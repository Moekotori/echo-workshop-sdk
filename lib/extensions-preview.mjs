/** Fixed author fixtures; launching them never invokes an installed plug-in. */
export function createExtensionsPreview(items = [
  { key: 'fixture:tools:command', kind: 'command', id: 'inspect', title: 'Inspect library', description: null,
    pluginId: 'fixture.tools', pluginName: 'Fixture tools', ready: true, hasParameters: false, requiresConfirmation: false },
  { key: 'fixture:tools:page', kind: 'page', id: 'tools', title: 'Tools', description: null,
    pluginId: 'fixture.tools', pluginName: 'Fixture tools', ready: true, hasParameters: false, requiresConfirmation: false },
]) {
  const supports = action => action === 'extensions:list' || action === 'extensions:launch';
  const run = (action, payload = {}) => {
    if (action === 'extensions:launch') {
      if (!items.some(item => item.key === payload.key)) throw Error('extension-unavailable');
      return null;
    }
    const page = payload.page ?? 1, pageSize = payload.pageSize ?? 40;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw Error('invalid-payload');
    const search = String(payload.search ?? '').trim().toLowerCase();
    const matches = items.filter(item => (!payload.kind || item.kind === payload.kind)
      && (!search || `${item.pluginName} ${item.title}`.toLowerCase().includes(search)));
    const offset = (page - 1) * pageSize;
    return { page, pageSize, total: matches.length, hasMore: offset + pageSize < matches.length,
      items: matches.slice(offset, offset + pageSize).map(item => ({ ...item })) };
  };
  return { supports, run };
}
