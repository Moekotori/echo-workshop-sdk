/** Session-owned library fixture shared by CLI and UI previews. It never calls host services. */
export function createLibraryPreview(options) {
  const tracks = options.tracks ?? [];
  const albums = options.albums ?? [];
  const playlists = new Map((options.playlists ?? []).map(value => [value.id, { ...value }]));
  const contents = new Map((options.playlists ?? []).map(value => [value.id, (options.playlistItems ?? []).filter(item => item.playlistId === value.id).map(item => ({ ...item }))]));
  const liked = new Set(options.likedTrackIds ?? []), likedAlbums = new Set();
  const tags = new Map(), assignments = new Map(), later = new Map();
  let sequence = 0;
  const id = prefix => `${prefix}-${++sequence}`;
  const changed = favorites => {
    options.emit?.('library:changed', null);
    if (favorites) options.emit?.('library:liked-changed', null);
  };
  const track = trackId => {
    const value = tracks.find(item => item.id === trackId);
    if (!value) throw Error('track-unavailable');
    return value;
  };
  const playlist = playlistId => {
    const value = playlists.get(playlistId);
    if (!value) throw Error('playlist-unavailable');
    return value;
  };
  const manual = playlistId => {
    const value = playlist(playlistId);
    if (value.kind !== 'manual') throw Error('playlist-unavailable');
    return value;
  };
  const page = (items, query = {}) => {
    const search = String(query.search ?? '').toLocaleLowerCase();
    let filtered = items.filter(item => !search || String(item.title ?? item.name ?? item.track?.title ?? '').toLocaleLowerCase().includes(search));
    if (query.fileFormatFilter && query.fileFormatFilter !== 'all') filtered = filtered.filter(item => String((item.track ?? item).codec).toLowerCase() === query.fileFormatFilter);
    const fields = { titleAsc: 'title', titleDesc: 'title', artist: 'artist', artistDesc: 'artist', durationAsc: 'durationSeconds', durationDesc: 'durationSeconds', yearAsc: 'year', yearDesc: 'year', album: 'album', albumDesc: 'album' };
    if (fields[query.sort]) filtered = [...filtered].sort((a, b) => {
      const key = fields[query.sort], x = (a.track ?? a)[key], y = (b.track ?? b)[key];
      return (typeof x === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))) * (query.sort.endsWith('Desc') ? -1 : 1);
    });
    const current = query.page ?? 1, pageSize = query.pageSize ?? 50;
    if (!Number.isInteger(current) || current < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw Error('invalid-payload');
    return { page: current, pageSize, total: filtered.length, hasMore: current * pageSize < filtered.length,
      items: filtered.slice((current - 1) * pageSize, current * pageSize).map(item => ({ ...item })) };
  };
  const create = (input, kind = 'manual') => {
    if (playlists.size >= 64) throw Error('preview-capacity-exceeded');
    const value = { id: id('preview-playlist'), name: input.name ?? 'Smart playlist', description: input.description ?? null,
      kind, sortMode: 'manual', itemCount: 0, coverUrl: null };
    if (kind === 'smart') value.smartRules = { version: 2, match: 'all', limit: 100, sort: 'recentlyAdded', filters: {}, ...input.rules };
    playlists.set(value.id, value); contents.set(value.id, []); changed(); return { ...value };
  };
  const items = playlistId => { playlist(playlistId); return contents.get(playlistId); };
  const reindex = values => values.forEach((item, index) => { item.position = index; });
  const handlers = {
    'library:getSummary': () => ({ trackCount: tracks.length, albumCount: albums.length, artistCount: new Set(tracks.map(item => item.artist)).size, totalDurationSeconds: tracks.reduce((sum, item) => sum + item.durationSeconds, 0) }),
    'library:getTrack': p => ({ ...track(p.trackId ?? p.id) }),
    'library:getTracksByIds': p => p.trackIds.map(value => ({ ...track(value) })),
    'library:getTracks': p => page(tracks, p),
    'library:getAlbums': p => page(albums, p),
    'library:getAlbumTracks': p => page(tracks.filter(item => !albums.length || item.album === albums.find(album => album.id === p.id)?.title), p),
    'library:getArtists': p => page([...new Set(tracks.map(item => item.artist))].map(name => ({ id: name, name, mediaType: 'local', role: 'both', trackCount: tracks.filter(item => item.artist === name).length, albumCount: 1, coverUrl: null })), p),
    'library:getArtistTracks': p => page(tracks.filter(item => item.artist === p.id), p),
    'library:getArtistAlbums': p => page(albums.filter(item => item.albumArtist === p.id), p),
    'library:getGenres': p => page([...new Set(tracks.map(item => item.genre))].map(name => ({ id: name, name, mediaType: 'local', unclassified: !name, trackCount: 1, albumCount: 1, coverUrl: null })), p),
    'library:getGenreTracks': p => page(tracks.filter(item => item.genre === p.id), p),
    'library:getGenreAlbums': p => page(albums.filter(album => tracks.some(item => item.genre === p.id && item.album === album.title)), p),
    'library:getPlaylists': () => [...playlists.values()].map(value => ({ ...value, smartRules: undefined })),
    'library:playlists:list': p => page([...playlists.values()].map(value => ({ ...value, smartRules: undefined })), p),
    'library:playlists:get': p => ({ ...playlist(p.playlistId), smartRules: undefined }),
    'library:getPlaylistItems': p => page(items(p.id), p),
    'library:createPlaylist': p => create(p),
    'library:updatePlaylist': p => { const value = manual(p.playlistId); for (const key of ['name', 'description', 'sortMode']) if (p[key] !== undefined) value[key] = p[key]; changed(); return { ...value }; },
    'library:addTracksToPlaylist': p => {
      const value = manual(p.playlistId), all = items(value.id);
      if (all.length + p.trackIds.length > 1000) throw Error('preview-capacity-exceeded');
      const added = p.trackIds.map(trackId => ({ id: id('preview-item'), playlistId: value.id, position: all.length, unavailable: false, track: track(trackId) }));
      all.push(...added); reindex(all); value.itemCount = all.length; changed(); return added;
    },
    'library:removePlaylistItems': p => { const value = manual(p.playlistId), all = items(value.id), remaining = all.filter(item => !p.itemIds.includes(item.id)); contents.set(value.id, remaining); reindex(remaining); value.itemCount = remaining.length; changed(); return { affectedCount: all.length - remaining.length }; },
    'library:playlists:delete': p => { playlist(p.playlistId); playlists.delete(p.playlistId); contents.delete(p.playlistId); changed(); return null; },
    'library:playlists:moveItem': p => { const value = manual(p.playlistId); if (value.sortMode !== 'manual') throw Error('playlist-sort-not-manual'); const all = items(value.id), index = all.findIndex(item => item.id === p.itemId); if (index < 0 || p.position < 0 || p.position >= all.length) throw Error('invalid-payload'); all.splice(p.position, 0, all.splice(index, 1)[0]); reindex(all); changed(); return null; },
    'library:playlists:getRules': p => { const value = playlist(p.playlistId); if (value.kind !== 'smart') throw Error('playlist-unavailable'); return structuredClone(value.smartRules); },
    // Preview returns a fixture sample. It does not emulate the host SQL rule engine.
    'library:playlists:previewRules': p => ({ items: tracks.slice(0, Math.min(100, p.input.rules?.limit ?? 100)), candidateCount: tracks.length, includedCount: Math.min(tracks.length, p.input.rules?.limit ?? 100), requestedLimit: p.input.rules?.limit ?? 100, hasMore: tracks.length > 100 }),
    'library:playlists:createSmart': p => create(p.input, 'smart'),
    'library:playlists:updateRules': p => { const value = playlist(p.playlistId); if (value.kind !== 'smart') throw Error('playlist-unavailable'); value.smartRules = { ...value.smartRules, ...p.input.rules }; changed(); return { ...value, smartRules: undefined }; },
    'library:playlists:freeze': p => { const value = playlist(p.playlistId); if (value.kind !== 'smart') throw Error('playlist-unavailable'); return create({ ...value, name: p.name ?? value.name }); },
    'library:getLikedTrackIds': p => Object.fromEntries(p.trackIds.map(value => [value, liked.has(value)])),
    'library:getLikedTracks': p => page([...liked].map((value, index) => ({ id: value, playlistId: 'preview-liked', position: index, unavailable: false, track: track(value) })), p),
    'library:toggleTrackLiked': p => handlers['library:favorites:setTrack']({ trackId: p.trackId, liked: !liked.has(p.trackId) }),
    'library:toggleAlbumLiked': p => handlers['library:favorites:setAlbum']({ albumId: p.albumId, liked: !likedAlbums.has(p.albumId) }),
    'library:favorites:setTrack': p => { track(p.trackId); if (p.liked) liked.add(p.trackId); else liked.delete(p.trackId); changed(true); return { trackId: p.trackId, liked: p.liked }; },
    'library:favorites:setAlbum': p => { if (!albums.some(value => value.id === p.albumId)) throw Error('album-unavailable'); if (p.liked) likedAlbums.add(p.albumId); else likedAlbums.delete(p.albumId); changed(true); return { albumId: p.albumId, liked: p.liked }; },
    'library:favorites:getAlbums': p => page([...likedAlbums].map((value, index) => ({ id: value, playlistId: 'preview-liked-albums', position: index, track: null, unavailable: false, album: albums.find(album => album.id === value) })), p),
    'library:favorites:getAlbumStates': p => Object.fromEntries(p.albumIds.map(value => [value, likedAlbums.has(value)])),
    'library:favorites:moveTrack': p => { const all = [...liked], index = all.indexOf(p.itemId); if (index < 0 || p.position < 0 || p.position >= all.length) throw Error('invalid-payload'); all.splice(p.position, 0, all.splice(index, 1)[0]); liked.clear(); all.forEach(value => liked.add(value)); changed(true); return null; },
    'library:tags:list': p => [...tags.values()].map(value => ({ ...value, assigned: p.target ? assignments.get(value.id).has(`${p.target.kind}:${p.target.id}`) : undefined })),
    'library:tags:change': p => { if (p.action === 'create') { if (tags.size >= 64) throw Error('preview-capacity-exceeded'); const tagId = id('preview-tag'); tags.set(tagId, { id: tagId, name: p.name, itemCount: 0 }); assignments.set(tagId, new Map()); }
      else { const value = tags.get(p.id); if (!value) throw Error('tag-unavailable'); if (p.action === 'rename') value.name = p.name;
        else if (p.action === 'delete') { tags.delete(p.id); assignments.delete(p.id); }
        else if (p.action === 'assign') {
          const known = p.target.kind === 'track' ? tracks.some(value => value.id === p.target.id)
            : p.target.kind === 'album' ? albums.some(value => value.id === p.target.id) : tracks.some(value => value.artist === p.target.id);
          if (!known) throw Error('target-unavailable');
          const key = `${p.target.kind}:${p.target.id}`, all = assignments.get(p.id); if (p.assigned) all.set(key, p.target); else all.delete(key); value.itemCount = all.size;
        } else throw Error('invalid-payload'); } changed(); return null; },
    'library:tags:getItems': p => { if (!tags.has(p.tagId)) throw Error('tag-unavailable'); return page([...assignments.get(p.tagId).values()].map(value => ({ ...value, title: tracks.find(item => item.id === value.id)?.title ?? value.id, subtitle: '', available: true })), p); },
    'library:listenLater:list': p => page([...later.values()].filter(value => p.completed === undefined || value.completed === p.completed), p),
    'library:listenLater:get': p => later.get(p.albumId) ?? null,
    'library:listenLater:change': p => { const album = albums.find(value => value.id === p.albumId); if (!album) throw Error('album-unavailable');
      if (p.action === 'add') later.set(p.albumId, { albumId: album.id, album, title: album.title, artist: album.albumArtist, addedAt: new Date().toISOString(), completed: false, trackId: null, positionSeconds: 0, trackFinished: false });
      else if (p.action === 'remove') later.delete(p.albumId); else { const value = later.get(p.albumId); if (!value) throw Error('album-unavailable'); value.completed = p.action === 'complete'; } changed(); return null; },
    'library:playQuery': p => { const result = page(tracks, { ...p.query, page: 1, pageSize: 100 }); const value = result.items.find(item => !p.trackId || item.id === p.trackId); if (!value) throw Error('track-unavailable'); options.play?.(result.items, value.id); return { track: value, count: result.total }; },
  };
  return { supports: action => Object.hasOwn(handlers, action), run: (action, payload = {}) => {
    if (!Object.hasOwn(handlers, action)) throw Error('action-unavailable');
    return handlers[action](payload);
  } };
}
