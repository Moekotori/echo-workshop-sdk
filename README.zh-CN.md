# ECHO 创意工坊 SDK

[![ECHO Workshop SDK CI](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml)

[公开仓库](https://github.com/Moekotori/echo-workshop-sdk) · [最新版本](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) · [私密报告安全问题](https://github.com/Moekotori/echo-workshop-sdk/security/advisories/new) · [English](./README.md)

这是给作者用的便携工具箱。当前源码包版本 `1.17.0`，清单 schema `1`，插件 API `2`。本 SDK 采用 MIT 许可，本地创作需要 Node.js 20+，不发布到 npm。可下载的 `.tgz` 以 [GitHub Releases](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) 实际列出的资产为准；main 分支可能比最新 Release 新。

| 能力 | 最低 ECHO 版本 |
| --- | --- |
| 原生侧边栏页面 `placement: "page"`、页面导航及 1.17 的命令入口 | `26.9.25` |
| 1.16 的独立主题/歌词/背景组合、动画库和面板外观控制 | `26.9.16` |
| `system:full` 与 `trustedEntry` 完整系统权限插件 | `26.8.29`，且须订阅者明确批准 |

SDK 包含 `native-shell` Windows named-pipe 作者契约，但官方 ECHO Steam 版不会启动订阅者提供的 `.exe` 或 `.dll`；沙箱插件仍为默认方式。额外语言只活在工坊 JSON 里。[Steam 创意工坊 SDK 条目](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717)附带可运行示例与独立发布的 SDK，可能与 GitHub Release 版本不同，请分别核对下载内容。

尚未发布的 API 还为固定 `workshopAudioEffect` 槽加入受限 `vocalCut` 状态：插件可设置实时中置人声抑制强度和 80–300 Hz 低频保护分频点，实际处理与平滑仍由 Audio Core 持有，插件不会进入实时线程。

新视觉接口另见[稳定主题部件、独立视觉组合与宿主预览](./theme-parts.md)和[歌词创作](./lyrics-authoring.md)。

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
| `runtime` | 沙箱 HTML/CSS/JS 自定义界面 | `26.8.20` |

歌词 `--preset`：`editorial`（默认）、`compact`、`cinema`、`cover`。  
可视化 `--preset`：`bars`（默认）、`wave`、`radial`。宿主没有 `particles`。  
DSP `--preset`：`flat`（默认）、`vocal`、`bass`、`8bit`，都是官方 31 段；`8bit` 会声明一个由宿主执行的受限 chiptune 风格器，包含方波、三角低频和瞬态门控 LFSR 噪声层。工坊包负责请求的效果参数，Audio Core 负责实时执行和实际生效状态。它属于 PCM 处理；PCM 转 SDM 会先处理，而 Native DSD / DoP 直通不进入这条效果链。

插件 `--preset`：`basic`（默认）、`complete`、`catalog`、`lyrics`、`full-trust`。完整系统插件一条命令起步：

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

便携 CLI 与 ECHO 宿主共用 `contracts/plugin-package-limits.json`。内层可执行/文本 `.echo` 包仍最多 32 个文件、单个 UTF-8 文件最多 512 KiB、序列化整包最多 2 MiB，扩展名限 `.css`、`.html`、`.js`、`.mjs`、`.json`。外层 `plugin-package` 工坊项可以在 `assets/` 下额外携带清单哈希覆盖的 `.wasm`、`.onnx`、`.bin`、`.data`，单文件最多 128 MiB、合计最多 256 MiB；插件用 `new URL('./assets/model.onnx', location.href)` 这类相对 URL 读取，不能访问包外文件。`native-shell` 走单独的 `contracts/native-shell-limits.json`（512 文件、单文件 256 MiB、整包 512 MiB）。官方 Steam 校验仍拒绝订阅者 `.exe` / `.dll`。共享契约都可通过包导出被外部工具直接 import。沙箱入口仍须为 `.js`；完整系统 `trustedEntry` 是单独声明的 `.mjs`，其它 `.mjs` 也可作为模块素材。内层插件 `apiVersion` 必须与外层 Workshop 清单的 `compatibility.pluginApiVersion` 完全一致。

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
