# bili♪ 音乐库

把自己在 B 站听的音频变成本地音乐库：粘链接进来，后台用 yt-dlp 抓最高音质的音频流，
存到本地，然后用一个网页播放器来听——收藏、歌单、缓存、队列都在里面，不用再开 B 站。

```
浏览器 ──► FastAPI (本机 8788) ──► SQLite（曲目/歌单/收藏/历史）
                    │
                    └──► yt-dlp + ffmpeg ──► ~/.local/share/bili-music/media/*.m4a
```

## 启动

```bash
biliweb                 # 启动并打开浏览器
NOOPEN=1 biliweb        # 只启动
PORT=9000 biliweb       # 换端口
```

已经装了 systemd 用户服务，开机（登录）后自动跑：

```bash
systemctl --user status biliweb     # 看状态
systemctl --user restart biliweb    # 改完代码后重启
systemctl --user disable --now biliweb   # 不要它自启
journalctl --user -u biliweb -f     # 看日志
```

地址：<http://127.0.0.1:8788>

## 能做什么

| 页面 | 作用 |
|---|---|
| 音乐库 | 全部曲目，带「本地 / 未缓存 / 缓存中」状态；最近播放横向卡片；搜索框按歌名或 UP 主过滤 |
| 收藏 | ♡ 过的曲子，可一键播放全部 |
| 缓存 | 本地占用、已缓存 / 未缓存数量；「全部缓存」「清空音频文件」（只删文件，元数据留） |
| 歌单 | 新建、重命名、删除；任意曲目点「＋」加入歌单 |
| 设置 | 缓存音质、Cookie 浏览器、点开自动缓存、预缓存下一首 |
| 主题 | 右上角一键切换深色 / 浅色，选择记在浏览器里，首次打开跟随系统 |
| 播放器（底部常驻） | 播放/暂停、上一首/下一首、随机、单曲/列表循环、进度拖动、音量、队列抽屉、收藏 |

**播放流程**：点一首没缓存过的歌 → 自动排队下载 → 播放器上显示「缓存中 42%」→ 下完立刻开始播。
因为走的是本地文件，之后切歌、拖进度都是零延迟。

**续播**：播放位置每 2 秒记一次（存在浏览器里），关掉页面、重启电脑再打开，
队列和「上次听到 25:00」都还在，按播放键就从那儿接着放。
想从头听，点播放器左边的时间数字（有悬停提示），或者把进度条拖回开头。

快捷键：`空格` 播放/暂停，`N` 下一首，`P` 上一首，`Shift+←/→` 快退/快进 10 秒。

## 添加音频

页面顶部那条输入框就是添加入口（不弹窗、不遮页面），粘任意一种，回车：

- `https://www.bilibili.com/video/BV1m2pTzCEXc/`（后面带 `?spm_id_from=…` 之类的也认）
- `BV1m2pTzCEXc`
- `https://b23.tv/xxxxxxx`（短链会先跟一次跳转）
- 分 P 视频会问「只加当前这 P」还是「整个合集 N 首」（直接在那条预览里选）

添加后会自动排队缓存，不用再点一次。整个流程只有：粘贴 → 回车 → 选分 P → 加入库。

## 数据在哪

```
~/.local/share/bili-music/
├── library.db          曲目、歌单、收藏、播放历史、设置（SQLite）
├── media/<id>.m4a      音频，文件名就是 BV 号，跟标题无关（改标题不会乱）
└── covers/<id>.jpg     封面，统一转成 jpg，离线也有图
```

标题、UP 主、封面都写进了文件的标签里（m4a 用 MP4 tag，mp3 用 ID3），
所以把这些文件拷到手机 / 车机 / 别的播放器，信息也不会丢。

想换位置：`BILI_MUSIC_HOME=/path/to/dir biliweb`（数据库和媒体文件一起搬）。

## 音质说明

B 站对未登录用户最高只给 `30280`（约 100 kbps AAC）。这是源的上限，不是工具的毛病。

| 情况 | 能拿到 |
|---|---|
| 不登录 | 30280 ≈100 kbps AAC |
| 登录（普通账号） | 同上 |
| 大会员 + 杜比 / Hi-Res 曲目 | 30250 杜比全景声 / 30251 Hi-Res（FLAC） |

要拿第三种：设置里「登录状态」选你平时登录 B 站的浏览器（chrome / firefox / edge…），
音质选 `flac`。普通曲子这样选没有提升，只是白占空间。

## 命令行版

同时留了一个下歌到 `~/Music/Bilibili/` 的命令行工具（跟网页版互不干扰）：

```bash
bili BV1m2pTzCEXc            # 下载成 m4a
bili -s <链接>                # 不存盘，直接 ffplay 听
bili -a list.txt --m3u 学习.m3u   # 批量下 + 生成播放列表
```

`bili -h` 看全部选项。

## 目录结构

```
~/bili-music/
├── app.py          FastAPI 路由：库、解析、导入、缓存、收藏、歌单、流媒体（支持 Range）
├── catalog.py      SQLite + yt-dlp 下载队列 + 标签写入
├── static/
│   ├── index.html  单页骨架
│   ├── style.css   主题（B 站粉 #fb7299）
│   └── app.js      全部交互，无构建、无框架
└── requirements.txt
```

想改外观只动 `style.css` 里的 `:root` 变量即可（`--accent` 换成别的颜色整套都跟着变）。

## 接口

```
GET    /api/library                  全量状态（曲目/歌单/收藏/历史/设置/统计）
POST   /api/resolve   {url}          只解析元数据（含分P列表）
POST   /api/import    {url,pages}    入库，pages=one|all
POST   /api/cache     {ids,all}      排入下载队列
POST   /api/cache/clear {ids}        删本地音频，元数据保留
GET    /api/stream/{id}              播放（支持 Range，可拖进度）
GET    /api/cover/{id}               封面
GET    /api/track/{id}               单曲状态（缓存进度轮询用）
POST   /api/favorite/{id}            收藏开关
POST   /api/play/{id}                记一条播放历史
POST   /api/playlists {name}         建歌单
POST   /api/playlists/{id}/items     加歌
DELETE /api/playlists/{id}/items/{tid}
POST   /api/settings  {key,value}
```

## 常见问题

**「解析失败」/ SSL 报错**：本机 7897 那个代理偶尔会掐 TLS。现在已经把 B 站相关域名
（bilibili.com / bilivideo.com / hdslb.com / b23.tv …）加进 `no_proxy` 直连，一般不会再遇到。

**Cookie 有点慢**：第一次从浏览器导 Cookie 要几十秒，之后会缓存成
`~/.local/share/bili-music/cookies.txt`（6 小时更新一次），所以只有开机后第一次用会慢一下。
读不出来的时候会自动丢掉 Cookie 再试，不会卡住。

**更新 yt-dlp**（B 站接口常变，两三个月更一次）：

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY python3 -m pip install --user --break-system-packages -U yt-dlp
systemctl --user restart biliweb
```

**8787 被别的服务占了**，所以默认用 8788。

**删了歌，文件没删干净？** 从列表里「垃圾桶」删是连文件一起删；「清空音频文件」只删声音、
保留列表，下次播放会重新下。

## 还能往哪长

- 歌单内拖拽排序、批量选中
- B 站收藏夹 / UP 主投稿直接同步过来
- 歌词抓取、桌面歌词
- 把队列接到 mpv / MPRIS，用系统媒体键控制（现在只做了 Media Session，浏览器里能用）
