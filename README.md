# ECHO Workshop SDK

[![ECHO Workshop SDK CI](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml)

[Public repository](https://github.com/Moekotori/echo-workshop-sdk) · [Latest release](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) · [Report a vulnerability](https://github.com/Moekotori/echo-workshop-sdk/security/advisories/new) · [中文说明](./README.zh-CN.md)

This repository contains the portable developer kit for ECHO Steam Workshop. The current source package is `1.17.0`. SDK version `1` targets Workshop manifest schema `1` and plug-in API `2`. The SDK is MIT-licensed, requires Node.js 20+ for local authoring, and is not published to npm. Check the [latest GitHub release](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) for an actual downloadable `.tgz`; the main branch can be newer than the latest release.

| Feature | Minimum ECHO version |
| --- | --- |
| Native sidebar pages (`placement: "page"`), page navigation and the 1.17 command surfaces | `26.9.25` |
| Independent theme/lyrics/background composition, animation libraries and panel presentation from 1.16 | `26.9.16` |
| Full-trust plug-ins (`system:full` and `trustedEntry`) | `26.8.29`; explicit subscriber approval required |

The SDK includes `native-shell` authoring contracts for a Windows named-pipe channel, but the official ECHO Steam build does not launch subscriber-supplied `.exe` or `.dll` files. Sandboxed plug-ins remain the default. The five built-in app languages stay in ECHO. ECHO does not ship a third-party streaming platform.

The unreleased API surface also exposes a bounded `workshopAudioEffect.vocalCut` state for realtime center-vocal suppression. Audio Core owns execution and smoothing; plug-ins can set strength and an 80–300 Hz bass-preservation crossover, but still cannot run code on the realtime thread.

The public [Steam Workshop starter item](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717) provides a runnable sample and a separately published copy of the SDK. GitHub Releases and the Steam item can have different versions; check each download directly. Updates to the Steam item keep PublishedFileID `3784997717`.

It contains:

- `echo-workshop-plugin.d.ts`: editor completion for the sandbox `echo` global;
- `echo-workshop-ui-runtime.d.ts`: editor completion for the theme UI `postMessage` bridge;
- `echo-workshop-native-shell.d.ts`: editor completion for native-shell protocol v1;
- `echo-workshop-animation-library.d.ts`: data-only animation export and reference types;
- `echo-workshop-sdk.json`: machine-readable supported-version contract;
- `schemas/`: JSON Schema hints for the authoring project, manifests, themes and `.echo` packages;
- `bin/echo-workshop-sdk.mjs`: zero-dependency project generator, inspector, mock host and preflight checker;
- `templates/`: nine official content templates, theme/plugin presets and a GitHub Actions validation workflow;
- `examples/`: focused plug-in fragments, the day-one `hello-plugin` / `minimal-theme` starters, a complete `full-trust-plugin`, plus theme, lyrics, visualizer, DSP and locale-pack projects.

Chinese author notes: [README.zh-CN.md](./README.zh-CN.md). A bilingual
one-page command reference lives in [CHEATSHEET.md](./CHEATSHEET.md), and
[TROUBLESHOOTING.md](./TROUBLESHOOTING.md) maps every common local failure —
check errors, mock permission denials, dev port conflicts, tag warnings — to
its fix (`guide troubleshoot` prints the short Chinese table).
[Theme parts and host preview](./theme-parts.md) and [lyrics authoring](./lyrics-authoring.md) document the newer visual surfaces.

The JSON Schemas improve editor feedback. ECHO's production parser remains authoritative and may enforce cross-file, hash, size and runtime-policy checks that JSON Schema cannot express.

Plug-in API 2 is the stable compatibility baseline. Before showing a feature, use `echo.host.getFeatureAvailability(actionOrCapability)` or inspect `echo.host.getCapabilities()`, then degrade using the returned reason instead of probing undocumented methods or guessing from thrown errors. Experimental APIs must be explicitly marked experimental and are not part of the API 2 compatibility promise.

Sandbox panels can also behave like responsive ECHO-native tools without gaining parent DOM access. Use `echo.ui.getContext()` and `echo.ui.onContextChanged()` for the host locale, direction, viewport, reduced-motion setting, light/dark state and bounded semantic appearance tokens. A visible panel may call `echo.ui.setPanelPresentation()` to change its host-owned title, badge, dirty marker, attention state and `compact` / `comfortable` / `wide` / `full` / `immersive` size, or `echo.ui.closePanel()` after completing a workflow. Background runtimes may call `echo.ui.openPanel(panelId?)` so a `playerBarActions` command can open a declared panel, or omit the id to let the host choose among this plug-in's visible panels. `immersive` fills the whole ECHO window content area, including over the player bar, with no host chrome at all, so the panel must offer its own exit via `echo.ui.closePanel()` (the host's `Ctrl+Shift+Esc` emergency exit always remains); hosts older than the version that introduced it reject the value with `invalid-payload`, so fall back to `full`. Background runtimes cannot mutate panel chrome, and in every other size the host close control remains permanent.

## Quick start from the packed SDK

Download the `.tgz` that is actually listed on the [latest GitHub release](https://github.com/Moekotori/echo-workshop-sdk/releases/latest), then install or unpack it locally. Do not infer a downloadable release from the version on the repository's main branch. The package is intentionally not published to npm. Contributors can install this source folder directly while preparing a release.

```powershell
$sdkPackage = Get-ChildItem .\echo-workshop-sdk-*.tgz | Sort-Object LastWriteTime -Descending | Select-Object -First 1
npm install $sdkPackage.FullName
npx echo-workshop-sdk version --json
npx echo-workshop-sdk init .\harbor --recipe css-theme
cd .\harbor
npm run next
npm run check
npm run dev
```

`--id`, `--title` and `--holder` are optional. `recipes` lists outcome-oriented starters; `guide` is the Chinese cookbook; `add` / `set` / `scaffold` keep customizing inside the host whitelist. `--license` (on `init` and `set`) declares your own content license, such as `MIT` or `CC0-1.0`; the default stays `All-Rights-Reserved`. `next` starts with fix-first items derived from the project's current quality report, each mapped to the command that clears it. `snippet list` prints copy-paste starters (providers, storage, network calls, UI runtime bridge, theme tones) with the permissions each one needs; generated projects also ship the same set as `.vscode/echo-workshop.code-snippets`, expanded by typing an `echo-` prefix.

The SDK is also a standalone npm package: `npm install <path-to-this-folder-or-packed-tgz>` gives you `npx echo-workshop-sdk`. `init`, `check`, `test`, `quality` and `dev` need only Node 20+, not an ECHO installation. Authors own their development environment and install or build any third-party dependencies themselves; Authoring Studio does not provision Node, compilers or package managers. Publishing still happens in ECHO's Authoring Studio. `version --json` reports the supported schema, plug-in API, protocol and limit surface for external tooling.

`--kind` accepts `theme`, `lyrics-style`, `animation-library`, `visualizer-preset`, `dsp-preset`, `audio-plugin-profile`, `locale-pack`, `plugin-package` or `native-shell`. `animation-library` exports bounded host-interpreted keyframes for dependent lyrics scenes; it executes no author code. Its local `dev` view is an interactive kinetic-score gallery with trigger filters, intensity control and multi-voice replay. Libraries may use bounded 3D transforms, fixed transform origins, host-owned directional reveals, deterministic stagger timing and named ECHO motion characters, but never arbitrary CSS, selectors or filters. `locale-pack` is a JSON string table for a language ECHO does not ship, such as literary Chinese (`lzh`). Missing keys fall back to a built-in locale. `native-shell` is a Windows system-shell host (named pipe + packaged `.exe`), not the sandboxed plug-in VM. Official Steam Workshop validation still rejects subscriber `.exe` / `.dll` files.

Theme `--preset` values:

| Preset | What you get | Minimum ECHO |
| --- | --- | --- |
| `colors` | Light/dark tone overrides | `26.8.15` |
| `skin` | Declarative chrome, stages and atmosphere (default) | `26.8.15` |
| `stylesheet` | Packaged CSS scoped to the pack id | `26.8.20` |
| `runtime` | Sandboxed HTML/CSS/JS replacement UI | `26.8.20` |

Plugin `--preset` values: `basic` (default), `complete`, `catalog`, `lyrics`, or `full-trust`.

`catalog` is an author-owned searchable directory of direct HTTP(S) streams. It is not a built-in Netease / Spotify / YouTube restore. The host owns search UI, origin confirmation, queue and Audio Core playback.

Lyrics `--preset` values: `editorial` (default), `compact`, `cinema`, `cover`.

Visualizer `--preset` values: `bars` (default), `wave`, `radial`. The host does not accept `particles`.

DSP `--preset` values: `flat` (default), `vocal`, `bass`, `8bit`. All use the official 31-band layout; `8bit` declares a bounded host-executed chiptune stylizer with pulse, triangle-bass and transient-gated LFSR noise layers. The Workshop package owns the requested effect parameters, while Audio Core owns realtime execution and effective state. This is PCM processing: PCM-to-SDM is processed before modulation, while Native DSD and DoP passthrough remain outside the effect path.

Create the ready-to-edit 8-bit project with:

```powershell
node .\bin\echo-workshop-sdk.mjs init .\my-8bit --recipe 8bit-audio
```

Raise an existing theme later without starting over:

```powershell
node .\bin\echo-workshop-sdk.mjs scaffold .\my-theme --preset runtime
```

`npm run check` is the complete local gate: it synchronizes packaged content, validates hashes and schemas, runs the quality report, and executes deterministic fixtures. Use `npm run check -- --json` for one machine-readable result, or `--warn-only` to keep iterating with a passing exit code while failures are still reported; publication still requires a clean check. `doctor`, `validate` and `example list` also accept `--json`. The mock host enforces declared plug-in permissions, so undeclared capability use fails locally. `npm run dev` opens a live author console with gate status, permissions, fixtures, the latest changed file, copyable recovery commands and raw diagnostics; stylesheet, runtime, lyrics, visualizer and DSP projects also get a separate fixture preview. `npm run watch` and the dev console debounce editor save bursts, watch nested files and ignore the generated manifest update. This author-controlled local tool is not the production sandbox and must not be used as proof of Steam-client behavior.

The portable CLI and ECHO host share the plug-in package contract in `contracts/plugin-package-limits.json`. The inner executable/text `.echo` package remains capped at 32 files, 512 KiB per UTF-8 file and 2 MiB serialized, with `.css`, `.html`, `.js`, `.mjs` and `.json` assets. A `plugin-package` Workshop item may additionally carry hash-listed `.wasm`, `.onnx`, `.bin` and `.data` files under `assets/`, capped at 128 MiB each and 256 MiB total. These assets are package-local: load them with a relative URL such as `new URL('./assets/model.onnx', location.href)`. Native-shell items use the separate `contracts/native-shell-limits.json` surface (512 files, 256 MiB/file, 512 MiB package). All shared contracts are importable package exports for external tooling. The sandbox entry remains `.js`; a full-trust `trustedEntry` is a separately declared `.mjs` module. Other `.mjs` files may be imported module assets. The inner plug-in `apiVersion` must exactly match the outer Workshop manifest's `compatibility.pluginApiVersion`.

Generated projects include VS Code JSON Schema mappings and tasks. Run the default build task for `ECHO Workshop: Check`, or start `ECHO Workshop: Dev console` without remembering CLI paths.

`npm run quality` checks preview dimensions, listing copy, tags, compatibility, placeholders, documentation, stylesheet inventory, reserved host presets, UI runtime capabilities, lyrics slots, visualizer ranges and the 31-band EQ layout.

Inside the ECHO source repository, the same project can additionally use the production authoring path:

```powershell
npm run workshop:author -- validate path\to\my-theme
npm run workshop:author -- prepare path\to\my-theme
```

## Commands

```text
echo-workshop-sdk init|new <directory> [--kind] [--preset] [--recipe] [--id] [--title] [--holder] [--license]
echo-workshop-sdk add <directory> [--slot|--capability|--color|--permission]
echo-workshop-sdk set <directory> [--title|--description|--style|--background|--page-style|--preamp|--bars|--mirror|--license]
echo-workshop-sdk next <directory>
echo-workshop-sdk guide [list|topic]
echo-workshop-sdk snippet [list|<name>]
echo-workshop-sdk recipes
echo-workshop-sdk scaffold <directory> --preset <preset>
echo-workshop-sdk watch <directory>
echo-workshop-sdk version [--json]
echo-workshop-sdk help [command]
echo-workshop-sdk sync|validate|check|inspect|explain|fix|upgrade|quality|test|dev|doctor
```

Every command also accepts `--help` for focused usage. `check` ends with a one-line gate summary (quality pass/warning/blocker counts plus fixture results, also available as the `gate` object in `--json`); `watch` prints the same summary after every rerun. `fix` also restores a missing `README.md`, `CUSTOMIZE.md` or `.gitignore` and creates the preview when absent — it never overwrites files you already wrote. `dev` defaults to port `41783` and automatically tries the next free ports when it is busy; an explicit `--port` fails instead of falling back. `version --json` additionally reports the per-kind entry-file/tag mapping, the recipe ids, the guide topics and the snippet catalog for external tooling. The bundled GitHub Actions workflow mirrors the gate report into the job summary so pull requests show the verdict without opening logs.

These commands never upload or publish anything. Steam upload remains an explicit action in ECHO's Authoring Studio or the repository authoring CLI.

## Public TypeScript contract

Generated plug-in projects reference `.echo-sdk/echo-workshop-plugin.d.ts`. The declaration covers the sanitized track, album, artist, genre, playlist, queue, like, direct-source, listen-together and approved full-trust request surfaces returned by API 2. Authors do not need application source types or host internals. Run `echo-workshop-sdk guide types` for the shortest setup reminder.

`contracts/plugin-api.json` is the machine-readable method-to-permission and common-error contract used by the production host. Run `echo-workshop-sdk api`, filter with `echo-workshop-sdk api echo.queue.moveItem`, or inspect recovery guidance with `echo-workshop-sdk api errors`. A permission change is subscriber-visible; never loop on user-denied direct-source or sharing prompts.

## Full-system plug-ins

Create a ready-to-edit project in one command:

```powershell
npx echo-workshop-sdk init .\my-tool --recipe full-trust-plugin
```

This creates a sandbox entry at `src/plugin.js` and the subscriber-approved Node.js entry at `src/trusted.mjs`. Existing plug-ins can run `npx echo-workshop-sdk add . --permission system:full`; the CLI adds the paired `trustedEntry`, starter module and minimum ECHO version without overwriting an existing trusted module.

Full-system access is available to Workshop packages, not only local projects. Authors install Node 20+, compilers and dependencies in their own environment and package the resulting allowed files. ECHO does not install or manage that toolchain. Declare the capability and a separate trusted module in the inner package manifest:

```json
{
  "entry": "plugin.js",
  "trustedEntry": "trusted.mjs",
  "permissions": ["system:full"]
}
```

`trusted.mjs` runs in a dedicated utility process with normal Node.js access to files, network, child processes and installed native modules. It may export `activate(context)`, `handle(request, context)` and `dispose(context)`. The verified Workshop content root is provided as `context.contentRoot`. The sandbox UI calls it explicitly:

```js
const result = await echo.trusted.invoke('scan-library', { deep: true });
```

```js
// trusted.mjs
import { readdir } from 'node:fs/promises';

export async function handle({ method, input }, context) {
  if (method === 'scan-library') {
    return { input, files: await readdir(context.contentRoot) };
  }
  throw new Error(`Unknown method: ${method}`);
}
```

ECHO shows `system:full` as desktop-application-equivalent access during enablement. Disabling the plug-in terminates the utility process. Audio output, playback completion and realtime DSP truth remain owned by Audio Core; a full-trust process may request host actions but does not become the playback clock.

## Parameterized custom functions

A declared command may include up to 12 `parameters` (`string`, `number`, `boolean` or `select`) plus an optional `confirm` message. ECHO renders and validates the form in host UI, then passes one structured object to the registered handler. Use this for small tools such as playlist builders, configurable navigation actions or metadata helpers instead of shipping a panel just to collect a few values. Parameterized or confirmation-gated commands are launched from the plug-in function dock; one-click player-bar, track-context and automation actions must continue to target commands that need no interaction.

Commands can reuse other commands in the same sandbox with `await echo.commands.execute('command-id', input)`, and `echo.commands.list()` returns the runtime's registered command titles. These local composition helpers add no permission and cannot cross into another plug-in. Handlers should still normalize business-level values defensively. The `complete` plug-in preset demonstrates a host-generated form, confirmation, command composition and bounded sandbox storage.

`validate` rejects private, local, wildcard, duplicate and malformed `networkHosts`, and host declarations without `network:request`. Requests resolve and connect to validated public addresses while preserving Host/TLS identity. Prefer HTTPS.

## Standalone GitHub mirror

The SDK lives at
[Moekotori/echo-workshop-sdk](https://github.com/Moekotori/echo-workshop-sdk),
generated from this folder with
`npm run workshop:sdk:export-mirror` inside the ECHO repository. The mirror is
where to fork the SDK and where to file issues and pull requests; see
[CONTRIBUTING.md](./CONTRIBUTING.md), [GOVERNANCE.md](./GOVERNANCE.md), the
[code of conduct](./CODE_OF_CONDUCT.md) and [security policy](./SECURITY.md).
Its generated `MIRROR.md` records the
exported SDK version, and `.github/workflows/ci.yml` runs the standalone gate
(doctor, syntax checks, init/check/test for all nine kinds, example
validation and a strict TypeScript declaration compile) on every push and
pull request.

This folder inside the private ECHO repository remains the source of truth,
and the Steam Workshop starter item
[`3784997717`](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717)
ships its separately released package for authors who install through Steam.
Accepted mirror
contributions are folded back into the source of truth, verified against the
production host, and re-exported with credit in the changelog. The mirror
never publishes to Steam or npm.

## Theme customization rules

- `basePreset` must be a public host preset such as `classic`. `FINAL`, `nyanCat` and `darkSideMoon` are rejected.
- Packaged CSS must target `html[data-workshop-theme-pack="<id>"]`. The host sanitizes it and does not unlock a built-in pack.
- A stylesheet wins over a declarative skin. A runtime replaces the visible chrome and still requires an emergency-exit host chrome.
- Inline scripts, remote `@import` and non-raster `url()` values are blocked.

## Compatibility

- Prefer plug-in API `2` for new projects.
- Declare the oldest ECHO version actually tested in `compatibility.minEchoVersion`.
- Stylesheet and UI-runtime themes should declare `26.8.20` or newer.
- Treat versions absent from `echo-workshop-sdk.json` as unsupported.
- Read [MIGRATING.md](./MIGRATING.md) before raising schema or API versions.

## License

The SDK files in this package, including its types, schemas, CLI, templates and examples, are licensed under the [MIT License](./LICENSE). An independent extension that only uses the documented Workshop API or these MIT-licensed materials is not covered by the ECHO application's source-available license. Your original Workshop content remains yours and may use a license you choose; submission to ECHO's Steam Workshop must still follow the Workshop content policy, Steam terms, third-party rights and applicable law. The MIT license does not grant rights to the ECHO name, logo, proprietary application code or assets outside this SDK package.

Local-track uploads are no longer supported. Packages requesting `playback:share` are rejected. The playback upload methods have been removed from the host and SDK; existing local files are not deleted. Authorized direct-stream playback remains available through `sources:direct`.
