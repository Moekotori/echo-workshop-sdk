# Retro Modern UI

This is a complete Workshop theme project, not a plug-in fragment. It ships a sandboxed `ui/index.html` that talks to ECHO through the versioned `postMessage` bridge.

Capabilities used: navigation, playback, library, queue and window control. The host still owns Audio Core, emergency exit and capability checks.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs test .
node ..\..\bin\echo-workshop-sdk.mjs dev .
```
