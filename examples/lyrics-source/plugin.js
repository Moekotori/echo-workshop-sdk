echo.lyrics.registerProvider('community-lyrics', { title: 'Community lyrics' }, async ({ track, query }) => ({
  candidates: [{
    title: track.title,
    source: 'Author-provided catalog',
    language: 'und',
    confidence: 0.5,
    text: `[00:00.00]${query || track.title}`,
  }],
}));
