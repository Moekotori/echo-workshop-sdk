# ECHO 创意工坊 SDK

### 通用宿主与流媒体接口

插件和完整主题都可按需声明 `sources:direct`、`presence:control`、`bridge:control`，使用直链播放与队列，以及 Discord、Last.fm、ListenBrainz、Stage、OBS、MQTT、HQPlayer 和 Echo Link 的既有控制接口。`echo.ui.notify()` 复用宿主工坊通知。具体音源服务与目录解析由作者实现，ECHO 不选择平台。

`audio:output-read` 开放 `echo.audio.output.getStatus()`、`listDevices()`、`refreshDevices()` 和 `getDeviceVolume()`；`audio:output-write` 开放 `setOutput(settings)`、`setDeviceVolume(request)`、`setVolumeControlMode(mode)`。输出设置支持自动输出、输出模式、共享后端、设备索引/名称、请求采样率、延迟档和缓冲帧数；切换可能重开输出，结果以 Audio Core 返回的状态为准。状态不返回媒体路径或输入凭据。

插件的 `echo.network.request()` 支持 `GET / HEAD / POST / PUT / PATCH / DELETE / OPTIONS`，可明确传入作者自己的 `Authorization`，跨 origin 重定向时移除该头；不会读取 ECHO 或浏览器的账号凭据。仍按插件声明的 `networkHosts` 请求。完整主题可以通过工坊插件页面实现需要网络或完整系统权限的交互。

需要 Node、文件、任意网络或子进程能力时，使用已有 `system:full`、`trustedEntry` 和 `echo.trusted.invoke()`；完整系统代码在独立 utility process 中运行，停用插件即结束。所有能力仍由订阅者批准，不会自动为已安装内容授予新权限。设备与流媒体的离线预览使用固定 fixture；真实设备、账号和网络连接需在 ECHO 中验证。

当前源码的 API 2 增量按能力域登记。`contracts/capability-catalog.json` 列出公开 action、权限、插件/主题支持范围、事件和注册入口；`contracts/library.json` 是曲库域的参数、返回类型、别名及容量约束事实源。没有记录最低版本的旧能力使用原有兼容约定；不要把空版本解释为任意宿主均支持。

从 ECHO `26.10.18` 起，曲库域增加完整工作流：

- `echo.library.getTracks(query)` 支持排序、多列排序、音频/文件格式、歌词、纯音乐、去重、来源、文件夹及个人标签筛选；每页最多 100 项。`getTracksByIds()` 每批最多 200 个 ID。
- `echo.library.playlists` 提供分页目录、读取、创建、更新、增删歌曲、手动移动、删除、智能规则读取/预览/创建/更新/冻结。旧的 `getPlaylists`、`createPlaylist`、`updatePlaylist` 等方法保持可用，使用同一处理器。`getRules()` 读取智能规则；路径条件和文件夹规则需要独立的 `library:path` 授权。预览最多返回 100 首，`hasMore` 表示结果被截断；保存仍按宿主的最多 1000 首规则处理。
- `echo.library.favorites` 提供歌曲/专辑分页、批量收藏状态、明确的 `setTrack(id, liked)` / `setAlbum(id, liked)` 和收藏歌曲的手动顺序。
- `echo.library.tags` 提供 `list`、`getItems`、`change`（创建、改名、删除、分配）；`echo.library.listenLater` 提供 `list`、`get`、`change`（加入、移除、完成、重置）。稍后听条目包含播放位置；专辑歌曲仍通过 `getAlbumTracks()` 分页读取。
- 各域的 `onChanged(handler)` 返回取消订阅函数。通知用于失效当前页，保留旧事件 payload；请重新读取当前需要的数据，不在插件里复制整库。

```js
const query = { search: 'Ambient', sort: 'titleAsc', fileFormatFilter: 'flac', lyricsFilter: 'withWordTiming' };
const firstPage = await echo.library.getTracks({ ...query, page: 1, pageSize: 50 });
const created = await echo.library.playlists.create({ name: 'Evening' });
await echo.library.playlists.addTracks(created.id, firstPage.items.map(track => track.id));
await echo.library.favorites.setTrack(firstPage.items[0].id, true);
const stop = echo.library.playlists.onChanged(() => refreshVisiblePage());
// 页面结束时调用 stop()。
```

`echo.library.playQuery(query, trackId?)` 需要 `library:read` 和 `queue:control`，从头按相同条件逐页暂存到 Core 队列，全部成功后提交并播放；`trackId` 必须属于查询结果。它不会把整份结果保留在 renderer。读取失败、提交前作品卸载或曲库变化会撤销暂存，后者返回 `library-query-stale`。已提交的队列不因稍后的取消自动回滚。随机分页无法定义稳定序列，因此此方法拒绝 `sort: 'random'`；可在稳定查询之外使用现有随机播放控制。该能力要求 Core 队列可用，请先查 `getFeatureAvailability('library:playQuery')`。

删除歌单单独要求 `library:playlist-delete`；个人标签和稍后听写入要求 `library:personal-write`。新增权限必须在作品清单中声明并由订阅者批准；不会自动加入旧作品。普通歌单/收藏写入继续使用 `library:control`，不写原始媒体文件。

CLI、浏览器和应用内预览共用有状态的曲库 fixture。智能规则预览返回样例，不能用它证明真实 SQL 规则的匹配结果；真实规则解析与数据写入仍由宿主完成。

歌词界面作者可使用 [P0/P1 创作接口](./lyrics-authoring-interfaces.md)：本地逐行逐字时间轴、显示偏好、共享封面配色、样式包设置、布局与渲染预算，以及用户主动调整当前曲歌词偏移。宿主接口先查可用性；源码更新与已发布的 SDK 资产分开验收。

第一次写插件，从[首个插件完整教程](./FIRST-PLUGIN.zh-CN.md)开始：创建、修改、检查、在 ECHO 本地试用。

[![ECHO Workshop SDK CI](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml)

[公开仓库](https://github.com/Moekotori/echo-workshop-sdk) · [最新版本](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) · [私密报告安全问题](https://github.com/Moekotori/echo-workshop-sdk/security/advisories/new) · [English](./README.md)

这是给作者用的便携工具箱。SDK 版本为 `1.20.0`；GitHub 发布资产和 Steam 起步包通过各自渠道发布。清单 schema `1`，插件 API `2`。本 SDK 采用 MIT 许可，本地创作需要 Node.js 20+，不发布到 npm。可下载的 `.tgz` 以 [GitHub Releases](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) 实际列出的资产为准；源码改动不会自动生成发布资产。

| 能力 | 最低 ECHO 版本 |
| --- | --- |
| Afterglow 数据场景包 | 包含 Afterglow 支持的 `26.9.29` 或更新版本 |
| 原生侧边栏页面 `placement: "page"`、页面导航及 1.17 的命令入口 | `26.9.25` |
| 1.16 的独立主题/歌词/背景组合、动画库和面板外观控制 | `26.9.16` |
| `system:full` 与 `trustedEntry` 完整系统权限插件 | `26.8.29`，且须订阅者明确批准 |
| 编辑本地手动歌单、移除歌单条目（包含于 1.19） | 包含这两个操作的新版 ECHO 宿主；运行时先检查可用性 |
| 原生波形、声道电平与可视化查询（1.20） | 包含这些接口的 ECHO 宿主；检查 `echo.host.getFeatureAvailability('audio:getVisualization')` 或运行时 `init.audioVisualizationLimits` |

1.19 包含原 1.18 的改动，让应用内创作台从更小的插件模板起步，并在 `library:control` 下增加 `echo.library.updatePlaylist(playlistId, { name?, description? })` 与 `echo.library.removePlaylistItems(playlistId, itemIds)`。宿主只接受本地手动歌单；移除前核对条目归属并保留恢复记录。旧版 ECHO 中显示编辑入口前，先调用 `echo.host.getFeatureAvailability('library:updatePlaylist')`。

1.20 在 `audio:spectrum` 下新增 `echo.audio.getVisualization({ waveformSamples: 2048, spectrum: false, levels: true })`，返回带正负号的单声道波形、native 各声道电平和宿主上限。主题与歌词运行时可查询相同数据，并通过 `echo:workshop-ui:audio-configure` 选择推送字段和间隔。参见[音频可视化创作说明](./lyrics-authoring.md)和[运行时类型](./echo-workshop-ui-runtime.d.ts)。便携预览没有 native 音频时返回空波形；安装 SDK 不会让旧版 ECHO 自动获得宿主能力。

当前源码还提供 `echo.audio.getSpectrogram({ trackId })`：在 `audio:spectrum` 权限下按需分析当前本地歌曲的完整时频图（CUE 按单曲范围）。返回 1024 × 256 的 Base64 字节矩阵，时间从左到右、频率从低到高，0–24 kHz、-100–0 dBFS，来源为播放 DSP 前的单声道混音。不会写回媒体文件或保留整曲 PCM。调用前检查 `echo.host.getFeatureAvailability('audio:getSpectrogram')`；便携预览没有本地音频时会明确拒绝，旧宿主也不会因安装 SDK 自动获得该能力。

在 ECHO 创意工坊的**创作**页，先选目标，再填写内容 ID 和权利人：

| 想做的事 | 起步方式 | 能力范围 |
| --- | --- | --- |
| 小型 ECHO 工具 | 插件 → 基础工具 | 一个曲库命令和面板；`library:read` |
| 主题或歌词场景 | 主题 → 声明式外壳 / 歌词 → 封面加歌词 | 数据驱动的外观，不需要插件权限 |
| 多能力插件示例 | 插件 → 完整能力示例 | 多种宿主入口与权限声明，按项目需要删减 |
| 连接本机系统 | 插件 → 系统权限工具 | `system:full`；订阅者批准后才能运行 Node 代码 |

通过引导字段编辑、保存以更新哈希、准备并核对包体，然后检查授权和可见性再发布。原始 JSON 在**高级**区域。基础模板刻意保持精简；代码真正需要时再增加能力。

SDK 包含 `native-shell` Windows named-pipe 作者契约，但官方 ECHO Steam 版不会启动订阅者提供的 `.exe` 或 `.dll`；沙箱插件仍为默认方式。额外语言只活在工坊 JSON 里。[Steam 创意工坊 SDK 条目](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717)附带可运行示例与独立发布的 SDK，可能与 GitHub Release 版本不同，请分别核对下载内容。

尚未发布的 API 还为固定 `workshopAudioEffect` 槽加入受限 `vocalCut` 状态：插件可设置实时中置人声抑制强度和 80–300 Hz 低频保护分频点，实际处理与平滑仍由 Audio Core 持有，插件不会进入实时线程。

新视觉接口另见[稳定主题部件、独立视觉组合与宿主预览](./theme-parts.md)和[歌词创作](./lyrics-authoring.md)。
Afterglow 用户场景包见[场景包格式与导入](./afterglow-scenes.md)，支持 `lyrics-style --preset afterglow` 模板、ZIP 本地导入及工坊分发。

这些命令**永远不会上传**到 Steam。发布只能在 ECHO 创作台或仓库作者 CLI 里单独确认。

插件 API 2 是稳定兼容基线。展示功能前先调用 `echo.host.getFeatureAvailability(actionOrCapability)`，或读取 `echo.host.getCapabilities()`；根据 `unsupported-platform`、`not-entitled`、`capability-not-approved`、`audio-core-unavailable`、`current-mode-incompatible` 等原因渐进降级，不要靠调用未声明 API 或反复捕获异常来猜。实验接口必须明确标为 experimental，不属于 API 2 的跨版本保证。

沙箱面板现在也可以做成响应式、跟随 ECHO 主题的应用级工具，而不需要获得父页面 DOM。用 `echo.ui.getContext()` 和 `echo.ui.onContextChanged()` 读取宿主语言、文字方向、面板尺寸、减少动效偏好、明暗模式和有界语义主题 token。可见面板可以通过 `echo.ui.setPanelPresentation()` 动态设置宿主外壳的标题、徽标、未保存标记、注意状态，以及 `compact` / `comfortable` / `wide` / `full` / `immersive` 五档尺寸；工作完成后可调用 `echo.ui.closePanel()`。后台 runtime 可以调用 `echo.ui.openPanel(panelId?)`，让 `playerBarActions` 或插件坞命令打开已声明的面板；不传 id 时由宿主在多个可见面板之间选择。`immersive` 会铺满整个 ECHO 窗口内容区（覆盖播放栏），并且不渲染任何宿主外壳，因此面板必须自行通过 `echo.ui.closePanel()` 提供退出方式（宿主的 `Ctrl+Shift+Esc` 紧急退出始终可用）；比引入该尺寸更旧的宿主会以 `invalid-payload` 拒绝，插件应回退到 `full`。后台 runtime 不能修改面板外壳，其余尺寸下宿主关闭按钮也始终保留。

## 最快上手

从 [GitHub 最新版本](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) 下载该页面**实际列出**的 `.tgz`，再在本机安装或解包；不能只看 main 分支版本号就假定对应资产已发布。该包刻意不发布到 npm。准备发布的贡献者也可以直接安装当前源码目录。

```powershell
$sdkPackage = Get-ChildItem .\echo-workshop-sdk-*.tgz | Sort-Object LastWriteTime -Descending | Select-Object -First 1
npm install $sdkPackage.FullName
npx echo-workshop-sdk version --json
npx echo-workshop-sdk init .\harbor --recipe css-theme
cd .\harbor
npm run next
npm run check
npm run dev
```

只写目录也行：`init .\my-lyrics --kind lyrics-style`。要制作供歌词场景依赖的纯数据动画包，使用 `init .\my-motion --kind animation-library`。id / 标题会从文件夹名推断。`--license MIT`（`init` / `set` 都支持）可声明你自己的内容许可，默认仍是 `All-Rights-Reserved`。

SDK 也是独立 npm 包：`npm install <本文件夹或 tgz 路径>` 之后可直接 `npx echo-workshop-sdk`。`init` / `check` / `test` / `quality` / `dev` 只需要 Node 20+，不需要安装 ECHO。作者自己安装和维护 Node、编译器及第三方依赖；ECHO 创作台不代装环境，只负责校验、预览与发布。动画库的 `dev` 页面是一座可筛选 trigger、调 intensity、多声部重播的运动谱画廊；它支持限界 3D 变换、固定轴心、宿主管理的方向揭示和确定性错峰，但不接受任意 CSS、选择器或 filter。

按效果挑模板：`recipes`。中文说明书：`guide`（新增 `guide troubleshoot` 排错速查与 `guide checklist` 从 0 到发布清单）。一页纸命令速查见 [CHEATSHEET.md](./CHEATSHEET.md)，完整排错手册见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)（都是双语）。

第一天上手可直接拷最小示例：`example hello-plugin .\my-plugin`（单命令插件）、`example full-trust-plugin .\my-tool`（完整系统插件）或 `example minimal-theme .\my-theme`（最少文件的配色主题）。

已经建好的项目里继续加东西，不必重写 JSON：

```powershell
add . --slot spectrum
set . --style radial
scaffold . --preset cinema
```

主题 `--preset`：

| 档位 | 作用 | 最低 ECHO |
| --- | --- | --- |
| `colors` | 只改深浅色 | `26.8.15` |
| `skin` | 声明式外壳（默认） | `26.8.15` |
| `stylesheet` | 整包 CSS | `26.8.20` |
| `runtime` | 使用统一 SDK 的沙箱 HTML/CSS/JS 完整界面 | `26.10.18` |

声明过的 PNG、JPEG、WebP、主题样式表和界面运行时文件不再设张数或字节配额。SVG、可执行文件和带有远程地址或脚本的样式表仍然拒绝。

完整界面 runtime 与沙箱插件现在共用官方 `echo.*` SDK、权限检查和大数据分段传输。HTML 在应用脚本前加载 `<script src="__bridge__.js"></script>` 即可；这个文件由宿主提供，不放进包内清单。`runtime` 模板和 `retro-modern-ui-runtime` 示例已改为直接调用 `echo.library`、`echo.queue`、`echo.playback`、`echo.lyrics` 和 `echo.ui`，作者不需要自己编写消息桥或为作品向本体添加适配代码。

完整 shell 还可按需声明 `audio:dsp-read` / `audio:dsp-write`，通过 `echo.audio.dsp` 查询和调整 EQ、卷积开关／trim、ReplayGain、压缩器、crossfeed、声场、声道矩阵／平衡及机架顺序；`workshopAudioEffect` 仍属于带已验证插件身份的接口。`companion:control` 开放桌面歌词、迷你播放器、桌宠和任务栏播放器；`sleep-timer:control` 开放睡眠定时器；`media-session:control` 开放系统媒体会话。现有宿主的参数、权益和播放模式检查继续生效。缺少平台服务时，先用 `echo.host.getFeatureAvailability()` 查询，接口返回 `unsupported-platform`。

这些能力对 `shell`、`lyrics-view` 和 `lyrics-background` 都可按需声明，起步模板不会自动申请。可用 `add . --capability companion:control` 等命令加入清单；`snippet ui-runtime-controls` 提供调用示例。用 `echo.companion.onState()`、`echo.sleepTimer.onTick()`、`echo.mediaSession.onCommand()` 接收相应状态事件，退出时取消订阅。CLI 与应用内预览提供不影响真实声音和窗口的状态模拟；定时器模拟只在操作时更新，不模拟后台倒计时。

完整队列界面可用 `echo.queue.getPage({ offset: 500, limit: 100 })` 继续读取 500 项之后的内容（需要 ECHO `26.10.18` 和 `queue:read`）。返回 `total`、`hasMore`、`sessionId`、`revision` 和当前页 `items`。连续翻页时同时带上首屏的 `sessionId`、`revision`；遇到 `playback_queue_read_stale` 就丢弃旧页并重新读取，避免混合两个版本。每次最多 100 项，界面只保留当前可见窗口。旧 `get()` 和事件仍是最多 500 项的快照。CLI、浏览器和应用内预览共用会实际更新的队列模拟，支持入队、选项播放、移动、完整排序、删除、清空和上一首／下一首；应用内预览不会在播放进度或明暗模式更新时重置编辑。

### 添加自己的功能

在 `plugin-package` 项目中，用 `add` 生成命令和功能入口。命令会写入声明并追加到现有源入口；页面会生成独立 HTML/CSS/JS，使用官方 SDK 并跟随 ECHO 主题。已有源码保留，重复 id 或同名页面文件会明确拒绝。

```powershell
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --command my-tool --title "我的工具"
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --page tools --title "工具页面" --group plugins
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --sidebar favorites --title "我的收藏" --group library
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --setting compact --title "紧凑显示" --type boolean --default false
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --menu-action open-tool --command-id my-tool --title "我的工具"
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --player-action quick-tool --command-id my-tool --title "我的工具"
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --track-action inspect --command-id my-tool --title "处理所选歌曲" --selection multiple
```

生成的命令先以作者指定的标题显示提示，业务逻辑在注册函数中实现；歌曲菜单会把已清理的歌曲／选区参数传入处理函数。带参数／确认的命令也可挂到播放栏、歌曲菜单和主菜单快捷键，由宿主统一收集输入。随后执行 `check .`，再通过 ECHO 本地导入试用。新增侧边栏页面会自动把最低宿主版本提升到 `26.9.25`。

耗时功能可以用 `add . --command my-tool --title "我的工具" --timeout-ms 120000` 声明 120 秒执行时限；清单字段为 `contributes.commands[].timeoutMs`。从 `26.10.18` 起宿主采用该值，不再无视声明而统一在 5 秒报超时；未声明仍默认 5 秒。合法范围是 1–2147483647 的整数毫秒，CLI 会同步最低宿主版本。完整界面存储也移除了单项 16 KiB／总计 64 KiB 的额外配额，保留主题命名空间、JSON 校验和浏览器实际存储边界；写入失败不会覆盖原状态。

### 在自定义界面中组合已安装功能

从 `26.10.18` 起，带 `parameters` 或 `confirm` 的命令也可以挂到歌曲右键、主菜单／快捷键和播放栏按钮上；SDK `add --track-action`、`--menu-action`、`--player-action` 不再拒绝这些命令，并自动提升最低宿主版本。点击后统一显示宿主表单；取消不会调用作者代码。歌曲命令有参数时，handler 接收 `(values, selection)`；只有确认时仍接收原来的 `selection`。单选传一首歌曲，多选传歌曲数组；路径仍须显式声明 `library:path`。未驻留的运行时按需启动，注册完成后再继续。自动计算列和后台自动化仍只接受无交互命令。

插件、完整 shell、歌词界面和歌词背景声明 `extensions:read`、`extensions:launch` 后，可以使用 `echo.extensions.list({ page: 1, pageSize: 40, search, kind })` 读取当前已启用且可见的命令／独立页面，再用 `echo.extensions.launch(item.key)` 启动。查询按页返回显示信息和命令就绪、参数／确认状态，不返回路径、设置值或入口 URL。需要此接口的宿主版本为 `26.10.18`；插件用 `add . --permission extensions:read` 等命令会自动提升最低版本。

启动时宿主重新检查当前插件和入口；未常驻的命令通过原有生命周期启动。参数与确认表单仍由宿主显示，调用者不能提供参数绕过它们。`launch()` 返回表示宿主接受启动，不代表用户已经确认或业务完成，也不返回其他插件的执行结果。打开独立页面时，完整 shell 会退出到该页面。用 `echo.extensions.onChanged()` 接收仅含 `revision` 的目录变化通知，再重新查询所需页，并在 `echo.ui.onDispose()` 中解除订阅。官方预览使用固定功能样例，启动不会调用真实插件。

按 `theme.json` 的 `runtime.capabilities` 声明所需能力；`storage` 对应 `echo.storage`，仍使用主题独立的存储空间。通过 `echo.host.getFeatureAvailability()` 查询当前上下文的能力；插件贡献注册、网络 provider 和完整系统权限没有因此开放给主题。旧 runtime 消息协议继续兼容。

从 `26.10.18` 起，完整 shell、歌词界面、歌词背景共用 runtime 能力白名单，展示类型只决定放在哪里；声明所需能力即可调用公共 SDK 的曲库、队列、播放、DSP、桌面组件、睡眠定时器、媒体会话和已安装功能。加载 `__bridge__.js` 后 SDK 自动处理握手、心跳和卸载；歌词界面的旧命令协议也不再额外按展示类型拦截。

完整界面现在也可调用 `echo.ui.getParentPage()`，读取宿主路由、标题和插件页面标识；只有声明 `library:read` 才返回当前选择的歌曲 ID，主题不获得本机路径。插件的原有 `library:path` 授权行为保留。调用 `echo.navigation.open('songs', { dismissRuntime: false })` 可更新宿主路由并保留自定义界面；省略选项仍默认退出自定义界面，路由与 `navigation` 权限检查继续生效。

自绘标题栏可以通过 `echo.window.isMaximized()`／`isFullscreen()` 读取宿主窗口事实，并用 `onMaximizedChange()`／`onFullscreenChange()` 接收变化，无需自己推测或轮询。查询与事件都需要 `window:control`；缺少平台 API 时先用 `echo.host.getFeatureAvailability('window:isMaximized')` 等检查。保存返回的取消订阅函数，在 `echo.ui.onDispose()` 中调用。CLI 与内置预览使用独立样例窗口状态和路由，不操作真实窗口或导航。

`echo.assets.url/text/arrayBuffer` 用于包内资源，与插件共用格式解析，支持字体、SVG／图片、文本／CSV、gzip、GLB/glTF、WebAssembly，自定义扩展名按二进制提供。安装资源和内置预览均取消单文件大小门槛；预览分块校验后流式读取，不整份缓存模型。可以使用 canvas/WebGL、包内 worker 和 blob 纹理；应用代码与依赖须预先编译为外部脚本。用 `echo.ui.onContextChanged()` 跟随主题和窗口变化，在 `echo.ui.onDispose()` 中释放动画、worker 和 WebGL 资源；`echo.ui.closePanel()` 退出当前界面。播放与时钟仍以 Audio Core 为准。完整接入例子见[统一 SDK 说明](./README.md#full-interfaces-with-the-shared-sdk)。

`media-session:control` 开放 Windows SMTC 与 Linux MPRIS：读取不含本机路径的会话状态、设置可用按钮和随机/重复、重启会话，并接收媒体键命令。其他平台返回 `unsupported-platform`。

`companion:control` 控制桌面歌词、迷你播放器、桌宠和任务栏播放器。`sleep-timer:control` 控制睡眠定时器（1–720 分钟）。`presence:control` 控制 Steam Rich Presence，以及 Discord、Last.fm 和 ListenBrainz 的开关，不提供登录或令牌。`bridge:control` 只开关 HQPlayer、舞台桥、OBS、MQTT 和 Echo Link，状态不含地址、密码和配对信息。账号登录、Cookie、Spotify、下载和 MV 搜索仍然关闭。

Steam RPC 同时适用于插件和自定义主题（主题需声明 `runtime.capabilities: ["presence:control"]`），最低 ECHO 版本 `26.10.18`：

```js
const status = await echo.presence.steam.getStatus();
await echo.presence.steam.setEnabled(true);
await echo.presence.steam.setMode('detailed'); // off / basic / detailed / stalker
await echo.presence.steam.setTemporaryStatus({
  text: '正在专心听歌', includeTrack: false,
  expiresAt: Date.now() + 60 * 60 * 1000,
});
await echo.presence.steam.clearTemporaryStatus();
```

`getSettings()` 读取显示配置，`getOptions()` 查询支持的样式、模板变量和长度/时长范围，`updateSettings(patch)` 只修改提供的字段。例如：

```js
const settings = await echo.presence.steam.getSettings();
const options = await echo.presence.steam.getOptions();
await echo.presence.steam.updateSettings({
  style: 'custom', emojiPrefix: '🎧',
  templates: { playing: '{title}[ · {artist}]\n正在听 {album|音乐}' },
  rotationSeconds: 30,
  frames: { enabled: true, states: { playing: [
    { seconds: 15, requiredField: 'title' },
    { seconds: 10, requiredField: 'album' },
  ] } },
  typewriter: { enabled: true, direction: 'forward', stepMs: 500, holdSeconds: 3 },
  progressBarStyle: 'cat',
  sharing: { progressBar: true, artist: true, album: true },
});
```

配置还支持 `away: { enabled, minutes, text }` 和 `customProgress: { fill, empty, head, start, end, length }`。嵌套对象逐字段合并，单个状态的帧数组整体替换；`templates.playing: ""` 恢复该状态的内置文案，其余状态保留。每状态最多 6 句/帧，模板每状态最多 360 字符，轮换可选 0/30/60/120 秒；帧停留 5–120 秒；打字机步长 250–2000 毫秒、完整停留 1–30 秒；离开阈值 1–1440 分钟；自定义进度条长度 4–16。完整边界以 `getOptions().limits` 为准。

分享开关包括 `album / progress / progressBar / playlist / albumProgress / todaySummary / genre / playbackOrder / bpm / quality / format / artist / playbackRate / device / bitPerfect`。配置更新不会改变 RPC 模式或启用状态，也不会开启电脑硬件字段采集。未知字段和越界值报 `invalid-payload`，宿主模板语法错误报 `invalid-template`，整次更新不写入。离线预览和 mock 支持配置读写与结构边界；模板语法以宿主校验为准。配置读取不返回应用监控名单、硬件数值、用户配置档案或全局设置。

这些操作保存到 ECHO 设置。临时文案最多 160 字符，最终发布沿用宿主 220 UTF-8 字节限制；`expiresAt` 为 Unix 毫秒时间，省略或 `null` 表示手动清除，禁用插件不会自动清除。设置临时文案不会自动启用 RPC，也不会绕过关闭、基础或隐私模式。`setEnabled(true)` 在关闭模式下选择 `detailed`，已开启时保留当前模式。状态只返回可用性、启用状态、模式和发布结果，不含 Steam 身份、预览文案、设备或前台应用信息。预览和 mock 只模拟状态，不连接 Steam；真实发布仍由宿主现有链路负责。

歌词 `--preset`：`editorial`（默认）、`compact`、`cinema`、`cover`。  
可视化 `--preset`：`bars`（默认）、`wave`、`radial`。宿主没有 `particles`。  
DSP `--preset`：`flat`（默认）、`vocal`、`bass`、`8bit`，都是官方 31 段；`8bit` 会声明一个由宿主执行的受限 chiptune 风格器，包含方波、三角低频和瞬态门控 LFSR 噪声层。工坊包负责请求的效果参数，Audio Core 负责实时执行和实际生效状态。它属于 PCM 处理；PCM 转 SDM 会先处理，而 Native DSD / DoP 直通不进入这条效果链。

插件 `--preset`：`basic`（默认）、`complete`、`catalog`、`lyrics`、`full-trust`。

`catalog` 用于自定义流媒体音源。ECHO 只提供通用接口，接入哪个服务由用户和作者决定，目录访问与播放地址解析由插件实现。通过 `echo.sources.registerProvider()` 注册 `search`、`resolve`，以及可选的 `browse` / `listCollection`，再通过 `playDirect`、`enqueueDirect` 或 `playQueue` 将 HTTP(S) 音源交给宿主。接口不按平台域名拦截；来源确认、队列和 Audio Core 播放仍由 ECHO 管理。

完整系统插件一条命令起步：

```powershell
npx echo-workshop-sdk init .\my-tool --recipe full-trust-plugin
```

它会生成沙箱入口 `src/plugin.js` 与完整系统入口 `src/trusted.mjs`。旧插件执行 `npx echo-workshop-sdk add . --permission system:full` 时，CLI 会自动配对 `trustedEntry`、补 starter 文件并提升最低 ECHO 版本；已有 trusted 文件不会被覆盖。订阅者启用时仍必须确认桌面应用同等级权限，mock host 只检查清单和桥接，不会执行完整系统代码。

直接生成可编辑的 8-bit 工坊项目：

```powershell
node .\bin\echo-workshop-sdk.mjs init .\my-8bit --recipe 8bit-audio
```

已经建好的色板项目，不必重来：

```powershell
node .\bin\echo-workshop-sdk.mjs scaffold .\my-theme --preset stylesheet
node .\bin\echo-workshop-sdk.mjs fix .\my-theme
```

## 常用命令

- `check`：一次完成同步、清单/哈希校验、质量报告和本地 fixture 测试，结尾有一行门禁摘要（质量 pass/warning/blocker 计数 + fixture 通过数，`--json` 里是 `gate` 对象）；`--warn-only` 在早期迭代时照常打印失败但退出码为 0，发布前仍需完整通过
- `version`：机器可读的 SDK 版本与能力表面（schema、插件 API、协议、限额、契约清单），`--json` 还包含每类内容的入口文件/标签映射、recipe 列表和 guide 主题
- `next`：先列当前质量报告的待办（每条带能清掉它的命令），再列还允许加的槽位、颜色、能力或换档
- `add` / `set` / `scaffold`：继续改，不必重写整份 JSON（含 `set --license` 换内容许可；`set --mirror` 仅限可视化项目）
- `snippet`：常用代码片段（provider、存储、网络请求、UI runtime 桥、主题色块），每段都标注所需权限；生成项目还带 `.vscode/echo-workshop.code-snippets`，输入 `echo-` 前缀即可展开
- `guide` / `recipes`：中文说明书和按效果挑模板；`guide list` 只列主题索引
- `help <命令>` 或任意命令加 `--help`：查看单条命令的用法
- `watch`：递归监听源码，合并编辑器连续保存，忽略 SDK 自己生成的 manifest 更新，每次重跑结尾输出与 check 相同的一行门禁摘要
- `dev`：默认端口 41783 被占用时自动顺延到下一个空闲端口；显式传 `--port` 则占用时直接报错
- `fix`：修复预览图和 minEchoVersion，并补回缺失的 README.md / CUSTOMIZE.md / .gitignore（不会覆盖你已写的文件）
- `explain` / `upgrade` / `example` / `quality` / `test`；`doctor` / `validate` / `example list` / `snippet` / `next` 也支持 `--json`

`test` 的 mock host 会按清单权限拒绝越权 API。`dev` 会打开实时作者控制台，集中显示本地门禁、权限、fixture、最近变动文件、可复制修复命令和原始报告；可预览的主题、歌词、可视化和 DSP 项目会另外提供预览入口。这里只是作者本地证据，不代表 Steam 客户端验证。

新项目自带 VS Code JSON Schema、任务和代码片段，`echo.workshop.project.json` 也有完整字段提示与约束：默认构建任务就是 `ECHO Workshop: Check`，也可以直接运行 `ECHO Workshop: Dev console`，不用记 CLI 路径。自带的 GitHub Actions 工作流会把门禁报告写进 job summary，PR 页面直接能看到质量与 fixture 结论。

插件项目还会引用 `.echo-sdk/echo-workshop-plugin.d.ts`。API 2 返回的歌曲、专辑、歌手、曲风、歌单、队列、点赞、直链播放和一起听上传结果都有公开结构类型，不再要求作者用 `unknown` 猜字段或翻 ECHO 本体源码。可运行 `echo-workshop-sdk guide types` 查看最短说明。

`contracts/plugin-api.json` 是生产宿主直接使用的“方法 → 权限”及常见错误恢复契约。运行 `echo-workshop-sdk api` 查看全部方法，`echo-workshop-sdk api echo.queue.moveItem` 查询单个方法，`echo-workshop-sdk api errors` 查看哪些错误可退避重试。用户拒绝直链来源或一起听上传后不得循环弹窗。

## 参数化自定义功能

清单里的命令现在可以声明最多 12 个 `parameters`，支持 `string`、`number`、`boolean` 和 `select`，也可以加一段 `confirm` 确认说明。ECHO 会用宿主界面生成并校验表单，再把一个结构化对象交给命令处理函数。创建歌单工具、可配置跳转、元数据辅助等小功能不再需要为了几个输入框自造 HTML 面板。参数化或需要确认的命令从插件功能坞启动；播放器按钮、歌曲右键菜单和自动化仍只能绑定无需交互的一键命令。

同一沙箱内可以用 `await echo.commands.execute('command-id', input)` 复用其他命令，`echo.commands.list()` 可列出运行时已经注册的命令。这两个组合接口不增加权限，也不能跨插件调用。业务值仍应在处理函数中做防御性归一化。`complete` 插件模板已经演示宿主表单、确认、命令组合和受限沙箱存储。

`validate` 会拒绝私网、本机、通配、重复及畸形 `networkHosts`，域名声明必须具备 `network:request` 权限。请求只连接已验证的公网地址并保留 Host/TLS 身份；优先使用 HTTPS。

便携 CLI 与 ECHO 宿主共用 `contracts/plugin-package-limits.json`。内层可执行/文本 `.echo` 包取消文件数量、单个 UTF-8 文件字节和序列化整包字节配额，公开契约用 `null` 表示不限；扩展名为 `.css`、`.html`、`.js`、`.mjs`、`.json`。从 `26.10.18` 起，外层 `plugin-package` 可以在 `content/` 中任意目录放置清单哈希覆盖的资源，例如 `dist/`、`models/`、`fonts/`；旧 `assets/` 目录仍兼容，所有已声明的扩展名均可读取，同样不设文件数量、文件及整包字节配额；二进制素材按需流式读取，同路径优先使用内层文本资源；未登记文件和包外路径仍拒绝。嵌套插件页面也可从当前目录加载宿主虚拟 `__bridge__.js`。CLI 同步新目录布局时自动提升最低宿主版本。插件用 `new URL('./assets/model.onnx', location.href)` 这类相对 URL 读取，不能访问包外文件。`native-shell` 走单独的 `contracts/native-shell-limits.json`（512 文件、不设外层文件和整包字节配额）。官方 Steam 校验仍拒绝订阅者 `.exe` / `.dll`。共享契约都可通过包导出被外部工具直接 import。沙箱入口仍须为 `.js`；完整系统 `trustedEntry` 是单独声明的 `.mjs`，其它 `.mjs` 也可作为模块素材。内层插件 `apiVersion` 必须与外层 Workshop 清单的 `compatibility.pluginApiVersion` 完全一致。

整包 CSS 必须写在 `html[data-workshop-theme-pack="<id>"]` 下面。不能用 `FINAL`、`nyanCat`、`darkSideMoon` 当 `basePreset`。

公开工坊 SDK 起步包 [3784997717](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717) 通过独立发布流程分发此 SDK。GitHub Releases 页面和 Steam 条目才是用户实际可下载内容的事实源，两条发布线分别推进。以后更新 Steam 公开项必须继续用这一项，不要新建。

## 独立 GitHub 镜像仓库

SDK 的独立公开仓库是
[Moekotori/echo-workshop-sdk](https://github.com/Moekotori/echo-workshop-sdk)，由 ECHO
仓库内的 `npm run workshop:sdk:export-mirror` 从本文件夹生成。想 fork SDK、提
issue 或提 PR，都去镜像仓库；流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)、
[GOVERNANCE.md](./GOVERNANCE.md)、[行为准则](./CODE_OF_CONDUCT.md)和
[安全策略](./SECURITY.md)。镜像里生成的
`MIRROR.md` 记录导出的 SDK 版本；`.github/workflows/ci.yml` 会在每次 push / PR
上跑独立门禁（doctor、语法检查、八类内容 init/check/test、示例校验、严格
TypeScript 声明编译）。

私有 ECHO 仓库中的本文件夹是事实源；Steam 起步包 3784997717 面向通过 Steam
安装的作者，按独立节奏发布对应版本。镜像上被接受的贡献会由维护者合回事实源、
跑完生产侧
校验后重新导出，并在 CHANGELOG 中署名。镜像本身永远不发布到 Steam 或 npm。

## 许可

本 SDK 包内的类型、Schema、CLI、模板和示例采用 [MIT License](./LICENSE)。仅调用公开 Workshop API 或使用这些 MIT 材料的独立扩展，不受 ECHO 应用源码可见许可证约束。作者保留原创 Workshop 内容的所有权，并可自行选择许可；提交到 ECHO Steam 创意工坊时仍须遵守创意工坊内容政策、Steam 条款、第三方权利和适用法律。MIT License 不授予使用 ECHO 名称、Logo、SDK 包以外专有应用源码或素材的权利。

宿主不再提供本地歌曲上传能力。声明 `playback:share` 的旧插件会被拒绝；上传 API 已从宿主和 SDK 移除，不删除已有本地文件。合法外部直链播放继续使用 `sources:direct`。

### 添加 ECHO 设置项和侧栏内容

插件在 `manifest.contributes.settings` 声明设置，启用后显示在 ECHO 的「设置 → 创意工坊」，按插件分组。支持 `string`、`boolean`、`number`、`range`、`color`、`select`，复用宿主校验与插件私有存储。`--setting` 自动加入 `fs:plugin` 声明；订阅者仍需批准该权限。隐藏设置贡献、停用插件或紧急停止运行时会移除设置分组。

```js
const compact = await echo.settings.get('compact');
const unsubscribe = echo.settings.onChanged(values => renderLayout(values.compact));
// 界面销毁时调用 unsubscribe()。
```

`add . --setting gain --title "增益" --type range --min 0 --max 100 --step 1 --default 50` 生成数值滑块。选择项使用 `--type select --options-json '[{"label":"紧凑","value":"compact"},{"label":"舒适","value":"comfortable"}]' --default compact`。

`--sidebar` 生成 `placement: "page"` 的面板和 `src/page-<id>.html/.js/.css`，可用 `--group library|sources|playback|plugins` 选择侧栏分组。也可以直接在面板声明中指定 `icon`。用户点击侧栏入口后，内容在主区域的既有沙箱中打开。无需额外注册侧栏 API；`--page` 保持相同页面行为。

设置值仍由 `echo.settings.get/set/onChanged` 访问，只属于当前插件；声明设置项不授予任意 ECHO 全局设置写入权限。侧栏入口沿用贡献的隐藏、置顶和排序机制。此功能需要 ECHO `26.10.18`，本地 SDK 源码修改不会自动发布到 GitHub 或 Steam 工坊。


### 添加全新页面

使用 `--page` 创建独立页面，页面内容由作者的 HTML、CSS 和 JavaScript 实现，拥有自己的路由和侧栏入口：

```powershell
node .echo-sdk/bin/echo-workshop-sdk.mjs add . --page dashboard --title "我的仪表盘" --group plugins
```

编辑生成的 `src/page-dashboard.html`、`src/page-dashboard.css` 和 `src/page-dashboard.js` 即可开发页面。生成命令会把页面加入 `manifest.contributes.panels`：

```json
{
  "id": "dashboard",
  "title": "我的仪表盘",
  "path": "page-dashboard.html",
  "placement": "page",
  "group": "plugins"
}
```

`path` 相对于打包后的插件文件目录。一个插件可以声明多个页面，每个页面使用不同的 `id` 和入口文件。可选分组是 `library`、`sources`、`playback`、`plugins`；`--sidebar` 是创建这类页面的另一种命令写法。

用户可点击侧栏进入页面，插件也可以打开自己声明的页面：

```js
await echo.ui.openPanel('dashboard');
// 也可使用完整路由；echo.my-tools 替换为 manifest.id。
await echo.navigation.open('plugin:echo.my-tools:dashboard');
```

打开自身页面无需额外申请 `navigation`。页面可通过官方 SDK 组合曲库、队列、歌词和插件设置等功能，所用能力仍按各自权限批准。宿主保留侧栏与播放栏，页面切换沿用原有路由，离开页面会卸载其 iframe；监听与定时器应通过 `echo.ui.onDispose()` 清理。

## 提供器工作流与宿主状态订阅

歌词、元数据和封面现使用一致的提供器发现、候选搜索、预览、应用、拒绝与取消流程。DSP、首页、Presence、Bridge 和媒体会话提供按权限过滤的变更订阅，旧 API 保留兼容。权限、容量限制和订阅释放见 [提供器工作流](provider-workflows.md)。
