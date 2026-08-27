# Harbor Stylesheet Theme

This is a subscriber-ready Workshop theme pack. `theme.json` points at `theme.css`, which must stay scoped to `html[data-workshop-theme-pack="echo.harbor-stylesheet"]`.

Host support starts at ECHO `26.8.20`. Older clients that do not know `stylesheet` refuse the item.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs test .
node ..\..\bin\echo-workshop-sdk.mjs quality .
```
