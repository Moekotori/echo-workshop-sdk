const pending = new Map();
let requestSeq = 0;
let currentTrackId = null;
let libraryRevision = 0;

const command = (name, payload = {}) => new Promise((resolve, reject) => {
  const requestId = `sdk-${++requestSeq}`;
  pending.set(requestId, { resolve, reject });
  parent.postMessage({ type: 'echo:workshop-ui:command', requestId, command: name, payload }, '*');
});

const text = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
};

const renderList = (id, items, onClick) => {
  const list = document.getElementById(id);
  if (!list) return;
  list.replaceChildren();
  for (const item of items) {
    const row = document.createElement('li');
    row.textContent = item.label;
    row.addEventListener('click', () => onClick(item));
    list.append(row);
  }
};

const applyAppearance = (appearance) => {
  if (!appearance || typeof appearance !== 'object') return;
  const root = document.documentElement.style;
  if (appearance.accent) root.setProperty('--accent', appearance.accent);
  if (appearance.panel) root.setProperty('--panel', appearance.panel);
  if (appearance.text) root.setProperty('--ink', appearance.text);
  if (appearance.muted) root.setProperty('--muted', appearance.muted);
  if (appearance.border) root.setProperty('--line', appearance.border);
  if (appearance.appBg) document.body.style.background = appearance.appBg;
};

const refreshLibrary = async (search = '') => {
  const page = await command('library:listTracks', { page: 1, pageSize: 40, search });
  const items = Array.isArray(page?.items) ? page.items : [];
  renderList('tracks', items.map((track) => ({
    id: track.id,
    label: `${track.title || 'Untitled'} · ${track.artist || 'Unknown artist'}`,
  })), (track) => command('queue:playTrack', { trackId: track.id }));
  const albums = await command('library:listAlbums', { page: 1, pageSize: 24, search }).catch(() => ({ items: [] }));
  const albumItems = Array.isArray(albums?.items) ? albums.items : [];
  renderList('albums', albumItems.map((album) => ({
    id: album.id,
    label: `${album.title || 'Album'} · ${album.albumArtist || ''}`,
  })), async (album) => {
    await command('queue:playAlbum', { albumId: album.id });
  });
};

const paintSpectrum = (spectrum) => {
  const root = document.getElementById('spectrum');
  if (!root) return;
  const bands = Array.isArray(spectrum?.bands) ? spectrum.bands.slice(0, 24) : [];
  root.replaceChildren();
  for (const band of bands) {
    const bar = document.createElement('span');
    bar.style.height = `${Math.max(8, Math.round((Number(band) || 0) * 100))}%`;
    root.append(bar);
  }
};

const refreshLyrics = async (trackId) => {
  if (!trackId) { text('now-lyrics', ''); return; }
  const lyrics = await command('lyrics:get', { trackId }).catch(() => null);
  const line = Array.isArray(lyrics?.lines) && lyrics.lines[0] ? lyrics.lines[0].text : '';
  text('now-lyrics', line || '');
};

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'echo:workshop-ui:init') {
    applyAppearance(data.appearance);
    return;
  }
  if (data.type === 'echo:workshop-ui:state') {
    const nextId = data.playback?.currentTrackId ?? data.currentTrack?.id ?? null;
    if (nextId !== currentTrackId) {
      currentTrackId = nextId;
      if (!data.lyrics) void refreshLyrics(currentTrackId);
    }
    text('now-title', data.currentTrack?.title || (data.playback?.state === 'playing' ? 'Playing' : 'Nothing playing'));
    text('now-artist', data.currentTrack?.artist || '');
    text('now-lyrics', data.lyrics?.currentText || '');
    text('play-pause', data.playback?.state === 'playing' ? 'Pause' : 'Play');
    text('shuffle', data.playback?.shuffleEnabled ? 'Shuffle on' : 'Shuffle');
    text('repeat', data.playback?.repeatMode === 'one' ? 'Repeat one' : data.playback?.repeatMode === 'all' ? 'Repeat all' : 'Repeat');
    text('like', data.currentTrack?.liked ? 'Liked' : 'Like');
    paintSpectrum(data.spectrum);
    if (typeof data.library?.revision === 'number' && data.library.revision > libraryRevision) {
      libraryRevision = data.library.revision;
      void refreshLibrary(String(document.getElementById('search')?.value || '').trim());
    }
    const queueItems = Array.isArray(data.queue?.items) ? data.queue.items : [];
    renderList('queue', queueItems.map((item) => ({
      id: item.queueId,
      label: item.track?.title || item.queueId,
    })), (item) => command('queue:playItem', { queueId: item.id }));
    return;
  }
  if (data.type !== 'echo:workshop-ui:result') return;
  const waiter = pending.get(data.requestId);
  if (!waiter) return;
  pending.delete(data.requestId);
  if (data.ok) waiter.resolve(data.value);
  else waiter.reject(new Error(data.error || 'command-failed'));
});

document.getElementById('search')?.addEventListener('input', (event) => {
  const query = String(event.target.value || '').trim();
  void command('storage:set', { key: 'search', value: query }).catch(() => undefined);
  void refreshLibrary(query);
});
document.getElementById('play-pause')?.addEventListener('click', () => { void command('playPause'); });
document.getElementById('previous')?.addEventListener('click', () => { void command('previous'); });
document.getElementById('next')?.addEventListener('click', () => { void command('next'); });
document.getElementById('shuffle')?.addEventListener('click', () => { void command('toggleShuffle'); });
document.getElementById('repeat')?.addEventListener('click', () => { void command('cycleRepeat'); });
document.getElementById('like')?.addEventListener('click', () => {
  if (currentTrackId) void command('library:toggleLiked', { trackId: currentTrackId });
});

parent.postMessage({ type: 'echo:workshop-ui:ready' }, '*');
void command('storage:get', { key: 'search' }).then((value) => {
  const query = typeof value === 'string' ? value : '';
  const search = document.getElementById('search');
  if (search && query) search.value = query;
  return refreshLibrary(query);
}).catch(() => refreshLibrary());
