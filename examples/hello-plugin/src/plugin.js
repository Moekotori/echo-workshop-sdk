/// <reference path="../.echo-sdk/echo-workshop-plugin.d.ts" />

// The smallest useful ECHO Workshop plug-in: one command, one permission
// (playback:read), no network. Every echo.* call must be covered by a
// permission declared in content/community.echo; run `next .` to see what
// the host still allows, and `snippet list` for copy-paste starters.

echo.commands.register('hello-echo', { title: 'Hello ECHO' }, async () => {
  const status = await echo.playback.getStatus();
  await echo.ui.notify(status.currentTrackId ? 'Hello from your first plug-in. Something is playing.' : 'Hello from your first plug-in. Nothing is playing yet.');
});
