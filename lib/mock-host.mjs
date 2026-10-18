import { createWorkshopProviderClient } from './provider-client.mjs';
import { createProviderPreview } from './provider-preview.mjs';
import { createLibraryPreview } from './library-preview.mjs';
import { createWorkshopLibraryClient } from './library-client.mjs';
import { runtimePreviewHtml } from './runtime-preview.mjs';
import { createExtensionsPreview } from './extensions-preview.mjs';
import { createQueuePreview } from './queue-preview.mjs';
import { createRuntimeControlPreview } from './runtime-control-preview.mjs';
import { createServer } from 'node:http';
import vm from 'node:vm';
import { initializeWorkshopClient } from './sandbox-bridge.mjs';
import { createLyricsTimeline } from './lyrics-timeline.mjs';
import { createLyricsAuthoringPreview } from './lyrics-authoring-preview.mjs';
import { createWorkshopPayloadTransfer } from './payload-transfer.mjs';
import { createVisualizationFixture } from './visualization-fixture.mjs';
import { readFile, watch } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import {
  collectLyricsSceneSlots,
  eqFrequenciesHz,
  isHexColor,
  lyricsPageStyles,
  lyricsSceneSlots,
  visualizerStyles,
} from './kind-presets.mjs';
import {
  forbiddenThemeBasePresets,
  themeUiCapabilities,
} from './theme-assets.mjs';
import { createDebouncedRunner, isGeneratedWorkshopChange } from './watch-utils.mjs';
import { testNativeShell } from './native-shell.mjs';
import { validateLyricsSceneContract } from './lyrics-scene-contract.mjs';
import { animationPreviewHtml, isAnimationPreviewDefinitionValid } from './animation-preview.mjs';
import {
  assertWorkshopMockUrl,
  normalizeWorkshopNetworkHosts,
  validateWorkshopNetworkDeclaration,
} from './network-policy.mjs';
import pluginApiContract from '../contracts/plugin-api.json' with { type: 'json' };

const withTimeout = async (label, task, timeoutMs = 1_500) => Promise.race([
  Promise.resolve().then(task),
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)),
]);

const fixtureTrack = {
  id: 'fixture-track-01', mediaType: 'local', title: 'Neon Harbor', artist: 'ECHO Fixtures',
  album: 'Local Signals', albumArtist: 'ECHO Fixtures', trackNo: 1, discNo: 1, year: 2026,
  genre: 'Electronic', codec: 'FLAC', sampleRate: 96000, bitDepth: 24, bitrate: 2800000,
  durationSeconds: 221, coverUrl: null, unavailable: false,
};

const fixtureTracks = [
  fixtureTrack,
  { ...fixtureTrack, id: 'fixture-track-02', title: 'Glass Pier', trackNo: 2, durationSeconds: 184 },
  { ...fixtureTrack, id: 'fixture-track-03', title: 'After Hours', artist: 'Harbor Lamp', album: 'Night Desk', albumArtist: 'Harbor Lamp', trackNo: 1, durationSeconds: 196 },
];

const fixtureAlbum = {
  id: 'album-1', mediaType: 'local', title: 'Local Signals', albumArtist: 'ECHO Fixtures',
  year: 2026, trackCount: 2, durationSeconds: 405, coverUrl: null,
};
const fixtureArtist = {
  id: 'artist-1', mediaType: 'local', name: 'ECHO Fixtures', role: 'both',
  trackCount: 2, albumCount: 1, coverUrl: null,
};
const fixtureGenre = {
  id: 'genre-1', mediaType: 'local', name: 'Electronic', unclassified: false,
  trackCount: 3, albumCount: 2, coverUrl: null,
};
const fixturePlaylist = {
  id: 'playlist-1', name: 'Fixture playlist', description: 'Local SDK fixture',
  kind: 'manual', itemCount: fixtureTracks.length, coverUrl: null,
};
const fixturePlaylistItems = fixtureTracks.map((track, index) => ({
  id: `playlist-item-${index + 1}`, playlistId: fixturePlaylist.id, position: index,
  unavailable: false, track,
}));
export const createMockEcho = (packageValue, networkHosts = [], hostState = {}) => {
  const registrations = {
    commands: new Map(), agents: new Map(), sources: new Map(), lyrics: new Map(),
    metadata: new Map(), covers: new Map(), notifications: [],
    panel: {
      presentation: { title: 'Mock panel', badge: null, dirty: false, attention: 'none', size: 'comfortable' },
      closeCount: 0,
      opened: [],
    },
  };
  const permissions = new Set(Array.isArray(packageValue?.manifest?.permissions) ? packageValue.manifest.permissions : []);
  const controlEvents = new Map();
  const workflows = createRuntimeControlPreview((name, value) => { for (const handler of controlEvents.get(name) ?? []) handler(value); });
  const extensions = createExtensionsPreview(hostState.extensionItems);
  const declaredNetworkHosts = normalizeWorkshopNetworkHosts(networkHosts);
  const requireCapability = (capability) => {
    if (!permissions.has(capability)) throw new Error(`capability-denied:${capability}`);
  };
  const hostAvailability = (featureId) => {
    const definition = pluginApiContract.actions[featureId];
    if (!definition) return { supported: false, granted: false, available: false, reason: 'feature-disabled' };
    const granted = (definition.permission === null || permissions.has(definition.permission))
      && (definition.requiredPermissions ?? []).every(permission => permissions.has(permission));
    const override = hostState.features?.[featureId];
    if (!granted) return { supported: true, granted: false, available: false, reason: 'capability-not-approved' };
    if (override) return { supported: override.supported !== false, granted: true, available: override.available === true, reason: override.reason ?? null };
    if (hostState.proEntitled === false && featureId.startsWith('audio:dsp:')) {
      return { supported: true, granted: true, available: false, reason: 'not-entitled' };
    }
    if (hostState.audioCoreAvailable === false && (featureId.startsWith('audio:') || featureId.startsWith('playback:'))) {
      return { supported: true, granted: true, available: false, reason: 'audio-core-unavailable' };
    }
    if (hostState.currentModeCompatible === false && featureId.startsWith('audio:dsp:')) {
      return { supported: true, granted: true, available: false, reason: 'current-mode-incompatible' };
    }
    return { supported: true, granted: true, available: true, reason: null };
  };
  const guarded = (capability, handler) => (...args) => {
    requireCapability(capability);
    return handler(...args);
  };
  const eventCapabilities = {
    'window:maximized-changed': 'window:control',
    'window:fullscreen-changed': 'window:control',
    'extensions:changed': 'extensions:read',
    'playback:status': 'playback:read',
    'transition:committed': 'playback:read',
    'audio:spectrum': 'audio:spectrum',
    'queue:changed': 'queue:read',
    'library:changed': 'library:read',
    'library:liked-changed': 'library:read',
    'settings:changed': 'fs:plugin',
    'media-session:command': 'media-session:control',
    'companion:state': 'companion:control',
    'sleep-timer:tick': 'sleep-timer:control',
  };
  let playbackRate = 1;
  const queueEvents = new Set();
  const mediaState = { playback: { state: 'playing', currentTrackId: fixtureTrack.id, positionSeconds: 42.5,
    durationSeconds: fixtureTrack.durationSeconds, volume: 0.72, shuffleEnabled: false, repeatMode: 'off' },
    currentTrack: fixtureTrack, queue: { currentQueueId: 'fixture-queue-1',
      items: fixtureTracks.map((track, index) => ({ queueId: `fixture-queue-${index + 1}`, track })) } };
  const queuePreview = createQueuePreview({ tracks: fixtureTracks, state: mediaState,
    emit: (name, payload) => { if (name === 'queue:changed') for (const handler of queueEvents) handler(payload); } });
  const playFixtureCollection = tracks => ({ ...queuePreview.run('queue:playTrack', {
    trackId: tracks[0].id, queueTrackIds: tracks.map(track => track.id),
  }), count: tracks.length });
  const libraryEvents = new Map(['library:changed', 'library:liked-changed'].map(name => [name, new Set()]));
  const libraryPreview = createLibraryPreview({ tracks: fixtureTracks, albums: [fixtureAlbum], playlists: [fixturePlaylist], playlistItems: fixturePlaylistItems, likedTrackIds: [fixtureTrack.id],
    play: (items, trackId) => queuePreview.run('queue:playTrack', { trackId, queueTrackIds: items.map(item => item.id) }),
    emit: (name, payload) => { for (const handler of libraryEvents.get(name)) handler(payload); },
  });
  const windowState = { maximized: false, fullscreen: false };
  const windowEvents = new Map(['window:maximized-changed', 'window:fullscreen-changed'].map(name => [name, new Set()]));
  let parentRouteId = 'home';
  const onWindowEvent = (name, handler) => {
    requireCapability('window:control');
    if (typeof handler !== 'function') throw Error('invalid-event-handler');
    const handlers = windowEvents.get(name); handlers.add(handler); return () => handlers.delete(handler);
  };
  const toggleWindow = field => {
    windowState[field] = !windowState[field];
    for (const handler of windowEvents.get(`window:${field}-changed`)) handler(windowState[field]);
    return null;
  };
  const emptyPage = { page: 1, pageSize: 20, total: 0, hasMore: false, items: [] };
  const storage = new Map();
  const storageKeyPattern = /^(?!__)[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
  const validStorageKey = (key) => {
    if (typeof key !== 'string' || !storageKeyPattern.test(key)) throw new Error('invalid-payload');
    return key;
  };
  const dspModules = {
    equalizer: {
      enabled: false,
      preampDb: 0,
      dspHeadroomDb: -3,
      dspSafetyLimiterEnabled: true,
      bands: Array.from({ length: 31 }, (_, index) => ({ band: index, frequencyHz: 20 * (1.25 ** index), gainDb: 0, q: 1, filterType: 'peaking', enabled: true })),
      presetId: 'flat',
      presetName: 'Flat',
      clippingRisk: false,
    },
    convolution: { enabled: false, status: 'empty', irId: null, irName: null, channelMode: 'none', sampleRate: null, tapCount: 0, trimDb: 0, latencySamples: 0, clippingRisk: false },
    replayGain: { enabled: false, mode: 'track', targetLufs: -14, preampDb: 0 },
    compressor: {
      enabled: false, thresholdDb: -18, ratio: 4, attackMs: 10, releaseMs: 120, kneeDb: 6, makeupDb: 0, mix: 1,
      detectorMode: 'peak', sidechainHighpassEnabled: false, sidechainHighpassHz: 120, autoRelease: false, rangeDb: 72, stereoLink: 1,
      inputPeakDb: [-96, -96], inputRmsDb: [-96, -96], outputPeakDb: [-96, -96], outputRmsDb: [-96, -96],
      gainReductionDb: 0, gainReductionDbByChannel: [0, 0], outputHeadroomDb: 96, clippingRisk: false,
    },
    crossfeed: { enabled: false, amount: 0.25, cutoffHz: 700 },
    stereoField: { enabled: false, width: 1, centerGainDb: 0, sideGainDb: 0, clippingRisk: false },
    channelMatrix: { enabled: false, leftToLeft: 1, rightToLeft: 0, leftToRight: 0, rightToRight: 1, clippingRisk: false },
    channelBalance: {
      enabled: false, balance: 0, leftGainDb: 0, rightGainDb: 0,
      bandGains: { low: { leftGainDb: 0, rightGainDb: 0 }, mid: { leftGainDb: 0, rightGainDb: 0 }, high: { leftGainDb: 0, rightGainDb: 0 } },
      leftDelayMs: 0, rightDelayMs: 0, swapLeftRight: false, monoMode: 'off', invertLeft: false, invertRight: false, constantPower: true,
    },
    workshopAudioEffect: {
      enabled: false, effect: 'bitcrusher', bitDepth: 8, sampleRateHz: 11025, mix: 1, outputGainDb: 0,
      pulseMix: 0.8, triangleMix: 0.45, noiseMix: 0.2, drive: 2.8,
      vocalCutStrength: 1, vocalCutBassPreserveHz: 160,
    },
  };
  let dspRackOrder = ['equalizer', 'convolution', 'replayGain', 'compressor', 'crossfeed', 'stereoField', 'channelMatrix', 'channelBalance'];
  const echo = {
    extensions: {
      list: guarded('extensions:read', async query => extensions.run('extensions:list', query)),
      launch: guarded('extensions:launch', async key => extensions.run('extensions:launch', { key })),
      onChanged: handler => echo.events.on('extensions:changed', handler),
    },
    host: {
      getCapabilities: async () => ({
        apiVersion: pluginApiContract.apiVersion,
        features: Object.fromEntries(Object.keys(pluginApiContract.actions).map((featureId) => [featureId, hostAvailability(featureId)])),
      }),
      getFeatureAvailability: async (featureId) => hostAvailability(featureId),
    },
    commands: {
      register: (id, definition, handler) => registrations.commands.set(id, { definition, handler }),
      execute: async (id, input) => {
        const command = registrations.commands.get(id);
        if (!command) throw new Error('command-not-registered');
        return input === undefined ? command.handler() : command.handler(input);
      },
      list: () => [...registrations.commands.entries()].map(([id, command]) => ({
        id,
        title: command.definition?.title || id,
      })),
    },
    agents: {
      register: guarded('agent:runtime', (id, definition, handler) => registrations.agents.set(id, { definition, handler })),
      run: guarded('agent:runtime', async (id, input) => registrations.agents.get(id)?.handler(input)),
    },
    sources: {
      registerProvider: guarded('sources:provide', (id, definition, handlers) => registrations.sources.set(id, { definition, handlers })),
      playDirect: guarded('sources:direct', async source => queuePreview.run('sources:playDirect', source)),
      enqueueDirect: guarded('sources:direct', async source => queuePreview.run('sources:enqueueDirect', source)),
      playQueue: guarded('sources:direct', async sources => queuePreview.run('sources:playQueue', { sources })),
      search: guarded('sources:provide', async (providerId, request) => registrations.sources.get(providerId)?.handlers.search({ query: '', page: 1, pageSize: 20, ...(request || {}) })),
      browse: guarded('sources:provide', async (providerId, request) => {
        const handlers = registrations.sources.get(providerId)?.handlers;
        if (typeof handlers?.browse === 'function') return handlers.browse(request || { page: 1, pageSize: 20 });
        return handlers?.search?.({ query: '', page: 1, pageSize: 20, ...(request || {}) });
      }),
      listCollection: guarded('sources:provide', async (providerId, collectionId, request) => (
        registrations.sources.get(providerId)?.handlers.listCollection?.({ collectionId, page: 1, pageSize: 20, ...(request || {}) })
      )),
      resolve: guarded('sources:provide', async (providerId, providerTrackId) => registrations.sources.get(providerId)?.handlers.resolve({ providerTrackId })),
    },
    home: {
      getSettings: guarded('home:read', async () => workflows.run('home:getSettings', {})),
      updateSettings: guarded('home:control', async patch => workflows.run('home:updateSettings', patch)),
      getHistory: guarded('home:read', async query => workflows.run('home:getHistory', query || {})),
      getHistorySummary: guarded('home:read', async query => workflows.run('home:getHistorySummary', query || {})),
      getStats: guarded('home:read', async query => workflows.run('home:getStats', query || {})),
    },
    lyrics: { registerProvider: guarded('lyrics:provide', (id, definition, handler) => registrations.lyrics.set(id, { definition, handler })),
      listProviders: guarded('lyrics:read', async () => Array.from(registrations.lyrics, ([id, entry]) => ({
        key: id, id, title: entry.definition.title, pluginId: packageValue.manifest.id, pluginName: packageValue.manifest.name, ready: true }))),
      searchProvider: guarded('lyrics:search', async (key, trackId, query) => {
        const entry = registrations.lyrics.get(key);
        if (!entry) throw Error('lyrics-provider-not-ready');
        return (await entry.handler({ track: { id: trackId ?? fixtureTrack.id, title: fixtureTrack.title,
          artist: fixtureTrack.artist, album: fixtureTrack.album, durationSeconds: fixtureTrack.durationSeconds }, query },
          { providerId: key, signal: new AbortController().signal })).candidates.map((candidate, index) => ({ ...candidate, id: `${key}:${index}` }));
      }),
      getStoredCandidates: guarded('lyrics:read', async () => []),
      searchCandidates: guarded('lyrics:search', async () => []),
      previewCandidate: guarded('lyrics:read', async (trackId, candidateId) => workflows.run('lyrics:previewCandidate', { trackId, candidateId })),
      applyCandidate: guarded('lyrics:write', async (trackId, candidateId) => workflows.run('lyrics:applyCandidate', { trackId, candidateId })),
      applyCustom: guarded('lyrics:write', async (trackId, text, format) => workflows.run('lyrics:applyCustom', { trackId, text, format })),
      setOffset: guarded('lyrics:write', async (trackId, offsetMs) => workflows.run('lyrics:setOffset', { trackId, offsetMs })),
      markInstrumental: guarded('lyrics:write', async trackId => workflows.run('lyrics:markInstrumental', { trackId })),
      clearCache: guarded('lyrics:write', async trackId => workflows.run('lyrics:clearCache', { trackId })),
      get: guarded('lyrics:read', async () => ({
        kind: 'synced',
        title: fixtureTrack.title,
        artist: fixtureTrack.artist,
        album: fixtureTrack.album,
        durationSeconds: fixtureTrack.durationSeconds,
        offsetMs: 0,
        provider: 'local',
        lines: [{ timeMs: 0, text: fixtureTrack.title, translation: null, romanization: null, kana: null, words: [] }],
        plainText: fixtureTrack.title,
        syncedText: `[00:00.00]${fixtureTrack.title}`,
      })),
    },
    metadata: { registerProvider: (id, definition, handler) => registrations.metadata.set(id, { definition, handler }) },
    covers: { registerProvider: (id, definition, handler) => registrations.covers.set(id, { definition, handler }) },
    window: {
      isMaximized: guarded('window:control', async () => windowState.maximized),
      isFullscreen: guarded('window:control', async () => windowState.fullscreen),
      onMaximizedChange: handler => onWindowEvent('window:maximized-changed', handler),
      onFullscreenChange: handler => onWindowEvent('window:fullscreen-changed', handler),
      minimize: guarded('window:control', async () => null),
      toggleMaximize: guarded('window:control', async () => toggleWindow('maximized')),
      toggleFullscreen: guarded('window:control', async () => toggleWindow('fullscreen')),
      close: guarded('window:control', async () => null),
      getDesktopWall: guarded('window:desktop-wall', async () => ({ supported: false, enabled: false })),
      setDesktopWall: guarded('window:desktop-wall', async () => { throw new Error('command-unavailable'); }),
    },
    mediaSession: {
      setEnabled: guarded('media-session:control', async enabled => workflows.run('media-session:setEnabled', { enabled })),
      setLyricsEnabled: guarded('media-session:control', async enabled => workflows.run('media-session:setLyricsEnabled', { enabled })),
      getStatus: guarded('media-session:control', async () => workflows.run('media-session:getStatus', {})),
      setEnabledActions: guarded('media-session:control', async actions => workflows.run('media-session:setEnabledActions', actions)),
      setPlaybackModes: guarded('media-session:control', async modes => workflows.run('media-session:setPlaybackModes', modes)),
      restart: guarded('media-session:control', async () => workflows.run('media-session:restart', {})),
      onCommand: (handler) => {
        if (typeof handler !== 'function') throw new Error('invalid-payload');
        requireCapability('media-session:control');
        return () => undefined;
      },
    },
    companion: {
      desktopLyrics: {
        getState: guarded('companion:control', async () => ({ visible: false, locked: false, enabled: false })),
        show: guarded('companion:control', async () => ({ visible: true, locked: false, enabled: true })),
        hide: guarded('companion:control', async () => ({ visible: false, locked: false, enabled: true })),
        setLocked: guarded('companion:control', async () => ({ visible: true, locked: true, enabled: true })),
        reset: guarded('companion:control', async () => ({ visible: true, locked: false, enabled: true })),
      },
      miniPlayer: {
        getState: guarded('companion:control', async () => ({ visible: false, locked: false, layout: 'compact', queueOpen: false, dockEdge: null, enabled: false })),
        show: guarded('companion:control', async () => ({ visible: true, locked: false, layout: 'compact', queueOpen: false, dockEdge: null, enabled: true })),
        hide: guarded('companion:control', async () => ({ visible: false, locked: false, layout: 'compact', queueOpen: false, dockEdge: null, enabled: true })),
        setLocked: guarded('companion:control', async () => ({ visible: true, locked: true, layout: 'compact', queueOpen: false, dockEdge: null, enabled: true })),
        setLayout: guarded('companion:control', async (layout) => ({ visible: true, locked: false, layout, queueOpen: layout === 'queue', dockEdge: null, enabled: true })),
        reset: guarded('companion:control', async () => ({ visible: true, locked: false, layout: 'compact', queueOpen: false, dockEdge: null, enabled: true })),
      },
      pet: {
        getState: guarded('companion:control', async () => ({ visible: false, enabled: false, scalePercent: 100 })),
        show: guarded('companion:control', async () => ({ visible: true, enabled: true, scalePercent: 100 })),
        hide: guarded('companion:control', async () => ({ visible: false, enabled: true, scalePercent: 100 })),
        setScale: guarded('companion:control', async (scalePercent) => ({ visible: true, enabled: true, scalePercent })),
        reset: guarded('companion:control', async () => ({ visible: true, enabled: true, scalePercent: 100 })),
      },
      taskbar: {
        getState: guarded('companion:control', async () => ({ visible: false, supported: true, unsupportedReason: null, edge: null, enabled: false })),
        show: guarded('companion:control', async () => ({ visible: true, supported: true, unsupportedReason: null, edge: 'bottom', enabled: true })),
        hide: guarded('companion:control', async () => ({ visible: false, supported: true, unsupportedReason: null, edge: null, enabled: true })),
        setEnabled: guarded('companion:control', async (enabled) => ({ visible: enabled, supported: true, unsupportedReason: null, edge: null, enabled })),
      },
      onState: (handler) => {
        if (typeof handler !== 'function') throw new Error('invalid-payload');
        requireCapability('companion:control');
        return () => undefined;
      },
    },
    sleepTimer: {
      getStatus: guarded('sleep-timer:control', async () => ({ isActive: false, remainingMs: 0, action: 'pause', fadeOutEnabled: false, durationMinutes: 0 })),
      start: guarded('sleep-timer:control', async () => ({ isActive: true, remainingMs: 60000, action: 'pause', fadeOutEnabled: true, durationMinutes: 1 })),
      cancel: guarded('sleep-timer:control', async () => ({ isActive: false, remainingMs: 0, action: 'pause', fadeOutEnabled: false, durationMinutes: 0 })),
      onTick: (handler) => {
        if (typeof handler !== 'function') throw new Error('invalid-payload');
        requireCapability('sleep-timer:control');
        return () => undefined;
      },
    },
    presence: {
      steam: {
        getStatus: guarded('presence:control', async () => workflows.run('presence:steam:getStatus', {})),
        getSettings: guarded('presence:control', async () => workflows.run('presence:steam:getSettings', {})),
        updateSettings: guarded('presence:control', async patch => workflows.run('presence:steam:updateSettings', patch)),
        getOptions: guarded('presence:control', async () => workflows.run('presence:steam:getOptions', {})),
        setEnabled: guarded('presence:control', async enabled => workflows.run('presence:steam:setEnabled', { enabled })),
        setMode: guarded('presence:control', async mode => workflows.run('presence:steam:setMode', { mode })),
        setTemporaryStatus: guarded('presence:control', async status => workflows.run('presence:steam:setTemporaryStatus', status || {})),
        clearTemporaryStatus: guarded('presence:control', async () => workflows.run('presence:steam:clearTemporaryStatus', {})),
      },
      discord: {
        getStatus: guarded('presence:control', async () => ({ enabled: false, available: true, connected: false })),
        setEnabled: guarded('presence:control', async (enabled) => ({ enabled, available: true, connected: false })),
      },
      lastfm: {
        getStatus: guarded('presence:control', async () => ({ enabled: false, scrobbleEnabled: false, nowPlayingEnabled: false, connected: false, authPending: false })),
        setEnabled: guarded('presence:control', async (enabled) => ({ enabled, scrobbleEnabled: false, nowPlayingEnabled: false, connected: false, authPending: false })),
        setNowPlayingEnabled: guarded('presence:control', async (enabled) => ({ enabled: true, scrobbleEnabled: false, nowPlayingEnabled: enabled, connected: true, authPending: false })),
        setScrobbleEnabled: guarded('presence:control', async (enabled) => ({ enabled: true, scrobbleEnabled: enabled, nowPlayingEnabled: false, connected: true, authPending: false })),
        disconnect: guarded('presence:control', async () => ({ enabled: false, scrobbleEnabled: false, nowPlayingEnabled: false, connected: false, authPending: false })),
      },
      listenBrainz: {
        getStatus: guarded('presence:control', async () => ({ enabled: false, nowPlayingEnabled: false, scrobbleEnabled: false, phase: 'disabled', connected: false, tokenConfigured: false })),
        setFlags: guarded('presence:control', async () => ({ enabled: true, nowPlayingEnabled: true, scrobbleEnabled: false, phase: 'ready', connected: true, tokenConfigured: true })),
        disconnect: guarded('presence:control', async () => ({ enabled: false, nowPlayingEnabled: false, scrobbleEnabled: false, phase: 'disabled', connected: false, tokenConfigured: false })),
      },
    },
    bridge: {
      stage: {
        getStatus: guarded('bridge:control', async () => ({ running: false, obsEnabled: false, apiEnabled: false, eventClients: 0 })),
        setEnabled: guarded('bridge:control', async () => ({ running: true, obsEnabled: true, apiEnabled: false, eventClients: 0 })),
      },
      obsBrowser: {
        getStatus: guarded('bridge:control', async () => ({ enabled: false, fontSize: 56, translation: true, romanization: false, showTrack: true, background: 'transparent', offsetMs: 0, clients: 0 })),
        update: guarded('bridge:control', async () => ({ enabled: true, fontSize: 56, translation: true, romanization: false, showTrack: true, background: 'transparent', offsetMs: 0, clients: 0 })),
      },
      obsWebSocket: {
        getStatus: guarded('bridge:control', async () => ({ enabled: false, phase: 'disabled', connected: false, passwordConfigured: false })),
        setEnabled: guarded('bridge:control', async (enabled) => ({ enabled, phase: 'disabled', connected: false, passwordConfigured: false })),
      },
      mqtt: {
        getStatus: guarded('bridge:control', async () => ({ enabled: false, phase: 'disabled', connected: false, passwordConfigured: false, homeAssistantDiscoveryEnabled: false })),
        setEnabled: guarded('bridge:control', async (enabled) => ({ enabled, phase: 'disabled', connected: false, passwordConfigured: false, homeAssistantDiscoveryEnabled: false })),
      },
      hqPlayer: {
        getStatus: guarded('bridge:control', async () => ({ enabled: false, state: 'disabled', mediaServerEnabled: false, defaultPlaybackBackend: 'ask' })),
        setEnabled: guarded('bridge:control', async (enabled) => ({ enabled, state: 'checking', mediaServerEnabled: false, defaultPlaybackBackend: 'ask' })),
        sendLastControl: guarded('bridge:control', async () => ({ state: 'skipped', reason: 'control_plan_missing', command: 'none' })),
      },
      echoLink: {
        getStatus: guarded('bridge:control', async () => ({ enabled: false, running: false, pairingActive: false, clientCount: 0 })),
        setEnabled: guarded('bridge:control', async (enabled) => ({ enabled, running: enabled, pairingActive: false, clientCount: 0 })),
      },
    },
    navigation: { open: guarded('navigation', async (routeId, options) => {
      if (typeof routeId !== 'string' || !/^[a-z][a-z0-9:._%+-]*$/i.test(routeId)
        || options?.dismissRuntime !== undefined && typeof options.dismissRuntime !== 'boolean') throw Error('invalid-payload');
      parentRouteId = routeId; return null;
    }) },
    playback: {
      getStatus: guarded('playback:read', async () => ({ ...mediaState.playback, playbackRate })),
      getRate: guarded('playback:read', async () => playbackRate),
      setRate: guarded('playback:control', async rate => {
        if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0.5 || rate > 2) throw new Error('invalid-payload');
        playbackRate = rate; return rate;
      }),
      play: guarded('playback:control', async () => { mediaState.playback.state = 'playing'; return null; }),
      pause: guarded('playback:control', async () => { mediaState.playback.state = 'paused'; return null; }),
      stop: guarded('playback:control', async () => { mediaState.playback.state = 'stopped'; return null; }),
      seek: guarded('playback:control', async seconds => { mediaState.playback.positionSeconds = seconds; return null; }),
      previous: guarded('playback:control', async () => queuePreview.run('playback:previous')),
      next: guarded('playback:control', async () => queuePreview.run('playback:next')),
      nextAt: guarded('playback:control', async () => { throw new Error('mock-native-clock-unavailable'); }),
      setVolume: guarded('playback:control', async () => null),
      setShuffle: guarded('playback:control', async () => null),
      toggleShuffle: guarded('playback:control', async () => null),
      setRepeat: guarded('playback:control', async () => null),
      cycleRepeat: guarded('playback:control', async () => null),
      playUrl: guarded('sources:direct', async (url, metadata) => queuePreview.run('playback:playUrl', { ...(metadata || {}), url })),
    },
    audio: {
      output: {
        getStatus: guarded('audio:output-read', async () => workflows.run('audio:output:getStatus', {})),
        listDevices: guarded('audio:output-read', async () => workflows.run('audio:output:listDevices', {})),
        refreshDevices: guarded('audio:output-read', async () => workflows.run('audio:output:refreshDevices', {})),
        getDeviceVolume: guarded('audio:output-read', async () => workflows.run('audio:output:getDeviceVolume', {})),
        setOutput: guarded('audio:output-write', async settings => workflows.run('audio:output:setOutput', { settings })),
        setDeviceVolume: guarded('audio:output-write', async request => workflows.run('audio:output:setDeviceVolume', { request })),
        setVolumeControlMode: guarded('audio:output-write', async mode => workflows.run('audio:output:setVolumeControlMode', { mode })),
      },
      getSpectrum: guarded('audio:spectrum', async () => ({ bands: [0.08, 0.2, 0.46, 0.72], energy: 0.48, transient: 0.2, state: 'playing' })),
      getVisualization: guarded('audio:spectrum', async (options) => createVisualizationFixture(options, fixtureTrack.id)),
      getSpectrogram: guarded('audio:spectrum', async () => { throw new Error('spectrogram-local-track-required'); }),
      dsp: {
        getModule: guarded('audio:dsp-read', async (moduleId) => structuredClone(dspModules[moduleId])),
        setModule: guarded('audio:dsp-write', async (moduleId, state) => {
          if (!dspModules[moduleId]) throw new Error('invalid-payload');
          dspModules[moduleId] = { ...dspModules[moduleId], ...(state || {}) };
          return structuredClone(dspModules[moduleId]);
        }),
        getRackOrder: guarded('audio:dsp-read', async () => [...dspRackOrder]),
        setRackOrder: guarded('audio:dsp-write', async (order) => {
          dspRackOrder = [...order];
          return [...dspRackOrder];
        }),
      },
      transition: {
        registerProvider: guarded('audio:transition', async (_id, _meta, provider) => {
          if (!provider || ['windowFrames', 'prepare', 'render', 'rewritesSamples'].some((name) => typeof provider[name] !== 'function')) {
            throw new Error('transition-provider-invalid');
          }
          return async () => undefined;
        }),
      },
      offline: {
        // Fixtures exercise declarations; native timing is intentionally unavailable here.
        open: guarded('audio:offline-read', async (options) => ({
          sessionId: 'fixture-offline-session',
          trackId: options?.trackId ?? fixtureTrack.id,
          title: fixtureTrack.title,
          durationSeconds: fixtureTrack.durationSeconds,
          format: { sampleRate: options?.sampleRate ?? 22050, channels: options?.channels ?? 1, sampleFormat: options?.sampleFormat ?? 's16le' },
        })),
        read: guarded('audio:offline-read', async (sessionId) => ({
          sessionId,
          dataBase64: 'AAAAAA==',
          byteLength: 4,
          frames: 2,
          eof: true,
        })),
        close: guarded('audio:offline-read', async () => null),
        seek: guarded('audio:offline-read', async () => null),
      },
    },
    library: createWorkshopLibraryClient(async (action, payload) => {
      const definition = pluginApiContract.actions[action];
      if (definition.permission) requireCapability(definition.permission);
      if (action === 'library:playQuery') requireCapability('library:read');
      return libraryPreview.run(action, payload);
    }, (name, handler) => echo.events.on(name, handler)),
    queue: {
      get: guarded('queue:read', async () => queuePreview.run('queue:get')),
      getPage: guarded('queue:read', async query => queuePreview.run('queue:getPage', query)),
      playTrack: guarded('queue:control', async (trackId, queueTrackIds) => queuePreview.run('queue:playTrack', { trackId, queueTrackIds })),
      enqueueTrack: guarded('queue:control', async trackId => queuePreview.run('queue:enqueueTrack', { trackId })),
      playItem: guarded('queue:control', async queueId => queuePreview.run('queue:playItem', { queueId })),
      moveItem: guarded('queue:control', async (queueId, toIndex) => queuePreview.run('queue:moveItem', { queueId, toIndex })),
      reorder: guarded('queue:control', async queueIds => queuePreview.run('queue:reorder', { queueIds })),
      removeItem: guarded('queue:control', async queueId => queuePreview.run('queue:removeItem', { queueId })),
      clear: guarded('queue:control', async () => queuePreview.run('queue:clear')),
      playAlbum: guarded('queue:control', async id => {
        if (id !== fixtureAlbum.id) throw Error('invalid-payload');
        return playFixtureCollection(fixtureTracks.filter(track => track.album === fixtureAlbum.title));
      }),
      playArtist: guarded('queue:control', async id => {
        if (id !== fixtureArtist.id) throw Error('invalid-payload');
        return playFixtureCollection(fixtureTracks.filter(track => track.artist === fixtureArtist.name));
      }),
      playGenre: guarded('queue:control', async id => {
        if (id !== fixtureGenre.id) throw Error('invalid-payload');
        return playFixtureCollection(fixtureTracks.filter(track => track.genre === fixtureGenre.name));
      }),
      playPlaylist: guarded('queue:control', async id => {
        if (id !== fixturePlaylist.id) throw Error('playlist-unavailable');
        return playFixtureCollection(fixtureTracks);
      }),
      playLiked: guarded('queue:control', async () => playFixtureCollection([fixtureTrack])),
    },
    events: {
      on: (eventName, handler) => {
        const capability = eventCapabilities[eventName];
        if (capability) requireCapability(capability);
        if (libraryEvents.has(eventName)) {
          if (typeof handler !== 'function') throw Error('invalid-event-handler');
          const handlers = libraryEvents.get(eventName); handlers.add(handler); return () => handlers.delete(handler);
        }
        if (windowEvents.has(eventName)) return onWindowEvent(eventName, handler);
        if (eventName === 'queue:changed') {
          if (typeof handler !== 'function') throw Error('invalid-event-handler');
          queueEvents.add(handler); return () => queueEvents.delete(handler);
        }
        return () => undefined;
      },
    },
    settings: {
      get: guarded('fs:plugin', async () => ({})),
      set: guarded('fs:plugin', async () => ({})),
      onChanged: guarded('fs:plugin', () => () => undefined),
    },
    storage: {
      get: guarded('fs:plugin', async (key) => storage.get(validStorageKey(key)) ?? null),
      set: guarded('fs:plugin', async (key, value) => { storage.set(validStorageKey(key), value); return null; }),
      remove: guarded('fs:plugin', async (key) => { storage.delete(validStorageKey(key)); return null; }),
    },
    files: {
      export: guarded('fs:export', async (options) => ({
        saved: true,
        byteLength: Buffer.from(String(options?.dataBase64 ?? ''), 'base64').byteLength,
      })),
    },
    trusted: {
      invoke: guarded('system:full', async () => {
        throw new Error('The SDK mock host does not execute full-trust code; test trustedEntry in ECHO.');
      }),
    },
    network: {
      cancel: guarded('network:request', async () => null),
      request: guarded('network:request', async (options) => {
        const url = assertWorkshopMockUrl(options?.url, declaredNetworkHosts).toString();
        const body = new URL(url).hostname === 'api.amll.dev'
          ? '{"status":200,"data":{"items":[]}}' : '{"tracks":[]}';
        return { url, status: 200, statusText: 'Fixture', ok: true, headers: {}, body };
      }),
      get: guarded('network:request', async (value) => {
        const url = assertWorkshopMockUrl(value, declaredNetworkHosts).toString();
        return { url, status: 200, statusText: 'Fixture', ok: true, headers: {}, body: '{"tracks":[]}' };
      }),
      post: guarded('network:request', async (value) => {
        const url = assertWorkshopMockUrl(value, declaredNetworkHosts).toString();
        return { url, status: 200, statusText: 'Fixture', ok: true, headers: {}, body: '{}' };
      }),
    },
    ui: {
      getParentPage: async () => ({ routeId: parentRouteId, title: null, pluginPage: null, selection: [] }),
      onDispose: () => () => undefined,
      notify: async (message) => { registrations.notifications.push(String(message)); return null; },
      getContext: async () => ({
        surface: hostState.uiContext?.surface === 'panel' ? 'panel' : 'runtime',
        panel: hostState.uiContext?.surface === 'panel' ? { id: 'main', placement: 'main' } : null,
        visible: hostState.uiContext?.surface === 'panel' && hostState.uiContext?.visible !== false,
        locale: hostState.uiContext?.locale ?? 'en-US',
        direction: hostState.uiContext?.direction === 'rtl' ? 'rtl' : 'ltr',
        colorScheme: hostState.uiContext?.colorScheme === 'light' ? 'light' : 'dark',
        reducedMotion: hostState.uiContext?.reducedMotion === true,
        viewport: { width: 960, height: 640 },
        appearance: {
          accent: '#5cc8dc', accentText: '#08111f', panel: '#142234', text: '#c8dce8',
          heading: '#f4fbff', muted: '#8eabc0', appBg: '#08111f', border: '#2a3d52', player: '#142234',
        },
        presentation: hostState.uiContext?.surface === 'panel' ? { ...registrations.panel.presentation } : null,
      }),
      setPanelPresentation: async (value = {}) => {
        if (hostState.uiContext?.surface !== 'panel') throw new Error('panel-context-required');
        const allowedSizes = new Set(['compact', 'comfortable', 'wide', 'full', 'immersive']);
        const allowedAttention = new Set(['none', 'info', 'warning']);
        const allowedKeys = new Set(['title', 'badge', 'dirty', 'attention', 'size']);
        if (!value || typeof value !== 'object' || Array.isArray(value)
          || Object.keys(value).some((key) => !allowedKeys.has(key))
          || (value.title !== undefined && (typeof value.title !== 'string' || !value.title.trim()))
          || (value.badge !== undefined && value.badge !== null && typeof value.badge !== 'string')
          || (value.dirty !== undefined && typeof value.dirty !== 'boolean')) throw new Error('invalid-payload');
        if (value.size !== undefined && !allowedSizes.has(value.size)) throw new Error('invalid-payload');
        if (value.attention !== undefined && !allowedAttention.has(value.attention)) throw new Error('invalid-payload');
        registrations.panel.presentation = {
          ...registrations.panel.presentation,
          ...(typeof value.title === 'string' && value.title.trim() ? { title: value.title.trim().slice(0, 80) } : {}),
          ...(value.badge === null || typeof value.badge === 'string'
            ? { badge: typeof value.badge === 'string' && value.badge.trim() ? value.badge.trim().slice(0, 16) : null }
            : {}),
          ...(typeof value.dirty === 'boolean' ? { dirty: value.dirty } : {}),
          ...(typeof value.attention === 'string' ? { attention: value.attention } : {}),
          ...(typeof value.size === 'string' ? { size: value.size } : {}),
        };
        return { ...registrations.panel.presentation };
      },
      openPanel: async (panelId) => {
        const declared = Array.isArray(packageValue?.manifest?.contributes?.panels)
          ? packageValue.manifest.contributes.panels
            .map((panel) => panel && typeof panel.id === 'string' ? panel.id : '')
            .filter(Boolean)
          : [];
        const requested = typeof panelId === 'string' ? panelId.trim() : '';
        if (panelId !== undefined && panelId !== null && panelId !== '' && !requested) throw new Error('invalid-payload');
        const id = requested || declared[0] || '';
        if (!id || (declared.length > 0 && !declared.includes(id))) throw new Error('panel-undeclared');
        if (!requested && declared.length > 1) return null;
        const title = Array.isArray(packageValue?.manifest?.contributes?.panels)
          ? (packageValue.manifest.contributes.panels.find((panel) => panel && panel.id === id)?.title ?? id)
          : id;
        registrations.panel.opened.push({ id, title });
        return { id, title };
      },
      closePanel: async () => {
        if (hostState.uiContext?.surface !== 'panel') throw new Error('panel-context-required');
        registrations.panel.closeCount += 1;
        return null;
      },
      onContextChanged: () => () => undefined,
    },
  };
  const providerEvents = new Map();
  const providerPreview = createProviderPreview({ emit: (name, value) => { for (const handler of providerEvents.get(name) ?? []) handler(value); } });
  const providerClient = createWorkshopProviderClient((action, payload) => {
    requireCapability(pluginApiContract.actions[action].permission); return providerPreview.run(action, payload);
  }, (name, handler) => echo.events.on(name, handler));
  for (const kind of ['lyrics', 'metadata', 'covers']) Object.assign(echo[kind], providerClient[kind]);
  const authoringEvents = new Map();
  const authoringEventNames = new Set(['lyrics:display-preferences-changed', 'lyrics:changed', 'artwork:palette-changed', 'ui:layout-changed', 'ui:render-budget-changed']);
  const baseOn = echo.events.on;
  echo.events.on = (name, handler) => {
    if (['audio:dsp-changed', 'home:changed', 'presence:changed', 'bridge:changed', 'media-session:changed'].includes(name)) {
      requireCapability(pluginApiContract.events[name]);
      if (typeof handler !== 'function') throw Error('invalid-event-handler');
      const handlers = controlEvents.get(name) ?? new Set(); handlers.add(handler); controlEvents.set(name, handlers);
      return () => handlers.delete(handler);
    }
    if (name.endsWith(':providers-changed') || name.endsWith(':candidates-changed')) {
      requireCapability(pluginApiContract.events[name]);
      if (typeof handler !== 'function') throw Error('invalid-event-handler');
      const handlers = providerEvents.get(name) ?? new Set(); handlers.add(handler); providerEvents.set(name, handlers);
      return () => handlers.delete(handler);
    }
    if (!authoringEventNames.has(name)) return baseOn(name, handler);
    const permission = pluginApiContract.events[name]; if (permission) requireCapability(permission);
    if (typeof handler !== 'function') throw Error('invalid-event-handler');
    const handlers = authoringEvents.get(name) ?? new Set(); handlers.add(handler); authoringEvents.set(name, handlers);
    return () => handlers.delete(handler);
  };
  for (const [target, name] of [[echo.audio.dsp, 'audio:dsp-changed'], [echo.home, 'home:changed'], [echo.presence, 'presence:changed'],
    [echo.bridge, 'bridge:changed'], [echo.mediaSession, 'media-session:changed']]) target.onChanged = handler => echo.events.on(name, handler);
  echo.host.onChanged = handler => {
    const stops = Object.entries({ dsp: 'audio:dsp-changed', home: 'home:changed', presence: 'presence:changed', bridge: 'bridge:changed', 'media-session': 'media-session:changed' })
      .filter(([, name]) => permissions.has(pluginApiContract.events[name])).map(([domain, name]) => echo.events.on(name, () => handler({ domain })));
    return () => stops.forEach(stop => stop());
  };
  const authoring = createLyricsAuthoringPreview({ context: () => ({ visible: true, reducedMotion: false,
    viewport: { width: 1200, height: 800 }, ...hostState.uiContext }),
    state: { playback: { currentTrackId: fixtureTrack.id } }, lyrics: { kind: 'plain', offsetMs: 0, lines: [], plainText: 'Mock lyrics' },
    emit: (name, value) => { for (const handler of authoringEvents.get(name) ?? []) handler(value); } });
  const observeAuthoring = async (action, event, handler) => {
    const stop = echo.events.on(event, handler); authoring.run(action, { enabled: true });
    return async () => { stop(); authoring.run(action, { enabled: false }); };
  };
  Object.assign(echo.lyrics, { createTimeline: createLyricsTimeline,
    getDisplayPreferences: guarded('lyrics:read', async () => authoring.run('lyrics:getDisplayPreferences')),
    onDisplayPreferencesChanged: guarded('lyrics:read', handler => observeAuthoring('lyrics:watchDisplayPreferences', 'lyrics:display-preferences-changed', handler)),
    setCurrentOffset: guarded('lyrics:write', async offsetMs => authoring.run('lyrics:setCurrentOffset', { offsetMs })) });
  echo.artwork = {
    getPalette: guarded('playback:read', async () => authoring.run('artwork:getPalette')),
    onPaletteChanged: guarded('playback:read', handler => observeAuthoring('artwork:watchPalette', 'artwork:palette-changed', handler)),
  };
  Object.assign(echo.ui, {
    getLayout: async () => authoring.run('ui:getLayout'), onLayoutChanged: handler => observeAuthoring('ui:watchLayout', 'ui:layout-changed', handler),
    getRenderBudget: async () => authoring.run('ui:getRenderBudget'),
    onRenderBudgetChanged: handler => observeAuthoring('ui:watchRenderBudget', 'ui:render-budget-changed', handler),
  });
  return { echo, registrations, permissions: [...permissions] };
};

export const testPluginPackage = async (packageValue, manifest = {}) => {
  const entry = packageValue.files.find((file) => file.path === packageValue.manifest.entry);
  if (!entry) throw new Error('Mock host could not find the plug-in entry file');
  const networkHosts = validateWorkshopNetworkDeclaration(manifest, packageValue);
  const { echo, registrations, permissions } = createMockEcho(packageValue, networkHosts);
  const logs = [];
  vm.runInNewContext(entry.content, {
    echo,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    atob,
    btoa,
    AbortController,
    DOMException,
    crypto: globalThis.crypto,
    console: { log: (...values) => logs.push(values.map(String).join(' ')), warn: (...values) => logs.push(values.map(String).join(' ')) },
    setTimeout,
    clearTimeout,
  }, { filename: entry.path, timeout: 1_000 });

  const checks = [];
  const run = async (kind, id, task) => {
    try {
      await withTimeout(`${kind}:${id}`, task);
      checks.push({ kind, id, ok: true });
    } catch (error) {
      checks.push({ kind, id, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };
  for (const [id, value] of registrations.commands) await run('command', id, () => value.handler(fixtureTrack));
  for (const [id, value] of registrations.agents) await run('agent', id, () => value.handler('summarize the fixture library'));
  for (const [id, value] of registrations.sources) {
    await run('source-search', id, () => value.handlers.search({ query: '', page: 1, pageSize: 20 }));
    if (typeof value.handlers.browse === 'function') await run('source-browse', id, () => value.handlers.browse({ page: 1, pageSize: 20 }));
    if (typeof value.handlers.listCollection === 'function') {
      await run('source-collection', id, () => value.handlers.listCollection({ collectionId: 'night-desk', page: 1, pageSize: 20 }));
    }
    if (typeof value.handlers.resolve === 'function') await run('source-resolve', id, () => value.handlers.resolve({ providerTrackId: 'harbor' }));
  }
  for (const [id, value] of registrations.lyrics) await run('lyrics', id, () => value.handler({ track: fixtureTrack, query: fixtureTrack.title }));
  for (const [id, value] of registrations.metadata) await run('metadata', id, () => value.handler({ track: fixtureTrack }));
  for (const [id, value] of registrations.covers) await run('covers', id, () => value.handler({ track: fixtureTrack }));

  return {
    ok: checks.every((check) => check.ok),
    kind: 'plugin-package',
    registrations: Object.fromEntries(['commands', 'agents', 'sources', 'lyrics', 'metadata', 'covers'].map((key) => [key, registrations[key].size])),
    permissions,
    checks,
    notifications: registrations.notifications,
    logs,
  };
};

const pushCheck = (checks, id, ok, error) => {
  checks.push({ kind: 'theme', id, ok, ...(ok ? {} : { error }) });
};

export const testThemePackage = async (contentRoot, manifest, entry) => {
  const checks = [];
  pushCheck(checks, 'header', entry?.type === 'echo-workshop-theme-preset', 'theme.json must use echo-workshop-theme-preset');
  pushCheck(checks, 'base-preset', !forbiddenThemeBasePresets.includes(entry?.basePreset), 'Host-owned presets cannot be used as basePreset');
  pushCheck(checks, 'tones', Boolean(entry?.progressBar || entry?.light || entry?.dark || entry?.runtime), 'A runtime, progressBar decoration or light/dark tone is required');

  if (typeof entry?.stylesheet === 'string' && entry.stylesheet.trim()) {
    try {
      const css = await readFile(resolve(contentRoot, ...entry.stylesheet.split('/')), 'utf8');
      pushCheck(checks, 'stylesheet-file', css.trim().length > 0, 'stylesheet file is empty');
      pushCheck(checks, 'stylesheet-safe', !/@import|javascript:|<script/iu.test(css), 'stylesheet uses a blocked construct');
      pushCheck(
        checks,
        'stylesheet-scope',
        css.includes(`data-workshop-theme-pack="${manifest.id}"`),
        `Scope CSS to html[data-workshop-theme-pack="${manifest.id}"]`,
      );
    } catch {
      pushCheck(checks, 'stylesheet-file', false, `Missing stylesheet: ${entry.stylesheet}`);
    }
  }

  if (entry?.runtime && typeof entry.runtime === 'object') {
    const allowed = new Set(themeUiCapabilities);
    const capabilities = Array.isArray(entry.runtime.capabilities) ? entry.runtime.capabilities : [];
    pushCheck(
      checks,
      'runtime-capabilities',
      capabilities.every((capability) => allowed.has(capability)) && new Set(capabilities).size === capabilities.length,
      'runtime.capabilities must stay on the host whitelist',
    );
    try {
      const html = await readFile(resolve(contentRoot, ...String(entry.runtime.entry).split('/')), 'utf8');
      pushCheck(checks, 'runtime-html', html.includes('<html') && /<script\s+src=/iu.test(html), 'runtime HTML must load an external script');
      pushCheck(checks, 'runtime-no-inline-script', !/<script(?![^>]*\bsrc=)/iu.test(html), 'Inline scripts are blocked by the production host');
    } catch {
      pushCheck(checks, 'runtime-html', false, `Missing runtime entry: ${entry.runtime.entry}`);
    }
  }

  return {
    ok: checks.every((check) => check.ok),
    kind: 'theme',
    fixtures: ['schema', 'empty-library', 'missing-lyrics', 'playback-ended', 'provider-offline'],
    checks,
  };
};

export const testLyricsStyle = (entry) => {
  const checks = [];
  const settings = entry?.settings && typeof entry.settings === 'object' ? entry.settings : {};
  const scene = entry?.scene && typeof entry.scene === 'object' ? entry.scene : null;
  pushCheck(checks, 'header', entry?.type === 'echo-workshop-lyrics-style', 'the lyrics entry must use echo-workshop-lyrics-style');
  pushCheck(checks, 'not-empty', Boolean(scene) || Object.keys(settings).length > 0, 'settings or scene is required');
  if (settings.lyricsPageStyle) {
    pushCheck(checks, 'page-style', lyricsPageStyles.includes(settings.lyricsPageStyle), 'lyricsPageStyle is not a host layout');
  }
  if (scene) {
    const slots = collectLyricsSceneSlots(scene.root);
    const allowed = new Set(lyricsSceneSlots);
    pushCheck(checks, 'slots', slots.every((slot) => allowed.has(slot)), 'scene uses an unknown host slot');
    if (scene.afterglow) {
      const errors = validateLyricsSceneContract(scene);
      pushCheck(checks, 'afterglow-contract', errors.length === 0, errors.join('; '));
    }
    pushCheck(checks, 'lyrics-slot', Boolean(scene.afterglow) || slots.includes('lyrics') || slots.includes('current-line'), 'scene needs a lyrics or current-line slot unless Afterglow owns the layout');
    pushCheck(
      checks,
      'transport',
      scene.hostChrome?.miniPlayer !== 'hidden' || slots.includes('play-toggle'),
      'hiding the mini player requires play-toggle',
    );
  }
  return { ok: checks.every((check) => check.ok), kind: 'lyrics-style', fixtures: ['schema', 'missing-lyrics', 'playback-ended'], checks };
};

export const testVisualizerPreset = (entry) => {
  const checks = [];
  const palette = Array.isArray(entry?.palette) ? entry.palette : [];
  pushCheck(checks, 'header', entry?.type === 'echo-workshop-visualizer-preset', 'visualizer.json must use echo-workshop-visualizer-preset');
  pushCheck(checks, 'style', visualizerStyles.includes(entry?.style), 'style must be bars, wave or radial');
  pushCheck(
    checks,
    'palette',
    palette.length >= 1 && palette.length <= 8 && new Set(palette.map((value) => String(value).toLowerCase())).size === palette.length && palette.every(isHexColor),
    'palette must be 1-8 unique hex colors',
  );
  pushCheck(checks, 'bar-count', Number.isInteger(entry?.barCount) && entry.barCount >= 8 && entry.barCount <= 128, 'barCount must be 8-128');
  return { ok: checks.every((check) => check.ok), kind: 'visualizer-preset', fixtures: ['schema', 'empty-library'], checks };
};

export const testDspPreset = (entry) => {
  const checks = [];
  const bands = Array.isArray(entry?.bands) ? entry.bands : [];
  pushCheck(checks, 'header', entry?.type === 'echo-workshop-dsp-preset', 'the DSP entry must use echo-workshop-dsp-preset');
  pushCheck(checks, 'band-count', bands.length === eqFrequenciesHz.length, `DSP presets need ${eqFrequenciesHz.length} bands`);
  pushCheck(
    checks,
    'preamp',
    typeof entry?.preampDb === 'number' && entry.preampDb >= -12 && entry.preampDb <= 6,
    'preampDb must be -12 to 6',
  );
  if (entry?.audioEffect !== undefined) {
    const effect = entry.audioEffect;
    pushCheck(checks, 'audio-effect-type', effect?.type === 'bitcrusher' || effect?.type === 'chiptune', 'audioEffect.type must be bitcrusher or chiptune');
    pushCheck(checks, 'audio-effect-bit-depth', Number.isInteger(effect?.bitDepth) && effect.bitDepth >= 4 && effect.bitDepth <= 16, 'bitDepth must be 4-16');
    pushCheck(checks, 'audio-effect-sample-rate', Number.isInteger(effect?.sampleRateHz) && effect.sampleRateHz >= 1000 && effect.sampleRateHz <= 192000, 'sampleRateHz must be 1000-192000');
    pushCheck(checks, 'audio-effect-mix', typeof effect?.mix === 'number' && effect.mix >= 0 && effect.mix <= 1, 'mix must be 0-1');
    pushCheck(checks, 'audio-effect-output-gain', effect?.outputGainDb === undefined || (typeof effect.outputGainDb === 'number' && effect.outputGainDb >= -24 && effect.outputGainDb <= 6), 'outputGainDb must be -24 to 6');
    if (effect?.type === 'chiptune') {
      pushCheck(checks, 'audio-effect-pulse', typeof effect.pulseMix === 'number' && effect.pulseMix >= 0 && effect.pulseMix <= 1, 'pulseMix must be 0-1');
      pushCheck(checks, 'audio-effect-triangle', typeof effect.triangleMix === 'number' && effect.triangleMix >= 0 && effect.triangleMix <= 1, 'triangleMix must be 0-1');
      pushCheck(checks, 'audio-effect-noise', typeof effect.noiseMix === 'number' && effect.noiseMix >= 0 && effect.noiseMix <= 1, 'noiseMix must be 0-1');
      pushCheck(checks, 'audio-effect-layers', effect.pulseMix + effect.triangleMix + effect.noiseMix > 0, 'at least one chiptune layer must be audible');
      pushCheck(checks, 'audio-effect-drive', typeof effect.drive === 'number' && effect.drive >= 1 && effect.drive <= 8, 'drive must be 1-8');
    }
  }
  return { ok: checks.every((check) => check.ok), kind: 'dsp-preset', fixtures: ['schema'], checks };
};

export const testLocalePack = (entry) => {
  const checks = [];
  const builtin = new Set(['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR']);
  const strings = entry?.strings && typeof entry.strings === 'object' && !Array.isArray(entry.strings)
    ? entry.strings
    : {};
  pushCheck(checks, 'header', entry?.type === 'echo-workshop-locale-pack', 'locale.json must use echo-workshop-locale-pack');
  pushCheck(
    checks,
    'locale',
    typeof entry?.locale === 'string' && /^[a-z]{2,8}(?:-[A-Za-z0-9]{1,8}){0,3}$/u.test(entry.locale) && !builtin.has(entry.locale),
    'locale must be a new BCP-47 code, not a built-in ECHO language',
  );
  pushCheck(checks, 'strings', Object.keys(strings).length >= 1, 'locale packs need at least one translation string');
  return { ok: checks.every((check) => check.ok), kind: 'locale-pack', fixtures: ['schema'], checks };
};

export const testAnimationLibrary = (entry) => {
  const checks = [];
  const animations = Array.isArray(entry?.animations) ? entry.animations : [];
  pushCheck(checks, 'header', entry?.type === 'echo-workshop-animation-library' && entry?.schemaVersion === 1, 'animation-library.json must use the v1 animation-library header');
  pushCheck(checks, 'animation-count', animations.length >= 1 && animations.length <= 64, 'animation libraries need 1-64 exports');
  pushCheck(checks, 'keyframes', animations.every((animation) => {
    const frames = Array.isArray(animation?.keyframes) ? animation.keyframes : [];
    return frames.length >= 2 && frames.length <= 8 && frames[0]?.offset === 0 && frames.at(-1)?.offset === 1;
  }), 'every animation needs 2-8 keyframes spanning offsets 0 to 1');
  pushCheck(checks, 'definition-contract', animations.every(isAnimationPreviewDefinitionValid), 'animation exports must use only bounded host-supported fields');
  return { ok: checks.every((check) => check.ok), kind: 'animation-library', fixtures: ['schema', 'missing-dependency'], checks };
};

export const testWorkshopItem = async ({ kind, contentRoot, manifest, entry }) => {
  if (kind === 'plugin-package') return testPluginPackage(entry, manifest);
  if (kind === 'theme') return testThemePackage(contentRoot, manifest, entry);
  if (kind === 'lyrics-style') return testLyricsStyle(entry);
  if (kind === 'animation-library') return testAnimationLibrary(entry);
  if (kind === 'visualizer-preset') return testVisualizerPreset(entry);
  if (kind === 'dsp-preset') return testDspPreset(entry);
  if (kind === 'locale-pack') return testLocalePack(entry);
  if (kind === 'native-shell') return testNativeShell(entry);
  return {
    ok: true,
    kind,
    fixtures: ['schema', 'empty-library', 'missing-lyrics', 'playback-ended', 'provider-offline'],
  };
};

const mimeByExtension = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.svg': 'image/svg+xml',
  '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.lrc': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.gz': 'application/gzip', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream', '.wasm': 'application/wasm',
};

const consoleHtml = (hasPreview) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ECHO Workshop SDK Console</title>
  <style>
    :root{color-scheme:dark;--bg:#090d13;--panel:#111923;--panel2:#172230;--line:#27384a;--text:#eef7ff;--muted:#8da3b8;--accent:#67d4ff;--good:#78e6ad;--warn:#f3c66c;--bad:#ff8f9b}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 12% 0,#123047 0,transparent 34%),var(--bg);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
    button,a{font:inherit}.shell{width:min(1180px,calc(100% - 32px));margin:auto;padding:24px 0 48px}.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:42px}.brand{display:flex;align-items:center;gap:11px;font-weight:760;letter-spacing:.08em}.mark{width:28px;height:28px;display:grid;place-items:center;background:var(--accent);color:#071018;font-weight:900}.actions{display:flex;gap:10px;align-items:center}.action{display:inline-flex;align-items:center;min-height:36px;padding:0 13px;border:1px solid var(--line);color:var(--text);text-decoration:none;background:#101923;cursor:pointer}.action:hover{border-color:var(--accent)}.live{display:flex;gap:8px;align-items:center;color:var(--muted)}.live::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--good);box-shadow:0 0 14px var(--good)}
    .hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:end;margin-bottom:24px}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.hero h1{margin:0;font-size:clamp(30px,5vw,56px);line-height:1.02;letter-spacing:-.045em}.meta{margin:12px 0 0;color:var(--muted);font-size:15px}.verdict{min-width:190px;padding:18px 20px;background:var(--panel);border-left:4px solid var(--good)}.verdict.bad{border-color:var(--bad)}.verdict span{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em}.verdict strong{font-size:22px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}.metric,.panel{background:color-mix(in srgb,var(--panel) 92%,transparent);border:1px solid var(--line)}.metric{padding:17px}.metric span{display:block;color:var(--muted);font-size:12px}.metric strong{display:block;margin-top:5px;font-size:24px}.metric.good strong{color:var(--good)}.metric.warn strong{color:var(--warn)}.metric.bad strong{color:var(--bad)}
    .content{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:12px}.panel{padding:20px}.panel h2{margin:0 0 15px;font-size:15px;letter-spacing:.02em}.stack{display:grid;gap:9px}.row{display:grid;grid-template-columns:82px 1fr;gap:12px;padding:10px 0;border-top:1px solid var(--line)}.row:first-child{border-top:0}.label{color:var(--muted)}.chips{display:flex;flex-wrap:wrap;gap:7px}.chip{padding:4px 8px;background:var(--panel2);color:#cfe6f6;border:1px solid var(--line);font-size:12px}.checks{display:grid;gap:8px}.check{display:grid;grid-template-columns:auto 1fr;gap:10px;padding:10px 12px;background:var(--panel2)}.check i{width:8px;height:8px;margin-top:6px;border-radius:50%;background:var(--good)}.check.warning i{background:var(--warn)}.check.bad i{background:var(--bad)}.check small{display:block;color:var(--muted)}.empty{color:var(--muted);padding:18px 0}.foot{margin-top:16px;color:var(--muted);font-size:12px}.raw{width:100%;margin-top:14px;padding:10px 12px;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer}.raw:hover{color:var(--text);border-color:var(--accent)}pre{max-height:360px;overflow:auto;margin:10px 0 0;padding:12px;background:#080c11;color:#b8d2e5;white-space:pre-wrap}.hidden{display:none}
    @media(max-width:820px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.content{grid-template-columns:1fr}.verdict{min-width:0}}@media(max-width:480px){.shell{width:min(100% - 20px,1180px)}.topbar{align-items:flex-start}.actions{flex-direction:column;align-items:flex-end}.grid{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar"><div class="brand"><span class="mark">E</span><span>WORKSHOP SDK</span></div><div class="actions"><button class="action" id="copy-check" type="button">Copy check</button><button class="action" id="copy-fix" type="button">Copy fix</button>${hasPreview ? '<a class="action" href="/" target="_blank">Open preview</a>' : ''}<span class="live" id="live">Watching</span></div></header>
    <section class="hero"><div><p class="eyebrow">Local author console</p><h1 id="title">Loading project…</h1><p class="meta" id="meta">Reading the latest fixture report</p></div><div class="verdict" id="verdict"><span>Current gate</span><strong id="verdict-copy">Checking</strong></div></section>
    <section class="grid"><article class="metric good"><span>Passed</span><strong id="pass">0</strong></article><article class="metric warn"><span>Warnings</span><strong id="warning">0</strong></article><article class="metric bad"><span>Blockers</span><strong id="blocker">0</strong></article><article class="metric"><span>Fixture checks</span><strong id="fixture-count">0</strong></article></section>
    <section class="content"><article class="panel"><h2>Validation stream</h2><div class="checks" id="checks"></div><p class="empty" id="empty">No checks reported yet.</p></article><aside class="panel"><h2>Project contract</h2><div class="stack"><div class="row"><span class="label">Kind</span><strong id="kind">—</strong></div><div class="row"><span class="label">Version</span><strong id="version">—</strong></div><div class="row"><span class="label">Minimum</span><strong id="minimum">—</strong></div><div class="row"><span class="label">Changed</span><strong id="changed">Initial run</strong></div><div class="row"><span class="label">Permissions</span><div class="chips" id="permissions"></div></div><div class="row"><span class="label">Fixtures</span><div class="chips" id="fixtures"></div></div></div><button class="raw" id="raw-toggle" type="button">Show raw report</button><pre class="hidden" id="raw"></pre><p class="foot" id="updated">Waiting for first refresh.</p></aside></section>
  </main>
  <script>
    const byId=(id)=>document.getElementById(id);const set=(id,value)=>{byId(id).textContent=String(value??'—')};
    const chips=(id,values)=>{const node=byId(id);node.replaceChildren();for(const value of values||[]){const chip=document.createElement('span');chip.className='chip';chip.textContent=String(value);node.append(chip)}if(!node.childNodes.length){const empty=document.createElement('span');empty.className='label';empty.textContent='None';node.append(empty)}};
    const render=async()=>{try{const report=await fetch('/report.json',{cache:'no-store'}).then((response)=>response.json());const quality=report.quality||{summary:{pass:0,warning:0,blocker:0},issues:[]};const tests=report.tests||report;const checks=[...(report.error?[{ok:false,name:'project-error',detail:report.error,state:'blocker'}]:[]),...(quality.issues||[]).map((item)=>({ok:item.severity!=='blocker',name:item.code,detail:item.message,state:item.severity})),...(tests.checks||[]).map((item)=>({ok:item.ok,name:(item.kind?item.kind+':':'')+item.id,detail:item.error||'Fixture passed',state:item.ok?'pass':'blocker'}))];set('title',report.title||report.id||'Workshop project');set('meta',(report.id||'local project')+' · '+(report.files??0)+' packaged file(s)');set('kind',report.kind);set('version',report.version);set('minimum',report.minEchoVersion);set('changed',report.changedFile||'Initial run');set('pass',quality.summary?.pass??0);set('warning',quality.summary?.warning??0);set('blocker',quality.summary?.blocker??0);set('fixture-count',(tests.checks||[]).length);set('verdict-copy',report.ok?'Ready locally':'Needs attention');byId('verdict').classList.toggle('bad',!report.ok);chips('permissions',report.permissions||tests.permissions||[]);chips('fixtures',tests.fixtures||[]);const list=byId('checks');list.replaceChildren();for(const item of checks){const row=document.createElement('div');row.className='check '+(item.state==='warning'?'warning':item.ok?'pass':'bad');const dot=document.createElement('i');const copy=document.createElement('div');const name=document.createElement('strong');const detail=document.createElement('small');name.textContent=item.name;detail.textContent=item.detail;copy.append(name,detail);row.append(dot,copy);list.append(row)}byId('empty').classList.toggle('hidden',checks.length>0);byId('raw').textContent=JSON.stringify(report,null,2);set('updated','Updated '+new Date().toLocaleTimeString()+' · local fixtures only; no Steam upload.');set('live','Watching')}catch(error){set('live','Disconnected');set('verdict-copy','Console offline');byId('verdict').classList.add('bad')}};
    const copyCommand=async(button,command)=>{try{await navigator.clipboard.writeText(command);const previous=button.textContent;button.textContent='Copied';setTimeout(()=>{button.textContent=previous},1200)}catch{button.textContent=command}};byId('copy-check').addEventListener('click',(event)=>copyCommand(event.currentTarget,'npm run check'));byId('copy-fix').addEventListener('click',(event)=>copyCommand(event.currentTarget,'npm run fix'));byId('raw-toggle').addEventListener('click',()=>{const raw=byId('raw');raw.classList.toggle('hidden');byId('raw-toggle').textContent=raw.classList.contains('hidden')?'Show raw report':'Hide raw report'});new EventSource('/events').onmessage=render;render();
  </script>
</body>
</html>`;

const fixtureLyrics = [
  'Harbor lamps lean over the water',
  'Glass pier keeps the tempo',
  'Neon writes the chorus twice',
];

const renderScenePreview = (node) => {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'slot') {
    const copy = {
      cover: '▣',
      title: fixtureTrack.title,
      artist: fixtureTrack.artist,
      album: fixtureTrack.album,
      lyrics: fixtureLyrics.join('\n'),
      'current-line': fixtureLyrics[1],
      'previous-line': fixtureLyrics[0],
      'next-line': fixtureLyrics[2],
      translation: 'Local fixture translation',
      progress: '1:12 / 3:41',
      'seek-bar': '━━━━●━━',
      'time-current': '1:12',
      'time-duration': '3:41',
      spectrum: '▮▮▯▮▮',
      status: 'playing',
      'track-tech': 'FLAC 96 kHz',
      'play-toggle': '❚❚',
      'previous-track': '⏮',
      'next-track': '⏭',
      'volume-slider': '🔊',
    }[node.slot] ?? node.slot;
    return `<div class="slot" data-slot="${node.slot}">${String(copy).replaceAll('\n', '<br>')}</div>`;
  }
  if (node.type === 'group') {
    const children = Array.isArray(node.children) ? node.children.map(renderScenePreview).join('') : '';
    return `<div class="group">${children}</div>`;
  }
  if (node.type === 'text') return `<p>${String(node.text ?? '')}</p>`;
  return '';
};

const lyricsPreviewHtml = (entry) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ECHO lyrics scene preview</title>
  <style>
    body{margin:0;min-height:100vh;font:15px system-ui;background:#10131a;color:#eaf4ff}
    .note{padding:10px 16px;background:#151f2d;color:#9db3c7}
    .stage{min-height:calc(100vh - 42px);padding:28px;display:grid;gap:16px}
    .group{display:grid;gap:12px}
    .slot{padding:12px 14px;border-radius:14px;background:#182231;border:1px solid #30465a;white-space:pre-wrap}
    .slot[data-slot="cover"]{width:min(220px,40vw);aspect-ratio:1;display:grid;place-items:center;font-size:48px}
  </style>
</head>
<body>
  <p class="note">Local lyrics fixture. Slots are host-owned; this page is not the production lyrics renderer.</p>
  <div class="stage">${entry?.scene ? renderScenePreview(entry.scene.root) : '<p>Settings-only lyrics style. The host keeps its built-in layout.</p>'}</div>
</body>
</html>`;

const visualizerPreviewHtml = (entry) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ECHO visualizer preview</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1017;color:#eaf4ff;font:14px system-ui}
    .note{position:fixed;top:0;left:0;right:0;padding:8px 14px;background:#151f2d;color:#9db3c7}
    .bars,.wave,.radial{display:flex;align-items:flex-end;gap:4px;height:220px}
    .radial{align-items:center;justify-content:center;width:260px;height:260px;border-radius:50%;border:2px solid #31445b}
    i{display:block;width:8px;border-radius:99px;animation:pulse 1.2s ease-in-out infinite alternate}
    @keyframes pulse{from{opacity:.45}to{opacity:1}}
  </style>
</head>
<body>
  <p class="note">Local spectrum fixture for ${entry?.style ?? 'bars'}. Audio Core still owns the real analyzer.</p>
  <div class="${entry?.style === 'radial' ? 'radial' : entry?.style === 'wave' ? 'wave' : 'bars'}">
    ${Array.from({ length: Math.min(Number(entry?.barCount) || 24, 48) }, (_, index) => {
      const color = Array.isArray(entry?.palette) ? entry.palette[index % entry.palette.length] : '#66ccff';
      const height = 24 + ((index * 17) % 160);
      return `<i style="height:${height}px;background:${color}"></i>`;
    }).join('')}
  </div>
</body>
</html>`;

const dspPreviewHtml = (entry) => {
  const bands = Array.isArray(entry?.bands) ? entry.bands : [];
  const points = bands.map((band, index) => {
    const x = bands.length <= 1 ? 20 : 20 + (index / (bands.length - 1)) * 760;
    const y = 110 - Math.max(-12, Math.min(12, Number(band.gainDb) || 0)) * 7;
    return `${x},${y}`;
  }).join(' ');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ECHO DSP preview</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e1420;color:#eaf4ff;font:14px system-ui}
    .note{position:fixed;top:0;left:0;right:0;padding:8px 14px;background:#151f2d;color:#9db3c7}
    svg{width:min(820px,92vw);height:auto}
  </style>
</head>
<body>
  <p class="note">Local EQ curve. Native host / Audio Core still owns playback DSP.</p>
  <svg viewBox="0 0 800 220" role="img" aria-label="EQ curve">
    <rect width="800" height="220" fill="#151f2d" rx="16"/>
    <polyline fill="none" stroke="#66ccff" stroke-width="3" points="${points}"/>
    <text x="24" y="28" fill="#9db3c7">preamp ${entry?.preampDb ?? 0} dB · ${bands.length} bands</text>
  </svg>
</body>
</html>`;
}

const stylesheetPreviewHtml = (packId) => `<!doctype html>
<html data-theme-preset="workshopStylesheet" data-workshop-theme-pack="${packId}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ECHO stylesheet preview</title>
  <link rel="stylesheet" href="/theme.css">
  <style>
    body{margin:0;min-height:100vh;font:15px system-ui}
    .app-shell{min-height:100vh;display:grid;grid-template-rows:48px 1fr 84px;grid-template-columns:220px 1fr}
    .app-titlebar{grid-column:1/-1;display:flex;align-items:center;padding:0 16px}
    .sidebar{padding:16px}
    .page-surface{padding:24px}
    .player-bar{grid-column:1/-1;display:flex;align-items:center;padding:0 20px}
  </style>
</head>
<body>
  <div class="app-shell">
    <header class="app-titlebar">Stylesheet preview · ${packId}</header>
    <aside class="sidebar">Library<br>Queue<br>Lyrics</aside>
    <main class="page-surface">
      <h1>Local chrome mock</h1>
      <p>This page applies your packaged CSS to host class names. It is not the production sandbox.</p>
    </main>
    <footer class="player-bar">Now playing · fixture track</footer>
  </div>
</body>
</html>`;


const safeContentPath = (contentRoot, relativePath) => {
  if (!relativePath || relativePath.includes('\\') || isAbsolute(relativePath)) return null;
  const absolute = resolve(contentRoot, ...relativePath.split('/'));
  const fromRoot = relative(contentRoot, absolute);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) return null;
  return absolute;
};

const send = (response, status, contentType, body) => {
  response.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  response.end(body);
};

const listenOnFreePort = async (server, preferredPort, allowFallback) => {
  const attempts = allowFallback ? 20 : 1;
  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = preferredPort + offset;
    if (candidate > 65535) break;
    try {
      await new Promise((resolveListen, rejectListen) => {
        server.once('error', rejectListen);
        server.listen(candidate, '127.0.0.1', () => {
          server.removeListener('error', rejectListen);
          resolveListen();
        });
      });
      return candidate;
    } catch (error) {
      if (error?.code !== 'EADDRINUSE') throw error;
    }
  }
  if (!allowFallback) throw new Error(`Port ${preferredPort} is busy. Pass a different --port or omit it to auto-pick a free one.`);
  throw new Error(`No free local port between ${preferredPort} and ${Math.min(preferredPort + attempts - 1, 65535)}. Pass --port to choose another.`);
};

export const startMockHost = async ({ root, port, portIsExplicit = false, runTests, watchPath, contentRoot, kind, stylesheet, runtimeEntry, packId, entry }) => {
  let report = await runTests();
  let currentEntry = report.entry ?? entry;
  const hasPreview = (kind === 'theme' && Boolean(runtimeEntry || stylesheet))
    || kind === 'lyrics-style'
    || kind === 'animation-library'
    || kind === 'visualizer-preset'
    || kind === 'dsp-preset';
  const clients = new Set();
  const server = createServer(async (request, response) => {
    const url = request.url ?? '/';
    if (url.startsWith('/ui/') && url.split('/').at(-1) === '__bridge__.js' && runtimeEntry) {
      send(response, 200, 'text/javascript; charset=utf-8', `(${initializeWorkshopClient.toString()})(${createWorkshopPayloadTransfer.toString()},${createLyricsTimeline.toString()},${createWorkshopLibraryClient.toString()},${createWorkshopProviderClient.toString()});`);
      return;
    }
    if (url === '/report.json') {
      const { entry: _entry, ...publicReport } = report;
      send(response, 200, 'application/json; charset=utf-8', JSON.stringify(publicReport, null, 2));
      return;
    }
    if (url === '/events') {
      response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      clients.add(response);
      request.on('close', () => clients.delete(response));
      return;
    }
    if (url === '/theme.css' && stylesheet && contentRoot) {
      try {
        send(response, 200, 'text/css; charset=utf-8', await readFile(resolve(contentRoot, ...stylesheet.split('/')), 'utf8'));
      } catch {
        send(response, 404, 'text/plain; charset=utf-8', 'stylesheet missing');
      }
      return;
    }
    if (url.startsWith('/ui/') && contentRoot) {
      const absolute = safeContentPath(contentRoot, `ui/${url.slice(4)}`);
      if (!absolute) {
        send(response, 404, 'text/plain; charset=utf-8', 'not found');
        return;
      }
      try {
        const body = await readFile(absolute);
        send(response, 200, mimeByExtension[extname(absolute).toLowerCase()] ?? 'application/octet-stream', body);
      } catch {
        send(response, 404, 'text/plain; charset=utf-8', 'not found');
      }
      return;
    }
    if (url === '/console' || url === '/console/') {
      send(response, 200, 'text/html; charset=utf-8', consoleHtml(hasPreview));
      return;
    }
    if (url === '/' || url === '/index.html') {
      if (kind === 'theme' && runtimeEntry) {
        send(response, 200, 'text/html; charset=utf-8', runtimePreviewHtml({ capabilities: entry?.runtime?.capabilities ?? [], settings: entry?.runtime?.settings ?? [], fixtureTrack, fixtureTracks, fixtureAlbum, pluginApiContract, themeUiCapabilities, createVisualizationFixture }));
        return;
      }
      if (kind === 'theme' && stylesheet) {
        send(response, 200, 'text/html; charset=utf-8', stylesheetPreviewHtml(packId ?? 'workshop-theme'));
        return;
      }
      if (kind === 'lyrics-style') {
        send(response, 200, 'text/html; charset=utf-8', lyricsPreviewHtml(currentEntry));
        return;
      }
      if (kind === 'animation-library') {
        send(response, 200, 'text/html; charset=utf-8', animationPreviewHtml(currentEntry));
        return;
      }
      if (kind === 'visualizer-preset') {
        send(response, 200, 'text/html; charset=utf-8', visualizerPreviewHtml(currentEntry));
        return;
      }
      if (kind === 'dsp-preset') {
        send(response, 200, 'text/html; charset=utf-8', dspPreviewHtml(currentEntry));
        return;
      }
      send(response, 200, 'text/html; charset=utf-8', consoleHtml(false));
      return;
    }
    send(response, 404, 'text/plain; charset=utf-8', 'not found');
  });
  const boundPort = await listenOnFreePort(server, port, !portIsExplicit);
  const watcher = watch(resolve(root, watchPath), { recursive: true });
  const runner = createDebouncedRunner({
    run: async (changedFile) => {
      const nextReport = await runTests();
      report = { ...nextReport, changedFile };
      if (report.entry) currentEntry = report.entry;
      for (const client of clients) client.write(`data: reload\n\n`);
    },
    onError: (error, changedFile) => {
      report = { ok: false, changedFile, error: error instanceof Error ? error.message : String(error) };
      for (const client of clients) client.write(`data: reload\n\n`);
    },
  });
  void (async () => {
    for await (const event of watcher) {
      if (isGeneratedWorkshopChange(event.filename)) continue;
      runner.schedule(event.filename);
    }
    runner.dispose();
  })();
  return {
    server,
    watcher,
    port: boundPort,
    requestedPort: port,
    url: `http://127.0.0.1:${boundPort}`,
    consoleUrl: `http://127.0.0.1:${boundPort}${hasPreview ? '/console' : ''}`,
    previewUrl: hasPreview ? `http://127.0.0.1:${boundPort}/` : null,
  };
};
