# ECHO Workshop SDK changelog

## Unreleased — lyrics authoring

- Scoped lyric part styles, vertical text, scroll anchor/duration, timed single-line slots, and public back-button/control accent styling.
- Lyrics-only `lyrics-view` runtime with host recovery, revisioned current lyrics and shared clock packets.
- Recursive lyrics schema, author validation, typed lyric/clock events and the Lyric Ink example.
- Existing scenes and full-shell runtimes keep their defaults. No SDK or Steam publication is implied.

## Unreleased

- Added optional theme `runtime.presentation: "lyrics-background"`: an independent read-only sandbox backdrop that retains host lyrics and controls. The schema limits it to `playback:read` and `audio:spectrum`; host state includes a motion budget and heartbeat. See `docs/ECHO_WORKSHOP_LYRICS_BACKGROUND.md` and `workshop/spectrum-tide` in the ECHO source tree.

- Added data-only `animation-library` packages. Dependent lyrics scenes can reference versioned Workshop exports made from bounded opacity, 2D/3D transform, fixed-origin, host-owned clip-reveal and named-easing keyframes; deterministic stagger choreography coordinates explicitly indexed sibling nodes without selectors or author code. The ECHO host resolves enabled dependencies and owns execution. The portable `dev` host includes an interactive kinetic-score gallery for filtering and replaying single- and multi-voice exports at different intensity levels.
- Added responsive, host-themed sandbox panel context through `echo.ui.getContext()` and `echo.ui.onContextChanged()`, including locale, direction, viewport, reduced motion, light/dark state and bounded semantic appearance tokens.
- Added host-owned panel presentation controls for bounded title, badge, dirty state, attention and four panel sizes, plus a safe panel-close request. Background runtimes cannot mutate panel chrome, and the host close control remains permanent.

## 1.15.0 — 2026-08-29

- Added the one-command `full-trust-plugin` recipe / `full-trust` preset and a copyable official example. They provide a typed sandbox bridge plus `trusted.mjs`, declare `system:full`, and select the first compatible ECHO version.
- `add . --permission system:full` now safely upgrades an existing plug-in by pairing `trustedEntry`, creating a missing starter module without overwriting author code, and raising the outer minimum version.
- The portable gate now rejects unpaired or unpackaged trusted entries. Documentation makes the ownership boundary explicit: authors install and build their own Node toolchain and dependencies; Authoring Studio does not provision an environment.
- Release guidance no longer links a source-tree version to a GitHub asset that has not been published, and the 1.15 Steam starter metadata is prepared separately from any upload.
- Added content kind `native-shell`: a Windows system-shell channel that speaks JSON Lines over a named pipe. This is not the sandboxed plug-in VM.
- Promoted the AudioBand host protocol to official native-shell protocol v1 (`config` / `status` / `quit` inbound, `ready` / `log` / `command` outbound).
- Added per-kind limits in `contracts/native-shell-limits.json` (512 files, 256 MiB/file, 512 MiB package, `.exe` / `.dll` allowed in the portable authoring gate) so a self-contained WinUI host can be packaged.
- Added `echo-workshop-native-shell.d.ts`, `schemas/native-shell.schema.json`, `init --kind native-shell`, recipe `native-shell-taskbar`, and an authoring example that checks without the binary.
- Official ECHO Steam remains fail-closed: the production Workshop validator still rejects packaged `.exe` / `.dll`, and the official client does not spawn subscriber-supplied hosts.

## 1.14.0 — 2026-08-29

- Added subscriber-approved `system:full` for both Steam Workshop and local plug-in packages. A matching `.mjs` `trustedEntry` runs in a dedicated ECHO utility process with normal Node.js file, network, child-process and local-resource access.
- Added `echo.trusted.invoke(method, input)` so the default sandbox UI can call author-defined trusted methods without moving Node or raw preload objects into the renderer.
- Enabling shows full-system access as desktop-application-equivalent authority; disabling terminates the utility process. Package updates still require exact capability approval.

- Added the bounded `vocalCut` variant to the host-owned `workshopAudioEffect` slot. It performs realtime center-vocal suppression in Audio Core with adjustable strength and 80–300 Hz bass preservation; plug-ins still receive no realtime PCM callback or native code execution.
- Added permission-gated DSP control for sandbox plug-ins: `audio:dsp-read` can inspect all eight host rack modules, rack order and the fixed-position `workshopAudioEffect`; `audio:dsp-write` covers the standard rack plus bounded Bitcrusher/Chiptune/Vocal Cut parameters.
- DSP writes remain renderer control-plane requests routed through existing main/preload IPC and native-host validation. Plug-ins receive no raw IPC, audio buffers, native handle or realtime-thread execution.
- `dsp-preset` may now declare one bounded, host-executed `audioEffect`: the compatible `bitcrusher` or the new `chiptune` stylizer with pulse, triangle-bass and transient-gated LFSR noise layers.
- Upgraded ECHO 8-BIT into an interactive sandbox console with NES, Game Boy and Arcade profiles plus host-confirmed pulse, triangle, noise, drive, bit-depth and sample-hold controls.
- Neither sandbox nor full-trust code runs on the realtime audio thread. Audio Core owns execution, smoothing, Pro entitlement, PCM/DSD bypass and host-confirmed state.
- Disabling or unsubscribing the Workshop item that owns the active audio effect now clears that effect instead of leaving processing behind.

## 1.13.0 — 2026-08-29

- Added the pure-Workshop offline processing boundary. `audio:offline-read` opens a user-confirmed, host-decoded sequential PCM16 session for a local library track; the plug-in receives bounded chunks and sanitized metadata, never the source path, decoder handle or realtime Audio Core access.
- Added `fs:export` for bounded MIDI, JSON, text, CSV and MusicXML results. The host owns the save dialog and destination write, and the sandbox receives only saved/cancelled status and byte count.
- Plug-in Workshop items may carry hash-verified `.wasm`, `.onnx`, `.bin` and `.data` files under the outer `assets/` directory. These assets remain package-local and are available only through `echo-workshop://plugin/...`; undeclared files, other extensions and traversal fail closed.
- Raised only the outer `plugin-package` envelope to 128 MiB per file and 256 MiB total for model assets. The inner executable/text `.echo` package remains limited to 32 files, 512 KiB per UTF-8 file and 2 MiB serialized; all non-plug-in Workshop kinds retain their 16 MiB/64 MiB limits.
- The sandbox CSP now permits only the current plug-in package's module/model fetches and workers plus WebAssembly compilation, while keeping sibling plug-in assets, media, child frames, Node, raw IPC, arbitrary filesystem access and undeclared network destinations unavailable.

## 1.12.0 — 2026-08-28

- Added declarative parameterized commands: up to 12 host-rendered `string`, `number`, `boolean` or `select` fields, bounded defaults/ranges/options, and an optional confirmation message.
- Added same-sandbox `echo.commands.execute()` and `echo.commands.list()` helpers so a custom function can compose registered commands without receiving another host permission or crossing plug-in boundaries.
- Production validation rejects malformed parameter declarations and prevents parameterized commands from being attached to one-click player-bar or track-context actions.
- Updated the complete plug-in preset with a working custom-function example that combines a host-owned form, command composition and bounded sandbox storage.

## 1.11.1 — 2026-08-28

- Added canonical GitHub repository, homepage and issue metadata to the standalone package while keeping `private: true` so npm publication remains an explicit future decision.
- Added a public `SECURITY.md` and a direct GitHub private-vulnerability-reporting path for validation bypasses, sandbox/API discrepancies, unsafe network behavior and credential exposure.
- Updated standalone and generated-project CI to current `actions/checkout` and `actions/setup-node` releases, pinned both actions by commit, restricted the token to read-only contents, added bounded timeouts and concurrency cancellation, and pinned the TypeScript declaration check to `5.9.3`.
- Linked the real public repository and latest GitHub release from both READMEs, with offline `.tgz` installation instructions for `1.11.1`.

## 1.11.0 — 2026-08-24

- Added an exported JSON Schema for `echo.workshop.project.json`, covering the fixed ECHO AppID, PublishedFileID, safe content/preview paths, visibility, listing copy and bounded unique tags.
- Generated projects map that Schema in VS Code, so invalid publication metadata is visible while editing instead of only at prepare/publish time.
- Portable `validate` / `check` now reject unsupported project fields, unsafe paths, invalid preview types, blank or oversized listing copy, and duplicate or oversized tags before content validation.
- Public TypeScript declarations now expose the sanitized album, artist, genre, playlist, queue, like, direct-source and listen-together result shapes instead of forcing authors to guess through `unknown`; the package gate compiles a strict author-side usage fixture.
- Added the machine-readable API 2 capability/error contract at `contracts/plugin-api.json`. The production host consumes its action-permission mapping, `api` explains methods and recovery guidance, and the local mock now returns production-shaped media, queue, like and sharing fixtures.
- Portable validation now rejects unsafe/private/duplicate `networkHosts` and invalid capability-to-host declarations. The mock rejects undeclared hosts and custom ports, while production playback sharing resolves and pins a public address before uploading and revalidates returned playback URLs.
- The SDK now installs standalone with npm (this folder or the packed `.tgz`) and exposes `npx echo-workshop-sdk`; `init`, `check`, `test`, `quality` and `dev` need only Node 20+, not an ECHO installation. The new `version` command (`--json`) reports the supported schema, plug-in API, protocol and limit surface, and all three shared contracts — plug-in API, package limits and content kinds — are importable package exports.
- `init --license` and `set --license` declare the author's own content license (for example `MIT` or `CC0-1.0`) without hand-editing the manifest; the default stays `All-Rights-Reserved`. Production already accepted any bounded license id.
- `check --warn-only` keeps printing the complete local gate report while exiting 0 for early iteration; publication and the production authoring gate stay fail-closed. `doctor`, `validate` and `example list` gained machine-readable `--json` output.
- The SDK can now be exported as a standalone public GitHub repository (recommended name `echo-workshop-sdk`) with `npm run workshop:sdk:export-mirror`. The allowlist-driven exporter supports `--dry-run`, `--output`, `--force` and `--init-git`, generates `MIRROR.md` provenance, fails closed on unclassified SDK files and self-checks the exported tree with `doctor`.
- The package now ships its own governance: `CONTRIBUTING.md`, `GOVERNANCE.md`, a Contributor Covenant 2.1 `CODE_OF_CONDUCT.md`, GitHub issue templates (bug report, feature request, content-type RFC), a pull-request template and a standalone mirror CI workflow (doctor, syntax checks, seven-kind init/check/test, example validation, strict declaration compile) that runs without the ECHO repository.
- Per-command help: `help <command>` and `--help` on any command print focused usage; `guide list` prints the topic index instead of the whole cookbook.
- `check` ends with a one-line gate summary and its `--json` report gains a `gate` rollup (quality pass/warning/blocker counts plus fixture totals) for editors and bots.
- `dev` automatically tries the next free local ports when the default `41783` is busy and says which port it picked; an explicit `--port` still fails closed. `version --json` additionally reports per-kind entry-file/tag mappings, recipe ids and guide topics.
- `set --mirror` is now documented in the usage screen and rejected on non-visualizer projects instead of being silently accepted and dropped.
- New `snippet` command: copy-paste starters for providers, sandbox storage, declared-host network calls, the UI runtime bridge, theme tone blocks and lyrics slots, each annotated with the permissions or capabilities it needs. Generated projects ship the same set as `.vscode/echo-workshop.code-snippets` (type an `echo-` prefix to expand), and `version --json` reports the snippet catalog.
- `next` is now personalized: it starts with fix-first items derived from the project's current quality report, each mapped to the command that clears it, before listing host-allowed moves; `--json` gains an `attention` array.
- `fix` additionally creates a missing listing preview and restores a missing `README.md`, `CUSTOMIZE.md` or `.gitignore` without overwriting author-written files. `watch` ends every rerun with the same one-line gate summary as `check`, and plug-in test reports now name their kind correctly.
- New bilingual `TROUBLESHOOTING.md` (check/validate errors, mock permission and network denials, dev console issues, environment notes) and one-page `CHEATSHEET.md` (commands plus VS Code tips), shipped in the package, the mirror and the in-app SDK copy; `guide` gains `troubleshoot`, `checklist` and `snippets` topics.
- New day-one examples: `hello-plugin` (the smallest complete sandboxed plug-in — one command, one permission) and `minimal-theme` (the smallest complete colors-layer theme). Both are covered by the package gate, production validation and the standalone mirror CI.
- The bundled GitHub Actions template now explains each step and mirrors the gate report into the job summary, so pull requests show the quality/fixture verdict without opening logs.
- Standalone mirror CI now supplies a deterministic fixture author and replaces the audio plug-in profile's intentionally blocking VST3 placeholders before running the seven-kind gate; generated author projects still fail closed until their real author and plug-in identity are supplied.
- Public mirror exports now include `.gitattributes` so Windows checkouts preserve LF bytes in hash-protected text content while keeping preview PNGs binary.
- Added the shared content-kind contract at `contracts/content-kinds.json`. The SDK and the in-app authoring service now generate the same default entry file names (`lyrics-scene.json`, `dsp-preset.json`) and the same Steamworks-configured tags (`Visualizer Preset`, `DSP / EQ Preset` — the old `Visualizer`, `DSP Preset` and `Audio Plugin Profile` tags were never configured on the ECHO AppID and were dropped by Steam). Quality reports on both sides warn about non-configured tags, and the package gate fails on any drift between the toolchains.
- Public Workshop item `3784997717` remains on `1.10.0` until this candidate is separately published in place. This changelog is the single record of which SDK version that public item is on; other documents link here instead of repeating it.

## 1.10.0 — 2026-08-21

- The portable CLI and production host now share one package limit/extension contract and reject mismatched inner/outer API versions.
- Public library declarations now match the production bridge's playlist-item and liked-track response shapes.
- The SDK package and independent extensions built only on its public API are explicitly MIT-licensed; ECHO application code, assets and trademarks remain outside that grant.
- Workshop connector networking now rejects private/reserved DNS answers and non-default ports, pins connections to validated public addresses, and revalidates every redirect.
- Sandbox bridges now enforce message/in-flight limits, request timeouts and heartbeats; main owns a session-wide emergency block with an unresponsive-renderer reload fallback.
- The deterministic mock host now enforces declared plug-in capabilities, including event subscriptions and navigation, so local tests fail on undeclared API use.
- Generated projects use `npm run check` as one complete local gate: sync, validation, quality and fixtures. The bundled GitHub workflow uses the same command.
- `check --json` returns the complete gate as one machine-readable report for editors and external tooling.
- `npm run dev` now exposes a live author console for project contract, permissions, quality findings, fixtures, changed-file context, copyable recovery commands and raw diagnostics, with a separate preview link where supported.
- `watch` and `dev` recursively observe nested source files, debounce save bursts and ignore generated manifest writes to avoid redundant reruns.
- Generated projects include VS Code tasks for check/dev/next and complete JSON Schema mappings, including locale packs.
- Custom UI emergency-exit documentation and host handling now consistently use `Ctrl+Shift+Esc`.
- SDK packaging now inspects, installs and exercises the generated `.tgz`; source examples are tested from temporary copies so checks do not rewrite the SDK tree.
- Public Workshop item `3784997717` was updated in place to this `1.10.0` starter on 2026-08-23.

## 1.9.0 — 2026-08-20

- New data-only kind `locale-pack`. Extra languages live only in Workshop JSON; ECHO still ships zh-CN, zh-TW, en-US, ja-JP and ko-KR.
- Packs cannot claim those five locale codes. Missing keys fall back to a declared built-in locale.
- Starter and example: literary Chinese (`lzh` / 文言文). Recipe `wenyan-locale`. No JavaScript, no network.
- Public Workshop item `3784997717` was updated in place to this `1.9.0` starter on 2026-08-21.

## 1.8.0 — 2026-08-19

- Custom UI runtimes can shuffle/repeat, persist a small JSON store, look up a track, and play an album/artist/genre/playlist/likes collection. New optional capability: `storage`. Init now includes sanitized host appearance tokens; state includes a lyrics current-line peek, `currentTrack.liked`, and `library.revision`.
- Lyrics scenes gain host-owned `shuffle-toggle`, `repeat-cycle` and `like-toggle` slots, plus `when` conditions for shuffle/repeat/liked/album. Synchronized `current-line` / `previous-line` / `next-line` slots seek when the host allows seeking.
- Declarative skins can restyle albums, artists, playlists, genres, liked and history stages. Plug-in settings accept `#rrggbb` `color` and numeric `range` fields (still not a credential vault).
- This remains high customization, not a built-in streaming platform. Public Workshop item `3784997717` was updated in place to this `1.8.0` starter on 2026-08-20.

## 1.7.0 — 2026-08-19

- Custom UI runtimes can browse albums, artists, genres and local playlists, read sanitized lyrics, and paint Audio Core spectrum. New optional capabilities: `lyrics:read`, `audio:spectrum`.
- Sandbox plug-ins can skip tracks, set volume, reorder the queue, and call `echo.lyrics.get()` behind `lyrics:read`. Platform lyrics providers stay coarsened to `remote`.
- `init --preset lyrics` / recipe `lyrics-source` starts a lyrics companion. Extra recipes: `colors-theme`, `editorial-lyrics`, `bars-visualizer`.
- This is high customization, not a built-in streaming platform. Public Workshop item `3784997717` remains the published `1.5.0` starter until a separate confirmed publication.

## 1.6.0 — 2026-08-19

- Plug-in `init --preset catalog` / recipe `source-catalog` starts an author-owned searchable catalog: browse, collections, cover URLs, enqueue and play-queue. ECHO still does not ship a streaming platform.
- Sandbox API v2 additions: `echo.sources.browse`, `listCollection`, `enqueueDirect`, `playQueue`, plus optional `coverUrl`, `kind` and `live` on catalog rows. Empty search remains valid; `browse` falls back to it.
- The host-owned source dialog now opens on the catalog home, can drill into collections, and can enqueue. Playback is still a user-confirmed HTTP(S) direct stream through Audio Core. Platform page hosts stay rejected.
- These commands still never upload. Public Workshop item `3784997717` remains the published `1.5.0` starter until a separate confirmed publication.

## 1.5.0 — 2026-08-19

- `init` no longer requires `--id`, `--title` or `--holder`; the folder name is enough. `new` is an alias.
- Added human recipes (`css-theme`, `cinema-lyrics`, `vocal-eq`, …) plus `add`, `set`, `next`, `guide`, `recipes` and `watch`.
- `scaffold` now switches lyrics / visualizer / DSP starters in place, and `add` can append host-allowed slots, UI capabilities, palette colors or plug-in permissions without rewriting JSON.
- `CUSTOMIZE.md` and `next` tell authors what the host still allows. These commands still never upload. Public Workshop item `3784997717` was updated in place to this `1.5.0` starter on 2026-08-19.

## 1.4.0 — 2026-08-19

- Lyrics, visualizer and DSP `init` now have host-aligned presets: `editorial|compact|cinema|cover`, `bars|wave|radial`, and `flat|vocal|bass`.
- `quality`, `test`, `explain`, `kinds` and `dev` understand those kinds at the same depth as themes: scene slots, visualizer style whitelist, 31-band EQ layout, and local fixture previews.
- JSON Schema hints no longer advertise `particles` or lyrics backgrounds the host does not accept.
- Added complete `lyrics-cinema-scene`, `visualizer-radial` and `dsp-vocal` example projects.
- In-ECHO Authoring Studio and `workshop:author init` accept the same `--preset` values, including stylesheet/runtime extra files. The public Workshop SDK item remains `1.0.0` until a separate confirmed publication.

## 1.3.0 — 2026-08-19

- Fresh projects now get a 256×256 listing preview, `CUSTOMIZE.md`, and a `.gitignore` for authoring leftovers, so `quality` starts green instead of failing on a 1×1 pixel.
- `quality`, `test`, `kinds` and `explain` print readable text by default; pass `--json` for CI.
- Added `explain`, `fix`, `upgrade` and `example`. `fix` rebuilds hashes, bumps stylesheet/runtime `minEchoVersion`, and replaces an undersized preview. `upgrade` refreshes only `.echo-sdk`.
- Added a Windows `.cmd` launcher and a Chinese authoring README. Errors now include the next command to run.

## 1.2.0 — 2026-08-19

- Theme `init` now has four customization presets: `colors`, `skin` (default), `stylesheet` and `runtime`.
- Plug-in `init` accepts `--preset complete` for commands, a utility panel, Agent, providers and an importable appearance.
- Added `inspect`, `scaffold` and `kinds` commands. `dev` previews packaged CSS and the UI runtime against local fixtures.
- `quality` and `test` understand stylesheet paths, UI runtime entries, reserved host presets and `minEchoVersion 26.8.20`.
- Added JSON Schema hints for theme, lyrics, visualizer, DSP and audio-plugin-profile entries, plus UI runtime TypeScript declarations.
- Added complete `stylesheet-theme` and `retro-modern-ui-runtime` Workshop projects. The public Workshop SDK item remains `1.0.0` until a separate confirmed publication.

## 1.1.0 — 2026-08-17

- Added complete generators for all six Workshop content kinds.
- Added deterministic `test` fixtures and a hot-reloading local `dev` mock host.
- Added the `quality` publication-readiness report.
- Added focused examples for lyrics, Agents, authorized direct sources, Listen Together, metadata and complete appearance themes.

## 1.0.0 — 2026-08-17

- Published the machine-readable SDK contract.
- Added sandbox plug-in API v2 TypeScript declarations.
- Added JSON Schema hints for outer manifests and plug-in packages.
- Added a zero-dependency `init`, `sync`, `validate` and `doctor` CLI.
- Added a basic plug-in starter and GitHub Actions validation template.

Compatibility policy: additive API v2 declarations may land in SDK 1.x. Removing or changing an existing API surface requires a new plug-in API version and a migration note.
