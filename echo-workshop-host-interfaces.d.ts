/** Host-owned Home and lyrics-source workflows shared by plugins and themes. */
interface EchoWorkshopAudioOutputSettings {
  automaticOutputEnabled?: boolean;
  outputMode?: 'shared' | 'exclusive' | 'asio' | 'ks' | 'system';
  sharedBackend?: 'auto' | 'windows' | 'directsound' | 'alsa' | 'pipewire';
  deviceIndex?: number;
  deviceName?: string;
  requestedOutputSampleRate?: number;
  latencyProfile?: 'stable' | 'balanced' | 'lowLatency';
  bufferSizeFrames?: number | null;
}
interface EchoWorkshopAudioOutputStatus {
  host: 'not-initialized' | 'starting' | 'ready' | 'unavailable' | 'error';
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'ended' | 'error';
  outputDeviceId: string | null; outputDeviceName: string | null; outputDeviceType: string | null;
  outputBackend: string | null; outputMode: NonNullable<EchoWorkshopAudioOutputSettings['outputMode']>;
  automaticOutputEnabled?: boolean; sharedBackend?: EchoWorkshopAudioOutputSettings['sharedBackend'] | null;
  requestedOutputSampleRate: number | null; latencyProfile?: EchoWorkshopAudioOutputSettings['latencyProfile'];
  bufferSizeFrames?: number | null; volumeControlMode?: 'software' | 'device' | 'fixed';
}
interface EchoWorkshopAudioDevice {
  id: string; index: number; name: string; outputMode: Exclude<EchoWorkshopAudioOutputSettings['outputMode'], 'system' | undefined>;
  sampleRate: number | null; sharedDeviceSampleRate: number | null; isDefault: boolean;
  connectionType?: 'bluetooth' | 'unknown';
  formFactor?: 'headphones' | 'headset' | 'speakers' | 'display' | 'digital' | 'unknown';
  stableId?: string; sdmDopTransportSampleRates?: number[]; sdmNativeDsdSampleRates?: number[];
}
interface EchoWorkshopDeviceVolume {
  deviceKey: string | null; deviceName: string | null; supported: boolean; hardwareMute: boolean;
  minimumDb: number | null; maximumDb: number | null; stepDb: number | null;
  currentDb: number | null; muted: boolean | null;
  reason: 'software-only' | 'platform-unsupported' | 'route-unsupported' | 'unavailable' | null;
}
type EchoWorkshopDeviceVolumeRequest = { deviceKey: string; respectComfort?: boolean } & (
  { levelDb: number; muted?: never; direction?: never; toggleMute?: never }
  | { muted: boolean; levelDb?: never; direction?: never; toggleMute?: never }
  | { direction: -1 | 1; levelDb?: never; muted?: never; toggleMute?: never }
  | { toggleMute: true; levelDb?: never; muted?: never; direction?: never }
);
interface EchoWorkshopAudioOutputApi {
  /** audio:output-read. Output facts only; no media paths or input credentials. */
  getStatus(): Promise<EchoWorkshopAudioOutputStatus>;
  listDevices(): Promise<EchoWorkshopAudioDevice[]>;
  refreshDevices(): Promise<EchoWorkshopAudioDevice[]>;
  getDeviceVolume(): Promise<EchoWorkshopDeviceVolume>;
  /** audio:output-write. May reopen the route; resolves with Audio Core's confirmed state. */
  setOutput(settings: EchoWorkshopAudioOutputSettings): Promise<EchoWorkshopAudioOutputStatus>;
  setDeviceVolume(request: EchoWorkshopDeviceVolumeRequest): Promise<EchoWorkshopDeviceVolume>;
  setVolumeControlMode(mode: 'software' | 'device' | 'fixed'): Promise<EchoWorkshopAudioOutputStatus>;
}

interface EchoWorkshopHomeSettings {
  homeWaveformVisualizerEnabled: boolean;
  homeBackgroundMode: 'none' | 'lyrics' | 'flowingLight' | 'coverFlow' | 'geometricAmbience'
    | 'liquidLight' | 'pulseRidge' | 'halftone' | 'contour' | 'sakura' | 'bfs'
    | 'coverLiquid' | 'coverPrism' | 'coverFrost' | 'coverPond' | 'coverHolo' | 'coverVinyl' | 'coverNeon';
  homeBackgroundAppearance: { opacityPercent: number; uiOpacityPercent: number };
  homeBackgroundRendering: { frameRate: number; quality: 'smooth' | 'balanced' | 'sharp' };
}
interface EchoWorkshopHomeQuery {
  page?: number;
  /** 1–100, default 20. */
  pageSize?: number;
  /** Local calendar date in YYYY-MM-DD form. */
  from?: string;
  to?: string;
  search?: string;
  completedOnly?: boolean;
}
interface EchoWorkshopHomeHistoryEntry {
  id: string; trackId: string | null; mediaType: 'local' | 'remote' | 'streaming';
  title: string; artist: string; album: string; albumArtist: string; coverUrl: string | null;
  startedAt: string; endedAt: string | null; playedSeconds: number; durationSeconds: number;
  playCount: number; completed: boolean;
}
interface EchoWorkshopHomeHistorySummary {
  todayCount: number; todayPlayedSeconds: number; totalCount: number; latestPlayedAt: string | null;
  rangeCount: number; rangeTrackCount?: number; rangePlayedSeconds: number; rangeLatestPlayedAt: string | null;
}
interface EchoWorkshopHomeStats {
  generatedAt: string;
  totals: { playCount: number; completedCount: number; playedSeconds: number; uniqueTracks: number; uniqueArtists: number };
  topTracks: Array<{ trackId: string | null; title: string; artist: string; album: string; coverUrl: string | null;
    playCount: number; completedCount: number; playedSeconds: number; durationSeconds: number; lastPlayedAt: string | null }>;
  topArtists: Array<{ artist: string; playCount: number; completedCount: number; playedSeconds: number }>;
  topAlbums: Array<{ albumId: string | null; title: string; albumArtist: string; year: number | null;
    trackCount: number; durationSeconds: number; playCount: number; completedCount: number;
    playedSeconds: number; lastPlayedAt: string | null; coverUrl: string | null }>;
  formatBreakdown: Array<{ id: string; label: string; playCount: number; playedSeconds: number }>;
  qualityBreakdown: Array<{ id: string; label: string; playCount: number; playedSeconds: number }>;
  dailyActivity: Array<{ date: string; playCount: number; playedSeconds: number }>;
  insights?: {
    comparison: { current: { playCount: number; playedSeconds: number; uniqueTracks: number };
      previous: { playCount: number; playedSeconds: number; uniqueTracks: number } } | null;
    sessions: { sessionCount: number; averagePlayedSeconds: number; longestPlayedSeconds: number;
      averageTrackCount: number; activeDays: number; currentStreakDays: number; longestStreakDays: number };
    discovery: { hasBoundedRange: boolean; newTrackCount: number; returningTrackCount: number;
      replayedTrackCount: number; repeatPlayRate: number; rediscoveredTrackCount: number };
  };
}
interface EchoWorkshopHomeApi {
  onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
  /** Requires home:read. */
  getSettings(): Promise<EchoWorkshopHomeSettings>;
  /** Requires home:control. Only the four Home settings above may be changed. */
  updateSettings(patch: Partial<EchoWorkshopHomeSettings>): Promise<EchoWorkshopHomeSettings>;
  getHistory(query?: EchoWorkshopHomeQuery): Promise<{ page: number; pageSize: number; total: number; items: EchoWorkshopHomeHistoryEntry[] }>;
  getHistorySummary(query?: EchoWorkshopHomeQuery): Promise<EchoWorkshopHomeHistorySummary>;
  getStats(query?: EchoWorkshopHomeQuery): Promise<EchoWorkshopHomeStats>;
}
interface EchoWorkshopLyricsSourceDescriptor {
  key: string; id: string; title: string; pluginId: string; pluginName: string;
  ready: boolean; automaticPriority?: 'highest';
}
type EchoWorkshopLyricsSearchProviderId = 'local' | 'lrclib' | 'amll-ttml' | 'netease' | 'qqmusic' | 'manual';
interface EchoWorkshopStoredLyricsCandidate {
  id: string; provider: string; title: string; artist: string; album: string | null;
  durationSeconds: number | null; instrumental: boolean; hasSynced: boolean; hasWordTiming?: boolean;
  hasPlain: boolean; score: number; sourceLabel: string;
  confidence?: 'high' | 'balanced' | 'blocked'; autoAcceptEligible?: boolean;
  durationDeltaSeconds?: number | null; previewLines?: string[]; risk?: 'low' | 'medium' | 'high'; reasons?: string[];
}
interface EchoWorkshopLyricsSourceApi {
  /** Requires lyrics:read. Includes automatic and manually selected Workshop sources. */
  listProviders(): Promise<EchoWorkshopLyricsSourceDescriptor[]>;
  /** Requires lyrics:search. Provider receives host track metadata, without file paths. */
  searchProvider(providerKey: string, trackId?: string, query?: string): Promise<Array<EchoWorkshopLyricsCandidate & { id: string }>>;
  getStoredCandidates(trackId?: string): Promise<EchoWorkshopStoredLyricsCandidate[]>;
  /** Requires lyrics:search. Source packages retain their own approval/network requirements. */
  searchCandidates(trackId?: string, query?: string, providerId?: EchoWorkshopLyricsSearchProviderId): Promise<EchoWorkshopStoredLyricsCandidate[]>;
  previewCandidate(trackId: string, candidateId: string): Promise<EchoWorkshopSandboxLyrics | null>;
  /** These writes require lyrics:write and update the host lyrics cache/selection. */
  applyCandidate(trackId: string, candidateId: string): Promise<EchoWorkshopSandboxLyrics | null>;
  applyCustom(trackId: string, text: string, format?: 'lrc' | 'ttml' | 'txt'): Promise<EchoWorkshopSandboxLyrics | null>;
  setOffset(trackId: string, offsetMs: number): Promise<EchoWorkshopSandboxLyrics | null>;
  markInstrumental(trackId: string): Promise<EchoWorkshopSandboxLyrics | null>;
  clearCache(trackId: string): Promise<null>;
}
