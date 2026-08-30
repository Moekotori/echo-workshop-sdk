# Native Shell Taskbar

Smallest complete `native-shell` project: protocol v1, declared shell permissions, and a relative `host/EchoShell.exe` path.

Authoring `check` / `test` pass without the executable. A live ShinawaseLoader or ECHO host needs the WinUI (or other Windows) binary at that path. Do not commit a self-contained WinAppSDK publish here.

The complete reference implementation is ECHO AudioBand in the ShinawaseLoader tree: same pipe ops (`config` / `status` / `quit` / `ready` / `log` / `command`) and the same command list.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs validate .
node ..\..\bin\echo-workshop-sdk.mjs test .
```
