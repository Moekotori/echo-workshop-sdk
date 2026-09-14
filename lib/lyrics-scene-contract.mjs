import { readFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync(new URL('../schemas/lyrics-style.schema.json', import.meta.url), 'utf8'));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Evaluate only the schema vocabulary used by the packaged lyrics contract.
// This is author feedback; the production normalizer remains the activation authority.
const check = (value, rule, path, errors, depth = 0) => {
  if (errors.length >= 20 || depth > 64) return;
  const fail = message => errors.push(`${path}: ${message}`);
  if (rule.$ref) return check(value, schema.$defs[rule.$ref.split('/').at(-1)], path, errors, depth + 1);
  if (rule.allOf) rule.allOf.forEach(child => check(value, child, path, errors, depth + 1));
  for (const kind of ['anyOf', 'oneOf']) if (rule[kind]) {
    const matches = rule[kind].filter(child => { const trial = []; check(value, child, path, trial, depth + 1); return trial.length === 0; }).length;
    if (kind === 'anyOf' ? matches === 0 : matches !== 1) fail(`does not match ${kind}`);
  }
  if (rule.if) { const trial = []; check(value, rule.if, path, trial, depth + 1); if (!trial.length) check(value, rule.then, path, errors, depth + 1); }
  if ('const' in rule && value !== rule.const) fail(`expected ${rule.const}`);
  if (rule.enum && !rule.enum.includes(value)) fail(`expected one of ${rule.enum.join(', ')}`);
  if (rule.type) {
    const valid = rule.type === 'object' ? record(value) : rule.type === 'array' ? Array.isArray(value) : rule.type === 'integer' ? Number.isInteger(value) : typeof value === rule.type;
    if (!valid) { fail(`expected ${rule.type}`); return; }
  }
  if (typeof value === 'number' && (!Number.isFinite(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) fail('out of range');
  if (typeof value === 'string' && (value.length > (rule.maxLength ?? Infinity) || (rule.pattern && !new RegExp(rule.pattern, 'u').test(value)))) fail('invalid text');
  if (Array.isArray(value)) {
    if (value.length > (rule.maxItems ?? Infinity)) fail('too many items');
    if (rule.items) value.slice(0, 64).forEach((item, index) => check(item, rule.items, `${path}[${index}]`, errors, depth + 1));
  }
  if (record(value)) {
    const keys = Object.keys(value);
    if (keys.length > (rule.maxProperties ?? Infinity)) fail('too many properties');
    for (const key of rule.required ?? []) if (!(key in value)) fail(`missing ${key}`);
    for (const key of keys.slice(0, 160)) {
      if (rule.properties?.[key]) check(value[key], rule.properties[key], `${path}.${key}`, errors, depth + 1);
      else if (rule.additionalProperties === false) fail(`unknown field ${key}`);
    }
  }
};

export const validateLyricsSceneContract = scene => {
  const errors = [];
  let nodes = 0;
  const ids = new Set();
  const visit = (node, depth) => {
    if (++nodes > 64 || depth > 8) { if (errors.length < 20) errors.push('scene: maximum 64 nodes / depth 8'); return; }
    if (!record(node)) return;
    if (ids.has(node.id)) errors.push(`scene: duplicate node id ${node.id}`);
    ids.add(node.id);
    for (const style of [node.style, node.responsive?.compact, node.responsive?.wide, ...Object.values(node.options?.parts ?? {})]) {
      if (record(style) && Object.values(style).some(value => typeof value === 'string' && /url\s*\(|expression\s*\(|javascript:|@import|[;{}<>]/iu.test(value))) errors.push(`scene.${node.id}: unsafe style value`);
    }
    (Array.isArray(node.children) ? node.children.slice(0, 25) : []).forEach(child => visit(child, depth + 1));
  };
  visit(scene?.root, 0);
  if (errors.length === 0) check(scene, schema.properties.scene, 'scene', errors);
  return errors.slice(0, 20);
};
