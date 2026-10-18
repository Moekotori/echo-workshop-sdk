/** Session-owned author fixture. Shared by CLI, browser and in-app previews; no host access. */
export function createQueuePreview(options) {
  const streamActions = new Set(['sources:playDirect', 'sources:enqueueDirect', 'sources:playQueue', 'playback:playUrl']);
  const actions = new Set(['queue:get', 'queue:getPage', 'queue:playTrack', 'queue:enqueueTrack',
    'queue:playItem', 'queue:moveItem', 'queue:reorder', 'queue:removeItem', 'queue:clear',
    'playback:previous', 'playback:next']);
  let revision = 0, nextId = 0;
  const sessionId = `workshop-preview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const state = options.state;
  const currentIndex = () => state.queue.items.findIndex(item => item.queueId === state.queue.currentQueueId);
  const summary = () => ({ currentQueueId: state.queue.currentQueueId, currentTrack: state.currentTrack ?? null,
    canGoPrevious: currentIndex() > 0, canGoNext: currentIndex() >= 0 && currentIndex() + 1 < state.queue.items.length,
    shuffleEnabled: state.playback.shuffleEnabled ?? false, repeatMode: state.playback.repeatMode ?? 'off' });
  const snapshot = () => ({ ...summary(), items: state.queue.items.slice(0, 500).map(item => ({ ...item })) });
  const publish = () => {
    revision++;
    Object.assign(state.queue, summary());
    options.emit?.('queue:changed', snapshot());
    options.emit?.('playback:status', { ...state.playback });
    options.changed?.(state);
  };
  const trackById = id => {
    const track = options.tracks.find(track => track.id === id && !track.unavailable);
    if (!track) throw Error('track-unavailable');
    return track;
  };
  const makeItem = track => {
    let queueId;
    do { queueId = `preview-added-${++nextId}`; } while (state.queue.items.some(item => item.queueId === queueId));
    return { queueId, track };
  };
  const select = item => {
    state.queue.currentQueueId = item.queueId; state.currentTrack = item.track;
    Object.assign(state.playback, { currentTrackId: item.track.id, durationSeconds: item.track.durationSeconds,
      positionSeconds: 0, state: 'playing' });
  };
  const run = (action, payload = {}) => {
    if (streamActions.has(action)) {
      const sources = action === 'sources:playQueue' ? (Array.isArray(payload.sources) ? payload.sources.slice(0, 50) : []) : [payload];
      if (!sources.length) throw Error('direct-source-invalid');
      const tracks = sources.map(source => {
        let url;
        try { url = new URL(source.url); } catch { throw Error('direct-source-invalid'); }
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('direct-source-invalid');
        const text = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback;
        const artist = text(source.artist, 'Workshop Direct Source');
        return { id: `preview-stream-${++nextId}`, title: text(source.title, url.hostname),
          artist, album: text(source.album, 'Workshop Streams'), albumArtist: artist,
          mediaType: 'streaming', durationSeconds: 0, live: source.live === true,
          trackNo: null, discNo: null, year: null, genre: null, codec: 'stream', sampleRate: null, bitDepth: null, bitrate: null };
      });
      const items = tracks.map(makeItem);
      if (action === 'sources:enqueueDirect') state.queue.items.push(...items);
      else { state.queue.items = items; select(items[0]); }
      publish();
      return action === 'sources:playQueue' ? { tracks } : { track: tracks[0] };
    }
    if (!actions.has(action)) throw Error('action-unavailable');
    if (action === 'queue:get') return snapshot();
    if (action === 'queue:getPage') {
      const offset = payload.offset === undefined ? 0 : payload.offset;
      const limit = payload.limit === undefined ? 100 : payload.limit;
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100
        || (payload.sessionId !== undefined || payload.revision !== undefined) && (
          typeof payload.sessionId !== 'string' || !payload.sessionId || payload.sessionId.length > 160
          || !Number.isSafeInteger(payload.revision) || payload.revision < 0)) throw Error('invalid-payload');
      if (payload.sessionId !== undefined && (payload.sessionId !== sessionId || payload.revision !== revision)) throw Error('playback_queue_read_stale');
      const items = state.queue.items.slice(offset, offset + limit).map(item => ({ ...item }));
      return { offset, limit, total: state.queue.items.length, hasMore: offset + items.length < state.queue.items.length,
        sessionId, revision, currentQueueId: state.queue.currentQueueId, items };
    }
    if (action === 'queue:playTrack' || action === 'queue:enqueueTrack') {
      const track = trackById(payload.trackId);
      if (action === 'queue:enqueueTrack') state.queue.items.push(makeItem(track));
      else {
        const ids = payload.queueTrackIds ?? [track.id];
        if (!Array.isArray(ids) || ids.length > 200 || ids.some(id => typeof id !== 'string' || !id || id.length > 160)) throw Error('invalid-payload');
        const tracks = [...new Set(ids)].map(trackById);
        if (!tracks.includes(track)) tracks.unshift(track);
        state.queue.items = tracks.map(makeItem);
        select(state.queue.items.find(item => item.track.id === track.id));
      }
      publish(); return { track };
    }
    const index = state.queue.items.findIndex(item => item.queueId === payload.queueId);
    if (['queue:playItem', 'queue:moveItem', 'queue:removeItem'].includes(action) && index < 0) throw Error('invalid-payload');
    if (action === 'queue:playItem') select(state.queue.items[index]);
    if (action === 'queue:moveItem') {
      if (!Number.isInteger(payload.toIndex) || payload.toIndex < 0 || payload.toIndex >= state.queue.items.length) throw Error('invalid-payload');
      state.queue.items.splice(payload.toIndex, 0, state.queue.items.splice(index, 1)[0]);
    }
    if (action === 'queue:reorder') {
      const ids = payload.queueIds;
      const byId = new Map(state.queue.items.map(item => [item.queueId, item]));
      if (!Array.isArray(ids) || ids.length !== byId.size || new Set(ids).size !== byId.size || ids.some(id => !byId.has(id))) throw Error('invalid-payload');
      state.queue.items = ids.map(id => byId.get(id));
    }
    if (action === 'queue:removeItem') state.queue.items.splice(index, 1);
    if (action === 'queue:clear') state.queue.items = [];
    if (action === 'queue:clear' || action === 'queue:removeItem' && payload.queueId === state.queue.currentQueueId) {
      state.queue.currentQueueId = null;
      // Removing a queue occurrence does not stop the host's current audio.
    }
    if (action === 'playback:previous' || action === 'playback:next') {
      const target = currentIndex() + (action === 'playback:previous' ? -1 : 1);
      if (currentIndex() < 0 || target < 0 || target >= state.queue.items.length) return null;
      select(state.queue.items[target]);
    }
    publish(); return null;
  };
  return { supports: action => actions.has(action) || streamActions.has(action), run };
}
