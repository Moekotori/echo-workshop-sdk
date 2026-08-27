# ECHO 创意工坊 SDK

这是给作者用的便携工具箱。当前候选包版本 `1.11.0`，清单 schema `1`，插件 API `2`。它在 `1.10.0` 完整本地门禁的基础上补齐作者项目 Schema，并在本地提前拒绝非法发布路径、描述、可见性和标签；额外语言仍只活在工坊 JSON 里，本体仍只有五套内置语言。

这些命令**永远不会上传**到 Steam。发布只能在 ECHO 创作台或仓库作者 CLI 里单独确认。

## 最快上手

```powershell
node .\bin\echo-workshop-sdk.mjs init .\harbor --recipe css-theme
cd .\harbor
npm run next
npm run check
npm run dev
```

只写目录也行：`init .\my-lyrics --kind lyrics-style`。id / 标题会从文件夹名推断。`--license MIT`（`init` / `set` 都支持）可声明你自己的内容许可，默认仍是 `All-Rights-Reserved`。

SDK 也是独立 npm 包：`npm install <本文件夹或 tgz 路径>` 之后可直接 `npx echo-workshop-sdk`。`init` / `check` / `test` / `quality` / `dev` 只需要 Node 20+，不需要安装 ECHO；发布仍在 ECHO 创作台确认。

按效果挑模板：`recipes`。中文说明书：`guide`（新增 `guide troubleshoot` 排错速查与 `guide checklist` 从 0 到发布清单）。一页纸命令速查见 [CHEATSHEET.md](./CHEATSHEET.md)，完整排错手册见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)（都是双语）。

第一天上手可直接拷最小示例：`example hello-plugin .\my-plugin`（单命令插件）或 `example minimal-theme .\my-theme`（最少文件的配色主题）。

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
DSP `--preset`：`flat`（默认）、`vocal`、`bass`，都是官方 31 段。

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

`validate` 会拒绝私网、本机、通配、重复和畸形 `networkHosts`，也会拒绝没有 `network:request` / `playback:share` 能力依据的域名声明。mock 会在 fixture 阶段拒绝未声明域名和自定义端口；生产网络请求与一起听上传会先解析公网地址，再固定连接到已校验地址，同时保留原域名的 Host/TLS 身份。为兼容性仍接受 HTTP(S)，作者应优先使用 HTTPS。

便携 CLI 与 ECHO 宿主共用 `contracts/plugin-package-limits.json`：插件包最多 32 个文件，单个 UTF-8 文件最多 512 KiB，序列化整包最多 2 MiB；素材扩展名限 `.css`、`.html`、`.js`、`.mjs`、`.json`。三份共享契约（插件 API、包限额、内容类型）都可通过包导出被外部工具直接 import。插件入口仍须为 `.js`，`.mjs` 可作为被导入的模块素材。内层插件 `apiVersion` 必须与外层 Workshop 清单的 `compatibility.pluginApiVersion` 完全一致。

整包 CSS 必须写在 `html[data-workshop-theme-pack="<id>"]` 下面。不能用 `FINAL`、`nyanCat`、`darkSideMoon` 当 `basePreset`。

公开工坊 SDK 起步包是 [3784997717](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717) 的 `1.10.0`；`1.11.0` 目前只是本地候选。以后更新公开项必须继续用这一项，不要新建。

## 独立 GitHub 镜像仓库

SDK 还有一个独立的公开 GitHub 镜像仓库（建议名 `echo-workshop-sdk`），由 ECHO
仓库内的 `npm run workshop:sdk:export-mirror` 从本文件夹生成。想 fork SDK、提
issue 或提 PR，都去镜像仓库；流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)、
[GOVERNANCE.md](./GOVERNANCE.md) 和[行为准则](./CODE_OF_CONDUCT.md)。镜像里生成的
`MIRROR.md` 记录导出的 SDK 版本；`.github/workflows/ci.yml` 会在每次 push / PR
上跑独立门禁（doctor、语法检查、七类内容 init/check/test、示例校验、严格
TypeScript 声明编译）。

私有 ECHO 仓库中的本文件夹是事实源；Steam 起步包 3784997717 面向通过 Steam
安装的作者，装的是同一个包。镜像上被接受的贡献会由维护者合回事实源、跑完生产侧
校验后重新导出，并在 CHANGELOG 中署名。镜像本身永远不发布到 Steam 或 npm。

## 许可

本 SDK 包内的类型、Schema、CLI、模板和示例采用 [MIT License](./LICENSE)。仅调用公开 Workshop API 或使用这些 MIT 材料的独立扩展，不受 ECHO 应用源码可见许可证约束。作者保留原创 Workshop 内容的所有权，并可自行选择许可；提交到 ECHO Steam 创意工坊时仍须遵守创意工坊内容政策、Steam 条款、第三方权利和适用法律。MIT License 不授予使用 ECHO 名称、Logo、SDK 包以外专有应用源码或素材的权利。
