/// <reference path="../.echo-sdk/echo-workshop-plugin.d.ts" />

echo.commands.register('current-lyrics', { title: 'Current lyrics' }, async () => {
  const lyrics = await echo.lyrics.get();
  const line = lyrics && Array.isArray(lyrics.lines) && lyrics.lines[0] ? lyrics.lines[0].text : '';
  await echo.ui.notify(line || lyrics?.title || 'No lyrics for the current track.');
});

echo.lyrics.registerProvider('authored-lyrics', { title: 'Authored lyrics' }, async ({ track, query }) => ({
  candidates: [{
    title: track.title,
    source: 'Packaged catalog',
    language: 'und',
    confidence: 0.5,
    text: `[00:00.00]${query || track.title}`,
  }],
}));
