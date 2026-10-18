/** Check the actual public client object, including aliases and observer methods. No source regex. */
export function assertWorkshopClientContract(client, contract) {
  for (const definition of [...Object.values(contract.actions), ...Object.entries(contract.registrations).map(([method]) => ({ method }))]) {
    const parts = definition.method.replace(/^echo\./u, '').split('.');
    const leaves = parts.pop().split('/');
    let owner = client;
    for (const key of parts) owner = owner?.[key];
    for (const key of leaves) if (typeof owner?.[key] !== 'function') throw Error(`SDK public method missing: ${[...parts, key].join('.')}`);
  }
}
