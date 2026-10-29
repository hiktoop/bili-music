# bili♪ 音乐库

把自己在 B 站听的音频，变成本地音乐库。

粘一个链接进来，后台用 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 只抓音频流、存到本地，
然后用一个网页播放器来听——歌单、收藏、缓存、续播、深浅主题都在里面，不用再开着 B 站。

```
浏览器 ──► FastAPI (127.0.0.1:8788) ──► SQLite（曲目 / 歌单 / 收藏 / 历史 / 设置）
                    │
                    └──► yt-dlp + ffmpeg ──► ~/.local/share/bili-music/media/*.m4a
```

## 特性

- **只取音频轨**，m4a 原样保存不转码，音质等于源的上限，体积也最小
- **缓存优先**：点一首没下过的，自动排队下载并显示进度，下完立刻播；之后切歌、拖进度都是零延迟
- **自动预缓存下一首**，连着听的时候只会等第一次
- **回到正在播放**：点播放条左边的封面/标题，直接跳回正在听的那首歌所在的音乐库（或歌单）并定位到它；打开合集时也会自动滚到正在播放的那首
- **单标签播放**：同一个 app 开多个标签页时，只有一个会出声，其他的自动暂停
- **续播**：只记「当前正在听的那一首」的进度——每个音乐库各记一个，关掉页面/重启电脑再打开会接着放；点别的歌一律从头开始
- 歌单（拖拽排序）、收藏、播放历史、搜索过滤、播放队列
- **单曲 / 音乐库分开**：单 P 视频是单曲；多 P 视频整条链接下的所有曲目自动归成同一个「音乐库」，可以整库播放、整库缓存、整库删除
- 分 P 视频可以只加当前这 P，也能一次把整个合集加进来（150 集也是 0.2 秒解析完）
- 封面、标题、UP 主都写进文件标签，拷到手机/车机也不丢
- 深色 / 浅色主题，跟随系统，也可以手动切
- 纯静态前端，无框架、无构建、无 Node
- 浏览器原生播放器：Range 流式、键盘快捷键、系统媒体键（Media Session）

## 快速开始

```bash
git clone https://github.com/hiktoop/bili-music.git
cd bili-music
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

打开 <http://127.0.0.1:8788>，在顶部输入框粘一个 B 站链接，回车。

## 从零安装

### 0. 需要什么

| 依赖 | 版本 | 干什么用 |
|---|---|---|
| Python | 3.10+ | 跑服务 |
| ffmpeg | 4.2+（建议 6+） | 抽音频、转封面、写标签 |
| yt-dlp | 随 pip 装 | 解析 B 站、下载音频流 |

### 1. 装系统依赖

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y python3 python3-venv python3-pip ffmpeg git

# Fedora
sudo dnf install -y python3 python3-pip ffmpeg git

# Arch
sudo pacman -S --needed python python-pip ffmpeg git

# macOS（需要先装 Homebrew）
brew install python ffmpeg git
```

Windows 没实测过（代码里只有 pathlib 和 ffmpeg 调用，理论可行），需要把 ffmpeg 放进 `PATH`。

### 2. 拿代码

```bash
git clone https://github.com/hiktoop/bili-music.git
cd bili-music
```

### 3. 装 Python 包

推荐用虚拟环境，不污染系统 Python：

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

不想用 venv 也可以装到用户目录：

```bash
pip install --user -r requirements.txt
# Ubuntu 24.04 的 PEP 668 会拦，加 --break-system-packages
```

### 4. 启动

```bash
python3 app.py                     # → http://127.0.0.1:8788
PORT=9000 python3 app.py           # 换端口
```

服务只监听 `127.0.0.1`，不对外网开放。

### 5. 开机自启（可选）

仓库里带了 systemd 用户服务模板 `contrib/biliweb.service`：

```bash
mkdir -p ~/.config/systemd/user
cp contrib/biliweb.service ~/.config/systemd/user/
# 如果代码不在 ~/bili-music，改里面的 WorkingDirectory 和 ExecStart
systemctl --user daemon-reload
systemctl --user enable --now biliweb

systemctl --user status biliweb
journalctl --user -u biliweb -f      # 看日志
systemctl --user disable --now biliweb
```

macOS 用 launchd 或者 `brew services`，自行套一下。

## 怎么用

### 添加

页面顶部那条输入框就是入口（不是弹窗），粘任意一种，回车：

- `https://www.bilibili.com/video/BV1m2pTzCEXc/`（后面带 `?spm_id_from=…` 之类的也认）
- `BV1m2pTzCEXc`
- `https://b23.tv/xxxxxxx`（短链会先跟一次跳转）
- 分 P 视频会问「只加当前这 P」还是「整个合集 N 首」

添加后自动排队缓存，不用再点一次。流程就是：粘贴 → 回车 → 选分 P → 加入库。

### 播放

底部常驻播放器：播放/暂停、上一首/下一首、随机、单曲/列表循环、进度拖动、音量、队列抽屉。

| 快捷键 | 作用 |
|---|---|
| `空格` | 播放 / 暂停 |
| `N` / `P` | 下一首 / 上一首 |
| `Shift + ←/→` | 快退 / 快进 10 秒 |
| 点进度左边的数字 | 从头播放 |
| 点播放条左边的封面/歌名 | 跳回正在播放的那首（连同所在的库/歌单） |

系统媒体键（耳机上的播放/暂停键）也能用。

### 为什么是缓存，而不是每次在线解析

B 站的播放地址大约 2 小时过期，CDN 会限速，断网就直接没法放；而音乐是重复消费的东西，
同一首你第二遍听的概率接近 100%。所以这里的策略是「点播即缓存」：第一次等几秒（本地通常 2–5 秒），
之后永远从磁盘读，切歌零延迟、离线可听、随便拖进度。一首 50 分钟的音频约 36 MB。

在线解析只作为「没缓存时的填充动作」存在，不是主路径。

## 音质

B 站对未登录用户最高只给 `30280`（约 100 kbps AAC），这是源的上限，不是工具的问题。

| 情况 | 能拿到 |
|---|---|
| 不登录 | 30280 ≈100 kbps AAC |
| 登录（普通账号） | 同上 |
| 大会员 + 杜比 / Hi-Res 曲目 | 30250 杜比全景声 / 30251 Hi-Res（FLAC） |

要拿第三种：设置里「登录状态」选你平时登录 B 站的浏览器（chrome / firefox / edge…），
音质选 `flac`。普通曲子这样选没有提升，只是白占空间。

第一次读浏览器 Cookie 要几十秒，之后会导出成 `~/.local/share/bili-music/cookies.txt`
（6 小时更新一次），后续请求都走文件；读不出来会自动丢掉 Cookie 重试，不会卡住。

## 数据在哪

```
~/.local/share/bili-music/
├── library.db          曲目、合集、歌单、收藏、播放历史、设置（SQLite）
├── media/<id>.m4a      音频，文件名就是 BV 号
├── covers/<id>.jpg     封面，统一转 jpg，离线也有图
└── cookies.txt         浏览器 Cookie（600 权限，只在设置里选了浏览器时才有）
```

- 备份：整个目录拷走就行
- 换位置：`BILI_MUSIC_HOME=/path/to/dir python3 app.py`
- 文件里带标题/UP 主/封面标签，直接拷进手机音乐 App 也能正常显示

## 配置

| 位置 | 项 | 说明 |
|---|---|---|
| 设置页 | 缓存音质 | `m4a`（原始，推荐）/ `mp3`（老播放器）/ `flac` |
| 设置页 | 登录状态 | 不用 / chrome / firefox / edge… |
| 设置页 | 点开就自动缓存 | 关掉的话，没缓存的歌点了会提示先缓存 |
| 设置页 | 预缓存下一首 | 当前这首开始播时顺手把队列下一首下好 |
| 环境变量 | `PORT` | 端口，默认 8788 |
| 环境变量 | `BILI_MUSIC_HOME` | 数据目录 |

## 命令行版

`contrib/bili` 是个独立的 shell 脚本，把音频下到 `~/Music/Bilibili/`，不依赖上面那个服务：

```bash
cp contrib/bili ~/.local/bin/ && chmod +x ~/.local/bin/bili

bili BV1m2pTzCEXc                 # 下载成 m4a
bili -m <链接>                     # 转 mp3
bili -s <链接>                     # 不存盘，直接 ffplay 听
bili -p <链接>                     # 看看有哪几档音频
bili -n <链接>                     # 只下当前这 P
bili -a list.txt --m3u 学习.m3u    # 批量下 + 生成播放列表
bili -h
```

## 文件结构

```
bili-music/
├── app.py                  FastAPI 路由：库、解析、导入、缓存、收藏、歌单、流媒体（Range）
├── catalog.py              SQLite + yt-dlp 下载队列 + 标签写入 + Cookie 缓存
├── static/
│   ├── index.html           单页骨架
│   ├── style.css            两套主题（B 站粉 #fb7299 作主色）
│   └── app.js               全部交互，无构建、无框架
├── contrib/
│   ├── biliweb.service      systemd 用户服务模板
│   └── bili                 命令行下载工具
└── requirements.txt
```

想改配色只动 `style.css` 顶部两个变量块：`:root` 是深色，`html[data-theme="light"]` 是浅色。

## 接口

```
GET    /api/library                   全量状态（曲目/歌单/收藏/历史/设置/统计）
GET    /api/track/{id}                单曲状态（缓存进度轮询）
POST   /api/resolve    {url}          只解析元数据（含分P列表）
POST   /api/import     {url,pages}    入库，pages=one|all
POST   /api/cache      {ids,all}      排入下载队列
POST   /api/cache/clear{ids}          删本地音频，元数据保留
GET    /api/stream/{id}               播放（支持 Range）
GET    /api/cover/{id}                封面
GET    /api/preview-cover?url=        预览用封面（B 站图床有防盗链）
POST   /api/favorite/{id}             收藏开关
POST   /api/play/{id}                 记一条播放历史
GET    /api/playlists                 歌单列表
POST   /api/playlists {name}          建歌单
PATCH  /api/playlists/{id} {name}     重命名
PATCH  /api/playlists/{id}/order       重排 {track_ids:[...]}
POST   /api/playlists/{id}/items      加歌
DELETE /api/playlists/{id}/items/{tid}
DELETE /api/collections/{id}          删整个音乐库（连同曲目和文件）
POST   /api/settings   {key,value}
```

## 常见问题

**解析失败 / SSL 报错**：B 站整条链路都在国内，翻墙代理只会更慢更容易被掐 TLS。
代码里已经把 `bilibili.com / bilivideo.com / hdslb.com / biliimg.com / b23.tv` 等域名
自动加进 `no_proxy` 直连。如果还报错，先确认这台机器能直连 B 站。

**「缓存失败」**：多半是这条视频需要登录（会员/付费/年龄限制）。去设置里选上浏览器 Cookie 再试。

**更新 yt-dlp**：B 站接口常变，两三个月更新一次。

```bash
# venv 里
pip install -U yt-dlp
# 或者 --user 装的
pip install --user -U yt-dlp
```

**端口被占用**：`PORT=9000 python3 app.py`。

**删了歌，文件没删干净？** 列表里的「垃圾桶」是连文件一起删；「清空音频文件」只删声音、
保留列表，下次播放会重新下。

**数据库丢了能不能从文件恢复？** 暂时不能——没有扫描媒体目录重建库的功能，见下。

## 已知限制

- 单用户、无鉴权，只监听 `127.0.0.1`。要手机访问得自己加反向代理和密码
- 没有「只听不存」的试听模式
- 不能按 UP 主 / B 站收藏夹整包同步（现在是一条条加，分 P 可以整包）
- 合集目前是自动生成的，不能改名、不能手动把单曲并进去
- 没有歌词、没有均衡器
- 数据库和媒体目录不联动，删了 db 不会从 m4a 重建

## 免责

仅供个人离线收听。请遵守 B 站用户协议，不要传播下载下来的音视频内容，也不要用于任何商业用途。

## 许可

[MIT](LICENSE) © 2026 hiktoop

---

想改这个项目的话，先看 [AGENT.md](AGENT.md)：里面写了架构决策、代码地图，以及开发时踩过的坑。
