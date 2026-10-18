# ECHO Workshop SDK

## Generic host and streaming controls

Plugins and full theme runtimes may request `sources:direct`, `presence:control`
and `bridge:control` for direct streaming/queue handoff and the existing Discord,
Last.fm, ListenBrainz, Stage, OBS, MQTT, HQPlayer and Echo Link controls.
`echo.ui.notify()` uses the host Workshop notice surface. Authors choose the
source service and implement its catalog and stream resolution.

`audio:output-read` grants `echo.audio.output.getStatus()`, `listDevices()`,
`refreshDevices()` and `getDeviceVolume()`. `audio:output-write` grants
`setOutput(settings)`, `setDeviceVolume(request)` and `setVolumeControlMode(mode)`.
Output settings cover automatic output, output mode, shared backend, device
index/name, requested sample rate, latency profile and buffer frames. Changes may
reopen the route and resolve with Audio Core's returned state. Readback excludes
media paths and input credentials. See `EchoWorkshopAudioOutputApi` for types.

Plugin `echo.network.request()` supports GET, HEAD, POST, PUT, PATCH, DELETE and
OPTIONS, including explicitly supplied Authorization. Cross-origin redirects
strip that header; no ECHO/browser credential is read. Declared `networkHosts`
still apply. Themes can open plugin pages for networking or full-system tasks.
Existing `system:full`, `trustedEntry` and `echo.trusted.invoke()` provide
Node/files/network/child-process access in a separate utility process that ends
when the plugin is disabled. New permissions require subscriber approval.
Offline previews use fixtures; real devices, accounts and streams require ECHO.

The current source adds API 2 capability domains. `contracts/capability-catalog.json`
inventories public actions, permissions, runtime surfaces, events and registration
entrypoints. `contracts/library.json` owns library signatures, results, aliases and
limits; its client and declarations are generated. A null minimum version on a
legacy action retains its original compatibility policy, rather than promising
support on every host.

The ECHO `26.10.18` library domain includes:

- Validated sort/filter queries and up to 100 rows per page; `getTracksByIds()`
  accepts at most 200 identities. Queries support format, lyrics, vocal verdict,
  duplicate, source, folder and personal-tag conditions.
- `library.playlists`: paged listing, get/create/update, item insertion/removal,
  manual movement, deletion, and smart-rule read/preview/create/update/freeze.
  Existing flat methods keep their signatures and use the same host handlers.
- `library.favorites`: track/album pages, batch states, explicit
  `setTrack(id, liked)` / `setAlbum(id, liked)`, and manual liked-track movement.
- `library.tags.list/getItems/change` and `library.listenLater.list/get/change`.
  Listen Later includes saved progress; use existing `getAlbumTracks()` for
  paged tracks. Domain `onChanged()` methods return an unsubscribe function and
  invalidate visible queries while retaining legacy event payloads.

`library.playQuery(query, trackId?)` requires both `library:read` and
`queue:control`. It stages bounded pages into the existing Core queue and starts
the chosen matching track after commit. Read failures, unload before commit or
library changes abort staging (`library-query-stale` for changed data). A later
cancellation does not roll back a committed queue. Random paging is rejected
because it does not describe a stable sequence; use the existing shuffle control
with a stable query. Check host feature availability before showing the action.

Playlist deletion requires `library:playlist-delete`; personal-tag/Listen Later
writes require `library:personal-write`, declared and approved explicitly.
Existing library writes retain `library:control`. Path/folder smart rules require
`library:path`. Smart previews return at most 100 tracks with `hasMore`; saved
rules retain the host's 1000-track limit. These actions do not write source media.
CLI/browser/in-app previews share stateful fixtures; smart previews are samples,
not a second implementation of the host SQL rule engine.

Lyrics UI authors: [P0/P1 authoring interfaces](./lyrics-authoring-interfaces.md) cover local word/line timelines, display preferences, shared artwork colours, runtime package settings, layout/render budgets and explicit current-track offset adjustment. Check host availability; source additions are separate from published SDK assets.

## SMTC, Home and lyrics-source workflows

The same `echo` API is available to approved plugins and theme runtimes in
shell, lyrics-view and lyrics-background presentations. Declare only the
permissions used by the package; use `echo.host.getFeatureAvailability(action)`
to check the current host.

| API | Permission | Host workflow |
| --- | --- | --- |
| `echo.mediaSession.setEnabled(enabled)` | `media-session:control` | Enable/disable Windows SMTC or Linux MPRIS |
| `echo.mediaSession.setLyricsEnabled(enabled)` | `media-session:control` | Windows SMTC lyric-title display |
| `echo.home.getSettings()`, `getHistory(query)`, `getHistorySummary(query)`, `getStats(query)` | `home:read` | Existing Home preferences, paged history and listening aggregates |
| `echo.home.updateSettings(patch)` | `home:control` | Existing Home visualizer/background preferences |
| `echo.lyrics.listProviders()`, `getStoredCandidates(trackId)`, `previewCandidate(trackId, candidateId)` | `lyrics:read` | Registered source discovery and cached candidate inspection |
| `echo.lyrics.searchProvider(key, trackId, query)`, `searchCandidates(trackId, query, providerId)` | `lyrics:search` | Invoke an enabled source or the host matching service |
| `echo.lyrics.applyCandidate(trackId, candidateId)`, `applyCustom(trackId, text, format)`, `setOffset(trackId, offsetMs)`, `markInstrumental(trackId)`, `clearCache(trackId)` | `lyrics:write` | Existing lyrics selection/cache operations |

History pages accept 1–100 items (default 20); date filters use `YYYY-MM-DD`.
Home settings are limited to `homeWaveformVisualizerEnabled`,
`homeBackgroundMode`, `homeBackgroundAppearance` and `homeBackgroundRendering`.
The Home interface uses the existing library/navigation/queue APIs for catalog
reads and playback; declared `page` panels provide custom main pages.

Source discovery includes both manual and automatic Workshop providers. Source
packages retain their own approval and networking requirements. Search receives
host track metadata without paths. Applying lyrics updates the database/cache;
it does not embed tags in original media. SMTC remains synchronized with Audio
Core playback. `getStatus()` additionally reports `lyricsEnabled` and
`playbackRate`; lyric-title control reports `unsupported-platform` on MPRIS.

```js
const sources = await echo.lyrics.listProviders();
const source = sources.find(value => value.ready);
const candidates = source ? await echo.lyrics.searchProvider(source.key, trackId) : [];
const candidate = candidates[0];
if (candidate?.ttml) await echo.lyrics.applyCustom(trackId, candidate.ttml, 'ttml');
else if (candidate?.lrc || candidate?.text) {
  await echo.lyrics.applyCustom(trackId, candidate.lrc ?? candidate.text, 'lrc');
}
```

New authors can follow the [first plug-in tutorial in Chinese](./FIRST-PLUGIN.zh-CN.md): create, edit, check and try the result locally in ECHO.

Afterglow scene packs: [format and import guide](./afterglow-scenes.md). Create a `lyrics-style` project with `--preset afterglow`, then import its content ZIP locally or distribute it through Workshop.

[![ECHO Workshop SDK CI](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moekotori/echo-workshop-sdk/actions/workflows/ci.yml)

[Public repository](https://github.com/Moekotori/echo-workshop-sdk) · [Latest release](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) · [Report a vulnerability](https://github.com/Moekotori/echo-workshop-sdk/security/advisories/new) · [中文说明](./README.zh-CN.md)

This repository contains the portable developer kit for ECHO Steam Workshop. The SDK version is `1.20.0`; GitHub release assets and the Steam starter are published through separate channels. SDK version `1` targets Workshop manifest schema `1` and plug-in API `2`. The SDK is MIT-licensed, requires Node.js 20+ for local authoring, and is not published to npm. Check the [latest GitHub release](https://github.com/Moekotori/echo-workshop-sdk/releases/latest) for an actual downloadable `.tgz`; source changes do not create a release asset.

| Feature | Minimum ECHO version |
| --- | --- |
| Data-only Afterglow scene packs | `26.9.29` with Afterglow support |
| Native sidebar pages (`placement: "page"`), page navigation and the 1.17 command surfaces | `26.9.25` |
| Independent theme/lyrics/background composition, animation libraries and panel presentation from 1.16 | `26.9.16` |
| Full-trust plug-ins (`system:full` and `trustedEntry`) | `26.8.29`; explicit subscriber approval required |
| Local manual-playlist edit and item removal (included in 1.19) | An ECHO host build containing these actions; check feature availability at runtime |
| Native waveform/channel meters and visualization queries (1.20) | An ECHO host build containing these interfaces; check `echo.host.getFeatureAvailability('audio:getVisualization')` or runtime `init.audioVisualizationLimits` |

SDK 1.19 includes the 1.18 additions: a smaller in-app plug-in starter and exposes `echo.library.updatePlaylist(playlistId, { name?, description? })` and `echo.library.removePlaylistItems(playlistId, itemIds)` under `library:control`. The host accepts only local manual playlists; removal checks that every selected item belongs to that playlist and keeps recovery history. Check `echo.host.getFeatureAvailability('library:updatePlaylist')` before showing the edit control on older ECHO builds.

SDK 1.20 adds `echo.audio.getVisualization({ waveformSamples: 2048, spectrum: false, levels: true })` under `audio:spectrum`. Snapshots expose signed mono waveform samples, native channel meters and host limits. Theme and lyrics runtimes can query the same data and select push fields/spacing using `echo:workshop-ui:audio-configure`. See [audio visualization authoring](./lyrics-authoring.md) and the [runtime types](./echo-workshop-ui-runtime.d.ts). The portable preview returns an unavailable waveform when it has no native audio; installing the SDK does not upgrade an older ECHO host.

Current source also provides `echo.audio.getSpectrogram({ trackId })` under `audio:spectrum`: an on-demand whole-current-local-track time/frequency matrix, including the selected CUE range. Its 1024 × 256 Base64 byte matrix is time-major, low-to-high linear 0–24 kHz, -100–0 dBFS, from a pre-DSP mono downmix. Source media is read-only and whole-track PCM is never retained. Check `echo.host.getFeatureAvailability('audio:getSpectrogram')` before calling; portable previews reject without local audio, and older hosts need the corresponding implementation.

In ECHO's Workshop **Create** tab, choose a starting path before filling in the project ID and rights holder:

| Goal | Starting point | Scope |
| --- | --- | --- |
| Small ECHO tool | Plug-in → Basic tool | One library command and a panel; `library:read` |
| Theme or lyrics scene | Theme → Skin / Lyrics → Editorial | Data-driven appearance; no plug-in permission |
| Larger plug-in example | Plug-in → Complete example | Multiple host surfaces and declared permissions to trim to your project |
| Local system integration | Plug-in → Full-trust tool | `system:full`; subscriber approval is required before Node code runs |

Edit the project with the guided fields, save it to update hashes, prepare and inspect the package, then review rights and visibility before publishing. Raw JSON is under **Advanced**. The starter is intentionally small; add capabilities only when your code needs them.

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
| `runtime` | Sandboxed HTML/CSS/JS replacement UI using the unified SDK | `26.10.18` |

Complete queue interfaces can call `echo.queue.getPage({ offset: 500, limit: 100 })` to read beyond the 500-item snapshot (ECHO `26.10.18`, `queue:read`). Results include `total`, `hasMore`, `sessionId`, `revision`, `currentQueueId` and the requested `items`. Pass both identity fields from the first page when reading subsequent windows; on `playback_queue_read_stale`, discard the old windows and restart. Keep only visible rows. Calls are bounded to 100 items while `get()` and events keep their 500-item snapshot contract. Plugin mocks, browser previews and in-app previews share mutable enqueue/play/move/reorder/remove/clear/previous/next behavior. Progress and theme renders preserve in-app queue edits; changing the runtime entry resets the fixture.

Declared PNG, JPEG, WebP, theme stylesheets and UI runtime files have no count or byte quota. SVG, executables, and stylesheets that pull remote URLs or scripts are still rejected.

`media-session:control` opens Windows SMTC and Linux MPRIS: read a path-free session status, set enabled buttons and shuffle/repeat, restart the session, and receive media-key commands. Other platforms report `unsupported-platform`.

`companion:control` drives desktop lyrics, the mini player, the pet and the taskbar player. `sleep-timer:control` drives the sleep timer (1–720 minutes). `presence:control` only toggles Discord, Last.fm and ListenBrainz, without login or tokens. `bridge:control` only toggles HQPlayer, the stage bridge, OBS, MQTT and Echo Link; status omits addresses, passwords and pairing material. Account login, cookies, Spotify, downloads and MV search stay closed.

Plugin `--preset` values: `basic` (default), `complete`, `catalog`, `lyrics`, or `full-trust`.

`catalog` is a starter for custom streaming sources. ECHO provides service-neutral interfaces; users and authors choose the service and implement its catalog access and stream resolution in the plug-in. Register `search`, `resolve` and optional `browse` / `listCollection` handlers with `echo.sources.registerProvider()`. Pass the resulting HTTP(S) stream to `playDirect`, `enqueueDirect` or `playQueue`. The host does not block platform hostnames and owns search UI, origin confirmation, queue and Audio Core playback.

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

The portable CLI and ECHO host share the plug-in package contract in `contracts/plugin-package-limits.json`. The inner executable/text `.echo` package has no file-count, UTF-8 file-byte or serialized package-byte quota (`null` in the public contract), with `.css`, `.html`, `.js`, `.mjs` and `.json` assets. From `26.10.18`, a `plugin-package` item may carry hash-listed binary/resources in any content directory, including `dist/`, `models/`, `fonts/` and the legacy `assets/`, without outer file-count, file-byte or total-byte quotas. All declared extensions are accepted, with unknown types served as opaque bytes. Inner packaged text retains precedence on duplicate paths. Nested plug-in pages can load the host `__bridge__.js` in their own directory. CLI sync raises minimum compatibility when it finds external resources outside the legacy layout. These assets stream on demand and remain package-local: load them with a relative URL such as `new URL('./assets/model.onnx', location.href)`. Native-shell items use the separate `contracts/native-shell-limits.json` surface (512 files, no outer file or total byte quotas). All shared contracts are importable package exports for external tooling. The sandbox entry remains `.js`; a full-trust `trustedEntry` is a separately declared `.mjs` module. Other `.mjs` files may be imported module assets. The inner plug-in `apiVersion` must exactly match the outer Workshop manifest's `compatibility.pluginApiVersion`.

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

Author tools can add functional entry points to an existing `plugin-package` project: `add . --command my-tool --title "My tool"`, `--page tools --title "Tools" --group plugins`, or `--menu-action`, `--player-action`, `--track-action` with `--command-id my-tool`. Commands append a starter registration to the existing source entry; pages generate SDK-backed HTML/CSS/JS. Existing source is preserved and duplicate declarations/files are rejected. Replace the command's initial notification with your business logic; track menu handlers receive sanitized selection arguments. Native pages raise the minimum host version to `26.9.25`; interactive command slots require `26.10.18`, set automatically by the CLI.

Plug-ins and full shell themes may declare `extensions:read` and `extensions:launch` on ECHO `26.10.18` or newer. `echo.extensions.list({ page, pageSize, search, kind })` returns only visible commands and native pages from enabled plug-ins, with display metadata and readiness/interaction flags. `launch(item.key)` rechecks the current entry, uses normal lazy runtime startup, and preserves host forms and confirmation; callers cannot supply hidden command arguments. A launch reply acknowledges acceptance, not completion, and never returns the target command result. Shells leave the replacement interface when opening a native page. Subscribe through `echo.extensions.onChanged()` for revision-only invalidations and release the subscription on disposal. Author previews use fixed fixtures without invoking installed plug-ins.

A declared command may include `parameters` (`string`, `number`, `boolean` or `select`) plus an optional `confirm` message. ECHO renders and validates the form in host UI, then passes a structured values object to the registered handler. From `26.10.18`, the function dock, main-menu shortcuts, player-bar buttons and track menus share this flow, including lazy runtime startup. Cancelling the form does not invoke the command. Parameterized track handlers receive `(values, selection)`; confirmation-only track handlers retain `(selection)`. A single selection is one sanitized track, and a multiple selection is an array (up to 100). Paths require `library:path`. Background automation and automatically computed columns continue to require commands without interaction.

Commands default to a five-second host timeout. From ECHO `26.10.18`, declare `contributes.commands[].timeoutMs` to set the actual deadline, or use `add . --command my-tool --timeout-ms 120000`. CLI and host accept integer milliseconds from 1 to the JavaScript timer maximum (`2147483647`); sync raises minimum host compatibility. This controls host invocation, while local `echo.commands.execute()` remains an ordinary same-runtime call. Runtime theme storage also drops the extra 16 KiB entry / 64 KiB theme quotas; browser Web Storage capacity and JSON/key validation still apply, with saved state preserved on write failure.

Commands can reuse other commands in the same sandbox with `await echo.commands.execute('command-id', input)`, and `echo.commands.list()` returns the runtime's registered command titles. These local composition helpers add no permission and cannot cross into another plug-in. Handlers should still normalize business-level values defensively. The `complete` plug-in preset demonstrates a host-generated form, confirmation, command composition and bounded sandbox storage.

`validate` rejects private, local, wildcard, duplicate and malformed `networkHosts`, and host declarations without `network:request`. Requests resolve and connect to validated public addresses while preserving Host/TLS identity. Prefer HTTPS.

## Full interfaces with the shared SDK

The `runtime` theme preset and sandbox plug-in panels use the same official `echo.*` client, action contract, permission broker and acknowledged large-payload transport. New runtime projects require ECHO `26.10.18` or newer. Load the host-provided client before your compiled application; do not package a copy of `__bridge__.js`:

```html
<script src="__bridge__.js"></script>
<script src="app.js"></script>
```

```js
const albums = await echo.library.getAlbums({ page: 1, pageSize: 24 });
await echo.queue.playAlbum(albums.items[0].id);
const unsubscribe = echo.events.on('playback:status', renderPlayer);
echo.ui.onDispose(() => { unsubscribe(); renderer.dispose(); });
```

Declare the corresponding `runtime.capabilities` in `theme.json`. Shell, lyrics-view and lyrics-background runtimes share the plug-in library, queue, playback, lyrics, spectrum, navigation and window-control APIs from ECHO `26.10.18`. Presentation selects placement without another SDK permission whitelist. The official client handles the runtime ready handshake and heartbeat. Runtime `storage` maps to the SDK's `echo.storage` interface under the existing theme namespace; plug-ins continue to declare `fs:plugin`. Use `echo.host.getFeatureAvailability(action)` for context-specific support. Plug-in contribution registration, network providers and full-trust APIs remain plug-in-package features. Existing `echo:workshop-ui:*` packages remain supported.

Use `echo.assets.url(path)`, `.text(path)` or `.arrayBuffer(path)` for files inside your package. Runtime assets use the plug-in MIME map for fonts, images/SVG, text/CSV, gzip data, GLB/glTF geometry and WebAssembly; custom extensions remain opaque binary data. Installed assets and the in-app author preview have no per-file size quota. Preview verification and serving use bounded chunks and streams. Compile application code and bundle libraries as external files; inline JavaScript and dynamic JavaScript evaluation remain blocked. WebGL/canvas rendering, package workers and blob textures can run inside the opaque sandbox. Assets do not grant external networking or filesystem access.

Use `echo.ui.onContextChanged()` for host theme, locale, viewport and reduced-motion changes, `playback:clock` for bounded host-clock samples, and `lyrics:changed` for current lyrics updates. Playback remains owned by Audio Core. Release animation frames, workers and WebGL resources in `echo.ui.onDispose()`. `echo.ui.closePanel()` exits the replacement interface; the host emergency exit remains available. The runtime starter, `retro-modern-ui-runtime` example, CLI fixture preview and in-app preview all use this client.

From `26.10.18`, runtimes also support `echo.ui.getParentPage()` with the same sanitized route/title/plugin-page descriptor as plug-ins. Runtime selection IDs require `library:read`; themes receive no filesystem paths. Plug-ins retain their separately approved `library:path` behavior. `echo.navigation.open('songs', { dismissRuntime: false })` updates the host route while retaining the custom interface. Omission retains the exit default; route validation and navigation permissions still apply.

Custom title bars can query `echo.window.isMaximized()` / `isFullscreen()` and subscribe through `onMaximizedChange()` / `onFullscreenChange()` under `window:control`. Flags and events come from the native window; they add no polling or shadow window state. Check the corresponding action's feature availability when a platform API is absent and release listeners through `echo.ui.onDispose()`. Both author previews simulate these flags and parent-route changes without controlling a real host window or route.

All runtime presentations may additionally declare `audio:dsp-read` / `audio:dsp-write` for the built-in rack through `echo.audio.dsp`, `companion:control` for local companion windows, `sleep-timer:control` for the sleep timer, and `media-session:control` for the system media session. These are opt-in capabilities excluded from starter defaults. Native parameter, entitlement and playback-mode checks remain authoritative; `workshopAudioEffect` still requires a verified plug-in identity. Missing platform services report unavailable. Subscribe through `echo.companion.onState()`, `echo.sleepTimer.onTick()` and `echo.mediaSession.onCommand()`, releasing subscriptions on disposal. Both author previews provide state-only fixtures; timer fixtures update on actions without a background countdown. Use `snippet ui-runtime-controls` for an example.

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

Shell runtimes with `navigation` may send `ui:close` to dismiss locally while keeping the underlying route. Lattice's Use action starts a separate Windows desktop window and waits for native attachment, instead of selecting an application shell theme or maximizing ECHO. It repairs that pack's obsolete shell binding when upgrading. Lattice keeps the original bounded album-play loader; its preferences are inherited from the retired built-in wall only when no explicit Workshop value exists. The theme client coalesces preference writes and flushes on ordinary close. Original-module parity and the verification boundary are recorded in `workshop/lattice-wall/PARITY.md`.

The Lattice theme (`echo.lattice-wall`) can run on the Windows desktop after a verified local import is enabled, or after Steam subscription, installation and verified activation. Either source adds the 「音乐拼贴墙」 switch to the player's 「迷你」 panel, without changing the selected application theme. Local imports do not depend on the Steam catalog. The app has no built-in wall entry or experimental fallback. Disabling or removing all available sources closes its desktop window. External Steam subscription changes are checked by the existing 5-second desktop maintenance loop. Its sandbox may request `window:getDesktopWall` / `window:setDesktopWall` with `window:control`; the host checks the enabled revision and source availability and waits for native attachment. `getPlaybackRate` (`playback:read`) and `setPlaybackRate` (`playback:control`, `{rate:0.5..2}`) use host-confirmed speed. Desktop frames retain `allow-scripts` only and receive bounded local metadata, never native handles or arbitrary IPC. See the repository's `workshop/lattice-wall/README.md` for the self-contained source-bearing package.

- `basePreset` must be a public host preset such as `classic`. `FINAL`, `nyanCat` and `darkSideMoon` are rejected.
- Packaged CSS must target `html[data-workshop-theme-pack="<id>"]`. The host sanitizes it and does not unlock a built-in pack.
- A stylesheet wins over a declarative skin. A runtime replaces the visible chrome and still requires an emergency-exit host chrome.
- Inline scripts, remote `@import` and non-raster `url()` values are blocked.

## Compatibility

- Prefer plug-in API `2` for new projects.
- Declare the oldest ECHO version actually tested in `compatibility.minEchoVersion`.
- Stylesheet themes should declare `26.8.20` or newer. Runtimes using the shared SDK should declare `26.10.18` or newer.
- Treat versions absent from `echo-workshop-sdk.json` as unsupported.
- Read [MIGRATING.md](./MIGRATING.md) before raising schema or API versions.

## License

The SDK files in this package, including its types, schemas, CLI, templates and examples, are licensed under the [MIT License](./LICENSE). ECHO application code is separately licensed under AGPL-3.0-only. This SDK's MIT license covers its types, schemas, CLI, templates and examples; it does not relicense application code or third-party materials. Your original Workshop content remains yours and may use a license you choose, subject to the licenses of any code or assets it incorporates, Steam terms, Workshop policy and applicable law. The SDK license does not grant trademark endorsement.

Local-track uploads are no longer supported. Packages requesting `playback:share` are rejected. The playback upload methods have been removed from the host and SDK; existing local files are not deleted. Authorized direct-stream playback remains available through `sources:direct`.

## Desktop wall and playback rate (local host extension)

`echo.playback.getRate()` uses `playback:read`; `setRate(rate)` uses `playback:control` and accepts finite 0.5–2 values. Status events include `playbackRate`.

Declare `manifest.contributes.desktopWall = { path: "desktop.html" }` and request `window:desktop-wall`. The HTML is a packaged opaque sandbox entry using `__bridge__.js`. Use `echo.window.getDesktopWall()` / `setDesktopWall(enabled)` from the regular panel. In the desktop entry `ui.getContext().desktop.bottomInset` identifies the desktop surface; `ui.openPanel(id)` switches the declared wall context, while `ui.closePanel()` or disabling the desktop wall closes it. Main and desktop settings share the plug-in namespace. Desktop execution provides the bounded playback/library/queue/lyrics/settings subset, and retains the normal request broker. Only the verified enabled revision with approved capabilities and an active Steam subscription can attach. This extension requires the updated local host; it is not yet published.


## Steam Rich Presence configuration

Plugins and theme runtimes with approved `presence:control` can use
`echo.presence.steam.getSettings()`, `updateSettings(patch)` and `getOptions()`
in ECHO 26.10.18. The configuration whitelist includes style, emoji prefix,
four-state templates, sentence rotation, conditional frames, typewriter, away
status, progress bars and sharing flags. Nested objects merge by field; a supplied
state's frame array replaces only that state. Empty template text restores its
built-in text. Unknown fields, invalid shapes and out-of-range values reject
before writes; the host's existing template grammar rejects as `invalid-template`.
Use `getOptions()` for choices and limits. These calls persist display settings
without changing mode, enabling RPC or enabling computer-field collection.
Readback excludes monitored apps, profiles, hardware values and global settings.
Offline previews/mock hosts validate configuration structure; the running host
owns template grammar, privacy and actual Steam publication.

## Add an entirely new page

Run `node .echo-sdk/bin/echo-workshop-sdk.mjs add . --page dashboard --title "My dashboard" --group plugins` in a plug-in project. Edit the generated `src/page-dashboard.html`, `.css` and `.js`; the CLI declares an independent `placement: "page"` panel with its own sidebar entry and `plugin:<manifest.id>:dashboard` route. A package can declare multiple pages with distinct IDs and files. The `--sidebar` command creates the same kind of page.

Users open it from the sidebar, or the plug-in calls `await echo.ui.openPanel('dashboard')`. Opening its own declared page requires no additional navigation permission. The page uses the official capability-checked SDK inside the existing opaque sandbox, with ECHO's sidebar and player still available. Release listeners and timers through `echo.ui.onDispose()` when leaving the page.

## Provider workflows and host changes

Lyrics, metadata and covers share provider discovery and bounded candidate search, preview, apply, reject and cancellation. DSP, Home, Presence, Bridge and media session share permission-filtered change notifications. Existing APIs remain compatible. See [provider workflows](provider-workflows.md) for grants, limits, cancellation and subscription ownership.
