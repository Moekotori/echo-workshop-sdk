/** Build one declarative, host-rendered setting from explicit CLI inputs. */
export const createAuthorSetting = (id, title, options) => {
  const type = options.get('type') ?? 'boolean';
  if (!['string', 'boolean', 'number', 'range', 'color', 'select'].includes(type)) throw Error('Unknown setting type');
  const setting = { id, title, type };
  if (type === 'select') {
    const choices = JSON.parse(options.get('options-json') ?? '[]');
    if (!Array.isArray(choices) || !choices.length || choices.some(choice =>
      !choice || typeof choice.label !== 'string' || !choice.label.trim() || typeof choice.value !== 'string' || !choice.value.trim())) {
      throw Error('Select settings need --options-json with label/value entries');
    }
    if (new Set(choices.map(choice => choice.value)).size !== choices.length) throw Error('Select option values must be unique');
    setting.options = choices.map(({ label, value }) => ({ label, value }));
  }
  if (type === 'number' || type === 'range') {
    for (const field of ['min', 'max', 'step']) {
      if (!options.has(field)) continue;
      const value = Number(options.get(field));
      if (!Number.isFinite(value) || (field === 'step' && value <= 0)) throw Error(`Invalid setting ${field}`);
      setting[field] = value;
    }
    if (setting.min !== undefined && setting.max !== undefined && setting.min > setting.max) throw Error('Setting min exceeds max');
  }
  const rawDefault = options.get('default');
  if (type === 'boolean') {
    if (rawDefault !== undefined && !['true', 'false'].includes(rawDefault)) throw Error('Boolean default must be true or false');
    setting.defaultValue = rawDefault === 'true';
  } else if (type === 'number' || type === 'range') {
    const value = rawDefault === undefined ? setting.min ?? 0 : Number(rawDefault);
    if (!Number.isFinite(value) || (setting.min !== undefined && value < setting.min) || (setting.max !== undefined && value > setting.max)) throw Error('Setting default is outside its numeric range');
    setting.defaultValue = value;
  } else {
    setting.defaultValue = rawDefault ?? (type === 'color' ? '#66ccff' : type === 'select' ? setting.options[0].value : '');
    if (type === 'color' && !/^#[0-9a-fA-F]{6}$/u.test(setting.defaultValue)) throw Error('Color default must be #RRGGBB');
    if (type === 'select' && !setting.options.some(choice => choice.value === setting.defaultValue)) throw Error('Select default must match an option value');
  }
  return setting;
};
