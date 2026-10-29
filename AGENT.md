# AGENT.md

给接手这个仓库的人或 AI 代理看的：项目是怎么一步步长出来的、为什么这么设计、
哪些坑已经踩过一次了（别再踩）。

面向"怎么装、怎么用"的文档在 [README.md](README.md)，这里只写**为什么**和**怎么改**。

---

## 一句话

把 B 站的音频抓到本地，用一个自建的网页播放器来听：单曲 / 音乐库（合集）/ 歌单 / 收藏 /
缓存 / 续播。单用户、单机、`127.0.0.1`、零构建。

- 默认端口 **8788**（`PORT` 可改）
- 数据在 `~/.local/share/bili-music/`（`BILI_MUSIC_HOME` 可改）
- 进程：`systemctl --user restart biliweb` 重启，`biliweb` 手动起

---

## 代码地图

```
app.py          FastAPI 路由层，薄；不含业务判断
catalog.py      SQLite + yt-dlp + ffmpeg + mutagen，所有脏活都在这里
static/app.js   全部前端交互（无框架），一个 state 对象 + 渲染函数
static/style.css 两套主题（:root 深色 / html[data-theme="light"] 浅色）
contrib/        命令行工具 bili + systemd 模板
```

### 后端关键函数（catalog.py）

| 函数 | 作用 | 注意 |
|---|---|---|
| `normalize(url)` | 各种 B 站链接 → `(规范 URL, 页码)` | 短链 `b23.tv` 会跟一次跳转；**只认 B 站** |
| `_api_json()` | 调 B 站公开接口 | UA + Referer 都要带 |
| `_resolve_public()` | **快路径**：一次请求拿全分 P | 普通投稿走这里；番剧/失败返回 None |
| `resolve()` | 元数据总入口 | 先快路径，失败退回 yt-dlp `extract_flat` |
| `_run_ydl()` | 跑 yt-dlp，Cookie 出错自动降级重试一次 | |
| `add_from_url()` | 入库；多 P 自动建合集 | 整批共用一个 `added_at` |
| `upsert_collection()` | 合集（音乐库）元数据 | id 就是 BV 号 |
| `backfill_collections()` | 启动时把老数据按 bvid 补成合集 | 幂等，第二次跑查询为空 |
| `_ensure_cover()` | 封面按 URL 哈希去重存 jpg | 一个合集 150 首共用一张图 |
| `_download()` | 单曲下载 + 标签 | 队列 worker 调用 |
| `_tag()` | 写标题/UP/封面到 m4a / mp3 | mutagen，失败静默 |
| `enqueue()` | 排入下载队列（2 个 worker） | 已 ready/downloading 的跳过 |
| `library()` | 前端要的全量快照 | 曲目 + 合集 + 歌单 + 收藏 + 历史 |
| `playlist_set_order()` | 歌单重排 | 未知 id 忽略，漏传补末尾 |
| `clear_cache()` | 删音频保留元数据 | |
| `_ensure_cookie_file()` | 浏览器 Cookie 导出到 `cookies.txt` | 6 小时 TTL，600 权限 |

### 前端关键函数（static/app.js）

| 函数 | 作用 |
|---|---|
| `refresh(silent)` | 拉 `/api/library`；**静默刷新只补徽章不重建列表** |
| `render()` | 侧栏 + 主视图 + 播放器 + 队列；处理 `state.locateNext` |
| `viewLibrary/Singles/Collections/Collection/Favorites/Cache/Settings/Playlist` | 各视图模板字符串 |
| `playList/playCurrent/attachSource` | 播放与续播 |
| `rememberPosition/resumeKey` | 进度按上下文存（关键语义，见下） |
| `onDragStart/onDragMove/onDragEnd/flip` | 歌单拖拽（Pointer Events + FLIP） |
| `jumpToCurrent/scrollToRow` | 回到正在播放 |
| `paintVolume/paintControls/paintProgress` | 播放器绘制 |

---

## 开发时间线（按轮次）

1. **命令行起步**：先做了 `contrib/bili`（yt-dlp 包装），确定"只取音频轨、m4a 不转码、缓存优先"。
2. **做成系统**：FastAPI + SQLite + 原生 JS 前端；收藏 / 歌单 / 缓存 / 播放器 / 续播。
3. **两轮 UX 调整**：浅色主题（颜色全抽成 CSS 变量）、内联添加栏（去掉弹窗）、续播。
4. **开源**：GitHub 仓库、从零安装的 README、MIT。
5. **歌单拖拽**：先做能用（整行跳格子），再改成跟手 + FLIP 让位。
6. **修多 P 卡死**：从 yt-dlp 逐 P 展开改成 B 站公开接口一次拿全（150P：10 分钟 → 0.2 秒）。
7. **单曲 / 音乐库**：引入 `collections` 表，多 P 视频自动归成一个合集。
8. **续播语义调整**：从"每首歌各记进度"改成"每个音乐库只记当前这一首"。
9. **杂项修复**：多标签页同时播放、音量滑块不可见、一键回到正在播放。

---

## 架构决策（以及为什么）

**只取音频轨、m4a 原样存、不转码。**
B 站的音频轨就是 AAC/fMP4。转 mp3 只会更差、更慢、更占空间。ffmpeg 只在写标签和转封面时用。

**缓存优先，而不是每次在线解析。**
播放地址约 2 小时过期、CDN 限速、断网即废；音乐是重复消费的内容。
在线解析只作为"没缓存时的填充动作"。

**单进程 + SQLite + 无构建前端。**
单用户单机的需求下，这是活动部件最少的组合。改一行刷新就生效。

**普通投稿走 B 站公开接口做快路径。**
`x/web-interface/view` 一个请求返回 `pages[]`，150 P 只要 0.2 秒；
让 yt-dlp 展开分 P 是每 P 4 次请求，600+ 次请求起步。**这是本项目最重要的一次改动。**

**合集 = 源视频（BV 号），不是用户手动分组的目录。**
多 P 视频整条链接下的曲目自动归到同一条 BV 下，语义简单、不需要额外操作。

**续播按"播放上下文"存，不是按曲目存。**
`resume = { "col:<bvid>": {id, t}, "default": {id, t} }`。
每个音乐库只记当前这一首；单曲/歌单/全部共用一个槽。点别的歌一律从 0 开始。

**前端不引框架。**
现在约 1450 行原生 JS，还能一眼看懂；再往上（2000+）就该拆模块了。

---

## 踩过的坑（请勿重复）

| 现象 | 根因 | 现在的做法 |
|---|---|---|
| 150 P 的链接解析卡十几分钟 | yt-dlp 对**每个分 P** 重跑一遍完整解析（网页+pagelist+wbi+playurl），600+ 请求 | `_resolve_public()` 一次请求拿全；退回路径强制 `extract_flat=True` |
| 解析偶尔 SSL EOF / 代理掐连接 | 本机代理对国内链路反而更糟 | B 站相关域名写进 `no_proxy` 直连 |
| 带 Cookie 时每次解析要 28 秒 | 每次都去读系统钥匙串 | 导出成 `cookies.txt`，6 小时 TTL；读失败自动丢 Cookie 重试 |
| 导入 150 首后顺序是乱的 | 整批插入跨了 1 秒，`added_at DESC` 把第 1 首排到最后 | 整批共用一个 `added_at`，排序用 `added_at DESC, rowid` |
| 封面下载了 150 次 | 每首一个封面文件 | 按 URL 哈希命名，同图共用；删除时看引用计数 |
| 列表里 150 首每 1.6 秒闪一下 | 轮询触发整表 `innerHTML` 重建 | 曲目集合没变时只 `patchBadges()` |
| 拖动时会被轮询打断 | 重建 DOM 把手里的行弄丢 | `state.dragging` 期间跳过重建 |
| 拖拽"卡顿跳格子" | 整行在 DOM 里跳位 | 克隆成 `position:fixed` 影子跟手 + FLIP 让位 |
| 音量滑块看不见 | 全局 `input[type=range]::-webkit-slider-thumb{opacity:0}` 被继承（那是给进度条悬停用的） | 显式 `opacity:1` |
| 改了 CSS 刷新不生效 | 浏览器缓存 `/static` | `NoCacheStatic` 返回 `no-cache`；`index.html` 里还有 `?v=N` |
| 程序化滚动有时滚有时不滚 | `.view` 上的 `scroll-behavior:smooth` 把赋值变成动画，而**后台标签页的滚动动画/rAF 会被挂起** | 去掉该 CSS，直接赋 `scrollTop` |
| 两个标签页同时放歌 | 同一个 app 开了两个窗口 | `BroadcastChannel` 协调，后播的让先播的暂停 |
| 添加弹窗里出现两个"取消/关闭" | 预览 html 又加了一个 footer | 结构上只保留一个 footer |
| 拖拽把手事件收不到 | 模板里 class 写成了 `handle`，选择器找的是 `.tr-handle` | 命名统一 |

---

## 改代码的约定

- **中文注释、中文 UI**；提交信息也用中文（一句话标题 + 要点 body）。
- 后端改完必须 `systemctl --user restart biliweb`；前端改完只刷新页面。
- 前端改完把 `static/index.html` 里的 `?v=N` 加一（防止某些缓存场景）。
- 不把 `media/`、`covers/`、`library.db`、`cookies.txt` 提交进仓库（`.gitignore` 已挡）。
- 新增视图：`state.view` 加值 → `renderMain()` 的 map 里注册 → 侧栏加按钮（`data-view`）。
- 新增表/字段：`SCHEMA` 里加，并在 `init_db()` 里写 `ALTER TABLE` 兼容老库。
- 下载相关的改动要保证幂等：失败重试不能产生重复行、重复文件。

---

## 怎么验证

```bash
# 服务
systemctl --user restart biliweb && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/api/library

# 解析（不下载）
curl -s -X POST http://127.0.0.1:8788/api/resolve \
  -H 'Content-Type: application/json' -d '{"url":"BV号"}' | python3 -m json.tool

# 直接查库
python3 -c "import sqlite3;c=sqlite3.connect('$HOME/.local/share/bili-music/library.db');print(list(c.execute('select id,title,status from tracks limit 5')))"
```

前端交互（拖拽、滚动定位）没法用截图证明，做法是**临时**在 `app.js` 里加一段
`?selftest=...` 的钩子，用合成 `PointerEvent` 跑一遍真实的事件处理器，把结果写进
`document.title`，验证完删掉钩子。

---

## 数据与运行时

```
~/.local/share/bili-music/
├── library.db     tracks / collections / playlists / playlist_items / favorites / history / settings
├── media/<id>.m4a 文件名就是 BV 号（或 BV号_pN），与标题无关
├── covers/c<hash>.jpg  按封面 URL 哈希
└── cookies.txt   浏览器 Cookie（600 权限，只在设置里选了浏览器时才有）
```

- 队列：2 个 worker 线程，状态写在 `tracks.status`（none/queued/downloading/ready/error）
- 并发写：SQLite WAL + 每次操作独立连接
- 服务只监听 `127.0.0.1`；**不要**在没有鉴权的情况下绑到局域网

---

## 已知限制 / 待办

**限制（不算 bug，是有意为之）**

- 单用户、无鉴权、只听本机
- 只支持 B 站；YouTube/抖音未接（2026-10 讨论过，结论：不做，见下）
- 合集不能改名，不能手动把单曲并进某个库
- 数据库和媒体目录不联动（删了 db 不会从 m4a 重建）
- 播放期间进程不能退（音频是从本机服务流出来的）

**待办（按价值排序）**

1. 按 UP 主 / B 站收藏夹整包同步
2. 列表多选 + 批量缓存 / 批量删 / 批量加歌单
3. 「只听不存」的试听模式
4. 合集改名、单曲并入合集
5. 歌词

**安卓移植的结论（2026-10 讨论过）**

- 同一套跑 Termux：能用，但系统杀进程会导致播放中断
- 重写成 Kotlin App（youtubedl-android + Media3）：2–4 周，且上不了 Google Play
- 手机当遥控器连电脑：半天，但电脑得开着
- **当前决定：都不做**，先只在桌面用

---

## 提交规范

```
<类型>: <一句话说清改了什么>

- 要点一
- 要点二
```

类型用 `feat` / `fix` / `change` / `docs` / `chore`。
每次改完直接提交并推送到 `main`（仓库是单分支开发）。
