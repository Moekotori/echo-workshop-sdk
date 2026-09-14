const root = document.documentElement;
const presentation = { title: 'Workshop Plugin', badge: 'API 2', size: 'wide' };

const applyHostContext = (context) => {
  root.dataset.colorScheme = context.colorScheme;
  root.lang = context.locale;
  root.dir = context.direction;
  root.style.colorScheme = context.colorScheme;
  for (const [name, value] of Object.entries(context.appearance)) {
    root.style.setProperty(`--echo-host-${name}`, value);
  }
  document.getElementById('host-context').textContent =
    `${context.viewport.width} × ${context.viewport.height} · ${context.locale}`;
};

echo.ui.getContext().then(applyHostContext);
echo.ui.onContextChanged(applyHostContext);
echo.ui.setPanelPresentation(presentation);

echo.library.getSummary().then((summary) => {
  document.getElementById('summary').textContent =
    `Library has ${summary.trackCount || 0} tracks and ${summary.albumCount || 0} albums.`;
}).catch(() => {
  document.getElementById('summary').textContent = 'Library summary is unavailable in this host.';
});

document.getElementById('agent-input').addEventListener('input', () => {
  echo.ui.setPanelPresentation({ ...presentation, dirty: true });
});

document.getElementById('agent-run').onclick = async () => {
  const value = await echo.agents.run('library-helper', document.getElementById('agent-input').value);
  document.getElementById('agent-result').textContent = JSON.stringify(value, null, 2);
  await echo.ui.setPanelPresentation({ ...presentation, dirty: false, badge: 'DONE' });
};

document.getElementById('panel-close').onclick = () => echo.ui.closePanel();
