import { readFileSync } from 'node:fs';
const { limits } = JSON.parse(readFileSync(new URL('../contracts/afterglow-scenes.json', import.meta.url), 'utf8'));

/** Cross-field budgets complement the JSON schema. The host remains the activation authority. */
export const validateAfterglowContract = scene => {
  const pack = scene?.afterglow;
  if (pack === undefined) return [];
  const errors = [], ids = new Set();
  if (scene.background !== 'theme' || scene.backgroundAsset !== undefined || scene.hostChrome !== undefined || scene.root?.children?.length) errors.push('afterglow: use theme background and an empty host root');
  if (!pack || !Array.isArray(pack.scenes)) return [...errors, 'afterglow: scenes must be an array'];
  let layers = 0, paint = 0;
  for (const entry of pack.scenes.slice(0, limits.maximumScenes + 1)) {
    if (typeof entry?.id === 'string' && ids.has(entry.id)) errors.push('afterglow: duplicate scene id');
    ids.add(entry?.id);
    for (const layer of Array.isArray(entry?.layers) ? entry.layers.slice(0, limits.maximumLayersPerScene + 1) : []) {
      layers++;
      paint += layer?.type === 'particles' ? (layer.count ?? 24) : 1;
      const type = layer?.type;
      if (type !== 'text' && (layer?.text !== undefined || layer?.fontSize !== undefined)) errors.push('afterglow: text fields require a text layer');
      if (type !== 'polygon' && layer?.points !== undefined) errors.push('afterglow: points require a polygon layer');
      if (type !== 'particles' && layer?.count !== undefined) errors.push('afterglow: count requires a particle layer');
      if (type === 'text' && typeof layer?.text === 'string' && !layer.text.trim()) errors.push('afterglow: text cannot be blank');
    }
  }
  if (layers > limits.maximumLayers) errors.push(`afterglow: maximum ${limits.maximumLayers} layers per pack`);
  if (!Number.isFinite(paint) || paint > limits.maximumPaintElements) errors.push(`afterglow: maximum ${limits.maximumPaintElements} paint elements per pack`);
  // A conservative raw-size check; production also checks the normalized payload after defaults.
  if (Buffer.byteLength(JSON.stringify(pack), 'utf8') > limits.maximumNormalizedBytes) errors.push('afterglow: payload exceeds 128 KiB');
  return errors.slice(0, 20);
};
