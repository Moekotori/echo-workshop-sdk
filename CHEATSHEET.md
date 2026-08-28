# Command cheat sheet / 命令速查

One page, both languages. All commands are local-only and never upload to Steam. Inside a generated project, prefix with `npm run` (for example `npm run check`); standalone, use `node ./bin/echo-workshop-sdk.mjs <command>` or `npx echo-workshop-sdk <command>`.

## Start / 开工

| Command | What it does | 作用 |
| --- | --- | --- |
| `init ./dir --kind theme` | New project; folder name becomes id/title | 新建项目，目录名即 id/标题 |
| `init ./dir --recipe css-theme` | Start from an outcome (`recipes` lists them) | 按效果起步（`recipes` 列表） |
| `example list` / `example hello-plugin ./dir` | Copy a complete official example | 拷贝完整官方示例 |
| `kinds` / `recipes` / `guide` | Catalogs and the Chinese cookbook | 类型/配方目录与中文说明书 |

## Iterate / 迭代

| Command | What it does | 作用 |
| --- | --- | --- |
| `next .` | Fix-first items from the live quality report, then host-allowed moves | 先列当前质量报告待办，再列宿主还允许的动作 |
| `add . --permission library:read` | Append a whitelisted permission / slot / capability / color | 白名单内追加权限/槽位/能力/颜色 |
| `set . --title "Harbor"` | Update common fields in place | 原地改常用字段 |
| `scaffold . --preset stylesheet` | Switch or stack starters without restarting | 换档/叠层，不重开项目 |
| `snippet list` / `snippet plugin-command` | Copy-paste starters with required permissions | 常用代码片段（标注所需权限） |
| `watch .` | Rerun the gate on save, gate summary each time | 保存即重跑门禁并输出摘要 |
| `dev .` | Live author console + fixture preview (port 41783, auto-fallback) | 实时作者控制台与预览 |

## Verify / 验证

| Command | What it does | 作用 |
| --- | --- | --- |
| `check .` | The complete local gate: sync + validate + quality + fixtures | 完整本地门禁 |
| `check . --warn-only` | Same report, passing exit code while iterating | 照常报告但退出码 0 |
| `quality .` / `test .` / `validate .` | Individual gate stages | 门禁的单独阶段 |
| `fix .` | Repair preview / minEchoVersion / missing README, CUSTOMIZE, .gitignore | 修复预览、版本、缺失文档 |
| `explain .` / `inspect .` | Human / machine readable project summary | 人读 / 机器读项目摘要 |
| `api echo.queue.moveItem` / `api errors` | Method-to-permission contract and error recovery | 方法权限契约与错误恢复 |
| `version --json` / `doctor` | Capability surface / SDK self-check | 能力表面 / SDK 自检 |
| `upgrade .` | Refresh the project's portable `.echo-sdk` copy | 更新项目内便携 SDK |

Add `--json` to `check`, `quality`, `test`, `validate`, `next`, `version`, `doctor`, `snippet`, `api`, `example list` for machine-readable output. `help <command>` or any command with `--help` prints focused usage.

## Custom functions / 自定义功能

- Add `parameters` to a declared command for a host-owned form: `string`, `number`, `boolean`, `select`; maximum 12 fields. / 在命令声明中加入 `parameters`，由宿主生成表单；最多 12 项。
- Add `confirm` when the function has a meaningful side effect. / 有明显副作用的功能可加入 `confirm` 确认说明。
- The handler receives one values object; compose another local command with `echo.commands.execute(id, input)`. / 处理函数收到一个参数对象；可用 `echo.commands.execute` 组合本插件命令。
- Player-bar, track-context and automation actions stay one-click and must target a command without parameters or confirmation. / 播放器按钮、歌曲右键和自动化保持一键执行，只能绑定无需参数或确认的命令。
- Generate the working example with `init ./dir --kind plugin-package --preset complete`. / 用 `complete` 预设直接生成可运行示例。

## VS Code tips / 编辑器技巧

- Generated projects map every JSON file to its Schema (`.vscode/settings.json`), so bad fields are underlined while editing. / 生成项目已把所有 JSON 映射到 Schema，编辑时直接标红。
- The default build task is **ECHO Workshop: Check** (`Ctrl+Shift+B`); **ECHO Workshop: Dev console** starts `dev` without remembering CLI paths. / 默认构建任务就是 check，dev 也有现成任务。
- Type an `echo-` prefix in `.js` or `.json` files to expand the bundled snippets (`.vscode/echo-workshop.code-snippets`) — the same set `snippet list` prints. / 在 js/json 里输入 `echo-` 前缀即可展开内置片段。
- Plug-in projects get typed completion for the sandbox `echo` global from `.echo-sdk/echo-workshop-plugin.d.ts`; keep `checkJs` on (the generated `tsconfig.json` already does). / 插件项目自带 `echo` 全局类型补全。

## Publish / 发布

These commands never upload. Publish only in ECHO → Workshop → Authoring Studio after a clean `check`. / 这些命令永不上传；`check` 全绿后，只在 ECHO → 工坊 → 创作里发布。
