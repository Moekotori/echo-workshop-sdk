echo.commands.register('share-current-track', { title: 'Share current local track' }, async () => {
  const info = await echo.playback.getShareInfo();
  if (!info || typeof info !== 'object' || info.available !== true) throw new Error('current-track-not-shareable');
  const task = await echo.playback.shareCurrentTrack({
    uploadUrl: 'https://together.example.invalid/upload',
    roomId: 'author-room',
  });
  return echo.playback.getShareTask(task.id);
});
