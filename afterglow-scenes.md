# Afterglow scene packs

Afterglow packs add backgrounds to ECHO's lyric animation engine. They use the existing `lyrics-style` Workshop kind and `Lyrics Scene` tag. Local ZIP import and Steam subscriptions run through the same manifest, hash, compatibility and staging validation. Timed lyrics are required, as with built-in Afterglow. A build containing this feature is required; earlier builds reject the new field.

## Create and import

```powershell
node .\bin\echo-workshop-sdk.mjs init .\my-scenes --recipe afterglow-scenes
```

For TypeScript-assisted authoring, import `EchoAfterglowLyricsStyle` or `EchoAfterglowScenePack` from `@echo/workshop-sdk/afterglow`. The schema and [machine-readable limits](./contracts/afterglow-scenes.json) enforce ranges and paint budgets. See [echo-workshop-afterglow.d.ts](./echo-workshop-afterglow.d.ts).

Start with [examples/afterglow-scenes](./examples/afterglow-scenes/README.md), or create a `lyrics-style` project with the new `afterglow` preset. Edit `content/lyrics-style.json`, update its file inventory with the SDK `sync` command, then validate and ZIP the **contents** of the `content` folder. The ZIP root must contain `echo.workshop.json` and `lyrics-style.json`.

In Afterglow, open the look gallery and choose **Import and use scene ZIP**. The pack keeps host lyrics, transport and clocks. **Remove active scene pack** restores built-in backgrounds; it keeps the installed pack for reuse. Installed packs can also be enabled, used, disabled and removed through Workshop. Steam publishing uses the existing SDK publisher and requires the author's rights confirmation; importing does not publish anything.

## Format

```json
{
  "type": "echo-workshop-lyrics-style",
  "schemaVersion": 1,
  "id": "my.afterglow-pack",
  "title": "My scenes",
  "settings": { "lyricsPageStyle": "jizura" },
  "scene": {
    "schemaVersion": 1,
    "background": "theme",
    "root": { "id": "root", "type": "group", "children": [] },
    "afterglow": {
      "schemaVersion": 1,
      "mode": "mix",
      "scenes": [{
        "id": "moon",
        "title": "Moon orbit",
        "layers": [{
          "type": "circle", "x": 0.8, "y": 0.3, "radius": 0.2,
          "color": "transparent", "stroke": "accent2", "opacity": 0.6,
          "motion": { "floatY": 0.02, "speed": 0.2 }
        }]
      }]
    }
  }
}
```

`mix` inserts a pack scene every third pair of lyric lines. `only` rotates through pack scenes on every pair. Lyrics and their timing remain host-owned. The pack cannot change mini-player visibility or combine its root with generic Workshop scene nodes.

| Field | Meaning |
| --- | --- |
| `type` | `circle`, `ellipse`, `rect`, `line`, `polygon`, `text`, or `particles` |
| `x`, `y` | Anchor as a fraction of canvas width/height, default `0.5` |
| `width`, `height` | Full bounds in canvas fractions, default `0.2`; line endpoint offset for `line` |
| `radius` | Fraction of the shorter canvas side; default `0.1`, or `0.002` for particles |
| `color`, `stroke` | `bg`, `fg`, `accent`, `accent2`, `ghostA`, `ghostB`, `transparent`, or a six-digit hex colour |
| `opacity` | 0–1, default `0.3`; applies to fill and stroke |
| `rotation` | Radians, default 0 |
| `strokeWidth` | Fraction of the shorter canvas side, default `0.001` |
| `points` | Polygon offsets relative to the anchor, in canvas fractions; 3–32 pairs |
| `text`, `fontSize` | Literal text up to 120 characters; system font, size as a fraction of the shorter side |
| `count` | Particle count 1–80, default 24; fixed and seeded rather than accumulated |
| `motion.floatX`, `floatY` | Oscillation amplitude in canvas fractions, 0–0.25 |
| `motion.speed`, `phase` | Oscillation speed 0–3 radians/second and phase 0–2π |
| `motion.spin` | Rotation speed −0.5–0.5 radians/second |

Limits: 12 scenes, 64 layers per scene, 256 layers and 512 paint elements per pack, 128 KiB normalized payload. Each particle counts as a paint element; its radius is capped at 0.02. IDs must be unique lowercase names starting with a letter. Geometry must be finite. Unknown fields are rejected.

This version is data-only: no JavaScript, shaders, CSS, URLs, fonts, raster assets, network requests, filesystem access, audio buffers or playback commands. Use palette tokens for theme-following colours. Keep opaque shapes away from the lyric area. Reduced motion, background throttling and memory-pressure quality reduction follow the existing Afterglow runtime.
