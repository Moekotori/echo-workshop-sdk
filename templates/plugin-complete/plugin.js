/// <reference path="../.echo-sdk/echo-workshop-plugin.d.ts" />

echo.commands.register('library-summary', { title: 'Library summary' }, async () => {
  const summary = await echo.library.getSummary();
  await echo.storage.set('lastSummary', summary);
  await echo.ui.notify(`Library has ${summary.trackCount || 0} tracks.`);
  return summary;
});

echo.commands.register('save-library-note', { title: 'Save a custom library note' }, async (input = {}) => {
  const summary = await echo.commands.execute('library-summary');
  const note = {
    name: String(input.name || 'library-note'),
    style: input.style === 'detailed' ? 'detailed' : 'brief',
    includeAlbums: input.includeAlbums === true,
    limit: Math.max(1, Math.min(100, Number(input.limit) || 20)),
    trackCount: summary.trackCount || 0,
    albumCount: input.includeAlbums === true ? summary.albumCount || 0 : null,
  };
  await echo.storage.set(`note:${note.name}`, note);
  await echo.ui.notify(`Saved ${note.name}.`);
  return note;
});

echo.commands.register('inspect-track', { title: 'Inspect track' }, async (track) => {
  const item = track && typeof track === 'object' ? track : {};
  await echo.ui.notify(`${item.title || 'Track'} · ${item.codec || 'unknown'} · ${item.sampleRate || 0} Hz`);
});

echo.agents.register('library-helper', { title: 'Library helper' }, async (input) => {
  const summary = await echo.library.getSummary();
  const settings = await echo.settings.get();
  const detailed = settings['summary-style'] === 'detailed';
  const answer = detailed
    ? `Local library has ${summary.trackCount || 0} tracks and ${summary.albumCount || 0} albums.`
    : `Local library has ${summary.trackCount || 0} tracks.`;
  if (settings['show-notifications']) await echo.ui.notify('Library summary ready');
  return { input: String(input || ''), answer };
});

echo.lyrics.registerProvider('sample-lyrics', { title: 'Sample lyrics source' }, async ({ track, query }) => ({
  candidates: [{
    title: track.title,
    source: 'Packaged catalog',
    language: 'und',
    confidence: 0.5,
    text: `[00:00.00]${query || track.title}`,
  }],
}));

echo.metadata.registerProvider('sample-metadata', { title: 'Sample metadata provider' }, async ({ track }) => ({
  candidates: [{ title: track.title, artist: track.artist, album: track.album, source: 'Packaged catalog', confidence: 0.5 }],
}));

echo.covers.registerProvider('sample-covers', { title: 'Sample cover provider' }, async () => ({
  candidates: [],
}));

const stations = [
  { providerTrackId: 'harbor', title: 'Harbor Signal', artist: 'ECHO Fixtures', source: 'Packaged catalog', playable: true },
];

echo.sources.registerProvider('packaged-radio', { title: 'Packaged catalog' }, {
  search: async ({ query }) => {
    const term = String(query || '').toLowerCase();
    const tracks = stations.filter((station) => !term || station.title.toLowerCase().includes(term));
    return { tracks, total: tracks.length, hasMore: false };
  },
  resolve: async ({ providerTrackId }) => ({
    url: `https://audio.example.invalid/${encodeURIComponent(providerTrackId || 'harbor')}.mp3`,
    title: 'Harbor Signal',
    artist: 'ECHO Fixtures',
    live: true,
  }),
});
