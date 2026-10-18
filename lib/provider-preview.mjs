/** Bounded author fixture for the same provider workflow; never invokes host services. */
export function createProviderPreview(options = {}) {
  const rows = new Map();
  const supports = action => /^(lyrics|metadata|covers):(providers:list|candidates:(get|search|preview|apply|reject|cancel))$/u.test(action);
  const run = async (action, payload = {}) => {
    const [kind, group, operation] = action.split(':');
    if (!supports(action)) throw Error('action-unavailable');
    if (group === 'providers') return [{ key: `fixture:${kind}`, kind, title: `${kind} preview`, origin: 'host', ready: true }];
    if (operation === 'cancel') return false;
    if (typeof payload.trackId !== 'string' || !payload.trackId) throw Error('invalid-payload');
    if (operation === 'search') {
      if (payload.providerKey !== `fixture:${kind}` || typeof payload.requestId !== 'string' || !payload.requestId) throw Error('invalid-payload');
      const candidate = { id: `fixture:${kind}:${payload.trackId}`, trackId: payload.trackId, kind,
        providerKey: payload.providerKey, title: 'Preview song', artist: 'Preview artist', album: null, score: 1 };
      rows.set(kind, candidate); options.emit?.(`${kind}:candidates-changed`, null); return [candidate];
    }
    const candidate = rows.get(kind);
    if (operation === 'get') return candidate?.trackId === payload.trackId ? [{ ...candidate }] : [];
    if (candidate?.trackId !== payload.trackId || candidate?.id !== payload.candidateId) throw Error('candidate-unavailable');
    if (operation === 'preview') return { candidate: { ...candidate }, ...(kind === 'lyrics'
      ? { lyrics: { kind: 'plain', lines: [], plainText: 'Preview lyrics', offsetMs: 0 } }
      : kind === 'metadata' ? { metadata: { title: candidate.title, artist: candidate.artist, album: null,
        albumArtist: null, year: null, genre: null, trackNo: null, discNo: null } } : { coverUrl: null }) };
    if (operation === 'reject') rows.delete(kind);
    options.emit?.(`${kind}:candidates-changed`, null);
    return kind === 'lyrics' ? null : { status: operation === 'reject' ? 'rejected' : 'applied_missing_only', appliedFields: {} };
  };
  return { supports, run };
}
