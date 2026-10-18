/** Bounded configuration shape shared by the host adapter and offline author fixtures. */
export function createSteamPresenceSettingsTools() {
  const options = {
    styles: ['classic', 'neko', 'night', 'custom'],
    states: ['playing', 'paused', 'loading', 'idle'],
    variables: ['title', 'artist', 'album', 'progress', 'genre', 'order', 'bpm', 'quality', 'format', 'bitPerfect',
      'speed', 'device', 'details', 'playlist', 'playlistProgress', 'cpu', 'gpu', 'motherboard', 'memory', 'cpuUsage', 'memoryUsage'],
    rotationSeconds: [0, 30, 60, 120],
    progressBarStyles: ['blocks', 'line', 'squares', 'dots', 'stars', 'wave', 'pixels', 'cat', 'space', 'home', 'custom'],
    typewriterDirections: ['forward', 'reverse', 'alternate'],
    limits: { templateLength: 360, templateVariants: 6, outputBytes: 220, emojiPrefixBytes: 48,
      frameSeconds: [5, 120], typewriterStepMs: [250, 2000], typewriterHoldSeconds: [1, 30],
      awayMinutes: [1, 1440], awayTextLength: 160, progressSymbolBytes: 8, progressLength: [4, 16] },
  };
  const bool = { type: 'boolean' };
  const integer = (min, max) => ({ type: 'number', min, max });
  const text = (maxChars, maxBytes) => ({ type: 'string', maxChars, maxBytes });
  const choice = values => ({ enum: values });
  const object = properties => ({ type: 'object', properties });
  const perState = schema => Object.fromEntries(options.states.map(state => [state, schema]));
  const sharing = { album: true, progress: true, progressBar: true, playlist: false, albumProgress: false,
    todaySummary: false, genre: false, playbackOrder: false, bpm: false, quality: false, format: false,
    artist: true, playbackRate: true, device: false, bitPerfect: false };
  const schema = object({
    style: choice(options.styles), emojiPrefix: text(48, 48),
    templates: object(perState(text(360))), rotationSeconds: choice(options.rotationSeconds),
    frames: object({ enabled: bool, states: object(perState({ type: 'array', max: 6,
      item: { ...object({ seconds: integer(5, 120), requiredField: choice([null, ...options.variables]) }), required: ['seconds', 'requiredField'] } })) }),
    typewriter: object({ enabled: bool, direction: choice(options.typewriterDirections), stepMs: integer(250, 2000), holdSeconds: integer(1, 30) }),
    away: object({ enabled: bool, minutes: integer(1, 1440), text: text(160) }),
    progressBarStyle: choice(options.progressBarStyles),
    customProgress: object({ fill: text(8, 8), empty: text(8, 8), head: text(8, 8), start: text(8, 8), end: text(8, 8), length: integer(4, 16) }),
    sharing: object(Object.fromEntries(Object.keys(sharing).map(key => [key, bool]))),
  });
  const defaults = { style: 'classic', emojiPrefix: '', templates: {}, rotationSeconds: 0,
    frames: { enabled: false, states: {} }, typewriter: { enabled: false, direction: 'alternate', stepMs: 500, holdSeconds: 3 },
    away: { enabled: false, minutes: 30, text: '' }, progressBarStyle: 'blocks',
    customProgress: { fill: '━', empty: '─', head: '●', start: '', end: '', length: 10 }, sharing };
  const bytes = value => Array.from(value).reduce((total, char) => {
    const code = char.codePointAt(0); return total + (code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4);
  }, 0);
  const validate = (value, rule) => {
    const invalid = () => { throw Error('invalid-payload'); };
    if (rule.enum) { if (!rule.enum.includes(value)) invalid(); return value; }
    if (rule.type === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
      if (rule.required?.some(key => !Object.hasOwn(value, key))) invalid();
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
        if (!Object.hasOwn(rule.properties, key)) invalid();
        return [key, validate(entry, rule.properties[key])];
      }));
    }
    if (rule.type === 'array') {
      if (!Array.isArray(value) || value.length > rule.max) invalid();
      return value.map(entry => validate(entry, rule.item));
    }
    if (typeof value !== rule.type) invalid();
    if (rule.type === 'number' && (!Number.isInteger(value) || value < rule.min || value > rule.max)) invalid();
    if (rule.type === 'string' && (value.length > rule.maxChars || rule.maxBytes !== undefined && bytes(value) > rule.maxBytes)) invalid();
    return value;
  };
  const merge = (current, patch, rule) => {
    if (rule.type !== 'object') return patch;
    const result = { ...current };
    for (const [key, value] of Object.entries(patch)) result[key] = merge(current[key], value, rule.properties[key]);
    return result;
  };
  return { options, defaults, parsePatch: patch => validate(patch, schema),
    applyPatch: (current, patch) => merge(current, validate(patch, schema), schema) };
}
