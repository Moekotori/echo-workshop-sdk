# Functional examples

These examples complement the generators. Copy only the example you need.

Plug-in fragments (copy the script, then declare the matching contribution and capability):

- `lyrics-source`: user-selectable lyrics candidates from sanitized track metadata, plus `echo.lyrics.get()` for the current track.
- `author-agent`: an author-defined local Agent handler.
- `network-source`: a paged author-owned catalog that resolves only to a direct, authorized HTTP(S) stream. It is not a built-in streaming platform.
- `listen-together`: the API 2 local-track share task; it never receives a local path.
- `metadata-provider`: selectable metadata and cover candidates.
- `complete-ui-theme`: a plug-in `themePresets` fragment that subscribers import into My themes. It is not a Workshop theme pack.

Complete Workshop projects (run `node ../../bin/echo-workshop-sdk.mjs test .`):

- `hello-plugin`: the smallest complete plug-in — one command, one `playback:read` permission, no panels, no network. Start here on day one.
- `minimal-theme`: the smallest complete theme — a `colors`-layer preset with light/dark tone overrides on the public `classic` base.
- `stylesheet-theme`: a packaged CSS theme scoped to its pack id. Requires ECHO `26.8.20`.
- `retro-modern-ui-runtime`: a sandboxed theme with library/albums, shuffle/repeat, current-line lyrics, host appearance tokens, spectrum and theme-local search memory.
- `lyrics-cinema-scene`: a cinema-stage lyrics scene that owns transport, including shuffle/repeat/like, because the host mini player is hidden.
- `visualizer-radial`: a radial spectrum using only host styles `bars`, `wave` and `radial`.
- `dsp-vocal`: a conservative 31-band vocal EQ. Audio Core still owns playback DSP.
- `locale-wenyan`: a literary Chinese (`lzh`) language pack. Extra languages live only in Workshop JSON; missing keys fall back to Simplified Chinese.

For a parameterized custom-function project, run `init ./my-functions --kind plugin-package --preset complete`. Its `save-library-note` command demonstrates a host-rendered form, confirmation, `echo.commands.execute()` composition and sandbox-only storage without a custom HTML panel for the form.

Run generated projects with `npm test` in the local mock host. Network requests are intentionally disabled there; production requests remain capability-gated and limited to declared hosts.
