# Contributing to the ECHO Workshop SDK

Thank you for helping improve the SDK. This document applies to the standalone
public mirror
[Moekotori/echo-workshop-sdk](https://github.com/Moekotori/echo-workshop-sdk)
and to the
`docs/workshop-sdk/` folder inside the private ECHO repository, which is the
source of truth. See [GOVERNANCE.md](./GOVERNANCE.md) for how the two relate.

一份中文速览在文末（[中文速览](#中文速览)）。

## Ways to contribute

- **Bug reports** — use the *Bug report* issue template. Include the output of
  `node bin/echo-workshop-sdk.mjs version --json`, the exact command you ran,
  and what you expected.
- **Feature requests** — use the *Feature request* issue template. Explain the
  authoring problem first; propose a mechanism second.
- **New content-kind proposals** — use the *Content-type proposal* issue
  template. New kinds change the shared host contract, so they go through the
  RFC process described in [GOVERNANCE.md](./GOVERNANCE.md).
- **Pull requests** — fixes to the CLI, libraries, templates, examples,
  schemas, declarations and documentation are all welcome.

Do not report security issues in public issues. Follow [SECURITY.md](./SECURITY.md)
and use the repository's private vulnerability report form instead.

## Local development

The SDK is intentionally **zero-dependency**: only Node.js 20+ is required.

```bash
node bin/echo-workshop-sdk.mjs doctor          # self-check of the SDK tree
node bin/echo-workshop-sdk.mjs init /tmp/demo  # scaffold a starter project
node bin/echo-workshop-sdk.mjs check /tmp/demo # the complete local gate
node bin/echo-workshop-sdk.mjs help check      # per-command help
```

There is no build step. Edit the `.mjs` sources directly and re-run the CLI.

## The check gate

Every pull request must pass the mirror CI (`.github/workflows/ci.yml`):

1. `doctor` — the SDK tree is complete and internally consistent.
2. `node --check` on every `.mjs`/`.js` file in `bin/`, `lib/`, `templates/`
   and `examples/`.
3. `init` + `check` + `test` for all nine content kinds
   (`theme`, `lyrics-style`, `animation-library`, `visualizer-preset`, `dsp-preset`,
   `audio-plugin-profile`, `locale-pack`, `plugin-package`).
4. `validate` + `test` for the bundled complete example projects.
5. A strict `tsc` compile of the public TypeScript declarations.

Run the same commands locally before opening a pull request. Inside the
private ECHO repository, `npm run workshop:sdk:check` additionally verifies
the SDK against the production host.

## Pull request rules

- Keep changes small and focused; one logical change per pull request.
- **No new runtime dependencies.** The CLI must keep working with a bare
  Node.js 20+ installation.
- **Never weaken a fail-closed check.** Validation, hash, size, network-host
  and permission checks reject by default; a change that turns a rejection
  into a silent pass needs an explicit maintainer decision.
- **SDK commands never upload to Steam.** Do not add upload, login,
  credential or publishing capabilities; publication stays in ECHO's
  Authoring Studio.
- Do not add third-party platform scrapers, downloaders or authentication
  bypasses. Such pull requests will be declined regardless of code quality.
- Update both `README.md` and `README.zh-CN.md` when you change
  user-visible behavior, and add a `CHANGELOG.md` entry under the current
  unreleased version.
- New files must be original work or carry a license compatible with MIT and
  a traceable origin.

## Code style

- Modern ES modules (`.mjs`), `async`/`await`, no transpilation.
- Descriptive full-word identifiers; avoid abbreviations.
- Comments only where the intent is not obvious from the code.
- Follow the structure that is already there: commands stay thin in
  `bin/echo-workshop-sdk.mjs` and delegate to focused modules in `lib/`.

## Licensing of contributions

The SDK is [MIT-licensed](./LICENSE). By submitting a contribution you agree
that it is your own work (or that you have the right to submit it) and that
it is licensed under the MIT License. The MIT grant covers this SDK package
only — not the ECHO application, name or logo.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
Be kind; assume good intent; moderation decisions rest with the maintainers.

## 中文速览

- 提 bug 用 *Bug report* 模板，附上 `version --json` 输出和完整命令。
- 提功能建议用 *Feature request* 模板；新内容类型走 *Content-type proposal*
  模板和 [GOVERNANCE.md](./GOVERNANCE.md) 里的 RFC 流程。
- 本地开发只需要 Node.js 20+，没有构建步骤；改完直接重跑 CLI。
- PR 必须通过镜像 CI：`doctor`、全量 `node --check`、七类内容
  `init`/`check`/`test`、示例项目校验、严格 `tsc` 声明编译。
- 红线：不加运行时依赖；不削弱 fail-closed 校验；SDK 命令永不上传 Steam；
  不加平台抓取、下载器或鉴权绕行。
- 改了用户可见行为要同时更新中英文 README 和 CHANGELOG。
- 贡献以 MIT 许可提交；安全问题按 [SECURITY.md](./SECURITY.md) 通过 GitHub 私密报告入口提交，不要公开细节。
