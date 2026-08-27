/** ECHO Workshop sandbox plug-in API v2. See echo-workshop-sdk.json for the version contract. */

type EchoWorkshopUnsubscribe = () => void;

interface EchoWorkshopPlaybackStatus {
  state: string;
  currentTrackId: string | null;
  positionSeconds: number;
  durationSeconds: number;
  volume: number | null;
  shuffleEnabled?: boolean;
  repeatMode?: 'off' | 'one' | 'all';
}

interface EchoWorkshopSpectrum {
  bands: number[];
  energy: number;
  transient: number;
  state: string;
}

interface EchoWorkshopPageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface EchoWorkshopTrack {
  id: string;
  mediaType: 'local' | 'remote' | 'streaming';
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  trackNo: number | null;
  discNo: number | null;
  year: number | null;
  genre: string | null;
  durationSeconds: number;
  codec: string | null;
  sampleRate: number | null;
  bitDepth: number | null;
  bitrate: number | null;
  coverUrl: string | null;
  unavailable: boolean;
}

interface EchoWorkshopAlbum {
  id: string;
  mediaType: 'local' | 'remote' | 'streaming';
  title: string;
  albumArtist: string;
  year: number | null;
  trackCount: number;
  durationSeconds: number;
  coverUrl: string | null;
}

interface EchoWorkshopArtist {
  id: string;
  mediaType: 'local' | 'remote';
  name: string;
  role: 'track' | 'album' | 'both';
  trackCount: number;
  albumCount: number;
  coverUrl: string | null;
}

interface EchoWorkshopGenre {
  id: string;
  mediaType: 'local' | 'remote';
  name: string;
  unclassified: boolean;
  trackCount: number;
  albumCount: number;
  coverUrl: string | null;
}

interface EchoWorkshopPlaylist {
  id: string;
  name: string;
  description: string | null;
  kind: 'manual' | 'smart' | 'synced' | 'system';
  itemCount: number;
  coverUrl: string | null;
}

interface EchoWorkshopPage<T> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  items: T[];
}

interface EchoWorkshopPlaylistItem {
  id: string;
  playlistId: string;
  position: number;
  unavailable: boolean;
  track: EchoWorkshopTrack | null;
}

interface EchoWorkshopLibrarySummary {
  trackCount: number;
  albumCount: number;
  artistCount: number;
  totalDurationSeconds: number;
}

interface EchoWorkshopLikedTrackResult {
  trackId: string;
  liked: boolean;
}

interface EchoWorkshopLikedAlbumResult {
  albumId: string;
  liked: boolean;
}

interface EchoWorkshopTrackActionResult {
  track: EchoWorkshopTrack;
}

interface EchoWorkshopTracksActionResult {
  tracks: EchoWorkshopTrack[];
}

interface EchoWorkshopCollectionPlayResult extends EchoWorkshopTrackActionResult {
  count: number;
}

interface EchoWorkshopQueueItem {
  queueId: string;
  track: EchoWorkshopTrack;
}

interface EchoWorkshopQueueSnapshot {
  currentQueueId: string | null;
  currentTrack: EchoWorkshopTrack | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  items: EchoWorkshopQueueItem[];
}

interface EchoWorkshopDirectSource {
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  live?: boolean;
}

interface EchoWorkshopSourceTrack {
  providerTrackId: string;
  title: string;
  artist?: string;
  album?: string;
  durationSeconds?: number | null;
  source?: string;
  coverUrl?: string;
  kind?: 'track' | 'collection';
  live?: boolean;
  playable?: boolean;
  unavailableReason?: string;
}

interface EchoWorkshopSourceSearchRequest {
  query: string;
  page: number;
  pageSize: number;
}

interface EchoWorkshopSourceBrowseRequest {
  page?: number;
  pageSize?: number;
}

interface EchoWorkshopSourceCollectionRequest {
  collectionId: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

interface EchoWorkshopSourceSearchResult {
  tracks: EchoWorkshopSourceTrack[];
  total?: number | null;
  hasMore?: boolean;
}

interface EchoWorkshopSourceProviderHandlers {
  search(request: EchoWorkshopSourceSearchRequest): EchoWorkshopSourceSearchResult | Promise<EchoWorkshopSourceSearchResult>;
  resolve(request: { providerTrackId: string }): EchoWorkshopDirectSource | Promise<EchoWorkshopDirectSource>;
  browse?(request: EchoWorkshopSourceBrowseRequest): EchoWorkshopSourceSearchResult | Promise<EchoWorkshopSourceSearchResult>;
  listCollection?(request: EchoWorkshopSourceCollectionRequest): EchoWorkshopSourceSearchResult | Promise<EchoWorkshopSourceSearchResult>;
}

interface EchoWorkshopLyricsCandidate {
  title?: string;
  language?: string;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  lrc?: string;
  text?: string;
}

interface EchoWorkshopLyricsRequest {
  track: {
    id: string | null;
    title: string;
    artist: string;
    album: string;
    durationSeconds: number;
  };
  query?: string;
}

interface EchoWorkshopMetadataCandidate {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  trackNo?: number;
  discNo?: number;
  bpm?: number;
  confidence?: number;
  source?: string;
  sourceUrl?: string;
}

interface EchoWorkshopCoverCandidate {
  imageUrl: string;
  title?: string;
  source?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
  confidence?: number;
}

interface EchoWorkshopNetworkRequest {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
}

interface EchoWorkshopNetworkResponse {
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  body: string;
}

interface EchoWorkshopPlaybackShareTrack {
  id: string | null;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  codec: string | null;
  sizeBytes: number;
}

interface EchoWorkshopPlaybackShareInfo {
  available: boolean;
  reason: 'no-current-track' | 'not-local-file' | 'file-unavailable' | null;
  track: EchoWorkshopPlaybackShareTrack | null;
  allowedHosts: string[];
}

interface EchoWorkshopPlaybackShareTask {
  id: string;
  state: 'queued' | 'uploading' | 'ready' | 'error';
  bytesSent: number;
  totalBytes: number;
  progress: number;
  playbackUrl: string | null;
  expiresAt: string | null;
  error: string | null;
  track: EchoWorkshopPlaybackShareTrack;
}

interface EchoWorkshopSandboxLyrics {
  kind: 'empty' | 'plain' | 'synced' | 'instrumental';
  title: string;
  artist: string;
  album: string | null;
  durationSeconds: number | null;
  offsetMs: number;
  provider: 'none' | 'local' | 'manual' | 'cached' | 'remote';
  lines: Array<{
    timeMs: number;
    text: string;
    translation: string | null;
    romanization: string | null;
    kana: string | null;
    words: Array<{ text: string; startMs: number; endMs: number | null }>;
  }>;
  plainText: string | null;
  syncedText: string | null;
}

interface EchoWorkshopApi {
  commands: {
    /** A trackContextMenus command receives one sanitized EchoWorkshopTrack as its first argument. */
    register(id: string, metadata: { title: string }, handler: (...args: unknown[]) => unknown | Promise<unknown>): void;
  };
  events: {
    on(eventName: 'playback:status' | 'audio:spectrum' | 'queue:changed' | 'library:changed' | 'library:liked-changed' | 'settings:changed', handler: (payload: unknown) => unknown): EchoWorkshopUnsubscribe;
  };
  navigation: {
    open(routeId: string): Promise<null>;
  };
  playback: {
    getStatus(): Promise<EchoWorkshopPlaybackStatus>;
    play(): Promise<null>;
    pause(): Promise<null>;
    seek(positionSeconds: number): Promise<null>;
    previous(): Promise<null>;
    next(): Promise<null>;
    setVolume(volume: number): Promise<null>;
    setShuffle(enabled: boolean): Promise<null>;
    toggleShuffle(): Promise<null>;
    setRepeat(mode: 'off' | 'one' | 'all'): Promise<null>;
    cycleRepeat(): Promise<null>;
    getShareInfo(): Promise<EchoWorkshopPlaybackShareInfo>;
    shareCurrentTrack(options: { uploadUrl: string; roomId?: string; headers?: Record<string, string> }): Promise<EchoWorkshopPlaybackShareTask>;
    getShareTask(taskId: string): Promise<EchoWorkshopPlaybackShareTask>;
    playUrl(url: string, metadata?: Omit<EchoWorkshopDirectSource, 'url'>): Promise<EchoWorkshopTrackActionResult>;
  };
  audio: {
    getSpectrum(): Promise<EchoWorkshopSpectrum>;
  };
  library: {
    getSummary(): Promise<EchoWorkshopLibrarySummary>;
    getTrack(trackId: string): Promise<EchoWorkshopTrack>;
    getTracks(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
    getAlbums(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopAlbum>>;
    getAlbumTracks(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
    getArtists(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopArtist>>;
    getArtistTracks(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
    getArtistAlbums(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopAlbum>>;
    getGenres(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopGenre>>;
    getGenreTracks(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
    getGenreAlbums(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopAlbum>>;
    getPlaylists(): Promise<EchoWorkshopPlaylist[]>;
    getPlaylistItems(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
    getLikedTracks(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
    getLikedTrackIds(trackIds: string[]): Promise<Record<string, boolean>>;
    toggleTrackLiked(trackId: string): Promise<EchoWorkshopLikedTrackResult>;
    toggleAlbumLiked(albumId: string): Promise<EchoWorkshopLikedAlbumResult>;
    createPlaylist(input: { name: string; description?: string }): Promise<EchoWorkshopPlaylist>;
    addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<EchoWorkshopPlaylistItem[]>;
  };
  queue: {
    get(): Promise<EchoWorkshopQueueSnapshot>;
    playTrack(trackId: string, queueTrackIds?: string[]): Promise<EchoWorkshopTrackActionResult>;
    enqueueTrack(trackId: string): Promise<EchoWorkshopTrackActionResult>;
    playItem(queueId: string): Promise<null>;
    moveItem(queueId: string, toIndex: number): Promise<null>;
    removeItem(queueId: string): Promise<null>;
    clear(): Promise<null>;
    playAlbum(albumId: string): Promise<EchoWorkshopCollectionPlayResult>;
    playArtist(artistId: string): Promise<EchoWorkshopCollectionPlayResult>;
    playGenre(genreId: string): Promise<EchoWorkshopCollectionPlayResult>;
    playPlaylist(playlistId: string): Promise<EchoWorkshopCollectionPlayResult>;
    playLiked(): Promise<EchoWorkshopCollectionPlayResult>;
  };
  sources: {
    playDirect(source: EchoWorkshopDirectSource): Promise<EchoWorkshopTrackActionResult>;
    enqueueDirect(source: EchoWorkshopDirectSource): Promise<EchoWorkshopTrackActionResult>;
    playQueue(sources: EchoWorkshopDirectSource[]): Promise<EchoWorkshopTracksActionResult>;
    registerProvider(id: string, metadata: { title: string }, handlers: EchoWorkshopSourceProviderHandlers): void;
    search(providerId: string, request: Partial<EchoWorkshopSourceSearchRequest>): Promise<EchoWorkshopSourceSearchResult>;
    browse(providerId: string, request?: EchoWorkshopSourceBrowseRequest): Promise<EchoWorkshopSourceSearchResult>;
    listCollection(providerId: string, collectionId: string, request?: EchoWorkshopSourceBrowseRequest): Promise<EchoWorkshopSourceSearchResult>;
    resolve(providerId: string, providerTrackId: string): Promise<EchoWorkshopDirectSource>;
  };
  agents: {
    register(id: string, metadata: { title: string }, handler: (input: unknown, context: { agentId: string }) => unknown | Promise<unknown>): void;
    run(agentId: string, input: unknown): Promise<unknown>;
  };
  network: {
    request(options: EchoWorkshopNetworkRequest): Promise<EchoWorkshopNetworkResponse>;
    get(url: string, options?: Omit<EchoWorkshopNetworkRequest, 'url' | 'method' | 'body'>): Promise<EchoWorkshopNetworkResponse>;
    post(url: string, body: string, options?: Omit<EchoWorkshopNetworkRequest, 'url' | 'method' | 'body'>): Promise<EchoWorkshopNetworkResponse>;
  };
  lyrics: {
    registerProvider(id: string, metadata: { title: string }, handler: (request: EchoWorkshopLyricsRequest) => { candidates: EchoWorkshopLyricsCandidate[] } | Promise<{ candidates: EchoWorkshopLyricsCandidate[] }>): void;
    get(trackId?: string): Promise<EchoWorkshopSandboxLyrics | null>;
  };
  metadata: {
    registerProvider(id: string, metadata: { title: string }, handler: (request: { track: EchoWorkshopTrack }) => { candidates: EchoWorkshopMetadataCandidate[] } | Promise<{ candidates: EchoWorkshopMetadataCandidate[] }>): void;
  };
  covers: {
    registerProvider(id: string, metadata: { title: string }, handler: (request: { track: EchoWorkshopTrack }) => { candidates: EchoWorkshopCoverCandidate[] } | Promise<{ candidates: EchoWorkshopCoverCandidate[] }>): void;
  };
  settings: {
    get(): Promise<Record<string, string | number | boolean | null>>;
    get(settingId: string): Promise<string | number | boolean | null>;
    set(settingId: string, value: string | number | boolean | null): Promise<Record<string, string | number | boolean | null>>;
    onChanged(handler: (values: Record<string, string | number | boolean | null>) => unknown): EchoWorkshopUnsubscribe;
  };
  storage: {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown): Promise<null>;
    remove(key: string): Promise<null>;
  };
  ui: {
    notify(message: string): Promise<null>;
  };
}

declare const echo: EchoWorkshopApi;
