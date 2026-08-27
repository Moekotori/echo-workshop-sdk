# ECHO Workshop SDK

This folder is the portable developer kit for ECHO Steam Workshop. SDK version `1` targets Workshop manifest schema `1` and sandbox plug-in API `2`. Package version `1.11.0` adds a machine-readable authoring-project contract and fail-closed project metadata validation on top of the `1.10.0` local check gate. The five built-in app languages stay in ECHO. ECHO does not ship a third-party streaming platform.

The public Steam Workshop starter is
[`3784997717`](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717)
at published package version `1.10.0`; `1.11.0` is the next local release candidate until it is published. Later updates must keep that PublishedFileID.

It contains:

- `echo-workshop-plugin.d.ts`: editor completion for the sandbox `echo` global;
- `echo-workshop-ui-runtime.d.ts`: editor completion for the theme UI `postMessage` bridge;
- `echo-workshop-sdk.json`: machine-readable supported-version contract;
- `schemas/`: JSON Schema hints for the authoring project, manifests, themes and `.echo` packages;
- `bin/echo-workshop-sdk.mjs`: zero-dependency project generator, inspector, mock host and preflight checker;
- `templates/`: seven official content templates, theme/plugin presets and a GitHub Actions validation workflow;
- `examples/`: focused plug-in fragments, the day-one `hello-plugin` / `minimal-theme` starters, plus complete theme, lyrics, visualizer, DSP and locale-pack projects.

Chinese author notes: [README.zh-CN.md](./README.zh-CN.md). A bilingual
one-page command reference lives in [CHEATSHEET.md](./CHEATSHEET.md), and
[TROUBLESHOOTING.md](./TROUBLESHOOTING.md) maps every common local failure —
check errors, mock permission denials, dev port conflicts, tag warnings — to
its fix (`guide troubleshoot` prints the short Chinese table).

The JSON Schemas improve editor feedback. ECHO's production parser remains authoritative and may enforce cross-file, hash, size and runtime-policy checks that JSON Schema cannot express.

## Quick start from the packed SDK

```powershell
node .\bin\echo-workshop-sdk.mjs init .\harbor --recipe css-theme
cd .\harbor
npm run next
npm run check
npm run dev
```

`--id`, `--title` and `--holder` are optional. `recipes` lists outcome-oriented starters; `guide` is the Chinese cookbook; `add` / `set` / `scaffold` keep customizing inside the host whitelist. `--license` (on `init` and `set`) declares your own content license, such as `MIT` or `CC0-1.0`; the default stays `All-Rights-Reserved`. `next` starts with fix-first items derived from the project's current quality report, each mapped to the command that clears it. `snippet list` prints copy-paste starters (providers, storage, network calls, UI runtime bridge, theme tones) with the permissions each one needs; generated projects also ship the same set as `.vscode/echo-workshop.code-snippets`, expanded by typing an `echo-` prefix.

The SDK is also a standalone npm package: `npm install <path-to-this-folder-or-packed-tgz>` gives you `npx echo-workshop-sdk`. `init`, `check`, `test`, `quality` and `dev` need only Node 20+, not an ECHO installation; publishing still happens in ECHO's Authoring Studio. `version --json` reports the supported schema, plug-in API, protocol and limit surface for external tooling.

`--kind` accepts `theme`, `lyrics-style`, `visualizer-preset`, `dsp-preset`, `audio-plugin-profile`, `locale-pack` or `plugin-package`. `locale-pack` is a JSON string table for a language ECHO does not ship, such as literary Chinese (`lzh`). Missing keys fall back to a built-in locale.

Theme `--preset` values:

| Preset | What you get | Minimum ECHO |
| --- | --- | --- |
| `colors` | Light/dark tone overrides | `26.8.15` |
| `skin` | Declarative chrome, stages and atmosphere (default) | `26.8.15` |
| `stylesheet` | Packaged CSS scoped to the pack id | `26.8.20` |
| `runtime` | Sandboxed HTML/CSS/JS replacement UI | `26.8.20` |

Plugin `--preset` values: `basic` (default), `complete`, `catalog`, or `lyrics`.

`catalog` is an author-owned searchable directory of direct HTTP(S) streams. It is not a built-in Netease / Spotify / YouTube restore. The host owns search UI, origin confirmation, queue and Audio Core playback.

Lyrics `--preset` values: `editorial` (default), `compact`, `cinema`, `cover`.

Visualizer `--preset` values: `bars` (default), `wave`, `radial`. The host does not accept `particles`.

DSP `--preset` values: `flat` (default), `vocal`, `bass`. All use the official 31-band layout.

Raise an existing theme later without starting over:

```powershell
node .\bin\echo-workshop-sdk.mjs scaffold .\my-theme --preset runtime
```

`npm run check` is the complete local gate: it synchronizes packaged content, validates hashes and schemas, runs the quality report, and executes deterministic fixtures. Use `npm run check -- --json` for one machine-readable result, or `--warn-only` to keep iterating with a passing exit code while failures are still reported; publication still requires a clean check. `doctor`, `validate` and `example list` also accept `--json`. The mock host enforces declared plug-in permissions, so undeclared capability use fails locally. `npm run dev` opens a live author console with gate status, permissions, fixtures, the latest changed file, copyable recovery commands and raw diagnostics; stylesheet, runtime, lyrics, visualizer and DSP projects also get a separate fixture preview. `npm run watch` and the dev console debounce editor save bursts, watch nested files and ignore the generated manifest update. This author-controlled local tool is not the production sandbox and must not be used as proof of Steam-client behavior.

The portable CLI and ECHO host share the plug-in package contract in `contracts/plugin-package-limits.json`: at most 32 files, 512 KiB per UTF-8 file and 2 MiB for the serialized package, with `.css`, `.html`, `.js`, `.mjs` and `.json` assets. All three shared contracts (plug-in API, package limits, content kinds) are importable package exports for external tooling. A plug-in entry remains `.js`; `.mjs` is available to imported module assets. The inner plug-in `apiVersion` must exactly match the outer Workshop manifest's `compatibility.pluginApiVersion`.

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

Generated plug-in projects reference `.echo-sdk/echo-workshop-plugin.d.ts`. The declaration covers the sanitized track, album, artist, genre, playlist, queue, like, direct-source and listen-together results returned by API 2. Editor completion therefore follows the public sandbox contract; authors do not need application source types or host internals. Run `echo-workshop-sdk guide types` for the shortest setup reminder.

`contracts/plugin-api.json` is the machine-readable method-to-permission and common-error contract used by the production host. Run `echo-workshop-sdk api`, filter with `echo-workshop-sdk api echo.queue.moveItem`, or inspect recovery guidance with `echo-workshop-sdk api errors`. A permission change is subscriber-visible; never loop on user-denied direct-source or sharing prompts.

`validate` rejects private, local, wildcard, duplicate and malformed `networkHosts`, plus host declarations without `network:request` or `playback:share`. The mock rejects undeclared destinations and custom ports before a fixture can pass. Production network requests and playback-sharing uploads resolve a public address and connect to that validated address while preserving the declared Host/TLS identity. HTTP(S) remains accepted for compatibility, but authors should use HTTPS for requests and uploads.

## Standalone GitHub mirror

The SDK also lives as a standalone public GitHub repository (recommended name
`echo-workshop-sdk`), generated from this folder with
`npm run workshop:sdk:export-mirror` inside the ECHO repository. The mirror is
where to fork the SDK and where to file issues and pull requests; see
[CONTRIBUTING.md](./CONTRIBUTING.md), [GOVERNANCE.md](./GOVERNANCE.md) and the
[code of conduct](./CODE_OF_CONDUCT.md). Its generated `MIRROR.md` records the
exported SDK version, and `.github/workflows/ci.yml` runs the standalone gate
(doctor, syntax checks, init/check/test for all seven kinds, example
validation and a strict TypeScript declaration compile) on every push and
pull request.

This folder inside the private ECHO repository remains the source of truth,
and the Steam Workshop starter item
[`3784997717`](https://steamcommunity.com/sharedfiles/filedetails/?id=3784997717)
ships the same package for authors who install through Steam. Accepted mirror
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
