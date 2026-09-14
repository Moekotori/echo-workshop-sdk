# Full Trust Plugin

This is the smallest complete `system:full` project: a sandbox command in `src/plugin.js` explicitly calls a Node.js handler in `src/trusted.mjs`.

```powershell
node ..\..\bin\echo-workshop-sdk.mjs check .
node ..\..\bin\echo-workshop-sdk.mjs test .
```

The mock host validates the package and bridge but deliberately does not execute `trusted.mjs`. Run the command inside ECHO for a real test; the subscriber must approve desktop-application-equivalent access first.

Authors install Node 20+, compilers and third-party dependencies in their own environment. ECHO Authoring Studio does not provision that toolchain. Bundle or otherwise prepare allowed distributable files before packaging. These SDK commands never upload to Steam.
