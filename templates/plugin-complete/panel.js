echo.library.getSummary().then((summary) => {
  document.getElementById('summary').textContent =
    `Library has ${summary.trackCount || 0} tracks and ${summary.albumCount || 0} albums.`;
}).catch(() => {
  document.getElementById('summary').textContent = 'Library summary is unavailable in this host.';
});

document.getElementById('agent-run').onclick = async () => {
  const value = await echo.agents.run('library-helper', document.getElementById('agent-input').value);
  document.getElementById('agent-result').textContent = JSON.stringify(value, null, 2);
};
