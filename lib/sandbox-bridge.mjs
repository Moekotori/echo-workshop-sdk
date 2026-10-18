import { createWorkshopLibraryClient } from './library-client.mjs';
import { createWorkshopProviderClient } from './provider-client.mjs';
/** Official sandbox client shared by production plugins, UI runtimes and author previews. */
export function initializeWorkshopClient(createWorkshopPayloadTransfer, createLyricsTimeline, libraryClient, providerClient) {
  'use strict';
  if (libraryClient === undefined) libraryClient = createWorkshopLibraryClient;
  if (providerClient === undefined) providerClient = createWorkshopProviderClient;
  const channel = 'echo:workshop-plugin';
  const version = 1;
  const maximumPendingRequests = 32;
  const requestTimeoutMs = 15000;
  const longRequestTimeoutMs = 300000;
  const scheduleTimeout = typeof setTimeout === 'function' ? setTimeout : null;
  const cancelTimeout = typeof clearTimeout === 'function' ? clearTimeout : null;
    const pending = new Map();
  const disposeHandlers = new Set();
  let disposed = false;
  let runtimeReady = false;
    const commandHandlers = new Map();
    const commandMetadata = new Map();
    const agentHandlers = new Map();
    const sourceProviderHandlers = new Map();
    const lyricsProviderHandlers = new Map();
    const lyricsInvocations = new Map();
    const metadataProviderHandlers = new Map();
    const coverProviderHandlers = new Map();
    const transitionProviderHandlers = new Map();
    const eventHandlers = new Map();
  let sequence = 0;
  const payloadTransfer = createWorkshopPayloadTransfer({
    post:(target,message) => target.postMessage(message,'*'),
    accept:(target,header) => target === parent && (header.type === 'response' && pending.has(header.requestId)
      || header.type.startsWith('invoke-') || header.type === 'event'),
  });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const handler of disposeHandlers) { try { handler(); } catch { /* Author cleanup cannot retain host requests. */ } }
    disposeHandlers.clear();
    for (const operation of pending.values()) {
      if (operation.timer !== null && cancelTimeout) cancelTimeout(operation.timer);
      operation.reject(new Error('plugin-runtime-stopped'));
    }
    pending.clear(); eventHandlers.clear(); commandHandlers.clear(); commandMetadata.clear();
    agentHandlers.clear(); sourceProviderHandlers.clear(); lyricsProviderHandlers.clear();
    metadataProviderHandlers.clear(); coverProviderHandlers.clear(); transitionProviderHandlers.clear();
    for (const controller of lyricsInvocations.values()) controller.abort();
    lyricsInvocations.clear();
    payloadTransfer.disposeTarget();
  };
  window.addEventListener('pagehide', dispose);
  window.addEventListener('unload', dispose);

  const request = (action, payload, timeoutMs = requestTimeoutMs) => new Promise((resolve, reject) => {
    if (disposed) { reject(new Error('plugin-runtime-stopped')); return; }
    if (pending.size >= maximumPendingRequests) {
      reject(new Error('plugin-request-concurrency-exceeded'));
      return;
    }
    const requestId = String(Date.now()) + '-' + String(++sequence);
    const timer = scheduleTimeout ? scheduleTimeout(() => {
      pending.delete(requestId);
      reject(new Error('plugin-request-timeout'));
    }, timeoutMs) : null;
    pending.set(requestId, { resolve, reject, timer });
    void payloadTransfer.send(parent,{ channel, version, type: 'request', requestId, action, payload }).catch(error => {
      const operation = pending.get(requestId);
      if (!operation) return;
      pending.delete(requestId);
      if (operation.timer !== null && cancelTimeout) cancelTimeout(operation.timer);
      operation.reject(error);
    });
  });

  const on = (eventName, handler) => {
    if (typeof eventName !== 'string' || typeof handler !== 'function') return () => undefined;
    const handlers = eventHandlers.get(eventName) || new Set();
    handlers.add(handler);
    eventHandlers.set(eventName, handlers);
    return () => handlers.delete(handler);
  };

  const emit = async (eventName, payload) => {
    for (const handler of eventHandlers.get(eventName) || []) {
      try { await handler(payload); } catch { /* plugin callback isolation */ }
    }
  };

  // Observers acquire a host lease explicitly; last unsubscribe releases it.
  const observeHost = async (action, eventName, handler) => {
    if (typeof handler !== 'function') throw new Error('invalid-handler');
    const stop = on(eventName, handler);
    try { await request(action, { enabled: true }); } catch (error) { stop(); throw error; }
    let active = true;
    return async () => {
      if (!active) return;
      active = false; stop();
      if (!disposed && !eventHandlers.get(eventName)?.size) await request(action, { enabled: false });
    };
  };

  const executeCommand = async (commandId, args) => {
    const handler = commandHandlers.get(commandId);
    if (!handler) throw new Error('command-not-registered');
    return handler(...args);
  };

  window.addEventListener('message', async (event) => {
    if (disposed || event.source !== parent || !event.data) return;
    if (event.data.protocolVersion === 1 && event.data.type === 'echo:workshop-ui:ping') {
      parent.postMessage({ type: 'echo:workshop-ui:pong', protocolVersion: 1 }, '*'); return;
    }
    if (event.data.protocolVersion === 1 && event.data.type === 'echo:workshop-ui:init') {
      if (!runtimeReady) {
        runtimeReady = true;
        parent.postMessage({ type: 'echo:workshop-ui:ready', protocolVersion: 1 }, '*');
      }
      return;
    }
    if (event.data.protocolVersion === 1 && event.data.type === 'echo:workshop-ui:clock') {
      await emit('playback:clock', event.data.clock); return;
    }
    if (event.data.protocolVersion === 1 && event.data.type === 'echo:workshop-ui:lyrics') {
      await emit('lyrics:changed', { trackId: event.data.trackId, revision: event.data.revision, lyrics: event.data.lyrics }); return;
    }
    if (event.data.channel !== channel || event.data.version !== version) return;
    const transferred = payloadTransfer.receive(parent,event.data);
    if (transferred.handled && !transferred.message) return;
    const message = transferred.message || event.data;
    if (message.type === 'health-check') {
      parent.postMessage({ channel, version, type: 'health', nonce: message.nonce }, '*');
      return;
    }
    if (message.type === 'response') {
      const operation = pending.get(message.requestId);
      if (!operation) return;
      pending.delete(message.requestId);
      if (operation.timer !== null && cancelTimeout) cancelTimeout(operation.timer);
      if (message.ok) operation.resolve(message.value);
      else operation.reject(new Error(message.error || 'plugin-host-error'));
      return;
    }
    if (message.type === 'event') {
      await emit(message.eventName, message.payload);
      return;
    }
    if (message.type === 'invoke-transition-provider') {
      const provider = transitionProviderHandlers.get(message.providerId);
      const handler = provider && ['windowFrames', 'prepare', 'render'].includes(message.operation) && provider[message.operation];
      try {
        if (typeof handler !== 'function') throw new Error('transition-provider-unavailable');
        let value = await handler.call(provider, message.input);
        if (message.operation === 'render') {
          if (!(Array.isArray(value) || value instanceof Float32Array)) throw new Error('transition-pcm-invalid');
          if (value.length > 8192) throw new Error('transition-pcm-size-invalid');
          value = Array.from(value);
        }
        parent.postMessage({ channel, version, type: 'transition-provider-result', invocationId: message.invocationId, ok: true, value }, '*');
      } catch {
        parent.postMessage({ channel, version, type: 'transition-provider-result', invocationId: message.invocationId, ok: false }, '*');
      }
      return;
    }
    if (message.type === 'invoke-command') {
      if (!commandHandlers.has(message.commandId)) {
        parent.postMessage({ channel, version, type: 'command-result', invocationId: message.invocationId, ok: false, error: 'command-not-registered' }, '*');
        return;
      }
      try {
        const value = await executeCommand(message.commandId, Array.isArray(message.args) ? message.args : []);
        await payloadTransfer.send(parent,{ channel, version, type: 'command-result', invocationId: message.invocationId, ok: true, value });
      } catch (error) {
        parent.postMessage({ channel, version, type: 'command-result', invocationId: message.invocationId, ok: false, error: error instanceof Error ? error.message.slice(0, 160) : 'command-failed' }, '*');
      }
      return;
    }
    if (message.type === 'invoke-agent') {
        const handler = agentHandlers.get(message.agentId);
        if (!handler) {
          parent.postMessage({ channel, version, type: 'agent-result', invocationId: message.invocationId, ok: false, error: 'agent-not-registered' }, '*');
          return;
        }
        try {
          const value = await handler(message.input, Object.freeze({ agentId: message.agentId }));
          await payloadTransfer.send(parent,{ channel, version, type: 'agent-result', invocationId: message.invocationId, ok: true, value });
        } catch (error) {
          parent.postMessage({ channel, version, type: 'agent-result', invocationId: message.invocationId, ok: false, error: error instanceof Error ? error.message.slice(0, 160) : 'agent-failed' }, '*');
        }
        return;
    }
    if (message.type === 'invoke-source-provider') {
      const handlers = sourceProviderHandlers.get(message.providerId);
      const handler = handlers && handlers[message.operation];
      if (typeof handler !== 'function') {
        parent.postMessage({ channel, version, type: 'source-provider-result', invocationId: message.invocationId, ok: false, error: 'source-provider-not-registered' }, '*');
        return;
      }
      try {
        const value = await handler(message.request, Object.freeze({ providerId: message.providerId, operation: message.operation }));
        await payloadTransfer.send(parent,{ channel, version, type: 'source-provider-result', invocationId: message.invocationId, ok: true, value });
      } catch (error) {
        parent.postMessage({ channel, version, type: 'source-provider-result', invocationId: message.invocationId, ok: false, error: error instanceof Error ? error.message.slice(0, 160) : 'source-provider-failed' }, '*');
      }
      return;
    }
    if (['cancel-lyrics-provider', 'cancel-metadata-provider', 'cancel-cover-provider'].includes(message.type)) {
      lyricsInvocations.get(message.invocationId)?.abort();
      lyricsInvocations.delete(message.invocationId);
      return;
    }
    if (message.type === 'invoke-lyrics-provider') {
      const handler = lyricsProviderHandlers.get(message.providerId);
      if (!handler) {
        parent.postMessage({ channel, version, type: 'lyrics-provider-result', invocationId: message.invocationId, ok: false, error: 'lyrics-provider-not-registered' }, '*');
        return;
      }
      const controller = new AbortController();
      lyricsInvocations.set(message.invocationId, controller);
      try {
        const value = await handler(message.request, Object.freeze({ providerId: message.providerId, signal: controller.signal }));
        if (controller.signal.aborted) return;
        await payloadTransfer.send(parent,{ channel, version, type: 'lyrics-provider-result', invocationId: message.invocationId, ok: true, value });
      } catch (error) {
        parent.postMessage({ channel, version, type: 'lyrics-provider-result', invocationId: message.invocationId, ok: false, error: error instanceof Error ? error.message.slice(0, 160) : 'lyrics-provider-failed' }, '*');
      } finally {
        lyricsInvocations.delete(message.invocationId);
      }
      return;
    }
    if (message.type === 'invoke-metadata-provider' || message.type === 'invoke-cover-provider') {
      const isMetadata = message.type === 'invoke-metadata-provider';
      const handler = (isMetadata ? metadataProviderHandlers : coverProviderHandlers).get(message.providerId);
      const resultType = isMetadata ? 'metadata-provider-result' : 'cover-provider-result';
      if (!handler) {
        parent.postMessage({ channel, version, type: resultType, invocationId: message.invocationId, ok: false, error: isMetadata ? 'metadata-provider-not-registered' : 'cover-provider-not-registered' }, '*');
        return;
      }
      const controller = new AbortController();
      lyricsInvocations.set(message.invocationId, controller);
      try {
        const value = await handler(message.request, Object.freeze({ providerId: message.providerId, signal: controller.signal }));
        if (controller.signal.aborted) return;
        await payloadTransfer.send(parent,{ channel, version, type: resultType, invocationId: message.invocationId, ok: true, value });
      } catch (error) {
        parent.postMessage({ channel, version, type: resultType, invocationId: message.invocationId, ok: false, error: error instanceof Error ? error.message.slice(0, 160) : (isMetadata ? 'metadata-provider-failed' : 'cover-provider-failed') }, '*');
      } finally {
        lyricsInvocations.delete(message.invocationId);
      }
      return;
    }
  });

  const providerWorkflows = providerClient(request, on);
  const echo = Object.freeze({
    extensions: Object.freeze({
      list: (query) => request('extensions:list', query || {}),
      launch: (key) => request('extensions:launch', { key }),
      onChanged: (handler) => on('extensions:changed', handler),
    }),
    assets: Object.freeze({
      url: (path) => {
        if (typeof path !== 'string' || !path || typeof location === 'undefined') throw new Error('asset-path-invalid');
        const base = new URL(location.href);
        const prefix = base.protocol === 'echo-workshop:' ? base.pathname.split('/').slice(0, 3).join('/') + '/' : '/';
        const url = new URL(path, base);
        if (url.protocol !== base.protocol || url.host !== base.host || !url.pathname.startsWith(prefix)) throw new Error('asset-path-invalid');
        return url.href;
      },
      text: async (path) => { const response = await fetch(echo.assets.url(path)); if (!response.ok) throw new Error('asset-unavailable'); return response.text(); },
      arrayBuffer: async (path) => { const response = await fetch(echo.assets.url(path)); if (!response.ok) throw new Error('asset-unavailable'); return response.arrayBuffer(); },
    }),
    host: Object.freeze({
      onChanged: handler => {
        const stops = Object.entries({ dsp: 'audio:dsp-changed', home: 'home:changed', presence: 'presence:changed',
          bridge: 'bridge:changed', 'media-session': 'media-session:changed' }).map(([domain, event]) => on(event, () => handler({ domain })));
        return () => stops.forEach(stop => stop());
      },
      getCapabilities: () => request('host:getCapabilities'),
      getFeatureAvailability: (featureId) => request('host:getFeatureAvailability', { featureId }),
    }),
    commands: Object.freeze({
      register(id, metadata, handler) {
        if (typeof id !== 'string' || typeof handler !== 'function') throw new Error('invalid-command-registration');
        commandHandlers.set(id, handler);
        const title = metadata && typeof metadata.title === 'string' ? metadata.title : id;
        commandMetadata.set(id, Object.freeze({ id, title }));
        parent.postMessage({ channel, version, type: 'register-command', commandId: id, title }, '*');
      },
      execute: async (id, input) => executeCommand(id, input === undefined ? [] : [input]),
      list: () => Object.freeze(Array.from(commandMetadata.values())),
    }),
    events: Object.freeze({ on }),
    window: Object.freeze({
      isMaximized: () => request('window:isMaximized'),
      isFullscreen: () => request('window:isFullscreen'),
      onMaximizedChange: (handler) => on('window:maximized-changed', handler),
      onFullscreenChange: (handler) => on('window:fullscreen-changed', handler),
      minimize: () => request('window:minimize'),
      toggleMaximize: () => request('window:toggleMaximize'),
      toggleFullscreen: () => request('window:toggleFullscreen'),
      close: () => request('window:close'),
      getDesktopWall: () => request('window:getDesktopWall'),
      setDesktopWall: (enabled) => request('window:setDesktopWall', { enabled }),
    }),
    mediaSession: Object.freeze({
      onChanged: handler => on('media-session:changed', handler),
      getStatus: () => request('media-session:getStatus'),
      setEnabled: (enabled) => request('media-session:setEnabled', { enabled }),
      setLyricsEnabled: (enabled) => request('media-session:setLyricsEnabled', { enabled }),
      setEnabledActions: (actions) => request('media-session:setEnabledActions', actions || {}),
      setPlaybackModes: (modes) => request('media-session:setPlaybackModes', modes || {}),
      restart: () => request('media-session:restart'),
      onCommand: (handler) => on('media-session:command', handler),
    }),
    companion: Object.freeze({
      desktopLyrics: Object.freeze({
        getState: () => request('companion:getDesktopLyrics'),
        show: () => request('companion:showDesktopLyrics'),
        hide: () => request('companion:hideDesktopLyrics'),
        setLocked: (locked) => request('companion:setDesktopLyricsLocked', { locked }),
        reset: () => request('companion:resetDesktopLyrics'),
      }),
      miniPlayer: Object.freeze({
        getState: () => request('companion:getMiniPlayer'),
        show: () => request('companion:showMiniPlayer'),
        hide: () => request('companion:hideMiniPlayer'),
        setLocked: (locked) => request('companion:setMiniPlayerLocked', { locked }),
        setLayout: (layout) => request('companion:setMiniPlayerLayout', { layout }),
        reset: () => request('companion:resetMiniPlayer'),
      }),
      pet: Object.freeze({
        getState: () => request('companion:getPet'),
        show: () => request('companion:showPet'),
        hide: () => request('companion:hidePet'),
        setScale: (scalePercent) => request('companion:setPetScale', { scalePercent }),
        reset: () => request('companion:resetPet'),
      }),
      taskbar: Object.freeze({
        getState: () => request('companion:getTaskbar'),
        show: () => request('companion:showTaskbar'),
        hide: () => request('companion:hideTaskbar'),
        setEnabled: (enabled) => request('companion:setTaskbarEnabled', { enabled }),
      }),
      onState: (handler) => on('companion:state', handler),
    }),
    sleepTimer: Object.freeze({
      getStatus: () => request('sleep-timer:getStatus'),
      start: (requestOptions) => request('sleep-timer:start', requestOptions || {}),
      cancel: () => request('sleep-timer:cancel'),
      onTick: (handler) => on('sleep-timer:tick', handler),
    }),
    presence: Object.freeze({
      onChanged: handler => on('presence:changed', handler),
      steam: Object.freeze({
        getStatus: () => request('presence:steam:getStatus'),
        getSettings: () => request('presence:steam:getSettings'),
        updateSettings: (patch) => request('presence:steam:updateSettings', patch),
        getOptions: () => request('presence:steam:getOptions'),
        setEnabled: (enabled) => request('presence:steam:setEnabled', { enabled }),
        setMode: (mode) => request('presence:steam:setMode', { mode }),
        setTemporaryStatus: (status) => request('presence:steam:setTemporaryStatus', status || {}),
        clearTemporaryStatus: () => request('presence:steam:clearTemporaryStatus'),
      }),
      discord: Object.freeze({
        getStatus: () => request('presence:getDiscord'),
        setEnabled: (enabled) => request('presence:setDiscordEnabled', { enabled }),
      }),
      lastfm: Object.freeze({
        getStatus: () => request('presence:getLastFm'),
        setEnabled: (enabled) => request('presence:setLastFmEnabled', { enabled }),
        setNowPlayingEnabled: (enabled) => request('presence:setLastFmNowPlaying', { enabled }),
        setScrobbleEnabled: (enabled) => request('presence:setLastFmScrobble', { enabled }),
        disconnect: () => request('presence:disconnectLastFm'),
      }),
      listenBrainz: Object.freeze({
        getStatus: () => request('presence:getListenBrainz'),
        setFlags: (flags) => request('presence:setListenBrainz', flags || {}),
        disconnect: () => request('presence:disconnectListenBrainz'),
      }),
    }),
    bridge: Object.freeze({
      onChanged: handler => on('bridge:changed', handler),
      stage: Object.freeze({
        getStatus: () => request('bridge:getStage'),
        setEnabled: (patch) => request('bridge:setStage', patch || {}),
      }),
      obsBrowser: Object.freeze({
        getStatus: () => request('bridge:getObsBrowser'),
        update: (patch) => request('bridge:setObsBrowser', patch || {}),
      }),
      obsWebSocket: Object.freeze({
        getStatus: () => request('bridge:getObsWebSocket'),
        setEnabled: (enabled) => request('bridge:setObsWebSocketEnabled', { enabled }),
      }),
      mqtt: Object.freeze({
        getStatus: () => request('bridge:getMqtt'),
        setEnabled: (enabled) => request('bridge:setMqttEnabled', { enabled }),
      }),
      hqPlayer: Object.freeze({
        getStatus: () => request('bridge:getHqPlayer'),
        setEnabled: (enabled) => request('bridge:setHqPlayerEnabled', { enabled }),
        sendLastControl: () => request('bridge:sendHqPlayerControl'),
      }),
      echoLink: Object.freeze({
        getStatus: () => request('bridge:getEchoLink'),
        setEnabled: (enabled) => request('bridge:setEchoLinkEnabled', { enabled }),
      }),
    }),
    navigation: Object.freeze({ open: (routeId, options) => request('navigation:open', { routeId,
      ...(options && options.dismissRuntime !== undefined ? { dismissRuntime: options.dismissRuntime } : {}) }) }),
      playback: Object.freeze({
        getStatus: () => request('playback:getStatus'),
        getRate: () => request('playback:getRate'),
        setRate: (rate) => request('playback:setRate', { rate }),
        play: () => request('playback:play'),
        pause: () => request('playback:pause'),
        stop: () => request('playback:stop'),
        seek: (positionSeconds) => request('playback:seek', { positionSeconds }),
        previous: () => request('playback:previous'),
        next: () => request('playback:next'),
        nextAt: (positionSeconds) => request('playback:nextAt', { positionSeconds }),
        setVolume: (volume) => request('playback:setVolume', { volume }),
        setShuffle: (enabled) => request('playback:setShuffle', { enabled }),
        toggleShuffle: () => request('playback:toggleShuffle'),
        setRepeat: (mode) => request('playback:setRepeat', { mode }),
        cycleRepeat: () => request('playback:cycleRepeat'),
        playUrl: (url, metadata) => request('playback:playUrl', typeof url === 'string' ? { ...(metadata || {}), url } : url),
      }),
    audio: Object.freeze({
      output: Object.freeze({
        getStatus: () => request('audio:output:getStatus'),
        listDevices: () => request('audio:output:listDevices'),
        refreshDevices: () => request('audio:output:refreshDevices'),
        getDeviceVolume: () => request('audio:output:getDeviceVolume'),
        setOutput: settings => request('audio:output:setOutput', { settings }),
        setDeviceVolume: options => request('audio:output:setDeviceVolume', { request: options }),
        setVolumeControlMode: mode => request('audio:output:setVolumeControlMode', { mode }),
      }),
      getSpectrum: () => request('audio:getSpectrum'),
      getSpectrogram: (options) => request('audio:getSpectrogram', { trackId: options?.trackId }, longRequestTimeoutMs),
      getVisualization: (options) => request('audio:getVisualization', options || {}),
      transition: Object.freeze({
        registerProvider: async (id, meta, provider) => {
          if (!provider || ['windowFrames', 'prepare', 'render', 'rewritesSamples'].some((name) => typeof provider[name] !== 'function')
            || transitionProviderHandlers.size >= 1) throw new Error('transition-provider-invalid');
          transitionProviderHandlers.set(id, provider);
          try {
            const rewritesSamples = await provider.rewritesSamples();
            if (typeof rewritesSamples !== 'boolean') throw new Error('transition-provider-invalid');
            await request('audio:transition:registerProvider', { providerId: id, meta: meta || {}, rewritesSamples });
          }
          catch (error) { transitionProviderHandlers.delete(id); throw error; }
          return async () => {
            transitionProviderHandlers.delete(id);
            await request('audio:transition:unregisterProvider', { providerId: id });
          };
        },
      }),
      dsp: Object.freeze({
        onChanged: handler => on('audio:dsp-changed', handler),
        getModule: (moduleId) => request('audio:dsp:getModule', { moduleId }),
        setModule: (moduleId, state) => request('audio:dsp:setModule', { moduleId, state }),
        getRackOrder: () => request('audio:dsp:getRackOrder'),
        setRackOrder: (order) => request('audio:dsp:setRackOrder', { order }),
      }),
      offline: Object.freeze({
        open: (options) => request('audio:offline:open', options || {}, longRequestTimeoutMs),
        read: (sessionId, options) => request('audio:offline:read', { ...(options || {}), sessionId }),
        seek: (sessionId, positionSeconds) => request('audio:offline:seek', { sessionId, positionSeconds }),
        close: (sessionId) => request('audio:offline:close', { sessionId }),
      }),
    }),
    library: libraryClient(request, on),
      queue: Object.freeze({
      get: () => request('queue:get'),
      getPage: (query) => request('queue:getPage', query || {}),
      playTrack: (trackId, queueTrackIds) => request('queue:playTrack', { trackId, queueTrackIds }),
      enqueueTrack: (trackId) => request('queue:enqueueTrack', { trackId }),
      playItem: (queueId) => request('queue:playItem', { queueId }),
      moveItem: (queueId, toIndex) => request('queue:moveItem', { queueId, toIndex }),
      reorder: (queueIds) => request('queue:reorder', { queueIds }),
      removeItem: (queueId) => request('queue:removeItem', { queueId }),
        clear: () => request('queue:clear'),
      playAlbum: (albumId) => request('queue:playAlbum', { albumId }),
      playArtist: (artistId) => request('queue:playArtist', { artistId }),
      playGenre: (genreId) => request('queue:playGenre', { genreId }),
      playPlaylist: (playlistId) => request('queue:playPlaylist', { playlistId }),
      playLiked: () => request('queue:playLiked'),
      }),
      sources: Object.freeze({
        registerProvider: (id, metadata, handlers) => {
          if (typeof id !== 'string' || !handlers || typeof handlers.search !== 'function' || typeof handlers.resolve !== 'function') {
            throw new TypeError('invalid-source-provider');
          }
          const browse = typeof handlers.browse === 'function'
            ? handlers.browse
            : (request) => handlers.search({ query: '', page: 1, pageSize: 24, ...(request || {}) });
          const nextHandlers = { search: handlers.search, resolve: handlers.resolve, browse };
          if (typeof handlers.listCollection === 'function') nextHandlers.listCollection = handlers.listCollection;
          sourceProviderHandlers.set(id, Object.freeze(nextHandlers));
          parent.postMessage({ channel, version, type: 'register-source-provider', providerId: id, title: metadata && metadata.title }, '*');
        },
        search: (providerId, query) => request('source-provider:search', { providerId, ...(query || {}) }),
        browse: (providerId, query) => request('source-provider:browse', { providerId, ...(query || {}) }),
        listCollection: (providerId, collectionId, query) => request('source-provider:listCollection', { providerId, collectionId, ...(query || {}) }),
        resolve: (providerId, providerTrackId) => request('source-provider:resolve', { providerId, providerTrackId }),
        playDirect: (source) => request('sources:playDirect', source),
        enqueueDirect: (source) => request('sources:enqueueDirect', source),
        playQueue: (sources) => request('sources:playQueue', { sources }),
      }),
      agents: Object.freeze({
        register: (id, metadata, handler) => {
          if (typeof id !== 'string' || typeof handler !== 'function') throw new TypeError('invalid-agent');
          agentHandlers.set(id, handler);
          parent.postMessage({ channel, version, type: 'register-agent', agentId: id, title: metadata && metadata.title }, '*');
        },
        run: (agentId, input) => request('agent:run', { agentId, input }),
      }),
      network: Object.freeze({
        request: (options) => request('network:request', options || {}),
        cancel: (requestId) => request('network:cancel', {requestId}),
        get: (url, options) => request('network:request', { ...(options || {}), url, method: 'GET' }),
        post: (url, body, options) => request('network:request', { ...(options || {}), url, body, method: 'POST' }),
      }),
      home: Object.freeze({
        onChanged: handler => on('home:changed', handler),
        getSettings: () => request('home:getSettings'),
        updateSettings: (patch) => request('home:updateSettings', patch || {}),
        getHistory: (query) => request('home:getHistory', query || {}),
        getHistorySummary: (query) => request('home:getHistorySummary', query || {}),
        getStats: (query) => request('home:getStats', query || {}),
      }),
      lyrics: Object.freeze({
        ...providerWorkflows.lyrics,
        createTimeline: createLyricsTimeline,
        getDisplayPreferences: () => request('lyrics:getDisplayPreferences'),
        onDisplayPreferencesChanged: handler => observeHost('lyrics:watchDisplayPreferences', 'lyrics:display-preferences-changed', handler),
        setCurrentOffset: offsetMs => request('lyrics:setCurrentOffset', { offsetMs }),
        listProviders: () => request('lyrics:listProviders'),
        searchProvider: (providerKey, trackId, query) => request('lyrics:searchProvider', { providerKey, trackId, query }, longRequestTimeoutMs),
        getStoredCandidates: (trackId) => request('lyrics:getStoredCandidates', { trackId }),
        searchCandidates: (trackId, query, providerId) => request('lyrics:searchCandidates', { trackId, query, providerId }, longRequestTimeoutMs),
        previewCandidate: (trackId, candidateId) => request('lyrics:previewCandidate', { trackId, candidateId }),
        applyCandidate: (trackId, candidateId) => request('lyrics:applyCandidate', { trackId, candidateId }),
        applyCustom: (trackId, text, format) => request('lyrics:applyCustom', { trackId, text, format }),
        setOffset: (trackId, offsetMs) => request('lyrics:setOffset', { trackId, offsetMs }),
        markInstrumental: (trackId) => request('lyrics:markInstrumental', { trackId }),
        clearCache: (trackId) => request('lyrics:clearCache', { trackId }),
        registerProvider: (id, metadata, handler) => {
          if (typeof id !== 'string' || typeof handler !== 'function') throw new TypeError('invalid-lyrics-provider');
          lyricsProviderHandlers.set(id, handler);
          parent.postMessage({ channel, version, type: 'register-lyrics-provider', providerId: id, title: metadata && metadata.title }, '*');
        },
        get: (trackId) => request('lyrics:get', trackId === undefined ? {} : { trackId }),
      }),
      metadata: Object.freeze({
        ...providerWorkflows.metadata,
        registerProvider: (id, metadata, handler) => {
          if (typeof id !== 'string' || typeof handler !== 'function') throw new TypeError('invalid-metadata-provider');
          metadataProviderHandlers.set(id, handler);
          parent.postMessage({ channel, version, type: 'register-metadata-provider', providerId: id, title: metadata && metadata.title }, '*');
        },
      }),
      covers: Object.freeze({
        ...providerWorkflows.covers,
        registerProvider: (id, metadata, handler) => {
          if (typeof id !== 'string' || typeof handler !== 'function') throw new TypeError('invalid-cover-provider');
          coverProviderHandlers.set(id, handler);
          parent.postMessage({ channel, version, type: 'register-cover-provider', providerId: id, title: metadata && metadata.title }, '*');
        },
      }),
      settings: Object.freeze({
        get: (settingId) => request('settings:get', settingId === undefined ? {} : { settingId }),
        set: (settingId, value) => request('settings:set', { settingId, value }),
        onChanged: (handler) => on('settings:changed', handler),
      }),
    storage: Object.freeze({
      get: (key) => request('storage:get', { key }),
      set: (key, value) => request('storage:set', { key, value }),
      remove: (key) => request('storage:remove', { key }),
    }),
    files: Object.freeze({
      export: (options) => request('files:export', options || {}, longRequestTimeoutMs),
    }),
    trusted: Object.freeze({
      invoke: (method, input) => request('trusted:invoke', { method, input }, longRequestTimeoutMs),
    }),
    artwork: Object.freeze({
      getPalette: () => request('artwork:getPalette'),
      onPaletteChanged: handler => observeHost('artwork:watchPalette', 'artwork:palette-changed', handler),
    }),
    ui: Object.freeze({
      getLayout: () => request('ui:getLayout'),
      onLayoutChanged: handler => observeHost('ui:watchLayout', 'ui:layout-changed', handler),
      getRenderBudget: () => request('ui:getRenderBudget'),
      onRenderBudgetChanged: handler => observeHost('ui:watchRenderBudget', 'ui:render-budget-changed', handler),
      onDispose: (handler) => { if (typeof handler !== 'function') throw new TypeError('invalid-dispose-handler'); disposeHandlers.add(handler); return () => disposeHandlers.delete(handler); },
      notify: (message) => request('ui:notify', { message }),
      getContext: () => request('ui:getContext'),
      getParentPage: () => request('ui:getParentPage'),
      setPanelPresentation: (presentation) => request('ui:setPanelPresentation', presentation || {}),
      openPanel: (panelId) => request('ui:openPanel', panelId === undefined ? {} : { panelId }),
      closePanel: () => request('ui:closePanel'),
      onContextChanged: (handler) => on('ui:context-changed', handler),
    }),
  });

  Object.defineProperty(globalThis, 'echo', { value: echo, configurable: false, writable: false });
  parent.postMessage({ channel, version, type: 'ready' }, '*');
}
