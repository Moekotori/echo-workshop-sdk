## Summary

<!-- What does this change and why? Link the issue it resolves, if any. -->

## Kind of change

- [ ] Bug fix
- [ ] Feature (CLI command, flag, preset, recipe, template, example)
- [ ] Documentation only
- [ ] Contract/schema change (requires an accepted RFC — see GOVERNANCE.md)

## Checklist

- [ ] `node bin/echo-workshop-sdk.mjs doctor` passes
- [ ] `node --check` passes on every file I touched
- [ ] `init` + `check` + `test` still pass for the content kinds I touched
- [ ] No new runtime dependencies; the CLI still runs on bare Node.js 20+
- [ ] No fail-closed check was weakened; SDK commands still never upload to Steam
- [ ] `README.md` and `README.zh-CN.md` updated for user-visible changes
- [ ] `CHANGELOG.md` entry added under the current unreleased version
- [ ] New files are original work or MIT-compatible with a traceable origin
