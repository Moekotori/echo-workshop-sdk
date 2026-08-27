const text = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
};

const renderAlbums = async () => {
  const page = await echo.library.getAlbums({ page: 1, pageSize: 12 }).catch(() => ({ items: [] }));
  const list = document.getElementById('albums');
  if (!list) return;
  list.replaceChildren();
  for (const album of page.items || []) {
    const row = document.createElement('li');
    row.textContent = `${album.title || 'Album'} · ${album.albumArtist || ''}`;
    list.append(row);
  }
};

const refresh = async () => {
  const status = await echo.playback.getStatus().catch(() => null);
  const lyrics = await echo.lyrics.get().catch(() => null);
  text('now-playing', status?.currentTrackId ? `Track ${status.currentTrackId}` : 'Nothing playing');
  const lines = Array.isArray(lyrics?.lines) ? lyrics.lines.map((line) => line.text).filter(Boolean) : [];
  text('lyrics', lines.slice(0, 12).join('\n') || lyrics?.plainText || 'No lyrics for the current track.');
};

echo.events.on('playback:status', () => { void refresh(); });
void refresh();
void renderAlbums();
