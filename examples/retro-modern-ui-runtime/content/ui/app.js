const stops = [];
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
