"""B 站音乐库：SQLite 元数据 + yt-dlp 后台下载队列。

所有状态都落盘在 ~/.local/share/bili-music/：
    library.db        曲目 / 歌单 / 收藏 / 历史 / 设置
    media/<id>.m4a    音频文件
    covers/<id>.jpg   封面
"""

from __future__ import annotations

import json
import os
import queue
import re
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import time
import urllib.request
from pathlib import Path

import yt_dlp

# B 站整条链路都在国内，走本机那个翻墙代理只会更慢、更容易被掐 TLS。
# 这些域名一律直连（其余流量不受影响）。
_NO_PROXY = (".bilibili.com,.bilivideo.com,.hdslb.com,.biliimg.com,"
             ".biliapi.net,.biliapi.com,.b23.tv,.bili2233.cn")
for _k in ("no_proxy", "NO_PROXY"):
    _cur = os.environ.get(_k, "")
    if "bilibili.com" not in _cur:
        os.environ[_k] = (_cur + "," if _cur else "") + _NO_PROXY

HOME = Path(os.environ.get("BILI_MUSIC_HOME", Path.home() / ".local/share/bili-music"))
DATA = HOME
MEDIA = HOME / "media"
COVERS = HOME / "covers"
DB_PATH = HOME / "library.db"

for _d in (DATA, MEDIA, COVERS):
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------- 数据库

SCHEMA = """
CREATE TABLE IF NOT EXISTS tracks (
    id         TEXT PRIMARY KEY,
    bvid       TEXT,
    page       INTEGER DEFAULT 1,
    url        TEXT,
    title      TEXT,
    uploader   TEXT,
    duration   INTEGER DEFAULT 0,
    cover      TEXT,
    status     TEXT DEFAULT 'none',   -- none | queued | downloading | ready | error
    progress   REAL DEFAULT 0,
    size       INTEGER DEFAULT 0,
    path       TEXT,
    err        TEXT,
    added_at   INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS favorites (
    track_id  TEXT PRIMARY KEY,
    added_at  INTEGER
);
CREATE TABLE IF NOT EXISTS playlists (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at INTEGER
);
CREATE TABLE IF NOT EXISTS playlist_items (
    playlist_id INTEGER NOT NULL,
    track_id    TEXT NOT NULL,
    pos         INTEGER DEFAULT 0,
    PRIMARY KEY (playlist_id, track_id)
);
CREATE TABLE IF NOT EXISTS history (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT,
    played_at INTEGER
);
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""


def conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH, timeout=30)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA synchronous=NORMAL")
    return c


def init_db() -> None:
    with conn() as c:
        c.executescript(SCHEMA)


def q(sql: str, args: tuple = ()) -> list[dict]:
    with conn() as c:
        return [dict(r) for r in c.execute(sql, args).fetchall()]


def one(sql: str, args: tuple = ()) -> dict | None:
    rows = q(sql, args)
    return rows[0] if rows else None


def run(sql: str, args: tuple = ()) -> int:
    with conn() as c:
        cur = c.execute(sql, args)
        return cur.lastrowid


# ---------------------------------------------------------------- 设置

DEFAULTS = {
    "quality": "m4a",          # m4a | mp3 | flac
    "cookies": "",             # 空 = 不用 Cookie；chrome / firefox / edge …
    "autocache": "1",          # 点播放时自动缓存
    "prefetch": "1",           # 提前缓存队列里的下一首
}


def get_settings() -> dict:
    s = dict(DEFAULTS)
    for r in q("SELECT key, value FROM settings"):
        s[r["key"]] = r["value"]
    return s


def set_setting(key: str, value: str) -> None:
    run("INSERT INTO settings(key, value) VALUES(?,?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, str(value)))


# ---------------------------------------------------------------- 链接解析

BV_RE = re.compile(r"(BV[0-9A-Za-z]{10})")
AV_RE = re.compile(r"av(\d+)", re.I)


def normalize(url: str) -> tuple[str, int]:
    """把各种写法的链接变成 (规范的 video URL, 页码)。"""
    url = (url or "").strip()
    if not url:
        raise ValueError("链接是空的")

    page = 1
    m = re.search(r"[?&]p=(\d+)", url)
    if m:
        page = max(1, int(m.group(1)))

    # 短链先跟一次跳转
    if re.search(r"(b23\.tv|bili2233\.cn)/", url):
        if not url.startswith("http"):
            url = "https://" + url
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                url = r.geturl()
        except Exception as e:  # noqa: BLE001
            raise ValueError(f"短链打不开：{e}") from e
        m = re.search(r"[?&]p=(\d+)", url)
        if m:
            page = max(1, int(m.group(1)))

    bv = BV_RE.search(url)
    if bv:
        bvid = bv.group(1)
        return f"https://www.bilibili.com/video/{bvid}", page

    av = AV_RE.search(url)
    if av:
        return f"https://www.bilibili.com/video/av{av.group(1)}", page

    raise ValueError("认不出这个链接，给个 BV 号或 bilibili.com 的地址吧")


COOKIE_FILE = DATA / "cookies.txt"
_cookie_lock = threading.Lock()
COOKIE_TTL = 6 * 3600


def warm_cookies() -> None:
    """后台把浏览器 Cookie 导出成文件。读一次要几十秒，之后所有请求都用文件。"""
    st = get_settings()
    if st.get("cookies"):
        try:
            _ensure_cookie_file(st["cookies"])
        except Exception:
            pass


def _ensure_cookie_file(browser: str) -> str | None:
    with _cookie_lock:
        fresh = (COOKIE_FILE.exists()
                 and time.time() - COOKIE_FILE.stat().st_mtime < COOKIE_TTL)
        if fresh:
            return str(COOKIE_FILE)
        try:
            from yt_dlp.cookies import extract_cookies_from_browser
            jar = extract_cookies_from_browser(browser)
            jar.save(str(COOKIE_FILE), ignore_discard=True, ignore_expires=True)
            os.chmod(COOKIE_FILE, 0o600)
            return str(COOKIE_FILE)
        except Exception:
            # 读不到就用旧的（如果有），再不行就当没登录
            return str(COOKIE_FILE) if COOKIE_FILE.exists() else None


def _ydl_opts(**extra) -> dict:
    st = get_settings()
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": True,
        "cachedir": False,
        "retries": 5,
        "fragment_retries": 5,
        "socket_timeout": 25,
        "ignoreerrors": False,
        "extractor_retries": 3,
    }
    if st.get("cookies"):
        cf = _ensure_cookie_file(st["cookies"])
        if cf:
            opts["cookiefile"] = cf
    opts.update(extra)
    return opts


def _run_ydl(opts: dict, fn):
    """跑 yt-dlp；如果是因为浏览器 Cookie 读不出来而失败，就丢掉 Cookie 再试一次。"""
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return fn(ydl)
    except Exception:
        if not (opts.get("cookiesfrombrowser") or opts.get("cookiefile")):
            raise
        o2 = dict(opts)
        o2.pop("cookiesfrombrowser", None)
        o2.pop("cookiefile", None)
        with yt_dlp.YoutubeDL(o2) as ydl:
            return fn(ydl)


def resolve(url: str) -> dict:
    """只取元数据，不下载。返回视频信息和所有分P。"""
    base, page = normalize(url)
    # 多P视频只有当 noplaylist=False 时才会把每一 P 都列出来
    info = _run_ydl(_ydl_opts(skip_download=True, noplaylist=False),
                    lambda y: y.extract_info(base, download=False))

    if not info:
        raise ValueError("解析不到这个视频（可能已删除或需要登录）")

    entries = info.get("entries") or []
    if entries:
        base_cover = info.get("thumbnail") or next(
            (e.get("thumbnail") for e in entries if e and e.get("thumbnail")), None)
        parts = []
        for idx, e in enumerate(entries, 1):
            if not e:
                continue
            m = re.search(r"_p(\d+)$", str(e.get("id") or ""))
            pg = int(m.group(1)) if m else int(e.get("playlist_index") or e.get("page") or idx)
            parts.append({
                "id": e.get("id") or f"{info.get('id')}_p{pg}",
                "page": pg,
                "title": e.get("title") or info.get("title"),
                "duration": int(e.get("duration") or 0),
                "cover": e.get("thumbnail") or base_cover,
            })
        video = {
            "bvid": info.get("id"),
            "title": info.get("title"),
            "uploader": (info.get("uploader") or info.get("creator")
                         or next((e.get("uploader") for e in entries if e and e.get("uploader")), "")),
            "duration": int(info.get("duration") or 0) or sum(int(e.get("duration") or 0) for e in entries if e),
            "cover": base_cover,
            "parts": parts,
            "is_multi": len(parts) > 1,
            "page": page,
        }
    else:
        video = {
            "bvid": info.get("id"),
            "title": info.get("title"),
            "uploader": info.get("uploader") or info.get("creator") or "",
            "duration": int(info.get("duration") or 0),
            "cover": info.get("thumbnail"),
            "parts": [{
                "id": info.get("id"),
                "page": int(info.get("page") or 1),
                "title": info.get("title"),
                "duration": int(info.get("duration") or 0),
                "cover": info.get("thumbnail"),
            }],
            "is_multi": False,
            "page": int(info.get("page") or page),
        }
    video["url"] = base
    return video


# ---------------------------------------------------------------- 曲目

def upsert_track(*, tid: str, bvid: str, page: int, title: str, uploader: str,
                 duration: int, url: str, cover_url: str | None) -> None:
    exists = one("SELECT id FROM tracks WHERE id=?", (tid,))
    if exists:
        run("UPDATE tracks SET title=?, uploader=?, duration=?, url=? WHERE id=?",
            (title, uploader, duration, url, tid))
        return
    run("""INSERT INTO tracks(id,bvid,page,title,uploader,duration,url,status,added_at)
           VALUES(?,?,?,?,?,?,?,'none',?)""",
        (tid, bvid, page, title, uploader, duration, url, int(time.time())))
    if cover_url:
        _save_cover(tid, cover_url)


def fetch_image(url: str) -> tuple[bytes, str]:
    """取 B 站图床图片，返回 (数据, content-type)。"""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0", "Referer": "https://www.bilibili.com/"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = r.read()
        mt = (r.headers.get("Content-Type") or "image/jpeg").split(";")[0]
    return data, mt


def _save_cover(tid: str, url: str) -> None:
    """封面统一转成 jpg 存本地，这样离线也有图。"""
    if not url:
        return
    dest = COVERS / f"{tid}.jpg"
    if dest.exists():
        return
    tmp = None
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0", "Referer": "https://www.bilibili.com/"})
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
        if len(raw) < 512:
            return
        fd, tmp = tempfile.mkstemp(suffix=".img")
        os.write(fd, raw)
        os.close(fd)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
                        "-q:v", "3", "-vf", "scale=480:-1", str(dest)],
                       check=True, timeout=60)
        run("UPDATE tracks SET cover=? WHERE id=?", (dest.name, tid))
    except Exception:
        pass
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)


def add_from_url(url: str, pages: str = "one") -> list[str]:
    """解析并入库，pages='all' 时把整个合集都加进来。"""
    v = resolve(url)
    parts = v["parts"]
    if pages != "all":
        want = v.get("page") or 1
        picked = [p for p in parts if p["page"] == want] or parts[:1]
        parts = picked

    ids = []
    for p in parts:
        tid = p["id"]
        surl = f"{v['url']}?p={p['page']}"
        upsert_track(tid=tid, bvid=v["bvid"], page=p["page"], title=p["title"],
                     uploader=v["uploader"], duration=p["duration"],
                     url=surl, cover_url=p.get("cover") or v.get("cover"))
        ids.append(tid)
    return ids


def delete_track(tid: str, with_file: bool = True) -> None:
    row = one("SELECT * FROM tracks WHERE id=?", (tid,))
    if not row:
        return
    if with_file:
        for p in (row.get("path"), str(MEDIA / f"{tid}.m4a"), str(MEDIA / f"{tid}.mp3")):
            if p and Path(p).exists():
                try:
                    Path(p).unlink()
                except OSError:
                    pass
        cv = COVERS / f"{tid}.jpg"
        if cv.exists():
            cv.unlink()
    with conn() as c:
        c.execute("DELETE FROM tracks WHERE id=?", (tid,))
        c.execute("DELETE FROM favorites WHERE track_id=?", (tid,))
        c.execute("DELETE FROM playlist_items WHERE track_id=?", (tid,))
        c.execute("DELETE FROM history WHERE track_id=?", (tid,))


# ---------------------------------------------------------------- 收藏 / 歌单 / 历史

def toggle_favorite(tid: str) -> bool:
    if one("SELECT 1 FROM favorites WHERE track_id=?", (tid,)):
        run("DELETE FROM favorites WHERE track_id=?", (tid,))
        return False
    run("INSERT INTO favorites(track_id, added_at) VALUES(?,?)", (tid, int(time.time())))
    return True


def create_playlist(name: str) -> int:
    return run("INSERT INTO playlists(name, created_at) VALUES(?,?)",
               (name.strip()[:80] or "新歌单", int(time.time())))


def delete_playlist(pid: int) -> None:
    with conn() as c:
        c.execute("DELETE FROM playlists WHERE id=?", (pid,))
        c.execute("DELETE FROM playlist_items WHERE playlist_id=?", (pid,))


def playlist_add(pid: int, tid: str) -> None:
    row = one("SELECT COALESCE(MAX(pos),-1)+1 AS p FROM playlist_items WHERE playlist_id=?", (pid,))
    run("INSERT OR IGNORE INTO playlist_items(playlist_id,track_id,pos) VALUES(?,?,?)",
        (pid, tid, row["p"] if row else 0))


def playlist_remove(pid: int, tid: str) -> None:
    run("DELETE FROM playlist_items WHERE playlist_id=? AND track_id=?", (pid, tid))


def playlist_set_order(pid: int, ids: list[str]) -> None:
    """按给定顺序重排歌单。不在歌单里的忽略，漏传的按原顺序补到末尾。"""
    rows = q("SELECT track_id FROM playlist_items WHERE playlist_id=? ORDER BY pos", (pid,))
    current = [r["track_id"] for r in rows]
    wanted = [i for i in ids if i in current]
    seen = set(wanted)
    wanted += [i for i in current if i not in seen]
    with conn() as c:
        for pos, tid in enumerate(wanted):
            c.execute("UPDATE playlist_items SET pos=? WHERE playlist_id=? AND track_id=?",
                      (pos, pid, tid))


def log_play(tid: str) -> None:
    run("INSERT INTO history(track_id, played_at) VALUES(?,?)", (tid, int(time.time())))


# ---------------------------------------------------------------- 下载队列

_dl_queue: "queue.Queue[str | None]" = queue.Queue()
_workers: list[threading.Thread] = []
_lock = threading.Lock()


def _set(tid: str, **kw) -> None:
    if not kw:
        return
    cols = ", ".join(f"{k}=?" for k in kw)
    run(f"UPDATE tracks SET {cols} WHERE id=?", (*kw.values(), tid))


def _tag(path: Path, info: dict) -> None:
    """写标签和封面。m4a 用 MP4，mp3 用 ID3。"""
    title = info.get("track") or info.get("title") or path.stem
    artist = info.get("artist") or info.get("uploader") or info.get("creator") or "Bilibili"
    album = "Bilibili"
    cv = None
    cover_file = COVERS / f"{path.stem}.jpg"
    if cover_file.exists():
        cv = cover_file.read_bytes()
    try:
        if path.suffix.lower() in (".m4a", ".mp4"):
            from mutagen.mp4 import MP4, MP4Cover
            a = MP4(path)
            a["\xa9nam"] = [title]
            a["\xa9ART"] = [artist]
            a["aART"] = [artist]
            a["\xa9alb"] = [album]
            if cv:
                a["covr"] = [MP4Cover(cv, imageformat=MP4Cover.FORMAT_JPEG)]
            a.save()
        elif path.suffix.lower() == ".mp3":
            from mutagen.id3 import ID3, APIC, TALB, TIT2, TPE1, TPE2
            try:
                tags = ID3(path)
            except Exception:
                tags = ID3()
            tags.delall("TIT2;TPE1;TPE2;TALB;APIC")
            tags.add(TIT2(encoding=3, text=title))
            tags.add(TPE1(encoding=3, text=artist))
            tags.add(TPE2(encoding=3, text=artist))
            tags.add(TALB(encoding=3, text=album))
            if cv:
                tags.add(APIC(encoding=3, mime="image/jpeg", type=3, desc="Cover", data=cv))
            tags.save(path)
    except Exception:
        pass


def _download(tid: str) -> None:
    row = one("SELECT * FROM tracks WHERE id=?", (tid,))
    if not row:
        return

    want = get_settings().get("quality", "m4a")
    if want not in ("m4a", "mp3", "flac"):
        want = "m4a"

    # 已经有文件就直接标 ready
    for ext in ("m4a", "mp3", "flac"):
        f = MEDIA / f"{tid}.{ext}"
        if f.exists() and f.stat().st_size > 1024:
            _set(tid, status="ready", path=str(f), size=f.stat().st_size, progress=100, err=None)
            return

    _set(tid, status="downloading", progress=0, err=None)
    last = [0.0]

    def hook(d: dict) -> None:
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            got = d.get("downloaded_bytes") or 0
            pct = (got / total * 100) if total else 0
            now = time.time()
            if now - last[0] > 0.4:
                last[0] = now
                _set(tid, progress=round(pct, 1))
        elif d.get("status") == "finished":
            _set(tid, progress=99)

    opts = _ydl_opts(
        format="bestaudio/best",
        outtmpl=str(MEDIA / f"{tid}.%(ext)s"),
        progress_hooks=[hook],
        postprocessors=[{
            "key": "FFmpegExtractAudio",
            "preferredcodec": want,
            "preferredquality": "0",
        }],
    )

    try:
        info = _run_ydl(opts, lambda y: y.extract_info(row["url"], download=True)) or {}

        final = None
        for ext in ("m4a", "mp3", "flac", "webm", "opus"):
            f = MEDIA / f"{tid}.{ext}"
            if f.exists() and f.stat().st_size > 1024:
                final = f
                break
        if not final:
            raise RuntimeError("下载完了但找不到文件")

        _tag(final, info or row)
        _set(tid,
             status="ready",
             path=str(final),
             size=final.stat().st_size,
             progress=100,
             err=None)
        if info.get("duration"):
            _set(tid, duration=int(info["duration"]))
    except Exception as e:  # noqa: BLE001
        msg = str(e).replace("\n", " ")[:300]
        _set(tid, status="error", err=msg, progress=0)


def _worker() -> None:
    while True:
        tid = _dl_queue.get()
        try:
            if tid is None:
                return
            _download(tid)
        except Exception as e:  # noqa: BLE001
            try:
                _set(tid, status="error", err=str(e)[:300])
            except Exception:
                pass
        finally:
            _dl_queue.task_done()


def start_workers(n: int = 2) -> None:
    global _workers
    with _lock:
        if _workers:
            return
        for i in range(n):
            t = threading.Thread(target=_worker, name=f"dl-{i}", daemon=True)
            t.start()
            _workers.append(t)


def clear_cache(ids: list[str] | None = None) -> int:
    """删掉本地音频文件，元数据保留。返回删掉的字节数。"""
    if ids:
        rows = q("SELECT * FROM tracks WHERE id IN (%s)" % ",".join("?" * len(ids)), tuple(ids))
    else:
        rows = q("SELECT * FROM tracks")
    freed = 0
    for r in rows:
        if r.get("path"):
            p = Path(r["path"])
            if p.exists():
                try:
                    freed += p.stat().st_size
                    p.unlink()
                except OSError:
                    pass
        for ext in ("m4a", "mp3", "flac", "part"):
            f = MEDIA / f"{r['id']}.{ext}"
            if f.exists():
                try:
                    f.unlink()
                except OSError:
                    pass
        run("UPDATE tracks SET status='none', progress=0, path=NULL, size=0, err=NULL WHERE id=?", (r["id"],))
    return freed


def enqueue(ids: list[str]) -> list[str]:
    """排进下载队列，已在缓存中或已在队列里的跳过。"""
    added = []
    for tid in ids:
        row = one("SELECT status FROM tracks WHERE id=?", (tid,))
        if not row:
            continue
        if row["status"] in ("ready", "downloading", "queued"):
            continue
        _set(tid, status="queued", progress=0, err=None)
        _dl_queue.put(tid)
        added.append(tid)
    return added


# ---------------------------------------------------------------- 汇总

def library() -> dict:
    tracks = q("""
        SELECT t.*, (SELECT 1 FROM favorites f WHERE f.track_id=t.id) AS fav
        FROM tracks t ORDER BY t.added_at DESC, t.title
    """)
    for t in tracks:
        t["cover"] = bool(t.get("cover") and (COVERS / t["cover"]).exists())
        t["fav"] = bool(t["fav"])
    favs = [r["track_id"] for r in q("SELECT track_id FROM favorites")]
    playlists = q("""
        SELECT p.*, COUNT(i.track_id) AS count,
               (SELECT t.id FROM playlist_items x JOIN tracks t ON t.id=x.track_id
                 WHERE x.playlist_id=p.id ORDER BY x.pos LIMIT 1) AS first_track
        FROM playlists p LEFT JOIN playlist_items i ON i.playlist_id=p.id
        GROUP BY p.id ORDER BY p.created_at
    """)
    for p in playlists:
        p["cover"] = bool(p.get("first_track") and (COVERS / f"{p['first_track']}.jpg").exists())
    items = q("SELECT playlist_id, track_id FROM playlist_items ORDER BY pos")
    recent = q("""
        SELECT track_id, MAX(played_at) AS at FROM history
        GROUP BY track_id ORDER BY at DESC LIMIT 24
    """)
    cached = [t for t in tracks if t["status"] == "ready"]
    return {
        "tracks": tracks,
        "favorites": favs,
        "playlists": playlists,
        "items": items,
        "recent": [r["track_id"] for r in recent],
        "stats": {
            "count": len(tracks),
            "cached": len(cached),
            "size": sum(int(t.get("size") or 0) for t in cached),
            "downloading": sum(1 for t in tracks if t["status"] in ("queued", "downloading")),
        },
        "settings": get_settings(),
        "home": str(HOME),
    }
