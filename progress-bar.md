# Progress-only decoration (host support: 26.9.26 or later)

A `theme` contribution can declare `progressBar` instead of global colors, CSS or a runtime. It occupies the independent `progress` visual slot. Applying it must not change the active theme, light/dark preference, custom colors, sidebar, page or player layout. `basePreset` remains required metadata for schema compatibility; it is not applied in this mode.

```json
{
  "type": "echo-workshop-theme-preset", "schemaVersion": 1,
  "id": "example.progress", "title": "Pixel progress", "basePreset": "classic",
  "progressBar": {
    "height": 26,
    "thumb": { "asset": "art/cat-strip.png", "width": 72, "height": 48, "steps": 2, "durationMs": 480, "bobPx": 2 },
    "trail": { "asset": "art/rainbow.png", "width": 32, "height": 26, "steps": 2, "durationMs": 480 },
    "texture": { "asset": "art/stars.png", "width": 256, "height": 26, "steps": 128, "durationMs": 4800 }
  }
}
```

`width`/`height` are displayed CSS pixels. The thumb is a horizontal sprite sheet containing `steps` frames; trail and optional texture are horizontally repeating raster tiles. The host advances each by discrete steps. `durationMs / steps` must be at least 16 ms. Sprite frames are capped at 16; sizes and durations are bounded by `schemas/theme.schema.json` and the production validator. Every image must be declared and hash-verified in the outer manifest.

The entry cannot include `light`, `dark`, `stylesheet`, `skin`, `runtime` or `backgroundAsset`. It cannot inject CSS, script, global variables, selectors or event handlers. The host creates pointer-transparent decoration inside its existing seek rail; its range input, current track position, seek action and clock remain host-owned. Paused, reduced-motion, background-window and low-load states stop decorative animation. One active decoration is persisted; disabling or replacing its exact Registry revision removes it. No unbounded caches or timers are used.

Independent theme changes leave this decoration selected. A custom UI runtime that replaces the native player is outside this native-progress renderer's coverage. The SDK validates this declaration; the full host integration is the visual acceptance surface. The legacy stylesheet mock preview is not a test of isolation.

Migration from an older whole-theme release removes only that item's obsolete custom-theme binding, when it is still the active theme. Other selected themes and all their colors are preserved. A theme replaced by the older release cannot be reconstructed from missing historical settings; the user can select their preferred theme again.

Do not publish a progress-only update to users before a supporting ECHO release is available. Set `compatibility.minEchoVersion` to at least `26.9.26`; older hosts must reject it rather than fall back to applying a global theme.
