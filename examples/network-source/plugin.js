echo.sources.registerProvider('owned-catalog', { title: 'Owned catalog' }, {
  search: async ({ query, page, pageSize }) => {
    const response = await echo.network.get(`https://audio.example.invalid/catalog?q=${encodeURIComponent(query || '')}&page=${page}&pageSize=${pageSize}`);
    const payload = JSON.parse(response.body);
    const tracks = Array.isArray(payload?.tracks) ? payload.tracks : [];
    return { tracks, total: payload?.total ?? tracks.length, hasMore: payload?.hasMore === true };
  },
  browse: async ({ page, pageSize }) => {
    const response = await echo.network.get(`https://audio.example.invalid/catalog?page=${page || 1}&pageSize=${pageSize || 24}`);
    const payload = JSON.parse(response.body);
    return { tracks: Array.isArray(payload?.tracks) ? payload.tracks : [], total: payload?.total ?? 0, hasMore: payload?.hasMore === true };
  },
  listCollection: async ({ collectionId, page, pageSize }) => {
    const response = await echo.network.get(`https://audio.example.invalid/collections/${encodeURIComponent(collectionId)}?page=${page || 1}&pageSize=${pageSize || 24}`);
    const payload = JSON.parse(response.body);
    return { tracks: Array.isArray(payload?.tracks) ? payload.tracks : [], total: payload?.total ?? 0, hasMore: payload?.hasMore === true };
  },
  resolve: async ({ providerTrackId }) => {
    const response = await echo.network.get(`https://audio.example.invalid/resolve/${encodeURIComponent(providerTrackId)}`);
    const payload = JSON.parse(response.body);
    return {
      url: payload.url,
      title: payload.title,
      artist: payload.artist,
      album: payload.album,
      live: payload.live === true,
    };
  },
});
