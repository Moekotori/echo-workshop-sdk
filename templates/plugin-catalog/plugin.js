/// <reference path="../.echo-sdk/echo-workshop-plugin.d.ts" />

const catalog = [
  {
    providerTrackId: 'harbor',
    kind: 'track',
    title: 'Harbor Signal',
    artist: 'ECHO Fixtures',
    source: 'Packaged catalog',
    live: true,
    playable: true,
  },
  {
    providerTrackId: 'night-desk',
    kind: 'collection',
    title: 'Night Desk',
    artist: 'ECHO Fixtures',
    source: 'Packaged catalog',
    playable: true,
  },
];

const collections = {
  'night-desk': [
    { providerTrackId: 'glass-pier', kind: 'track', title: 'Glass Pier', artist: 'ECHO Fixtures', live: false, playable: true },
    { providerTrackId: 'after-hours', kind: 'track', title: 'After Hours', artist: 'Harbor Lamp', live: false, playable: true },
  ],
};

const matchesQuery = (track, query) => {
  const term = String(query || '').trim().toLowerCase();
  if (!term) return true;
  return [track.title, track.artist, track.source].join(' ').toLowerCase().includes(term);
};

echo.sources.registerProvider('packaged-catalog', { title: 'Packaged catalog' }, {
  search: async ({ query, page, pageSize }) => {
    const matches = catalog.filter((track) => matchesQuery(track, query));
    const start = Math.max(0, (page - 1) * pageSize);
    return {
      tracks: matches.slice(start, start + pageSize),
      total: matches.length,
      hasMore: start + pageSize < matches.length,
    };
  },
  browse: async ({ page, pageSize }) => {
    const start = Math.max(0, ((page || 1) - 1) * (pageSize || 24));
    const size = pageSize || 24;
    return { tracks: catalog.slice(start, start + size), total: catalog.length, hasMore: start + size < catalog.length };
  },
  listCollection: async ({ collectionId, page, pageSize }) => {
    const tracks = collectionId === 'night-desk' ? collections['night-desk'] : [];
    const start = Math.max(0, ((page || 1) - 1) * (pageSize || 24));
    const size = pageSize || 24;
    return { tracks: tracks.slice(start, start + size), total: tracks.length, hasMore: start + size < tracks.length };
  },
  resolve: async ({ providerTrackId }) => {
    const track = [...catalog, ...Object.values(collections).flat()]
      .find((item) => item.providerTrackId === providerTrackId && item.kind !== 'collection');
    if (!track) throw new Error('catalog-item-not-found');
    return {
      url: `https://audio.example.invalid/${encodeURIComponent(track.providerTrackId)}.mp3`,
      title: track.title,
      artist: track.artist,
      live: track.live === true,
    };
  },
});
