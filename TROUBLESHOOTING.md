# Troubleshooting / 排错手册

Every failure below is local and fail-closed by design: the SDK refuses early so the production host never has to. Nothing here uploads to Steam. 中文版见下半部分。

## Read the gate first

`check` (or `npm run check` inside a generated project) always ends with one line:

```text
[echo-workshop-sdk] Gate PASS for <id> · quality 9 pass / 0 warning / 0 blocker · fixtures 1/1
```

- **blocker**: must be zero before publication. `quality .` lists each one with the rule that raised it.
- **warning**: an author decision, not a hard stop. `next .` maps each warning to the command that clears it.
- **fixtures**: deterministic mock-host runs. A failing fixture prints the exact error id below.

Keep iterating with `check . --warn-only` (reports everything, exits 0); publication still requires a clean `check`.

## Validation and sync errors

| Message | Cause and fix |
| --- | --- |
| `Manifest hash mismatch: <file>` / `Manifest is missing files` | You edited `content/` or `src/` by hand. Run `sync .` — `check` and `watch` do it automatically. |
| `Target directory must be empty` | `init` and `example` refuse non-empty folders. Pick a new folder or clear leftovers. |
| `Project id is invalid` | Use lowercase like `echo.harbor-theme` (letters, digits, `.`, `_`, `-`, 3–80 chars). |
| `Unsupported template kind` / `Unsupported --preset` / `Unknown --recipe` | Run `kinds` and `recipes` for the accepted lists. |
| `Preview must be JPG, PNG or GIF under 1 MB` | Run `fix .` to generate a compliant 256×256 `preview.png`, or supply your own square image. |
| `Workshop networkHosts are invalid` | Hosts must be plain public domain names or public IPv4 — no protocol, port, wildcard, duplicate, private or loopback address. |
| `Inner and outer plug-in apiVersion must match` | `community.echo` `manifest.apiVersion` must equal the outer manifest's `compatibility.pluginApiVersion`. |
| `Plug-in package exceeds the host byte limit` | Contract: at most 32 files, 512 KiB per file, 2 MiB serialized. Split or trim assets. |
| `Project tags are invalid` | 1–8 unique non-empty tags. Quality additionally warns when a tag is not configured on the ECHO AppID (run `kinds` for the configured tag per content kind). |

## Mock-host (test / dev) denials

The local mock enforces the same declarations as production, so these failures are the tool working, not breaking:

| Fixture error | Fix |
| --- | --- |
| `capability-denied:<permission>` | The code calls an `echo.*` API without the permission. Run `add . --permission <permission>` (plug-ins) or `add . --capability <cap>` (UI runtimes). |
| `network-host-denied` | The code requests a host missing from the outer manifest's `networkHosts`. Declare it there, then `sync .`. |
| `network-port-denied` | Custom ports are rejected locally and in production. Use default 443/80. |
| `share-destination-denied` | `playback:share` uploads only to declared `networkHosts`. |

Local `test`/`dev` is author evidence only; it is not the production sandbox and not proof of Steam-client behavior.

## dev console issues

- **Port busy**: `dev` starts at `41783` and automatically takes the next free port (it prints which). An explicit `--port` fails instead of falling back — that is intentional.
- **Console shows “Disconnected”**: the dev process exited; check the terminal for the error, fix, and rerun `npm run dev`.
- **No preview link**: only stylesheet/runtime themes, lyrics, visualizer and DSP projects get a fixture preview. Other kinds still get the full console.

## Environment

- Node.js **20+** is required (`node --version`). No other dependency is needed; the SDK is zero-dependency by design.
- On Windows, quote paths with spaces and prefer `.\folder` relative paths, as in the README examples.
- For machine-readable output in scripts and editors, add `--json` to `check`, `quality`, `test`, `validate`, `next`, `version`, `doctor`, `snippet` and `api`.

## Still stuck?

- `guide troubleshoot` prints the one-screen Chinese quick table; `help <command>` prints focused usage.
- File issues on the public mirror repository (see “Standalone GitHub mirror” in the README). Do not attach Steam credentials, tokens or local absolute paths.

---

# 排错手册（中文）

下面所有失败都发生在本地，而且是刻意 fail-closed：SDK 先拒绝，生产宿主就不用替你兜底。这些命令永不上传 Steam。

## 先看门禁摘要

`check`（生成项目里是 `npm run check`）结尾总有一行：

```text
[echo-workshop-sdk] Gate PASS for <id> · quality 9 pass / 0 warning / 0 blocker · fixtures 1/1
```

- **blocker**：发布前必须清零，`quality .` 会列出每一条。
- **warning**：作者决策，不强制。`next .` 会把每条 warning 映射到能清掉它的命令。
- **fixtures**：确定性 mock 测试，失败会打印下面的错误 id。

早期迭代可用 `check . --warn-only`（照常报告但退出码 0）；发布前仍需完整通过。

## 校验 / 同步类错误

| 报错 | 原因与处理 |
| --- | --- |
| `Manifest hash mismatch` / `Manifest is missing files` | 手改了 `content/` 或 `src/`。跑 `sync .`（`check`、`watch` 会自动做）。 |
| `Target directory must be empty` | `init` / `example` 只接受空目录。 |
| `Project id is invalid` | 用小写 `echo.harbor-theme` 这类 id。 |
| `Unsupported template kind / --preset / --recipe` | 用 `kinds`、`recipes` 查合法值。 |
| `Preview must be ...` | `fix .` 会生成合规 256×256 `preview.png`。 |
| `Workshop networkHosts are invalid` | 只能写纯公网域名或公网 IPv4；不能带协议、端口、通配符、私网、本机地址，也不能重复。 |
| `Inner and outer plug-in apiVersion must match` | 内层 `community.echo` 的 `apiVersion` 必须等于外层清单 `compatibility.pluginApiVersion`。 |
| `Plug-in package exceeds the host byte limit` | 限额：32 个文件、单文件 512 KiB、整包 2 MiB。 |
| `Project tags are invalid` | 1–8 个不重复标签；quality 还会提示未在 ECHO AppID 配置的标签（`kinds` 可查每类默认标签）。 |

## mock（test / dev）拒绝

本地 mock 执行与生产一致的声明检查，报错说明工具在正常工作：

| fixture 错误 | 处理 |
| --- | --- |
| `capability-denied:<权限>` | 代码用了未声明的权限：插件 `add . --permission <权限>`，UI runtime `add . --capability <能力>`。 |
| `network-host-denied` | 请求了外层清单 `networkHosts` 没有的域名，先声明再 `sync .`。 |
| `network-port-denied` | 本地与生产都拒绝自定义端口，用默认 443/80。 |
| `share-destination-denied` | `playback:share` 只能上传到已声明域名。 |

本地 `test` / `dev` 只是作者证据，不是生产沙箱，也不能当 Steam 客户端验证。

## dev 控制台

- **端口被占**：`dev` 从 `41783` 起自动顺延并打印实际端口；显式 `--port` 被占用会直接报错（这是刻意的）。
- **显示 Disconnected**：dev 进程已退出，看终端报错，修好后重跑 `npm run dev`。
- **没有预览链接**：只有 stylesheet/runtime 主题、歌词、可视化、DSP 项目有 fixture 预览，其它类型仍有完整控制台。

## 环境

- 需要 Node.js **20+**；SDK 零依赖，无需 npm install。
- Windows 下带空格的路径要加引号，示例统一用 `.\folder` 相对路径。
- 脚本 / 编辑器集成给 `check`、`quality`、`test`、`validate`、`next`、`version`、`doctor`、`snippet`、`api` 加 `--json`。

## 还是卡住？

- `guide troubleshoot` 是一屏速查表；`help <命令>` 看单条命令用法。
- 去公开镜像仓库提 issue（README「独立 GitHub 镜像仓库」一节）。不要附带 Steam 凭据、token 或本机绝对路径。
