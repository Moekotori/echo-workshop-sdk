import { appendFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createAuthorSetting } from './author-settings.mjs';
const { commandExecution } = JSON.parse(await readFile(new URL('../contracts/plugin-api.json', import.meta.url), 'utf8'));

export const featureOptions = ['command', 'page', 'sidebar', 'setting', 'menu-action', 'player-action', 'track-action'];
const identifier = value => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value)) throw Error('Feature id must contain 1-80 letters, digits, dots, underscores or hyphens');
  return value;
};
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const pageFiles = (id, title) => [
  { path: `page-${id}.html`, content: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="page-${id}.css"></head><body><main><h1>${escapeHtml(title)}</h1><section id="content"></section></main><script src="__bridge__.js"></script><script src="page-${id}.js"></script></body></html>\n` },
  { path: `page-${id}.css`, content: ':root{font-family:system-ui;color-scheme:light dark}body{margin:0;background:var(--appBg);color:var(--text)}main{padding:24px}h1{color:var(--heading);font-size:24px}\n' },
  { path: `page-${id}.js`, content: `const applyContext = context => {
  document.documentElement.lang = context.locale;
  document.documentElement.dir = context.direction;
  document.documentElement.style.colorScheme = context.colorScheme;
  for (const [key, value] of Object.entries(context.appearance)) document.documentElement.style.setProperty('--' + key, value);
};
const off = echo.ui.onContextChanged(applyContext);
echo.ui.onDispose(off);
void echo.ui.getContext().then(applyContext).catch(console.error);
// Add this feature's controls inside #content using the official echo.* APIs.
` },
];

/** Plan first, then write only the selected project's explicit author sources. */
export const addAuthorFeature = async (current, options, projectPath) => {
  if (current.manifest.content.kind !== 'plugin-package') throw Error('Feature entries require a plugin-package project');
  const selected = featureOptions.filter(name => options.has(name));
  if (selected.length !== 1) throw Error('Choose one feature entry per add command');
  const kind = selected[0], id = identifier(options.get(kind));
  const title = options.get('title') ?? id;
  if (typeof title !== 'string' || !title.trim() || title.length > 80) throw Error('Feature title must contain 1-80 characters');
  const contributes = structuredClone(current.entry.manifest.contributes ?? {});
  const listName = { command: 'commands', page: 'panels', sidebar: 'panels', setting: 'settings', 'menu-action': 'mainMenus', 'player-action': 'playerBarActions', 'track-action': 'trackContextMenus' }[kind];
  const list = contributes[listName] ?? [];
  if (list.some(item => item.id === id)) throw Error(`Feature already declared: ${id}`);
  let contribution = { id, title: title.trim() };
  const files = [];
  const sourceRoot = resolve(current.root, 'src');
  let entryPath, commandSource;
  let minEchoVersion = kind === 'page' ? '26.9.25' : kind === 'sidebar' || kind === 'setting' ? '26.10.18' : null;
  if (kind === 'command') {
    if (options.has('timeout-ms')) {
      const timeoutMs = Number(options.get('timeout-ms'));
      if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > commandExecution.maximumTimeoutMs) throw Error(`Command timeout must be an integer from 1 to ${commandExecution.maximumTimeoutMs} milliseconds`);
      contribution.timeoutMs = timeoutMs;
      minEchoVersion = '26.10.18';
    }
    if (options.has('confirm')) {
      const confirm = options.get('confirm').trim();
      if (!confirm || confirm.length > 240) throw Error('Confirmation must contain 1-240 characters');
      contribution.confirm = confirm;
    }
    entryPath = projectPath(sourceRoot, current.entry.manifest.entry, 'manifest.entry');
    const entryStat = await lstat(entryPath);
    if (!entryStat.isFile() || entryStat.isSymbolicLink()) throw Error('Plug-in entry must be an author source file');
    await readFile(entryPath, 'utf8');
    commandSource = `\n// Implement this feature with the official echo.* APIs. Track menus pass a sanitized selection as input.\necho.commands.register(${JSON.stringify(id)}, { title: ${JSON.stringify(title.trim())} }, async (input) => {\n  await echo.ui.notify(${JSON.stringify(title.trim())});\n  return input ?? null;\n});\n`;
  } else if (kind === 'setting') {
    contribution = createAuthorSetting(id, title.trim(), options);
  } else if (kind === 'page' || kind === 'sidebar') {
    const group = options.get('group') ?? 'plugins';
    if (!['library', 'sources', 'playback', 'plugins'].includes(group)) throw Error('Unknown page group');
    contribution = { ...contribution, path: `page-${id}.html`, placement: 'page', group };
    files.push(...pageFiles(id, title.trim()));
  } else {
    const commandId = identifier(options.get('command-id'));
    const command = (contributes.commands ?? []).find(item => item.id === commandId);
    if (!command) throw Error(`Declare the target command first: ${commandId}`);
    if ((command.parameters?.length ?? 0) > 0 || command.confirm) minEchoVersion = '26.10.18';
    contribution.commandId = commandId;
    if (kind === 'player-action') contribution.icon = 'sparkles';
    if (kind === 'track-action') {
      const selection = options.get('selection') ?? 'single';
      if (!['single', 'multiple'].includes(selection)) throw Error('Unknown track selection');
      contribution.selection = selection;
    }
  }
  for (const file of files) {
    const target = projectPath(sourceRoot, file.path, 'feature.path');
    try { await lstat(target); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    throw Error(`Author file already exists: ${file.path}`);
  }
  for (const file of files) {
    const target = projectPath(sourceRoot, file.path, 'feature.path');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, { flag: 'wx' });
  }
  if (commandSource) await appendFile(entryPath, commandSource, 'utf8');
  contributes[listName] = [...list, contribution];
  const permissions = kind === 'setting'
    ? [...new Set([...(current.entry.manifest.permissions ?? []), 'fs:plugin'])]
    : current.entry.manifest.permissions;
  return { entry: { ...current.entry, manifest: { ...current.entry.manifest, permissions, contributes } },
    minEchoVersion, change: `Added ${kind} ${id}` };
};
