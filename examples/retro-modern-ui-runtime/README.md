# Retro Modern UI

This is a complete Workshop theme project requiring ECHO 26.10.18 or newer. Its sandboxed `ui/index.html` loads the host's `__bridge__.js` and uses the official `echo.*` SDK, shared with sandbox plug-ins. The client file is supplied by the host and is not packaged.

The example pages the library, plays tracks and albums, displays the queue, lyrics and spectrum, follows host appearance, and releases listeners on disposal. Its declared capabilities are checked by the host, which owns Audio Core and emergency exit.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs test .
node ..\..\bin\echo-workshop-sdk.mjs dev .
```
