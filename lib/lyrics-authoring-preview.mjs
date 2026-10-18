/** Fixture implementation only: no native audio, media writes or host settings. */
export function createLyricsAuthoringPreview(options = {}) {
  const declarations = options.settings ?? [];
  const defaults = Object.fromEntries(declarations.map(setting => [setting.id, setting.defaultValue
    ?? (setting.type === 'boolean' ? false : ['number', 'range'].includes(setting.type) ? setting.min ?? 0
      : setting.type === 'select' ? setting.options?.[0]?.value ?? null : setting.type === 'color' ? '#66ccff' : '')]));
  const storage = options.storage ?? new Map();
  const values = () => Object.fromEntries(declarations.map(setting => [setting.id,
    storage.has(`__settings.${setting.id}`) ? storage.get(`__settings.${setting.id}`) : defaults[setting.id]]));
  const actions = new Set(['lyrics:getDisplayPreferences', 'lyrics:watchDisplayPreferences', 'lyrics:setCurrentOffset',
    'artwork:getPalette', 'artwork:watchPalette', 'ui:getLayout', 'ui:watchLayout', 'ui:getRenderBudget', 'ui:watchRenderBudget',
    'settings:get', 'settings:set']);
  const trackId = () => options.state?.playback?.currentTrackId ?? 'preview-track';
  const preferences = { fontFamily: null, fontUrl: null, fontSizePx: 40, secondaryFontSizePx: 22,
    translationEnabled: true, romanizationEnabled: true, wordHighlightEnabled: true, textDirection: 'horizontal' };
  const layout = () => ({ viewport: options.context?.().viewport ?? { width: 1200, height: 800 },
    safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }, occlusions: [] });
  const budget = () => {
    const context = options.context?.() ?? { visible: true, reducedMotion: false };
    return { mode: context.visible ? 'active' : 'hidden', visible: context.visible,
      frameIntervalMs: context.visible ? 1000 / 30 : null, allowDecorativeMotion: context.visible && !context.reducedMotion,
      reducedMotion: context.reducedMotion };
  };
  const palette = () => ({ trackId: trackId(), colors: ['#183447', '#c88972'] });
  const watches = new Set();
  const contextChanged = () => {
    if (watches.has('ui:watchLayout')) options.emit?.('ui:layout-changed', layout());
    if (watches.has('ui:watchRenderBudget')) options.emit?.('ui:render-budget-changed', budget());
  };
  const run = (action, payload = {}) => {
    if (!actions.has(action)) throw Error('action-unavailable');
    if (action.includes(':watch')) {
      if (typeof payload.enabled !== 'boolean') throw Error('invalid-payload');
      if (payload.enabled) watches.add(action); else watches.delete(action);
      if (payload.enabled) {
        const [event, value] = action === 'artwork:watchPalette' ? ['artwork:palette-changed', palette()]
          : action === 'lyrics:watchDisplayPreferences' ? ['lyrics:display-preferences-changed', preferences]
            : action === 'ui:watchLayout' ? ['ui:layout-changed', layout()] : ['ui:render-budget-changed', budget()];
        options.emit?.(event, value);
      }
      return null;
    }
    if (action === 'lyrics:getDisplayPreferences') return { ...preferences };
    if (action === 'artwork:getPalette') return palette();
    if (action === 'ui:getLayout') return layout();
    if (action === 'ui:getRenderBudget') return budget();
    if (action === 'lyrics:setCurrentOffset') {
      if (!Number.isFinite(payload.offsetMs) || Math.abs(payload.offsetMs) > 60000) throw Error('lyrics-offset-invalid');
      if (!options.lyrics) throw Error('current-track-required');
      options.lyrics.offsetMs = payload.offsetMs;
      options.emit?.('lyrics:changed', { trackId: trackId(), revision: 1, lyrics: options.lyrics });
      return options.lyrics;
    }
    if (action === 'settings:get') {
      if (payload.settingId === undefined) return values();
      if (!Object.hasOwn(defaults, payload.settingId)) throw Error('setting-undeclared');
      return values()[payload.settingId];
    }
    const setting = declarations.find(value => value.id === payload.settingId), value = payload.value;
    if (!setting) throw Error('setting-undeclared');
    const valid = value === null ? !setting.required
      : setting.type === 'boolean' ? typeof value === 'boolean'
        : ['number', 'range'].includes(setting.type) ? Number.isFinite(value) && value >= (setting.min ?? -Infinity) && value <= (setting.max ?? Infinity)
          : typeof value === 'string' && (!setting.required || value.trim())
            && (setting.type !== 'color' || /^#[0-9a-f]{6}$/i.test(value))
            && (setting.type !== 'select' || setting.options.some(option => option.value === value));
    if (!valid) throw Error('setting-value-invalid');
    storage.set(`__settings.${setting.id}`, value);
    options.emit?.('settings:changed', values());
    return values();
  };
  return { supports: action => actions.has(action), run, contextChanged };
}
