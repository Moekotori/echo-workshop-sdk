echo.metadata.registerProvider('clean-tags', { title: 'Clean tag candidates' }, async ({ track }) => ({
  candidates: [{ title: track.title, artist: track.artist, album: track.album, source: 'Author catalog', confidence: 0.7 }],
}));

echo.covers.registerProvider('owned-covers', { title: 'Owned cover candidates' }, async () => ({
  candidates: [],
}));
