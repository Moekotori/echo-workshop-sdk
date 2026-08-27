# Minimal Theme

The smallest complete Workshop theme project: a `colors`-layer preset that only overrides light and dark tones on the public `classic` base. Two JSON files, one preview image, nothing else to maintain.

- Edit the hex values in `content/theme.json`; `snippet theme-colors` prints a fresh tone block.
- Grow later without starting over: `scaffold . --preset stylesheet` or `--preset runtime`.
- `basePreset` must stay a public host preset; `FINAL`, `nyanCat` and `darkSideMoon` are rejected.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs check .
node ..\..\bin\echo-workshop-sdk.mjs test .
```

These commands never upload to Steam.
