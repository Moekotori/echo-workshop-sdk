# SDK migration policy

SDK `1.15.0` is additive. Existing theme / lyrics / visualizer / DSP / locale / plug-in projects keep working. New kind `native-shell` is a system-shell channel (Windows exe + named pipe protocol v1). Do not convert a sandboxed plug-in to `native-shell` unless you actually ship a host process. Official Steam Workshop validation still rejects packaged `.exe` / `.dll`.

There is no required migration for existing `1.0.0` through `1.5.0` projects.

SDK `1.8.0` is additive. Shuffle/repeat, theme `storage`, collection play, lyrics transport slots, lyrics click-to-seek, appearance tokens, lyrics peeks, library revision, extra skin stages and `color`/`range` settings are optional. Declaring the new `storage` capability on an older host will fail closed until ECHO knows that capability. Existing runtimes without it keep working.

SDK `1.7.0` is additive. Custom UI library browse / lyrics / spectrum commands and plug-in `previous` / `next` / `setVolume` / `queue.moveItem` / `echo.lyrics.get` are optional. Existing search/resolve providers and UI runtimes keep working. `init --preset lyrics` only affects new projects.

SDK `1.6.0` is additive. New catalog handlers (`browse`, `listCollection`) and `enqueueDirect` / `playQueue` are optional. Existing search/resolve providers keep working; the host injects a `browse` fallback that calls `search` with an empty query. `init --preset catalog` only affects new projects.

SDK `1.5.0` is additive. `init` still accepts explicit `--id` / `--title` / `--holder`. New commands (`add`, `set`, `next`, `guide`, `recipes`, `watch`) do not change existing projects until you run them. `scaffold` now also switches lyrics, visualizer and DSP starters.

SDK `1.4.0` is additive. Lyrics, visualizer and DSP starters now default to `editorial`, `bars` and `flat`. Pass `--preset` to start from cinema/cover, wave/radial or vocal/bass. Existing projects can run `upgrade` to refresh `.echo-sdk` without touching content.

SDK `1.3.0` is additive. Existing projects can run `upgrade` to refresh `.echo-sdk` without touching content. `quality` and `test` now print text unless you pass `--json`.

SDK `1.2.0` is additive:

- `init --kind theme` now defaults to the `skin` preset instead of a colors-only file. Pass `--preset colors` to keep the previous starter.
- Stylesheet and UI-runtime themes should raise `compatibility.minEchoVersion` to `26.8.20`.
- New commands (`inspect`, `scaffold`, `kinds`) do not change existing project files unless you run `scaffold`.

When a future SDK version is released:

1. compare `echo-workshop-sdk.json` before changing project files;
2. keep the current `schemaVersion` and `pluginApiVersion` until the new versions are listed as supported;
3. update one version field at a time;
4. run the portable SDK `sync` and `validate` commands;
5. run ECHO's production `workshop:author -- validate` command;
6. test subscribe, download, use and disable with an ordinary Steam account before changing the public item.

ECHO will not infer a newer API from SDK package version. Compatibility is declared explicitly in `echo.workshop.json`.
