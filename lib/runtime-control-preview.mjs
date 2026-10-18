import { createSteamPresenceSettingsTools } from './steam-presence-settings.mjs';
/** State-only author fixtures. No native services, clocks, paths or network access. */
export function createRuntimeControlPreview(emit = () => {}, createSteamTools = createSteamPresenceSettingsTools) {
  const mainWindow = { maximized: false, fullscreen: false };
  const output = { host: 'ready', state: 'paused', outputDeviceId: 'fixture-output', outputDeviceName: 'Fixture output',
    outputDeviceType: 'shared', outputBackend: 'fixture', outputMode: 'shared', automaticOutputEnabled: true,
    sharedBackend: 'auto', requestedOutputSampleRate: null, latencyProfile: 'balanced', bufferSizeFrames: null, volumeControlMode: 'software' };
  const deviceVolume = { deviceKey: 'fixture-output', deviceName: 'Fixture output', supported: true, hardwareMute: true,
    minimumDb: -60, maximumDb: 0, stepDb: 1, currentDb: -12, muted: false, reason: null };
  const windowActions = new Set(['window:isMaximized', 'window:isFullscreen', 'window:toggleMaximize', 'window:toggleFullscreen', 'window:minimize', 'window:close']);
  const order = ['equalizer', 'convolution', 'replayGain', 'compressor', 'crossfeed', 'stereoField', 'channelMatrix', 'channelBalance'];
  const modules = {
    equalizer: { enabled: false, preampDb: 0, dspHeadroomDb: -3, dspSafetyLimiterEnabled: true,
      bands: Array.from({ length: 31 }, (_, band) => ({ band, frequencyHz: 20 * 1.25 ** band, gainDb: 0, q: 1, filterType: 'peaking', enabled: true })), presetId: 'flat', presetName: 'Flat', clippingRisk: false },
    convolution: { enabled: false, status: 'empty', irId: null, irName: null, channelMode: 'none', sampleRate: null, tapCount: 0, trimDb: 0, latencySamples: 0, clippingRisk: false },
    replayGain: { enabled: false, mode: 'track', targetLufs: -14, preampDb: 0 },
    compressor: { enabled: false, thresholdDb: -18, ratio: 4, attackMs: 10, releaseMs: 120, kneeDb: 6, makeupDb: 0, mix: 1, detectorMode: 'peak', sidechainHighpassEnabled: false, sidechainHighpassHz: 120, autoRelease: false, rangeDb: 72, stereoLink: 1, inputPeakDb: [-96, -96], inputRmsDb: [-96, -96], outputPeakDb: [-96, -96], outputRmsDb: [-96, -96], gainReductionDb: 0, gainReductionDbByChannel: [0, 0], outputHeadroomDb: 96, clippingRisk: false },
    crossfeed: { enabled: false, amount: 0.25, cutoffHz: 700 },
    stereoField: { enabled: false, width: 1, centerGainDb: 0, sideGainDb: 0, clippingRisk: false },
    channelMatrix: { enabled: false, leftToLeft: 1, rightToRight: 1, leftToRight: 0, rightToLeft: 0, clippingRisk: false },
    channelBalance: { enabled: false, balance: 0, leftGainDb: 0, rightGainDb: 0, bandGains: { low: { leftGainDb: 0, rightGainDb: 0 }, mid: { leftGainDb: 0, rightGainDb: 0 }, high: { leftGainDb: 0, rightGainDb: 0 } }, leftDelayMs: 0, rightDelayMs: 0, swapLeftRight: false, monoMode: 'off', invertLeft: false, invertRight: false, constantPower: true },
  };
  const windows = {
    DesktopLyrics: { visible: false, locked: false, enabled: true },
    MiniPlayer: { visible: false, locked: false, enabled: true, layout: 'compact', queueOpen: false, dockEdge: null },
    Pet: { visible: false, enabled: true, scalePercent: 100 },
    Taskbar: { visible: false, supported: true, unsupportedReason: null, edge: null, enabled: true },
  };
  const surfaces = { DesktopLyrics: 'desktopLyrics', MiniPlayer: 'miniPlayer', Pet: 'pet', Taskbar: 'taskbar' };
  let timer = { isActive: false, remainingMs: 0, action: 'pause', fadeOutEnabled: false, durationMinutes: 0 };
  const session = { transport: 'smtc', enabled: true, hostState: 'fixture', playbackState: 'paused', positionSeconds: 0, durationSeconds: 180,
    lyricsEnabled: false, playbackRate: 1,
    enabledActions: { play: true, pause: true, previous: true, next: true, seek: true }, playbackModes: { shuffle: false, repeat: 'none' } };
  const home = { homeWaveformVisualizerEnabled: false, homeBackgroundMode: 'none',
    homeBackgroundAppearance: { opacityPercent: 100, uiOpacityPercent: 64 }, homeBackgroundRendering: { frameRate: 30, quality: 'balanced' } };
  const lyricsActions = new Set(['lyrics:listProviders', 'lyrics:searchProvider', 'lyrics:getStoredCandidates', 'lyrics:searchCandidates',
    'lyrics:previewCandidate', 'lyrics:applyCandidate', 'lyrics:applyCustom', 'lyrics:setOffset', 'lyrics:markInstrumental', 'lyrics:clearCache']);
  let lyrics = null;
  const steam = { available: true, enabled: true, mode: 'detailed', publicationState: 'waiting', lastPublishedAt: null, lastError: null };
  const steamTools = createSteamTools();
  let steamSettings = JSON.parse(JSON.stringify(steamTools.defaults));
  const steamActions = new Set(['presence:steam:getStatus', 'presence:steam:setEnabled', 'presence:steam:setMode',
    'presence:steam:getSettings', 'presence:steam:updateSettings', 'presence:steam:getOptions',
    'presence:steam:setTemporaryStatus', 'presence:steam:clearTemporaryStatus']);
  const supports = action => windowActions.has(action) || steamActions.has(action) || lyricsActions.has(action) || ['home:', 'audio:dsp:', 'audio:output:', 'companion:', 'sleep-timer:', 'media-session:'].some(prefix => action.startsWith(prefix));
  const copy = value => JSON.parse(JSON.stringify(value));
  const integrations = {
    Discord: { enabled: false, connected: false },
    LastFm: { enabled: false, scrobbleEnabled: false, nowPlayingEnabled: false, connected: false, authPending: false },
    ListenBrainz: { enabled: false, nowPlayingEnabled: false, scrobbleEnabled: false, phase: 'disabled', connected: false, tokenConfigured: false },
    Stage: { running: false, obsEnabled: false, apiEnabled: false, eventClients: 0 },
    ObsBrowser: { enabled: false, fontSize: 56, translation: true, romanization: false, showTrack: true, background: 'transparent', offsetMs: 0, clients: 0 },
    ObsWebSocket: { enabled: false, phase: 'disabled', connected: false, passwordConfigured: false },
    Mqtt: { enabled: false, phase: 'disabled', connected: false, passwordConfigured: false, homeAssistantDiscoveryEnabled: false },
    HqPlayer: { enabled: false, state: 'disabled', mediaServerEnabled: false, defaultPlaybackBackend: 'ask' },
    EchoLink: { enabled: false, running: false, pairingActive: false, clientCount: 0 },
  };
  const integrationGroup = action => {
    if (action.startsWith('presence:steam:')) return null;
    if (!action.startsWith('presence:') && !action.startsWith('bridge:')) return null;
    return Object.keys(integrations).find(group => action.split(':')[1].includes(group)) ?? null;
  };
  const supportsAll = action => supports(action) || integrationGroup(action) !== null;
  const run = (action, payload) => {
    const group = integrationGroup(action);
    if (group) {
      const value = integrations[group];
      if (action.includes(':disconnect')) { value.enabled = false; value.connected = false; }
      else if (action.includes(':set')) {
        if (typeof payload.enabled === 'boolean' && 'enabled' in value) value.enabled = payload.enabled;
        if (action === 'presence:setLastFmNowPlaying') value.nowPlayingEnabled = payload.enabled;
        if (action === 'presence:setLastFmScrobble') value.scrobbleEnabled = payload.enabled;
        if (action === 'presence:setListenBrainz') for (const key of ['enabled', 'nowPlayingEnabled', 'scrobbleEnabled']) {
          if (payload[key] !== undefined) value[key] = payload[key];
        }
        if (group === 'Stage') {
          if (payload.obsBrowserSourceEnabled !== undefined) value.obsEnabled = payload.obsBrowserSourceEnabled;
          if (payload.stageApiEnabled !== undefined) value.apiEnabled = payload.stageApiEnabled;
          value.running = value.obsEnabled || value.apiEnabled;
        }
        if (group === 'ObsBrowser') for (const key of Object.keys(value)) if (payload[key] !== undefined) value[key] = payload[key];
        if (group === 'EchoLink') value.running = value.enabled;
      }
      if (action === 'bridge:sendHqPlayerControl') return { state: 'skipped', reason: 'control_plan_missing', command: 'none' };
      return copy(value);
    }
    if (action.startsWith('audio:output:')) {
      if (action === 'audio:output:listDevices' || action === 'audio:output:refreshDevices') return [{
        id: 'fixture-output', index: 0, name: 'Fixture output', outputMode: 'shared', sampleRate: 48000, sharedDeviceSampleRate: 48000, isDefault: true }];
      if (action === 'audio:output:getDeviceVolume') return copy(deviceVolume);
      if (action === 'audio:output:setDeviceVolume') {
        const request = payload.request;
        if (!request || request.deviceKey !== deviceVolume.deviceKey) throw Error('invalid-payload');
        if (request.levelDb !== undefined) deviceVolume.currentDb = request.levelDb;
        if (request.muted !== undefined) deviceVolume.muted = request.muted;
        if (request.direction !== undefined) deviceVolume.currentDb += request.direction;
        if (request.toggleMute) deviceVolume.muted = !deviceVolume.muted;
        return copy(deviceVolume);
      }
      if (action === 'audio:output:setOutput') {
        const settings = payload.settings;
        const valid = {
          automaticOutputEnabled: value => typeof value === 'boolean',
          outputMode: value => ['shared', 'exclusive', 'asio', 'ks', 'system'].includes(value),
          sharedBackend: value => ['auto', 'windows', 'directsound', 'alsa', 'pipewire'].includes(value),
          deviceIndex: value => Number.isSafeInteger(value) && value >= -1,
          deviceName: value => typeof value === 'string',
          requestedOutputSampleRate: value => Number.isSafeInteger(value) && value >= 0,
          latencyProfile: value => ['stable', 'balanced', 'lowLatency'].includes(value),
          bufferSizeFrames: value => value === null || Number.isSafeInteger(value) && value >= 0,
        };
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)
          || Object.entries(settings).some(([key, value]) => !Object.hasOwn(valid, key) || !valid[key](value))) throw Error('invalid-payload');
        Object.assign(output, settings);
      }
      if (action === 'audio:output:setVolumeControlMode') {
        if (!['software', 'device', 'fixed'].includes(payload.mode)) throw Error('invalid-payload');
        output.volumeControlMode = payload.mode;
      }
      if (['audio:output:getStatus', 'audio:output:setOutput', 'audio:output:setVolumeControlMode'].includes(action)) return copy(output);
      throw Error('action-unavailable');
    }
    if (steamActions.has(action)) {
      if (action === 'presence:steam:updateSettings') {
        steamSettings = steamTools.applyPatch(steamSettings, payload);
        for (const state of Object.keys(steamSettings.templates)) if (!steamSettings.templates[state]) delete steamSettings.templates[state];
        return copy(steamSettings);
      }
      if (action === 'presence:steam:getSettings' || action === 'presence:steam:getOptions') {
        if (Object.keys(payload).length) throw Error('invalid-payload');
        return copy(action === 'presence:steam:getSettings' ? steamSettings : steamTools.options);
      }
      const keys = { 'presence:steam:getStatus': [], 'presence:steam:setEnabled': ['enabled'], 'presence:steam:setMode': ['mode'],
        'presence:steam:setTemporaryStatus': ['text', 'includeTrack', 'expiresAt'], 'presence:steam:clearTemporaryStatus': [] }[action];
      if (Object.keys(payload).some(key => !keys.includes(key))) throw Error('invalid-payload');
      if (action === 'presence:steam:setEnabled') {
        if (typeof payload.enabled !== 'boolean') throw Error('invalid-payload');
        steam.mode = payload.enabled ? steam.mode === 'off' ? 'detailed' : steam.mode : 'off';
      }
      if (action === 'presence:steam:setMode') {
        if (!['off', 'basic', 'detailed', 'stalker'].includes(payload.mode)) throw Error('invalid-payload');
        steam.mode = payload.mode;
      }
      if (action === 'presence:steam:setTemporaryStatus'
        && (typeof payload.text !== 'string' || !payload.text.replace(/\p{Cc}+/gu, ' ').trim() || payload.text.length > 160
          || payload.includeTrack !== undefined && typeof payload.includeTrack !== 'boolean'
          || payload.expiresAt != null && (!Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= 0 || payload.expiresAt > 8_640_000_000_000_000))) throw Error('invalid-payload');
      steam.enabled = steam.mode !== 'off';
      steam.publicationState = steam.enabled ? 'waiting' : 'disabled';
      return copy(steam);
    }
    if (action === 'window:isMaximized') return mainWindow.maximized;
    if (action === 'window:isFullscreen') return mainWindow.fullscreen;
    if (action === 'window:toggleMaximize' || action === 'window:toggleFullscreen') {
      const field = action === 'window:toggleMaximize' ? 'maximized' : 'fullscreen';
      mainWindow[field] = !mainWindow[field]; emit(`window:${field}-changed`, mainWindow[field]); return null;
    }
    if (action === 'window:minimize' || action === 'window:close') return null;
    if (action === 'audio:dsp:getRackOrder') return [...order];
    if (action === 'audio:dsp:setRackOrder') {
      if (!Array.isArray(payload.order) || payload.order.length !== order.length
        || new Set(payload.order).size !== order.length || payload.order.some(id => !order.includes(id))) throw Error('invalid-payload');
      order.splice(0, order.length, ...payload.order); return [...order];
    }
    if (action === 'audio:dsp:getModule' || action === 'audio:dsp:setModule') {
      if (!Object.hasOwn(modules, payload.moduleId)) throw Error('dsp-unavailable');
      const state = modules[payload.moduleId];
      if (action === 'audio:dsp:setModule') {
        if (!payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)
          || Object.keys(payload.state).some(key => !Object.hasOwn(state, key))) throw Error('invalid-payload');
        if ('bands' in payload.state && (!Array.isArray(payload.state.bands) || payload.state.bands.length > 31)) throw Error('invalid-payload');
        Object.assign(state, payload.state);
      }
      return copy(state);
    }
    if (action.startsWith('companion:')) {
      const surface = Object.keys(windows).find(name => action.includes(name));
      if (!surface) throw Error('action-unavailable');
      const state = windows[surface];
      if (action.startsWith('companion:show')) state.visible = true;
      if (action.startsWith('companion:hide')) state.visible = false;
      if (action.endsWith('Locked')) state.locked = payload.locked;
      if (action.endsWith('Layout')) state.layout = payload.layout;
      if (action.endsWith('Scale')) state.scalePercent = payload.scalePercent;
      if (action.endsWith('Enabled')) state.enabled = payload.enabled;
      if (!action.startsWith('companion:get')) emit('companion:state', { surface: surfaces[surface], state: copy(state) });
      return copy(state);
    }
    if (action.startsWith('sleep-timer:')) {
      if (action === 'sleep-timer:start') timer = { isActive: true, remainingMs: payload.durationMinutes * 60_000, action: payload.action, fadeOutEnabled: payload.fadeOut, durationMinutes: payload.durationMinutes };
      if (action === 'sleep-timer:cancel') timer = { ...timer, isActive: false, remainingMs: 0 };
      if (action !== 'sleep-timer:getStatus') emit('sleep-timer:tick', { remainingMs: timer.remainingMs });
      return copy(timer);
    }
    if (action === 'home:getSettings') return copy(home);
    if (action === 'home:updateSettings') {
      if (Object.keys(payload).some(key => !Object.hasOwn(home, key))) throw Error('invalid-payload');
      Object.assign(home, payload); return copy(home);
    }
    if (action === 'home:getHistory') return { page: payload.page ?? 1, pageSize: payload.pageSize ?? 20, total: 0, items: [] };
    if (action === 'home:getHistorySummary') return { todayCount: 0, todayPlayedSeconds: 0, totalCount: 0, latestPlayedAt: null,
      rangeCount: 0, rangeTrackCount: 0, rangePlayedSeconds: 0, rangeLatestPlayedAt: null };
    if (action === 'home:getStats') return { generatedAt: '2026-10-18T00:00:00Z',
      totals: { playCount: 0, completedCount: 0, playedSeconds: 0, uniqueTracks: 0, uniqueArtists: 0 },
      topTracks: [], topArtists: [], topAlbums: [], formatBreakdown: [], qualityBreakdown: [], dailyActivity: [] };
    if (['lyrics:listProviders', 'lyrics:getStoredCandidates', 'lyrics:searchCandidates'].includes(action)) return [];
    if (action === 'lyrics:searchProvider') throw Error('lyrics-provider-not-ready');
    if (action === 'lyrics:previewCandidate' || action === 'lyrics:applyCandidate') throw Error('candidate-not-found');
    if (action === 'lyrics:applyCustom' || action === 'lyrics:markInstrumental') {
      lyrics = { kind: action === 'lyrics:markInstrumental' ? 'instrumental' : 'plain', title: 'Preview track', artist: 'ECHO Fixtures',
        album: null, durationSeconds: null, offsetMs: 0, provider: 'manual', lines: [], plainText: payload.text ?? null, syncedText: null };
      return copy(lyrics);
    }
    if (action === 'lyrics:setOffset') { if (lyrics) lyrics.offsetMs = payload.offsetMs; return copy(lyrics); }
    if (action === 'lyrics:clearCache') { lyrics = null; return null; }
    if (action === 'media-session:setEnabled' || action === 'media-session:setLyricsEnabled') {
      if (typeof payload.enabled !== 'boolean') throw Error('invalid-payload');
      session[action === 'media-session:setEnabled' ? 'enabled' : 'lyricsEnabled'] = payload.enabled;
      return copy(session);
    }
    if (action === 'media-session:setEnabledActions') { session.enabledActions = { ...payload }; return null; }
    if (action === 'media-session:setPlaybackModes') { session.playbackModes = { ...payload }; return null; }
    if (action === 'media-session:getStatus' || action === 'media-session:restart') return copy(session);
    throw Error('action-unavailable');
  };
  return { supports: supportsAll, run: (action, payload) => {
    const result = run(action, payload);
    if (action.startsWith('audio:dsp:set')) emit('audio:dsp-changed', null);
    else if (action === 'home:updateSettings') emit('home:changed', null);
    else if (action.startsWith('presence:') && !/:get/u.test(action)) emit('presence:changed', null);
    else if (action.startsWith('bridge:') && !/:get/u.test(action)) emit('bridge:changed', null);
    else if (action.startsWith('media-session:') && action !== 'media-session:getStatus') emit('media-session:changed', null);
    return result;
  } };
}
