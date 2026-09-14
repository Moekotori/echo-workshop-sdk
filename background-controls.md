# Lyrics background controls v1

`lyrics-background` is selected independently from `appearanceThemeCustomId`.
Applying it enables the validated background receipt without installing its
color tokens or shell skin into the application. Background colors, assets and
layout remain inside the lyrics surface; the homepage and drawers retain the
user's application theme. The host releases the iframe when that surface leaves.

A `lyrics-background` runtime can announce `backgroundControlsVersion: 1` in
its `echo:workshop-ui:ready` message. ECHO then shows background controls below
the lyrics background selector. Older runtimes do not show unsupported controls.

`echo:workshop-ui:state` optionally contains `backgroundControls`:

| Field | Type / range | Default |
| --- | --- | --- |
| paused | boolean | false |
| musicReactive | boolean | true |
| grain | boolean | true |
| response | number, 0–2.5 in 0.1 steps | 1.5 |

These are user preferences shared by compatible backgrounds. ECHO persists a
single bounded object. Slider changes are previewed live and saved on release.
The host sets the motion interval to null when paused and releases the runtime's
spectrum demand when paused or music reaction is off. Playback itself continues.
The runtime must freeze phase when paused, repaint parameter changes, and honor
grain and response. Motion pressure / reduced motion always takes precedence.

Frequency meters are host UI, read the existing 32-band snapshot at up to 10 Hz,
and retain no sample history. No new capability, network access, PCM transport,
or runtime-to-settings write permission is introduced.

Independent lyrics backgrounds have no floating exit button. Users switch back
to a built-in source in the visual sidebar; Ctrl+Shift+Esc remains available.
The full-shell custom UI runtime retains its own exit control.

## Optional current-cover palette

A read-only background with `playback:read` may announce `coverPaletteVersion: 1`
alongside `backgroundControlsVersion: 1` in its ready message. The host then adds
`coverPalette: { trackId: string | null, colors: string[] }` to state messages.
Colors are 2–4 `#rrggbb` values extracted from the trusted current artwork
thumbnail. `colors: []` means no cover, pending sampling, an invalidated track,
or a failed sample. Only apply colors whose trackId matches playback.currentTrackId.
Clear stale artwork on track changes and fall back to appearance colors when empty.

This field contains no artwork URL, path, image bytes or metadata. Sampling is
opt-in, uses a 32×32 canvas, retains one current palette, and is cancelled when
the background leaves, the artwork changes, or resource pressure disables it.
No command, storage, filesystem, network or playback-control capability is added.
Older hosts omit the field; backgrounds must retain a theme-color fallback.
