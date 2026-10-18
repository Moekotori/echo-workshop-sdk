// Generated from contracts/providers.json.
export function createWorkshopProviderClient(request, on) {
  return Object.freeze({
    lyrics: Object.freeze({
      providers: Object.freeze({
        onChanged: handler => on('lyrics:providers-changed', handler),
        list: () => request('lyrics:providers:list', {  }),
      }),
      candidates: Object.freeze({
        onChanged: handler => on('lyrics:candidates-changed', handler),
        get: (trackId) => request('lyrics:candidates:get', { trackId }),
        search: (trackId, options) => request('lyrics:candidates:search', { trackId, ...options }, 300000),
        preview: (trackId, candidateId) => request('lyrics:candidates:preview', { trackId, candidateId }),
        apply: (trackId, candidateId) => request('lyrics:candidates:apply', { trackId, candidateId }),
        reject: (trackId, candidateId) => request('lyrics:candidates:reject', { trackId, candidateId }),
        cancel: (requestId) => request('lyrics:candidates:cancel', { requestId }),
      }),
    }),
    metadata: Object.freeze({
      providers: Object.freeze({
        onChanged: handler => on('metadata:providers-changed', handler),
        list: () => request('metadata:providers:list', {  }),
      }),
      candidates: Object.freeze({
        onChanged: handler => on('metadata:candidates-changed', handler),
        get: (trackId) => request('metadata:candidates:get', { trackId }),
        search: (trackId, options) => request('metadata:candidates:search', { trackId, ...options }, 300000),
        preview: (trackId, candidateId) => request('metadata:candidates:preview', { trackId, candidateId }),
        apply: (trackId, candidateId) => request('metadata:candidates:apply', { trackId, candidateId }),
        reject: (trackId, candidateId) => request('metadata:candidates:reject', { trackId, candidateId }),
        cancel: (requestId) => request('metadata:candidates:cancel', { requestId }),
      }),
    }),
    covers: Object.freeze({
      providers: Object.freeze({
        onChanged: handler => on('covers:providers-changed', handler),
        list: () => request('covers:providers:list', {  }),
      }),
      candidates: Object.freeze({
        onChanged: handler => on('covers:candidates-changed', handler),
        get: (trackId) => request('covers:candidates:get', { trackId }),
        search: (trackId, options) => request('covers:candidates:search', { trackId, ...options }, 300000),
        preview: (trackId, candidateId) => request('covers:candidates:preview', { trackId, candidateId }),
        apply: (trackId, candidateId) => request('covers:candidates:apply', { trackId, candidateId }),
        reject: (trackId, candidateId) => request('covers:candidates:reject', { trackId, candidateId }),
        cancel: (requestId) => request('covers:candidates:cancel', { requestId }),
      }),
    }),
  });
}
