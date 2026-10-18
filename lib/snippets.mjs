// Copy-paste starters for the most common Workshop authoring moves.
// Every snippet stays inside the host whitelist: the listed permissions or
// capabilities must be declared before the code can run, locally and in
// production. `snippet <name>` prints one; init also writes the same set to
// .vscode/echo-workshop.code-snippets for editor expansion.

export const workshopSnippets = [
  {
    name: 'installed-features', kind: 'plugin-package / shell theme', target: 'your UI script',
    requires: ['extensions:read', 'extensions:launch'],
    summary: 'Discover installed commands/pages and launch them through the normal host UI.',
    notes: 'Requires ECHO 26.10.18. launch accepts an opaque key, preserves host forms and confirmation, and returns no command result.',
    code: `const refreshFeatures = async () => {
  const page = await echo.extensions.list({ page: 1, pageSize: 40 });
  const list = document.getElementById('features');
  list.replaceChildren(...page.items.map(item => {
    const button = document.createElement('button'); button.textContent = item.title;
    button.onclick = () => { void echo.extensions.launch(item.key).catch(console.error); };
    return button;
  }));
};
const off = echo.extensions.onChanged(() => { void refreshFeatures().catch(console.error); });
echo.ui.onDispose(off);
void refreshFeatures().catch(console.error);
`,
  },
  {
    name: 'ui-runtime-controls', kind: 'theme', target: 'content/ui/app.js',
    requires: ['audio:dsp-read', 'audio:dsp-write', 'companion:control', 'sleep-timer:control', 'media-session:control'],
    summary: 'Build custom DSP and companion controls in a complete shell interface.',
    notes: 'Load __bridge__.js first. Invoke setters from your own controls; native DSP checks remain in effect.',
    code: `const readEq = () => echo.audio.dsp.getModule('equalizer');
const setEqPreamp = preampDb => echo.audio.dsp.setModule('equalizer', { preampDb });
const showLyrics = () => echo.companion.desktopLyrics.show();
const sleepAfter = durationMinutes => echo.sleepTimer.start({ durationMinutes, action: 'pause', fadeOut: true });
const stops = [
  echo.companion.onState(state => console.log('companion', state)),
  echo.sleepTimer.onTick(tick => console.log('timer', tick.remainingMs)),
  echo.mediaSession.onCommand(command => console.log('media command', command)),
];
echo.ui.onDispose(() => { for (const stop of stops) stop(); });
`,
  },
  {
    name: 'plugin-command',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['playback:read'],
    summary: 'Register a command that reads playback status and notifies.',
    notes: 'Command ids must be unique inside the plug-in and declared under contributes.commands.',
    code: `echo.commands.register('my-command', { title: 'My command' }, async () => {
  const status = await echo.playback.getStatus();
  await echo.ui.notify(status.currentTrackId ? 'Something is playing.' : 'Nothing is playing.');
});
`,
  },
  {
    name: 'plugin-storage',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['fs:plugin'],
    summary: 'Persist a small JSON value in the plug-in sandbox store.',
    notes: 'The store holds small JSON only. It is not a credential vault and never sees file paths.',
    code: `const preferences = (await echo.storage.get('preferences')) ?? { compact: false };
preferences.compact = !preferences.compact;
await echo.storage.set('preferences', preferences);
`,
  },
  {
    name: 'plugin-function',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['fs:plugin'],
    summary: 'Handle a host-rendered parameter form and compose another local command.',
    notes: 'Declare matching contributes.commands[].parameters in community.echo. From ECHO 26.10.18, dock, menu, player and track actions use the host form. Track handlers receive values first and the sanitized selection second.',
    code: `echo.commands.register('save-note', { title: 'Save note' }, async (input = {}) => {
  const summary = await echo.commands.execute('library-summary');
  const name = String(input.name || 'library-note').slice(0, 80);
  const limit = Math.max(1, Math.min(100, Number(input.limit) || 20));
  await echo.storage.set('library-note', { name, limit, trackCount: summary.trackCount || 0 });
  await echo.ui.notify(\`Saved \${name}.\`);
});
`,
  },
  {
    name: 'plugin-settings',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['fs:plugin'],
    summary: 'Read a setting declared under contributes.settings.',
    notes: 'Settings must be declared in the manifest first; undeclared ids are rejected.',
    code: `const compact = await echo.settings.get('compact-layout');
await echo.ui.notify(compact ? 'Compact layout is on.' : 'Compact layout is off.');
`,
  },
  {
    name: 'lyrics-provider',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['lyrics:provide'],
    summary: 'Offer lyrics candidates the user can pick in the host selector.',
    notes: 'Declare a matching entry under contributes.lyricsProviders. The host owns saving and playback sync.',
    code: `echo.lyrics.registerProvider('my-lyrics', { title: 'My lyrics' }, async ({ track, query }) => ({
  candidates: [{
    title: track.title,
    source: 'My packaged catalog',
    language: 'und',
    confidence: 0.5,
    text: \`[00:00.00]\${query || track.title}\`,
  }],
}));
`,
  },
  {
    name: 'source-provider',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['sources:provide', 'sources:direct', 'network:request'],
    summary: 'Author-owned catalog: search rows plus a single direct-stream resolve.',
    notes: 'network:request also needs networkHosts on the outer manifest. resolve must return one user-confirmed HTTP(S) direct stream; platform scraping stays forbidden.',
    code: `echo.sources.registerProvider('my-catalog', { title: 'My catalog' }, {
  search: async ({ query, page, pageSize }) => {
    const response = await echo.network.get(
      \`https://catalog.example/tracks?q=\${encodeURIComponent(query || '')}&page=\${page}&pageSize=\${pageSize}\`,
    );
    const payload = JSON.parse(response.body);
    const tracks = Array.isArray(payload?.tracks) ? payload.tracks : [];
    return { tracks, total: payload?.total ?? tracks.length, hasMore: payload?.hasMore === true };
  },
  resolve: async ({ providerTrackId }) => {
    const response = await echo.network.get(\`https://catalog.example/resolve/\${encodeURIComponent(providerTrackId)}\`);
    const payload = JSON.parse(response.body);
    return { url: payload.url, title: payload.title, artist: payload.artist };
  },
});
`,
  },
  {
    name: 'network-fetch',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['network:request'],
    summary: 'Fetch JSON from a declared networkHosts destination with correct error handling.',
    notes: 'The destination must be listed in the outer manifest networkHosts (plain public host, default port). Never auto-retry a user denial; only rate limits and read timeouts may back off.',
    code: `const loadCatalogPage = async (page) => {
  try {
    const response = await echo.network.get(\`https://catalog.example/tracks?page=\${page}\`);
    return JSON.parse(response.body);
  } catch (error) {
    // capability-denied / network-host-denied: fix the declaration, do not retry in a loop.
    await echo.ui.notify(\`Catalog request failed: \${error instanceof Error ? error.message : error}\`);
    return null;
  }
};
`,
  },
  {
    name: 'plugin-agent',
    kind: 'plugin-package',
    target: 'src/plugin.js',
    requires: ['agent:runtime', 'library:read'],
    summary: 'Register a local Agent handler that answers from sanitized data.',
    notes: 'Declare a matching entry under contributes.agents. Agents run locally; they receive sanitized inputs only.',
    code: `echo.agents.register('my-helper', { title: 'My helper' }, async (input) => {
  const summary = await echo.library.getSummary();
  return { input: String(input || ''), answer: \`Your local library contains \${summary.trackCount || 0} track(s).\` };
});
`,
  },
  {
    name: 'trusted-handler',
    kind: 'plugin-package',
    target: 'src/trusted.mjs',
    requires: ['system:full'],
    summary: 'Handle one request in the subscriber-approved Node.js utility process.',
    notes: 'Start with --recipe full-trust-plugin. You own the Node toolchain and dependencies; ECHO only packages and launches the verified module after approval.',
    code: `export async function handle({ method, input }, context) {
  if (method === 'runtime-info') {
    return {
      input,
      pluginId: context.pluginId,
      node: process.versions.node,
      platform: process.platform,
    };
  }
  throw new Error(\`Unknown trusted method: \${method}\`);
}
`,
  },
  {
    name: 'ui-runtime-init',
    kind: 'theme',
    target: 'content/ui/app.js',
    requires: ['capability: declare each command group in runtime.capabilities'],
    summary: 'Full UI runtime using the same official echo.* SDK as sandbox plug-ins.',
    notes: 'Requires ECHO 26.10.18 and __bridge__.js before app.js. Declare playback:read and library:read. The host owns permissions and emergency exit.',
    code: `const applyContext = context => {
  document.documentElement.style.colorScheme = context.colorScheme;
  document.documentElement.lang = context.locale;
  document.documentElement.dir = context.direction;
};
const stops = [
  echo.ui.onContextChanged(applyContext),
  echo.events.on('playback:status', state => {
    document.getElementById('play-pause').textContent = state.state === 'playing' ? 'Pause' : 'Play';
  }),
];
void echo.ui.getContext().then(applyContext).catch(console.error);
void echo.library.getTracks({ page: 1, pageSize: 40 }).then(page => {
  document.getElementById('tracks').replaceChildren(...page.items.map(track => {
    const row = document.createElement('li'); row.textContent = track.title; return row;
  }));
}).catch(console.error);
echo.ui.onDispose(() => { for (const stop of stops) stop(); });
`,
  },
  {
    name: 'theme-colors',
    kind: 'theme',
    target: 'content/theme.json',
    requires: [],
    summary: 'Dark/light tone override block for a colors-layer theme.',
    notes: 'basePreset must stay a public host preset such as classic. FINAL, nyanCat and darkSideMoon are rejected.',
    code: `{
  "basePreset": "classic",
  "dark": {
    "appBg": "#10131a",
    "panel": "#182231",
    "accent": "#66ccff",
    "heading": "#f5fbff",
    "text": "#d8e8f3"
  },
  "light": {
    "appBg": "#eef8fc",
    "panel": "#f8fdff",
    "accent": "#0b78d0",
    "text": "#254252"
  },
  "swatches": ["#10131a", "#66ccff", "#eef8fc"]
}
`,
  },
  {
    name: 'lyrics-slot',
    kind: 'lyrics-style',
    target: 'content/lyrics-scene.json (inside scene.root.children)',
    requires: [],
    summary: 'One host-owned slot node for a lyrics scene.',
    notes: 'Only host slots are accepted; run next . to list what can still be added, or add . --slot <slot> to avoid hand-editing.',
    code: `{
  "id": "spectrum",
  "type": "slot",
  "slot": "spectrum"
}
`,
  },
];

export const snippetNames = workshopSnippets.map((snippet) => snippet.name);

export const findSnippet = (name) => {
  const snippet = workshopSnippets.find((entry) => entry.name === name);
  if (!snippet) {
    throw new Error(`Unknown snippet ${name}. Use: ${snippetNames.join(', ')}`);
  }
  return snippet;
};

export const formatSnippetList = () => [
  'Copy-paste snippets (snippet <name> prints one):',
  ...workshopSnippets.map((snippet) => `  ${snippet.name.padEnd(18)} ${snippet.kind.padEnd(14)} ${snippet.summary}`),
  'Each snippet lists the permissions or capabilities it needs. These commands never upload.',
].join('\n');

export const formatSnippet = (snippet) => [
  `${snippet.name} — ${snippet.summary}`,
  `  paste into  ${snippet.target}`,
  `  requires    ${snippet.requires.length > 0 ? snippet.requires.join(', ') : '(nothing extra)'}`,
  `  note        ${snippet.notes}`,
  '',
  snippet.code.trimEnd(),
].join('\n');

const vsCodeScopeForSnippet = (snippet) => (
  snippet.target.includes('.json') ? 'json,jsonc' : 'javascript'
);

// Project-local VS Code snippet file. Typing the echo- prefix expands the same
// starters the snippet command prints, without leaving the editor.
export const createVsCodeSnippetsFile = () => {
  const entries = {};
  for (const snippet of workshopSnippets) {
    entries[`ECHO Workshop: ${snippet.name}`] = {
      prefix: `echo-${snippet.name}`,
      scope: vsCodeScopeForSnippet(snippet),
      description: `${snippet.summary} Requires: ${snippet.requires.join(', ') || 'nothing extra'}.`,
      body: snippet.code.replaceAll('$', '\\$').trimEnd().split('\n'),
    };
  }
  return entries;
};
