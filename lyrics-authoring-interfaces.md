# Lyrics authoring interfaces / 歌词样式接口

These interfaces require an ECHO host containing their implementation. Check
`echo.host.getFeatureAvailability(action)` before using a host method. The pure
timeline helper belongs to the SDK and does not require a host round trip.

| Interface | Permission / capability | Purpose |
| --- | --- | --- |
| `echo.lyrics.createTimeline(document)` | Local SDK helper | Derive active lines, words, overlapping singers, background vocals and lyric-timing gaps. |
| `echo.lyrics.getDisplayPreferences()` | `lyrics:read` | Read user font, size, spacing, text direction and translation/romanization/highlight preferences. |
| `echo.lyrics.onDisplayPreferencesChanged(handler)` | `lyrics:read` | Observe display preference and registered-font changes. |
| `echo.artwork.getPalette()` / `onPaletteChanged(handler)` | `playback:read` | Current-cover colours, tagged with track identity; no image or local path is returned. |
| `echo.settings.get/set/onChanged` | Runtime `storage` | Validated settings declared by this package, saved separately from other packages and global settings. |
| `echo.ui.getLayout()` / `onLayoutChanged(handler)` | Current verified frame | Iframe viewport, safe insets and clipped host titlebar/player occlusion rectangles. |
| `echo.ui.getRenderBudget()` / `onRenderBudgetChanged(handler)` | Current verified frame | Host visibility, frame spacing, motion policy and active/unfocused/hidden/pressure/moving mode. |
| `echo.lyrics.setCurrentOffset(offsetMs)` | `lyrics:write` | Explicit user action changing only the current track's cached lyrics offset, -60000..60000 ms. |

## Time and word progress

```js
let timeline = null;
const stopLyrics = echo.events.on('lyrics:changed', ({ lyrics }) => {
  timeline?.dispose();
  timeline = lyrics ? echo.lyrics.createTimeline(lyrics) : null;
});
// Inside your budgeted draw loop; seconds come from the host playback clock.
function draw(positionSeconds) {
  const frame = timeline?.frameAt(positionSeconds);
  // frame.activeLines: [{lineIndex, progress}]
  // frame.activeWords: [{lineIndex, vocalIndex, wordIndex, progress}]
  // vocalIndex === null identifies the primary vocal.
  // frame.backgroundVocals supports simultaneously active backing vocals.
  // frame.gap includes remainingMs only for a gap in supplied lyric timings.
}
echo.ui.onDispose(() => { stopLyrics(); timeline?.dispose(); timeline = null; });
```

`frameAt()` applies the document's `offsetMs` once. It supports seeking backwards,
equal-start lines, explicit ending times and unknown word endings. Missing endings
use supplied word/next-line/duration boundaries for display only. A lyric-timing
gap does not prove instrumental audio. This helper never decides EOF or playback
transitions, and never sends per-frame IPC. Retain only the current document;
dispose and replace it when the track or lyrics revision changes.

## Preferences, layout and motion

```js
const preferences = await echo.lyrics.getDisplayPreferences();
// fontUrl is a registered echo-font: resource or null; never a filesystem path.
const layout = await echo.ui.getLayout();
let budget = await echo.ui.getRenderBudget();
const stopBudget = await echo.ui.onRenderBudgetChanged(value => { budget = value; });
// Stop RAF when frameIntervalMs is null or visible is false.
// Otherwise obey frameIntervalMs; disable decorative movement when
// allowDecorativeMotion is false. Drawing layout/text remains the author's choice.
echo.ui.onDispose(() => { void stopBudget(); });
```

All new observation methods return `Promise<async unsubscribe>`. Await registration,
then await the returned function when switching away from a feature. Frame teardown
also releases subscriptions. The existing `echo.settings.onChanged` remains a
synchronous local event subscription with a synchronous unsubscribe function.
Layout coordinates are relative to the iframe and include only visible host chrome
that actually intersects it. Resizing, player auto-hide/reveal, chrome replacement
and completed layout transitions update the snapshot without exposing parent DOM.

## Shared cover colours

```js
const stopPalette = await echo.artwork.onPaletteChanged(({ trackId, colors }) => {
  // Check trackId against your displayed song. Empty colors means not yet available.
  // colors contains up to four host-derived colours, without artwork URLs.
});
echo.ui.onDispose(() => { void stopPalette(); });
```

Queries and subscriptions share one current-cover sampler with legacy background
messages. It uses a 32x32 sampling surface, drops stale completions and cancels on
the last release. Hidden/moving/pressure runtime budgets suspend its observers;
an unavailable one-shot query rejects. Results are colour suggestions, not a
replacement for the host semantic theme tokens.

## Package settings

Add setting declarations under the theme entry's `runtime`, using the existing
string/select/boolean/number/color/range types:

```json
{
  "entry": "ui/index.html",
  "presentation": "lyrics-view",
  "capabilities": ["lyrics:read", "playback:read", "storage"],
  "settings": [
    { "id": "font-size", "title": "Font size", "type": "range", "min": 20, "max": 80, "step": 2, "defaultValue": 40 },
    { "id": "soft-background", "title": "Soft background", "type": "boolean", "defaultValue": true }
  ]
}
```

```js
const settings = await echo.settings.get();
await echo.settings.set('font-size', 48); // Call from an explicit user control.
const stopSettings = echo.settings.onChanged(values => { /* update this style */ });
echo.ui.onDispose(stopSettings);
```

Only declared IDs and valid values are accepted. Settings reuse the verified
source/item/content namespace and existing settings storage, and survive style
switches. They do not change global lyric preferences. Raw storage cannot address
the reserved settings keys. Runtime declarations cannot contain secret credentials.

偏移调整使用 `await echo.lyrics.setCurrentOffset(250)`，由用户操作明确触发；
接口不接受曲目 ID 或文件路径，不会保存标签或嵌入歌词。返回值是更新后的当前曲歌词文档。
在写入期间切歌时，迟到的结果不会作为新歌曲的歌词返回。

Portable previews expose labelled fixture values and package-setting validation;
they do not modify ECHO settings, local audio or real lyrics files. In-app preview
settings survive preview redraws, and its layout/render budget use the actual host
frame. The portable browser preview reports its iframe's size on resize.
