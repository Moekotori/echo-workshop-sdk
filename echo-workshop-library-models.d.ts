/** Library DTOs contain display fields and opaque identities, never host services. */
type EchoWorkshopPlaylistSort = 'manual' | 'titleAsc' | 'titleDesc' | 'artistAsc' | 'artistDesc' | 'album' | 'albumDesc' | 'artistAlbum' | 'addedDesc' | 'addedAsc' | 'durationAsc' | 'durationDesc';
interface EchoWorkshopPlaylistPatch { name?: string; description?: string | null; sortMode?: EchoWorkshopPlaylistSort; }
type EchoWorkshopTagTarget = { kind: 'track' | 'album' | 'artist'; id: string };
interface EchoWorkshopPersonalTag { id: string; name: string; itemCount: number; assigned?: boolean; }
type EchoWorkshopTagItem = EchoWorkshopTagTarget & { title: string; subtitle: string; available: boolean };
type EchoWorkshopTagChange = { action: 'create'; name: string } | { action: 'rename'; id: string; name: string }
  | { action: 'delete'; id: string } | { action: 'assign'; id: string; target: EchoWorkshopTagTarget; assigned: boolean };
interface EchoWorkshopListenLaterEntry {
  albumId: string; album: EchoWorkshopAlbum | null; title: string; artist: string; addedAt: string;
  completed: boolean; trackId: string | null; positionSeconds: number; trackFinished: boolean;
}
type EchoWorkshopSmartCondition = { type: 'group'; match: 'all' | 'any'; children: EchoWorkshopSmartCondition[] }
  | { type: 'rule'; field: 'title' | 'artist' | 'album' | 'albumArtist' | 'genre' | 'codec' | 'path' | 'year' | 'bpm' | 'duration'
      | 'playCount' | 'skipCount' | 'sampleRate' | 'bitDepth' | 'bitrate' | 'dateAdded' | 'lastPlayed' | 'lastSkipped' | 'liked' | 'instrumental' | 'replayGainStatus';
      operator: 'is' | 'isNot' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'atLeast' | 'lessThan'
      | 'atMost' | 'between' | 'isEmpty' | 'isNotEmpty' | 'withinLastDays' | 'notWithinLastDays';
      value?: string | number | boolean | null; valueTo?: string | number | null; };
interface EchoWorkshopSmartRules {
  version: 1 | 2; match: 'all' | 'any'; limit: number;
  sort: 'recentlyAdded' | 'recentlyPlayed' | 'mostPlayed' | 'leastPlayed' | 'title' | 'random';
  condition?: Extract<EchoWorkshopSmartCondition, { type: 'group' }>;
  sorts?: Array<{ field: 'dateAdded' | 'lastPlayed' | 'playCount' | 'skipCount' | 'title' | 'artist' | 'album' | 'year' | 'bpm' | 'duration' | 'bitrate'; direction: 'asc' | 'desc' }>;
  filters: { liked?: boolean; excludeNeverRecommend?: boolean; unplayed?: boolean; genre?: string; codec?: string; folderId?: string;
    yearFrom?: number; yearTo?: number; bpmFrom?: number; bpmTo?: number; minPlayCount?: number; maxPlayCount?: number;
    minSkipCount?: number; minSampleRate?: number; addedWithinDays?: number; playedWithinDays?: number; };
}
interface EchoWorkshopSmartInput {
  name?: string | null; description?: string | null; limit?: number; recentDays?: number;
  rules?: Partial<Omit<EchoWorkshopSmartRules, 'version' | 'filters'>> & { filters?: EchoWorkshopSmartRules['filters'] };
}
interface EchoWorkshopSmartPreview {
  items: EchoWorkshopTrack[]; candidateCount: number; includedCount: number; requestedLimit: number;
  hasMore: boolean; deferredForPlayback?: boolean;
}
