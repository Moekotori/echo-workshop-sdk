/// <reference path="../../../echo-workshop-plugin.d.ts" />

echo.commands.register('runtime-info', { title: 'Show trusted runtime info' }, async () => {
  try {
    /** @type {{ node?: string, platform?: string, arch?: string }} */
    const info = await echo.trusted.invoke('runtime-info');
    await echo.ui.notify(`Node ${info.node ?? '?'} · ${info.platform ?? '?'} · ${info.arch ?? '?'}`);
    return info;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('mock host does not execute full-trust code')) {
      await echo.ui.notify('Manifest and bridge verified. Run this command inside ECHO to execute trusted.mjs.');
      return { mockOnly: true };
    }
    throw error;
  }
});
