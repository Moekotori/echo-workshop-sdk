import {
  dspPresets,
  lyricsStylePresets,
  visualizerPresets,
} from './kind-presets.mjs';
import { fullTrustMinimumEchoVersion, fullTrustPluginPreset } from './trusted-plugin.mjs';

export const themePresets = ['colors', 'skin', 'stylesheet', 'runtime'];
export const pluginPresets = ['basic', 'complete', 'catalog', 'lyrics', fullTrustPluginPreset];
export { lyricsStylePresets, visualizerPresets, dspPresets };
export const stylesheetMinEchoVersion = '26.8.20';
export const unifiedRuntimeMinEchoVersion = '26.10.18';
export const defaultDataMinEchoVersion = '26.8.15';
export const forbiddenThemeBasePresets = ['FINAL', 'nyanCat', 'darkSideMoon'];
export const defaultThemeUiCapabilities = [
  'navigation',
  'playback:read',
  'playback:control',
  'library:read',
  'library:control',
  'queue:read',
  'queue:control',
  'window:control',
  'lyrics:read',
  'lyrics:match',
  'audio:spectrum',
  'storage',
];
export const themeUiCapabilities = [...defaultThemeUiCapabilities,
  'sources:direct', 'bridge:control', 'audio:output-read', 'audio:output-write',
  'library:playlist-delete', 'library:personal-write',
  'presence:control',
  'lyrics:search', 'lyrics:write', 'home:read', 'home:control',
  'audio:canvas',
  'extensions:read', 'extensions:launch',
  'audio:dsp-read', 'audio:dsp-write', 'media-session:control', 'companion:control', 'sleep-timer:control',
  'metadata:read', 'metadata:search', 'metadata:write', 'covers:read', 'covers:search', 'covers:write',
];

export const defaultPresetForKind = (kind) => {
  if (kind === 'theme') return 'skin';
  if (kind === 'plugin-package') return 'basic';
  if (kind === 'lyrics-style') return 'editorial';
  if (kind === 'visualizer-preset') return 'bars';
  if (kind === 'dsp-preset') return 'flat';
  return null;
};

export const resolveTemplatePreset = (kind, value) => {
  const fallback = defaultPresetForKind(kind);
  const preset = String(value ?? fallback ?? '').trim();
  if (!preset) return null;
  if (kind === 'theme' && themePresets.includes(preset)) return preset;
  if (kind === 'plugin-package' && pluginPresets.includes(preset)) return preset;
  if (kind === 'lyrics-style' && lyricsStylePresets.includes(preset)) return preset;
  if (kind === 'visualizer-preset' && visualizerPresets.includes(preset)) return preset;
  if (kind === 'dsp-preset' && dspPresets.includes(preset)) return preset;
  throw new Error(`Unsupported --preset ${preset} for ${kind}`);
};

export const defaultMinEchoVersionForPreset = (preset) => {
  if (preset === 'runtime') return unifiedRuntimeMinEchoVersion;
  if (preset === 'afterglow') return '26.9.29';
  if (preset === fullTrustPluginPreset) return fullTrustMinimumEchoVersion;
  return preset === 'stylesheet' || preset === 'runtime' ? stylesheetMinEchoVersion : defaultDataMinEchoVersion;
};

export const isEchoVersionAtLeast = (value, minimum) => {
  const parse = (version) => String(version ?? '').split('.').map((part) => Number(part) || 0);
  const [major = 0, minor = 0, patch = 0] = parse(value);
  const [needMajor, needMinor, needPatch] = parse(minimum);
  return major > needMajor
    || (major === needMajor && (minor > needMinor || (minor === needMinor && patch >= needPatch)));
};

const themeTones = {
  dark: {
    appBg: '#10131a',
    appBg2: '#151b26',
    panel: '#182231',
    accent: '#66ccff',
    accentStrong: '#8cdbff',
    heading: '#f5fbff',
    text: '#d8e8f3',
    muted: '#91a7b8',
    border: '#30465a',
    titlebar: '#111924',
    sidebar: '#121d29',
    player: '#172535',
    panelOpacityPercent: 72,
    glassPercent: 30,
    shadowPercent: 58,
    cornerRadiusPx: 18,
    panelBlurPx: 18,
    saturationPercent: 108,
    motionSpeedSeconds: 0.7,
    motionIntensityPercent: 86,
    motionEnabled: true,
  },
  light: {
    appBg: '#eef8fc',
    panel: '#f8fdff',
    accent: '#0b78d0',
    heading: '#132938',
    text: '#254252',
    muted: '#607b8a',
    border: '#b8d3df',
    panelOpacityPercent: 88,
    glassPercent: 18,
    cornerRadiusPx: 18,
    panelBlurPx: 14,
  },
  swatches: ['#10131a', '#182231', '#66ccff', '#8cdbff', '#eef8fc'],
};

export const themeSkinTemplate = {
  mode: 'shell',
  layout: {
    sidebarPosition: 'left',
    sidebarPresentation: 'overlay',
    sidebarWidth: 'wide',
    playerStyle: 'hero',
    titlebarStyle: 'immersive',
    contentDensity: 'editorial',
    cardStyle: 'glass',
    displayStyle: 'editorial',
    navStyle: 'pills',
    motion: 'cinematic',
  },
  stages: {
    home: 'cinema',
    lyrics: 'theater',
    queue: 'tickets',
    songs: 'poster',
    albums: 'magazine',
    artists: 'poster',
    playlists: 'tickets',
    genres: 'poster',
    liked: 'dense',
    history: 'tickets',
  },
  effects: {
    grainPercent: 8,
    vignettePercent: 22,
    glowPercent: 18,
    scrimPercent: 38,
    bloomPercent: 12,
    mistPercent: 6,
    dimChromePercent: 12,
    spotlightPercent: 28,
    frostPercent: 8,
  },
};

export const createThemeEntry = (preset, id, title) => {
  const base = {
    type: 'echo-workshop-theme-preset',
    schemaVersion: 1,
    id,
    title,
    description: preset === 'runtime'
      ? 'A sandboxed replacement UI with a declarative color fallback.'
      : preset === 'stylesheet'
        ? 'A packaged CSS theme scoped to this workshop pack id.'
        : preset === 'skin'
          ? 'A highly customizable, data-only ECHO chrome skin.'
          : 'A complete light and dark appearance preset for ECHO.',
    basePreset: 'classic',
    dark: themeTones.dark,
    light: themeTones.light,
    swatches: themeTones.swatches,
  };
  if (preset === 'skin') return { ...base, skin: themeSkinTemplate };
  if (preset === 'stylesheet') return { ...base, stylesheet: 'theme.css' };
  if (preset === 'runtime') {
    return {
      ...base,
      runtime: {
        entry: 'ui/index.html',
        capabilities: [...defaultThemeUiCapabilities],
      },
    };
  }
  return base;
};

export const createThemeStylesheetCss = (id) => `html[data-workshop-theme-pack="${id}"] {
  --color-bg: #10131a;
  --color-text: #d8e8f3;
  --color-muted: #91a7b8;
  --color-accent: #66ccff;
  --color-accent-strong: #8cdbff;
  --echo-heading-text: #f5fbff;
  --theme-app-bg: #10131a;
  --theme-page-text: #d8e8f3;
  --theme-heading-text: #f5fbff;
  --theme-muted-text: #91a7b8;
  --theme-panel-bg: #182231;
  --theme-player-bg: #172535;
  color-scheme: dark;
}

html[data-workshop-theme-pack="${id}"] body,
html[data-workshop-theme-pack="${id}"] .app-shell {
  background: radial-gradient(circle at 12% 8%, rgb(102 204 255 / 0.16), transparent 34%),
    linear-gradient(160deg, #10131a 0%, #151b26 54%, #0d1218 100%);
  color: var(--color-text);
}

html[data-workshop-theme-pack="${id}"] .app-titlebar,
html[data-workshop-theme-pack="${id}"] .sidebar,
html[data-workshop-theme-pack="${id}"] .player-bar,
html[data-workshop-theme-pack="${id}"] .page-surface {
  background: rgb(24 34 49 / 0.72);
  border-color: rgb(48 70 90 / 0.45);
}

html[data-workshop-theme-pack="${id}"] .sidebar {
  backdrop-filter: blur(18px);
}

html[data-workshop-theme-pack="${id}"] .player-bar {
  border-top: 1px solid rgb(102 204 255 / 0.22);
}
`;

export const createThemeRuntimeHtml = (title) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div id="app">
    <header class="top">
      <strong id="brand">${title}</strong>
      <input id="search" type="search" placeholder="Search library" autocomplete="off">
    </header>
    <main>
      <section>
        <h2>Tracks</h2>
        <ol id="tracks"></ol>
      </section>
      <section>
        <h2>Albums</h2>
        <ol id="albums"></ol>
      </section>
      <section>
        <h2>Queue</h2>
        <ol id="queue"></ol>
      </section>
    </main>
    <footer class="player">
      <div>
        <p id="now-title">Nothing playing</p>
        <p id="now-artist" class="muted"></p>
        <p id="now-lyrics" class="muted"></p>
      </div>
      <div id="spectrum" class="spectrum" aria-hidden="true"></div>
      <div class="transport">
        <button id="previous" type="button">Prev</button>
        <button id="play-pause" type="button">Play</button>
        <button id="next" type="button">Next</button>
        <button id="shuffle" type="button">Shuffle</button>
        <button id="repeat" type="button">Repeat</button>
        <button id="like" type="button">Like</button>
      </div>
    </footer>
  </div>
  <script src="__bridge__.js"></script><script src="app.js"></script>
</body>
</html>
`;

export const createThemeRuntimeCss = () => `:root {
  color-scheme: dark;
  --ink: #f4fbff;
  --muted: #8eabc0;
  --line: #2a3d52;
  --panel: #121b26;
  --accent: #7ad4ff;
  font-family: "Segoe UI", system-ui, sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--appBg, #0c1219); color: var(--ink); }
#app { min-height: 100%; display: grid; grid-template-rows: auto 1fr auto; }
.top, .player {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--panel);
}
.top { border-bottom: 1px solid var(--line); }
.player { border-top: 1px solid var(--line); }
main { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.8fr); gap: 20px; padding: 20px; }
h2 { margin: 0 0 12px; font-size: 15px; color: var(--accent); }
ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.spectrum { display: flex; gap: 2px; height: 28px; align-items: flex-end; min-width: 120px; }
.spectrum span { flex: 1; background: var(--accent); min-height: 2px; border-radius: 1px; }
li, button, input {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: inherit;
}
li, button { padding: 10px 12px; cursor: pointer; text-align: left; }
input { min-width: 220px; padding: 10px 12px; }
.muted { color: var(--muted); margin: 4px 0 0; }
.transport { display: flex; gap: 8px; }
p { margin: 0; }
@media (max-width: 860px) {
  main { grid-template-columns: 1fr; }
  .top, .player { flex-wrap: wrap; }
}
`;

export const createThemeRuntimeJs = () => `const stops = [];
let currentTrackId = null, refreshTimer = null, stopped = false, searchRevision = 0;
const text = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
const report = error => { text('now-lyrics', error.message); };
const list = (id, items, select) => {
  const root = document.getElementById(id); if (!root) return;
  root.replaceChildren(...items.map(item => { const row = document.createElement('li'); row.textContent = item.label;
    row.onclick = () => { void select(item.id).catch(report); }; return row; }));
};
const appearance = context => {
  if (stopped) return;
  document.documentElement.style.colorScheme = context.colorScheme;
  for (const [key, value] of Object.entries(context.appearance)) document.documentElement.style.setProperty('--' + key, value);
  const a = context.appearance;
  document.documentElement.style.setProperty('--ink', a.text);
  document.documentElement.style.setProperty('--line', a.border);
  document.body.style.background = a.appBg;
};
const refresh = async (search = '') => {
  const revision = ++searchRevision;
  const [tracks, albums] = await Promise.all([
    echo.library.getTracks({ page: 1, pageSize: 40, search }), echo.library.getAlbums({ page: 1, pageSize: 24, search }),
  ]);
  if (stopped || revision !== searchRevision) return;
  list('tracks', tracks.items.map(t => ({ id: t.id, label: t.title + ' · ' + (t.artist || '') })), id => echo.queue.playTrack(id));
  list('albums', albums.items.map(a => ({ id: a.id, label: a.title + ' · ' + (a.albumArtist || '') })), id => echo.queue.playAlbum(id));
};
const queue = value => { if (!stopped) list('queue', value.items.map(i => ({ id: i.queueId, label: i.track.title })), id => echo.queue.playItem(id)); };
const spectrum = document.getElementById('spectrum');
const bars = Array.from({ length: 24 }, () => document.createElement('span'));
spectrum?.replaceChildren(...bars);
const playback = async value => {
  if (stopped) return;
  text('play-pause', value.state === 'playing' ? 'Pause' : 'Play');
  text('shuffle', value.shuffleEnabled ? 'Shuffle on' : 'Shuffle');
  text('repeat', value.repeatMode === 'one' ? 'Repeat one' : value.repeatMode === 'all' ? 'Repeat all' : 'Repeat');
  const id = value.currentTrackId;
  if (id === currentTrackId) return;
  currentTrackId = id;
  if (!id) { text('now-title', 'Nothing playing'); text('now-artist', ''); text('now-lyrics', ''); return; }
  const [track, lyrics] = await Promise.all([echo.library.getTrack(id), echo.lyrics.get(id)]);
  if (stopped || id !== currentTrackId) return;
  text('now-title', track.title); text('now-artist', track.artist || '');
  text('now-lyrics', lyrics?.lines?.[0]?.text || lyrics?.plainText || '');
};
const bind = (id, action) => { const node = document.getElementById(id); if (node) node.onclick = () => { void action().catch(report); }; };
bind('play-pause', async () => { const state = await echo.playback.getStatus(); return state.state === 'playing' ? echo.playback.pause() : echo.playback.play(); });
bind('previous', () => echo.playback.previous()); bind('next', () => echo.playback.next());
bind('shuffle', () => echo.playback.toggleShuffle()); bind('repeat', () => echo.playback.cycleRepeat());
bind('like', () => echo.library.toggleTrackLiked(currentTrackId));
const search = document.getElementById('search');
if (search) search.oninput = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => { void refresh(search.value.trim()).catch(report); }, 180); };
stops.push(echo.events.on('playback:status', state => { void playback(state).catch(report); }));
stops.push(echo.events.on('queue:changed', queue));
stops.push(echo.events.on('audio:spectrum', value => { if (!stopped) bars.forEach((bar, i) => { bar.style.height = Math.round((value.bands[i] || 0) * 28) + 'px'; }); }));
stops.push(echo.events.on('library:changed', () => { void refresh(search?.value.trim() || '').catch(report); }));
stops.push(echo.ui.onContextChanged(appearance));
echo.ui.onDispose(() => { stopped = true; searchRevision++; clearTimeout(refreshTimer); for (const stop of stops) stop(); });
void Promise.all([echo.ui.getContext().then(appearance), echo.playback.getStatus().then(playback), echo.queue.get().then(queue), refresh()]).catch(report);
`;

export const createThemeExtraFiles = (preset, id, title) => {
  if (preset === 'stylesheet') {
    return [{ path: 'theme.css', content: createThemeStylesheetCss(id) }];
  }
  if (preset === 'runtime') {
    return [
      { path: 'ui/index.html', content: createThemeRuntimeHtml(title) },
      { path: 'ui/app.css', content: createThemeRuntimeCss() },
      { path: 'ui/app.js', content: createThemeRuntimeJs() },
    ];
  }
  return [];
};

export const inferThemePreset = (entry) => {
  if (entry?.progressBar) return 'progress';
  if (entry?.runtime?.entry) return 'runtime';
  if (typeof entry?.stylesheet === 'string' && entry.stylesheet.trim()) return 'stylesheet';
  if (entry?.skin && typeof entry.skin === 'object') return 'skin';
  return 'colors';
};

export const describeThemeCustomization = (entry) => ({
  preset: inferThemePreset(entry),
  basePreset: typeof entry?.basePreset === 'string' ? entry.basePreset : null,
  tones: {
    light: Boolean(entry?.light && typeof entry.light === 'object'),
    dark: Boolean(entry?.dark && typeof entry.dark === 'object'),
  },
  skin: Boolean(entry?.skin && typeof entry.skin === 'object'),
  stylesheet: typeof entry?.stylesheet === 'string' ? entry.stylesheet : null,
  runtime: entry?.runtime && typeof entry.runtime === 'object'
    ? {
        entry: entry.runtime.entry ?? null,
        capabilities: Array.isArray(entry.runtime.capabilities) ? entry.runtime.capabilities : [],
      }
    : null,
});
