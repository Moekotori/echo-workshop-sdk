# ECHO Workshop SDK governance

This document describes who maintains the SDK, how changes are decided, and
how the public mirror relates to the ECHO application repository.

## Repositories and source of truth

- **Source of truth**: the `docs/workshop-sdk/` folder inside the private
  ECHO application repository. The production Workshop host and the SDK share
  contracts (`contracts/*.json`) there, and the private repository's checks
  verify both sides against each other on every change.
- **Public mirror**:
  [Moekotori/echo-workshop-sdk](https://github.com/Moekotori/echo-workshop-sdk),
  generated from the source of truth with the export
  tool (`npm run workshop:sdk:export-mirror` in the private repository). The
  mirror contains everything in this package plus `MIRROR.md`, which records
  the exported SDK version.
- **Steam Workshop starter**: item
  [`3784997717`](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717)
  ships a packaged copy of the SDK for authors who install through Steam.
  `CHANGELOG.md` is the single record of which SDK version that item is on.

Issues and pull requests happen on the public mirror. Accepted changes are
applied to the source of truth by a maintainer (with contributor credit in
the changelog), re-verified against the production host, and re-exported.
Public mirror history is preserved: normal re-exports append commits and must
not rewrite tagged history. Treat release tags and `MIRROR.md` as the stable
mapping back to the private source-of-truth commit.

## Roles

- **Maintainers** — the ECHO team. They triage issues, review pull requests,
  run the production-side verification that the public CI cannot run, decide
  releases, and hold the keys to the Steam Workshop starter item. They are
  the final decision-makers.
- **Contributors** — anyone who opens an issue or pull request under
  [CONTRIBUTING.md](./CONTRIBUTING.md) and the
  [code of conduct](./CODE_OF_CONDUCT.md).

## Versioning policy

The package version is `<sdkVersion>.<feature>.<fix>`:

- `sdkVersion` (major) tracks the supported Workshop manifest schema family.
  It only changes when the manifest schema does.
- Feature releases may add commands, kinds, presets, declarations and
  contract surface **additively** within the same plug-in API version.
- Removing or changing an existing public API surface requires a new plug-in
  API version and a migration note in [MIGRATING.md](./MIGRATING.md).
- `echo-workshop-sdk.json` is the machine-readable statement of what a given
  release supports. Versions absent from it are unsupported.

## Change process

1. **Small fixes** (bugs, docs, template polish): open a pull request
   directly. One maintainer approval merges it.
2. **New features** (commands, presets, recipes): open a *Feature request*
   issue first so the authoring problem is agreed before code review.
3. **Contract changes** (new content kinds, new plug-in permissions, new
   capabilities, schema changes): these change the production host as well,
   so they follow an RFC flow:
   - open a *Content-type proposal* issue describing the authoring need, the
     entry-file shape, the host surface required, and the security review
     (network access? runtime code? new permissions?);
   - maintainers accept, defer or decline the proposal;
   - accepted proposals are implemented host-side first in the private
     repository, then the SDK surface lands in a feature release.
4. **Security boundaries are not up for vote.** Fail-closed validation, the
   no-upload rule, sandbox restrictions and the ban on platform scrapers are
   fixed constraints of the project.

## Releases

A release is cut in the private repository: version bump in `package.json`
and `echo-workshop-sdk.json`, changelog entry, full check gate, mirror
re-export, and — separately and explicitly — an in-place update of the Steam
Workshop starter item. The mirror repository itself never publishes to Steam
or npm; the `private: true` flag in `package.json` is intentional and guards
against accidental npm publishes.

## 中文摘要

- 私有 ECHO 仓库中的 `docs/workshop-sdk/` 是唯一事实源；公开镜像
  [Moekotori/echo-workshop-sdk](https://github.com/Moekotori/echo-workshop-sdk)
  由导出脚本生成，issue 和 PR 在镜像上进行，公开后保留提交与 tag 历史，
  被接受的改动由维护者合入事实源、跑完生产侧校验后重新导出。
- 版本号 `<sdkVersion>.<feature>.<fix>`：major 跟随清单 schema；1.x 内 API
  只能加不能破坏；破坏性修改必须开新的插件 API 版本并写迁移说明。
- 小修复直接提 PR；新功能先开 Feature request；改共享契约（新内容类型、
  新权限、schema）走 Content-type proposal 的 RFC 流程，由维护者决定。
- 安全边界不可协商：fail-closed 校验、永不上传 Steam、沙箱限制、
  禁止平台抓取。发布和 Steam 起步包更新只由维护者在私有仓库执行。
