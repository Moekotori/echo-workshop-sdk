# Hello Plugin

The smallest complete Workshop plug-in project: one command, one permission (`playback:read`), no panels and no network. Use it as the first-day starting point before growing into the `complete`, `catalog` or `lyrics` presets.

- `src/plugin.js` is the only file you edit; `sync` packages it into `content/community.echo`.
- Add a permission without hand-editing JSON: `add . --permission library:read`.
- Print copy-paste starters for providers, storage and network calls: `snippet list`.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs check .
node ..\..\bin\echo-workshop-sdk.mjs test .
```

The local mock host enforces declared permissions, so an undeclared `echo.*` call fails here before it fails in production. These commands never upload to Steam.
