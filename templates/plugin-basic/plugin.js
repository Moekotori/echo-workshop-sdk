/// <reference path="../.echo-sdk/echo-workshop-plugin.d.ts" />

echo.commands.register('hello-echo', { title: 'Hello ECHO' }, async () => {
  const status = await echo.playback.getStatus();
  await echo.ui.notify(status.currentTrackId ? 'ECHO plug-in is ready.' : 'ECHO plug-in is ready; nothing is playing.');
});
