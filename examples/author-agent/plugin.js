echo.agents.register('library-guide', { title: 'Library guide' }, async (input) => {
  const summary = await echo.library.getSummary();
  return { input: String(input || ''), answer: `Your local library contains ${summary.trackCount || 0} tracks.` };
});
