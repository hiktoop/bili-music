"""B 站音乐库 —— 本地 Web 服务。

    python3 app.py            默认 http://127.0.0.1:8787
    PORT=9000 python3 app.py
"""

from __future__ import annotations

import mimetypes
import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import catalog

HERE = Path(__file__).parent
STATIC = HERE / "static"

@asynccontextmanager
async def lifespan(_app):
    catalog.init_db()
    catalog.start_workers(2)
    threading.Thread(target=catalog.warm_cookies, daemon=True).start()
    yield


app = FastAPI(title="Bilibili Music", docs_url=None, redoc_url=None, lifespan=lifespan)


def _short(e: Exception, n: int = 160) -> str:
    """把 yt-dlp 那一长串报错压成一句人话。"""
    msg = " ".join(str(e).split())
    for noise in ("please report this issue on  https://github.com/yt-dlp/yt-dlp/issues",
                  "Confirm you are on the latest version using  yt-dlp -U",
                  "You can also use --no-check-certificate"):
        msg = msg.replace(noise, "")
    msg = msg.replace("ERROR: ", "").replace("[BiliBili] ", "")
    return msg[:n] + ("…" if len(msg) > n else "")


class ResolveIn(BaseModel):
    url: str


class ImportIn(BaseModel):
    url: str
    pages: str = "one"          # one | all


class CacheIn(BaseModel):
    ids: list[str] = []
    all: bool = False


class PlaylistIn(BaseModel):
    name: str


class PlaylistItemIn(BaseModel):
    track_id: str


class SettingIn(BaseModel):
    key: str
    value: str


# ------------------------------------------------------------ 库

@app.get("/api/library")
def api_library():
    return catalog.library()


@app.get("/api/track/{tid}")
def api_track(tid: str):
    row = catalog.one("SELECT * FROM tracks WHERE id=?", (tid,))
    if not row:
        raise HTTPException(404, "没有这首")
    return row


@app.post("/api/resolve")
def api_resolve(body: ResolveIn):
    try:
        return catalog.resolve(body.url)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"解析失败：{_short(e)}") from e


@app.post("/api/import")
def api_import(body: ImportIn):
    try:
        ids = catalog.add_from_url(body.url, body.pages)
        return {"added": ids, "library": catalog.library()}
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"添加失败：{_short(e)}") from e


@app.delete("/api/tracks/{tid}")
def api_delete_track(tid: str, keep_file: bool = False):
    catalog.delete_track(tid, with_file=not keep_file)
    return {"ok": True, "library": catalog.library()}


# ------------------------------------------------------------ 缓存

@app.post("/api/cache")
def api_cache(body: CacheIn):
    if body.all:
        ids = [t["id"] for t in catalog.library()["tracks"] if t["status"] != "ready"]
    else:
        ids = body.ids
    return {"queued": catalog.enqueue(ids)}


@app.post("/api/cache/clear")
def api_cache_clear(body: CacheIn):
    freed = catalog.clear_cache(body.ids or None)
    return {"freed": freed, "library": catalog.library()}


# ------------------------------------------------------------ 收藏 / 播放 / 歌单

@app.post("/api/favorite/{tid}")
def api_favorite(tid: str):
    return {"fav": catalog.toggle_favorite(tid)}


@app.post("/api/play/{tid}")
def api_play(tid: str):
    catalog.log_play(tid)
    return {"ok": True}


@app.get("/api/playlists")
def api_playlists():
    return catalog.q("SELECT * FROM playlists ORDER BY created_at")


@app.post("/api/playlists")
def api_create_playlist(body: PlaylistIn):
    pid = catalog.create_playlist(body.name)
    return {"id": pid}


@app.patch("/api/playlists/{pid}")
def api_rename_playlist(pid: int, body: PlaylistIn):
    catalog.run("UPDATE playlists SET name=? WHERE id=?", (body.name.strip()[:80], pid))
    return {"ok": True}


@app.delete("/api/playlists/{pid}")
def api_delete_playlist(pid: int):
    catalog.delete_playlist(pid)
    return {"ok": True}


@app.post("/api/playlists/{pid}/items")
def api_playlist_add(pid: int, body: PlaylistItemIn):
    catalog.playlist_add(pid, body.track_id)
    return {"ok": True}


@app.delete("/api/playlists/{pid}/items/{tid}")
def api_playlist_remove(pid: int, tid: str):
    catalog.playlist_remove(pid, tid)
    return {"ok": True}


# ------------------------------------------------------------ 设置

@app.post("/api/settings")
def api_setting(body: SettingIn):
    catalog.set_setting(body.key, body.value)
    if body.key == "cookies":
        # 换了浏览器就重新导一次
        try:
            catalog.COOKIE_FILE.unlink(missing_ok=True)
        except OSError:
            pass
        threading.Thread(target=catalog.warm_cookies, daemon=True).start()
    return catalog.get_settings()


# ------------------------------------------------------------ 媒体

@app.get("/api/stream/{tid}")
def api_stream(tid: str):
    row = catalog.one("SELECT * FROM tracks WHERE id=?", (tid,))
    if not row or row["status"] != "ready" or not row.get("path"):
        raise HTTPException(409, "这首还没缓存好")
    p = Path(row["path"])
    if not p.exists():
        catalog._set(tid, status="none", path=None, progress=0)  # noqa: SLF001
        raise HTTPException(410, "文件不在了，重新缓存一下吧")
    mt = mimetypes.guess_type(p.name)[0] or "audio/mp4"
    return FileResponse(p, media_type=mt, filename=None,
                        headers={"Cache-Control": "no-store", "Accept-Ranges": "bytes"})


@app.get("/api/cover/{tid}")
def api_cover(tid: str):
    row = catalog.one("SELECT cover FROM tracks WHERE id=?", (tid,))
    if row and row.get("cover"):
        p = catalog.COVERS / row["cover"]
        if p.exists():
            return FileResponse(p, media_type="image/jpeg",
                                headers={"Cache-Control": "max-age=2592000"})
    raise HTTPException(404, "没封面")


@app.get("/api/preview-cover")
def api_preview_cover(url: str):
    """预览用：B 站图床有防盗链，直连 <img> 会失败，这里转一下。"""
    from urllib.parse import urlparse

    host = (urlparse(url).hostname or "").lower()
    if not host.endswith((".hdslb.com", ".biliimg.com", ".bilivideo.com")):
        raise HTTPException(400, "只允许 B 站图床")
    try:
        data, mt = catalog.fetch_image(url)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"取图失败：{e}") from e
    from fastapi.responses import Response

    return Response(content=data, media_type=mt,
                    headers={"Cache-Control": "max-age=86400"})


# ------------------------------------------------------------ 前端

app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html", media_type="text/html",
                        headers={"Cache-Control": "no-store"})


@app.exception_handler(HTTPException)
async def http_err(_req, exc: HTTPException):
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8788"))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
