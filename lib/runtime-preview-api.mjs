import { createProviderPreview } from './provider-preview.mjs';
import { createLibraryPreview } from './library-preview.mjs';
import { createRuntimeControlPreview } from './runtime-control-preview.mjs';
import { createExtensionsPreview } from './extensions-preview.mjs';
import { createQueuePreview } from './queue-preview.mjs';
import { createLyricsAuthoringPreview } from './lyrics-authoring-preview.mjs';
/** Pure fixture API shared by browser and in-app author previews. Never accesses host services. */
export function createRuntimePreviewApi(options, createControls = createRuntimeControlPreview, createExtensions = createExtensionsPreview, createQueue = createQueuePreview, createAuthoring = createLyricsAuthoringPreview, createLibrary = createLibraryPreview, createProviders = createProviderPreview) {
  const providers = createProviders(options);
  const controls = options.controls ?? createControls(options.emit);
  const extensions = createExtensions(options.extensionItems);
  const queue = options.queuePreview ?? createQueue(options);
  const authoring = createAuthoring(options);
  const library = options.libraryPreview ?? createLibrary({ ...options, play: (items, trackId) => queue.run('queue:playTrack', { trackId, queueTrackIds: items.map(item => item.id) }) });
  const permissions = new Set(options.capabilities);
  if (permissions.has('storage')) permissions.add('fs:plugin');
  const storage = options.storage ?? new Map();
  const parentPage = options.parentPage ?? { routeId: 'home', title: null, pluginPage: null, selection: [] };
  const supported = new Set(['host:getCapabilities', 'host:getFeatureAvailability', 'ui:getContext', 'ui:closePanel',
    'ui:getParentPage', 'ui:notify', 'navigation:open',
    'library:getTracks', 'library:getAlbums', 'library:getAlbumTracks', 'library:getTrack', 'library:getPlaylists',
    'library:getLikedTracks', 'library:getPlaylistItems', 'library:toggleTrackLiked', 'lyrics:get',
    'queue:get', 'queue:playTrack', 'queue:playAlbum', 'queue:playItem', 'playback:getStatus',
    'playback:play', 'playback:pause', 'playback:stop', 'playback:seek', 'playback:setVolume',
    'playback:previous', 'playback:next', 'playback:toggleShuffle', 'playback:cycleRepeat',
    'storage:get', 'storage:set', 'storage:remove']);
  const availability = action => {
    const definition = options.actions[action];
    if (!definition) {
      const matches = Object.entries(options.actions).filter(([, value]) => value.permission === action).map(([id]) => availability(id));
      return matches.find(value => value.available) ?? matches.find(value => value.supported)
        ?? { supported: false, granted: false, available: false, reason: 'feature-disabled' };
    }
    const exists = !!definition && (providers.supports(action) || library.supports(action) || authoring.supports(action) || supported.has(action) || controls.supports(action) || extensions.supports(action) || queue.supports(action));
    const granted = exists && (!definition.permission || permissions.has(definition.permission))
      && (definition.requiredPermissions ?? []).every(permission => permissions.has(permission));
    return { supported: exists, granted, available: granted,
      reason: !exists ? 'feature-disabled' : granted ? null : 'capability-not-approved' };
  };
  const run = (action, payload = {}) => {
    const feature = availability(action);
    if (!feature.supported) throw Error('action-unavailable');
    if (!feature.granted) throw Error('capability-denied');
    if (providers.supports(action)) return providers.run(action, payload);
    if (library.supports(action)) return library.run(action, payload);
    if (authoring.supports(action)) return authoring.run(action, payload);
    if (extensions.supports(action)) return extensions.run(action, payload);
    if (controls.supports(action)) return controls.run(action, payload);
    if (queue.supports(action)) return queue.run(action, payload);
    const state = options.state;
    const tracks = options.tracks;
    const page = items => ({ page: 1, pageSize: items.length, total: items.length, hasMore: false, items });
    if (action === 'host:getCapabilities') return { apiVersion: 2, features: Object.fromEntries(Object.keys(options.actions).map(id => [id, availability(id)])) };
    if (action === 'host:getFeatureAvailability') return availability(payload.featureId);
    if (action === 'ui:getContext') return options.context();
    if (action === 'ui:notify') {
      if (typeof payload.message !== 'string' || !payload.message.trim()) throw Error('invalid-payload');
      options.state.notice = payload.message.trim().slice(0, 240);
      options.changed?.(options.state);
      return null;
    }
    if (action === 'ui:getParentPage') return { ...parentPage, selection: permissions.has('library:read') || permissions.has('library:path')
      ? parentPage.selection.slice(0, 100).map(track => ({ trackId: track.trackId,
        ...(permissions.has('library:path') && track.path ? { path: track.path } : {}) })) : [] };
    if (action === 'navigation:open') {
      if (typeof payload.routeId !== 'string' || !/^[a-z][a-z0-9:._%+-]*$/i.test(payload.routeId)
        || payload.dismissRuntime !== undefined && typeof payload.dismissRuntime !== 'boolean') throw Error('invalid-payload');
      parentPage.routeId = payload.routeId; parentPage.title = null; parentPage.pluginPage = null; parentPage.selection = [];
      if (payload.dismissRuntime !== false) options.close?.();
      return null;
    }
    if (action === 'ui:closePanel') { options.close?.(); return null; }
    if (action === 'lyrics:get') return options.lyrics;
    if (action === 'queue:playAlbum') {
      const album = options.albums.find(album => album.id === payload.albumId);
      if (!album) throw Error('invalid-payload');
      const items = tracks.filter(track => track.album === album.title && !track.unavailable).slice(0, 100);
      if (!items.length) throw Error('track-unavailable');
      queue.run('queue:playTrack', { trackId: items[0].id, queueTrackIds: items.map(track => track.id) });
      return { track: items[0], count: items.length };
    }
    if (action === 'playback:getStatus') return state.playback;
    if (action === 'playback:play') state.playback.state = 'playing';
    if (action === 'playback:pause') state.playback.state = 'paused';
    if (action === 'playback:stop') state.playback.state = 'stopped';
    if (action === 'playback:seek') state.playback.positionSeconds = payload.positionSeconds;
    if (action === 'playback:setVolume') state.playback.volume = payload.volume;
    if (action === 'playback:toggleShuffle') state.playback.shuffleEnabled = !state.playback.shuffleEnabled;
    if (action === 'playback:cycleRepeat') state.playback.repeatMode = state.playback.repeatMode === 'off' ? 'all' : state.playback.repeatMode === 'all' ? 'one' : 'off';
    if (action === 'storage:get') return storage.get(payload.key) ?? null;
    if (action === 'storage:set') { storage.set(payload.key, payload.value); return payload.value; }
    if (action === 'storage:remove') storage.delete(payload.key);
    if (action.startsWith('playback:')) options.emit?.('playback:status', { ...state.playback });
    options.changed?.(state);
    return null;
  };
  return { run, contextChanged: authoring.contextChanged };
}
