/** ECHO Workshop theme UI runtime bridge. Protocol version 1. See echo-workshop-sdk.json. */

/** Optional `lyrics-interaction` init feature. Only accepted from the active lyrics-view frame.
 * Pointer coordinates are viewport-normalized [0, 1]; coalesce to at most 20 Hz.
 * Back requests the host's lyrics return action; it grants no arbitrary navigation.
 */
type EchoWorkshopLyricsInteraction = {
  type: 'echo:workshop-ui:interaction';
  protocolVersion: 1;
} & ({ action: 'back' } | { action: 'pointer'; x: number; y: number });

type EchoWorkshopUiCapability =
  | 'navigation'
  | 'playback:read'
  | 'playback:control'
  | 'library:read'
  | 'library:control'
  | 'queue:read'
  | 'queue:control'
  | 'window:control'
  | 'lyrics:read'
  | 'lyrics:match'
  | 'audio:spectrum'
  | 'audio:canvas'
  | 'storage';

type EchoWorkshopUiCommand =
  | 'navigate'
  /** navigation; close this runtime locally without changing the underlying route. */
  | 'ui:close'
  | 'play'
  | 'pause'
  | 'playPause'
  | 'previous'
  | 'next'
  | 'seek'
  | 'setVolume'
  /** { enabled: boolean }; explicit fixed 100% volume setting; DSD auto-lock cannot be bypassed. */
  | 'setFixedVolume'
  /** playback:read; returns the host-confirmed playback speed. */
  | 'getPlaybackRate'
  /** playback:control; { rate: number } in [0.5, 2], waits for host confirmation. */
  | 'setPlaybackRate'
  | 'setShuffle'
  | 'toggleShuffle'
  | 'setRepeat'
  | 'cycleRepeat'
  | 'library:listTracks'
  | 'library:listLiked'
  | 'library:getLiked'
  | 'library:toggleLiked'
  | 'library:getSummary'
  | 'library:listAlbums'
  | 'library:listAlbumTracks'
  | 'library:listArtists'
  | 'library:listArtistTracks'
  | 'library:listArtistAlbums'
  | 'library:listGenres'
  | 'library:listGenreTracks'
  | 'library:listGenreAlbums'
  | 'library:listPlaylists'
  | 'library:listPlaylistItems'
  | 'library:getTrack'
  | 'library:toggleAlbumLiked'
  | 'library:createPlaylist'
  | 'library:addTracksToPlaylist'
  | 'library:updatePlaylist'
  | 'library:removePlaylistItems'
  | 'lyrics:get'
  | 'lyrics:matchAmll'
  | 'audio:getSpectrum'
  | 'audio:getVisualization'
  /** audio:canvas; current local track only, host-owned bounded Canvas analysis. */
  | 'audio:getCanvasProfile'
  | 'audio:getCanvasSpectrum'
  | 'audio:canvasHeartbeat'
  | 'audio:releaseCanvas'
  | 'queue:get'
  | 'queue:playTrack'
  | 'queue:enqueueTrack'
  | 'queue:playItem'
  | 'queue:moveItem'
  | 'queue:removeItem'
  | 'queue:clear'
  | 'queue:playAlbum'
  | 'queue:playArtist'
  | 'queue:playGenre'
  | 'queue:playPlaylist'
  | 'queue:playLiked'
  | 'storage:get'
  | 'storage:set'
  | 'storage:remove'
  | 'window:minimize'
  | 'window:toggleMaximize'
  | 'window:toggleFullscreen'
  /** window:control; Lattice desktop extension, returns { supported, enabled }. */
  | 'window:getDesktopWall'
  /** window:control; { enabled: boolean }, enabled verified echo.lattice-wall only. */
  | 'window:setDesktopWall'
  | 'window:close';

interface EchoWorkshopUiTrack {
  id: string;
  title?: string;
  artist?: string | null;
  album?: string | null;
  durationSeconds?: number | null;
  coverUrl?: string | null;
  liked?: boolean;
  trackNo?: number | null;
  genre?: string | null;
  bpm?: number | null;
  bpmEstimated?: boolean;
  beatOffsetMs?: number | null;
  sampleRate?: number | null;
  bitDepth?: number | null;
  bitrate?: number | null;
}

interface EchoWorkshopUiAppearance {
  /** Resolved light/dark palette; absent means follow the host palette. */
  tone?: 'light' | 'dark';
  accent: string;
  accentText: string;
  panel: string;
  text: string;
  heading: string;
  muted: string;
  appBg: string;
  border: string;
  player: string;
}

interface EchoWorkshopUiLyricsPeek {
  kind: string;
  currentLineIndex: number;
  currentText: string | null;
  nextText: string | null;
  translation: string | null;
}

interface EchoWorkshopUiAudioVisualizationOptions {
  waveformSamples?: number;
  /** Requested minimum spacing, 16..1000 ms. Actual cadence follows host updates and render budget. */
  intervalMs?: number;
  spectrum?: boolean;
  levels?: boolean;
}
interface EchoWorkshopUiAudioVisualizationLimits {
  maximumWaveformSamples: number; maximumMeterChannels: number;
  minimumIntervalMs: number; maximumIntervalMs: number;
  waveformLayout: 'mono'; continuous: false;
}
interface EchoWorkshopUiAudioConfigureMessage {
  type: 'echo:workshop-ui:audio-configure';
  audioVisualization: EchoWorkshopUiAudioVisualizationOptions;
}
interface EchoWorkshopUiReadyMessage {
  type: 'echo:workshop-ui:ready';
  protocolVersion?: 1;
  /** Optional native waveform precision. Default 256; integer 0..2048.
   * 0 omits waveform snapshots. Requires audio:spectrum. May be renegotiated via ready. */
  audioVisualization?: EchoWorkshopUiAudioVisualizationOptions;
}

interface EchoWorkshopUiCommandMessage {
  type: 'echo:workshop-ui:command';
  requestId: string;
  command: EchoWorkshopUiCommand;
  payload?: Record<string, unknown>;
}

interface EchoWorkshopUiInitMessage {
  type: 'echo:workshop-ui:init';
  protocolVersion: 1;
  theme: { id: string; version: string };
  capabilities: EchoWorkshopUiCapability[];
  presentation?: 'shell' | 'lyrics-background' | 'lyrics-view';
  appearance?: EchoWorkshopUiAppearance;
  features?: Array<'lyrics-events' | 'clock' | 'audio-events' | 'lyrics-interaction' | 'canvas-audio'>;
  audioVisualizationLimits?: EchoWorkshopUiAudioVisualizationLimits;
  /** Lattice desktop extension only; the host owns Windows desktop attachment. */
  desktop?: boolean;
  bottomInset?: number;
  uiContext?: { visible: boolean; locale: string; direction: 'ltr' | 'rtl'; reducedMotion: boolean };
}

interface EchoWorkshopUiStateMessage {
  type: 'echo:workshop-ui:state';
  protocolVersion: 1;
  /** Background runtimes stop RAF when null, and respect the host frame budget. */
  motion?: { frameIntervalMs: number | null };
  playback?: {
    state: string;
    currentTrackId: string | null;
    /** Same monotonic Audio Core generation as clock packets; reject older state after a switch. */
    generation?: number | null;
    positionSeconds: number;
    durationSeconds: number;
    volume: number | null;
    fixedVolumeEnabled?: boolean;
    volumeLocked?: boolean;
    volumeLockReason?: 'fixed' | 'dsd' | null;
    canGoPrevious?: boolean;
    canGoNext?: boolean;
    shuffleEnabled?: boolean;
    repeatMode?: 'off' | 'one' | 'all';
  };
  currentTrack?: EchoWorkshopUiTrack | null;
  queue?: {
    currentQueueId: string | null;
    canGoPrevious: boolean;
    canGoNext: boolean;
    shuffleEnabled?: boolean;
    repeatMode?: 'off' | 'one' | 'all';
    items: Array<{ queueId: string; track: EchoWorkshopUiTrack }>;
  };
  library?: {
    revision: number;
  };
  lyrics?: EchoWorkshopUiLyricsPeek | null;
  spectrum?: {
    /** Up to 128 native logarithmic frequency probes, or 32 on older/fallback hosts. */
    bands: number[];
    energy: number;
    transient: number;
    state: string;
  };
  /** Lyrics backgrounds with audio:spectrum receive these on state messages. */
  visualization?: Required<EchoWorkshopUiAudioVisualizationOptions>;
  visualizationLimits?: EchoWorkshopUiAudioVisualizationLimits;
  levels?: EchoWorkshopUiAudioMessage['levels'];
  waveform?: EchoWorkshopUiAudioMessage['waveform'];
}

interface EchoWorkshopUiResultMessage<T = unknown> {
  type: 'echo:workshop-ui:result';
  protocolVersion: 1;
  requestId: string;
  ok: boolean;
  value?: T;
  error?: string;
}

type EchoWorkshopUiHostMessage =
  | { type: 'echo:workshop-ui:appearance'; protocolVersion: 1; appearance: EchoWorkshopUiAppearance }
  | EchoWorkshopUiInitMessage
  | EchoWorkshopUiStateMessage
  | EchoWorkshopUiResultMessage
  | EchoWorkshopUiLyricsMessage
  | EchoWorkshopUiClockMessage
  | EchoWorkshopUiPingMessage
  | EchoWorkshopUiAudioMessage;

type EchoWorkshopUiFrameMessage =
  | EchoWorkshopUiAudioConfigureMessage
  | EchoWorkshopLyricsInteraction
  | EchoWorkshopUiReadyMessage
  | EchoWorkshopUiCommandMessage
  | EchoWorkshopUiPongMessage
  | EchoWorkshopUiErrorMessage;

/** Sanitized, bounded document returned by lyrics:get and pushed when its revision changes. */
interface EchoWorkshopUiLyricWord { text: string; startMs: number; endMs: number | null; }
interface EchoWorkshopUiLyricLine {
  timeMs: number;
  /** Optional rich TTML display fields; older hosts omit them. */
  endMs?: number | null;
  agentId?: string;
  backgroundVocals?: EchoWorkshopUiBackgroundVocal[];
  text: string;
  translation: string | null;
  romanization: string | null;
  kana: string | null;
  words: EchoWorkshopUiLyricWord[];
}
/** At most 8 vocals per line; words preserve authored whitespace. Total runtime lyrics stay <= 256 KiB. */
interface EchoWorkshopUiBackgroundVocal {
  timeMs: number;
  endMs: number | null;
  text: string;
  agentId?: string;
  translation: string | null;
  words: EchoWorkshopUiLyricWord[];
}
interface EchoWorkshopUiLyrics {
  kind: 'empty' | 'plain' | 'synced' | 'instrumental';
  title: string; artist: string; album: string | null;
  durationSeconds: number | null; offsetMs: number;
  provider: 'none' | 'local' | 'manual' | 'cached' | 'remote';
  /** Set only when the currently applied document is actually from AMLL. */
  attribution?: 'AMLL';
  lines: EchoWorkshopUiLyricLine[];
  plainText: string | null; syncedText: string | null;
}
interface EchoWorkshopUiLyricsMessage {
  type: 'echo:workshop-ui:lyrics'; protocolVersion: 1;
  trackId: string | null; revision: number; lyrics: EchoWorkshopUiLyrics | null;
}

/** lyrics:match capability. Payload { trackId: string } must identify the current song.
 * Host searches AMLL only, applies only auto-eligible candidates and keeps existing lyrics on miss.
 * No provider IDs, URLs or search results are exposed. Respect existing network-lyrics settings.
 * Uses a separate request from playback controls; allow up to 30 seconds for its acknowledgement.
 */
interface EchoWorkshopUiAmllMatchResult { trackId: string; matched: boolean; }
interface EchoWorkshopUiClockMessage {
  type: 'echo:workshop-ui:clock'; protocolVersion: 1;
  /** Included on song/metadata changes and ready handshake, omitted on ordinary clock ticks.
   * Apply it together with the clock so switching identity cannot briefly erase artwork/title. */
  currentTrack?: EchoWorkshopUiTrack | null;
  clock: {
    currentTrackId: string | null; state: string;
    positionSeconds: number; durationSeconds: number; playbackRate: number;
    /** Host browser performance.timeOrigin + performance.now(), milliseconds. */
    sampledAtMs: number; generation: number | null;
  };
  motion: { frameIntervalMs: number | null };
}
interface EchoWorkshopUiPingMessage { type: 'echo:workshop-ui:ping'; protocolVersion: 1; }
/** Existing capabilities: audio metadata needs playback:read, meters/spectrum need audio:spectrum.
 * Defaults to 10 Hz (backgrounds roughly 30 Hz); configurable spacing follows Audio Core updates and the render budget.
 * No playback PCM stream, device IDs or local paths.
 */
interface EchoWorkshopUiAudioMessage {
  type: 'echo:workshop-ui:audio'; protocolVersion: 1; trackId: string | null;
  visualization?: Required<EchoWorkshopUiAudioVisualizationOptions>;
  visualizationLimits?: EchoWorkshopUiAudioVisualizationLimits;
  audio?: {
    codec: string | null; sampleRate: number | null; bitDepth: number | null;
    channels: number | null; bitrate: number | null;
    deviceSampleRate: number | null; outputDevice: string | null;
    outputBackend: string | null; outputMode: string | null; replayGainDb: number | null;
    replayGainActive: boolean | null;
  } | null;
  levels?: {
    /** dBFS; input before native DSP unless source is native_post_dsp. */
    peakDb: number | null; rmsDb: number | null;
    source: 'native_post_dsp' | 'pre_native_estimated_post_dsp' | null;
    /** All native output channels, up to 32, in native order: [left, right] for stereo; one entry for mono.
     * Empty if per-channel native telemetry is unavailable. Never synthesize a missing channel. */
    channels: { peakDb: number | null; rmsDb: number | null }[];
  };
  /** Latest signed mono samples from the native analysis window: default 256, up to 2048.
   * Finite amplitudes are preserved, including values beyond [-1, 1].
   * sampleRate is the effective analysis rate, not necessarily the file rate.
   * Null when paused or native waveform telemetry is unavailable. Not continuous audio. */
  waveform?: { samples: number[]; sampleRate: number; channels: 1; source: 'native_post_dsp' } | null;
  spectrum?: EchoWorkshopUiStateMessage['spectrum'];
}
interface EchoWorkshopUiPongMessage { type: 'echo:workshop-ui:pong'; protocolVersion: 1; }
interface EchoWorkshopUiErrorMessage { type: 'echo:workshop-ui:error'; protocolVersion: 1; }

type EchoWorkshopUiLyricsResult = EchoWorkshopUiResultMessage<EchoWorkshopUiLyrics | null>;
/** audio:getVisualization returns a snapshot, without event envelope fields. */
type EchoWorkshopUiAudioVisualizationResult = EchoWorkshopUiResultMessage<Omit<EchoWorkshopUiAudioMessage, 'type' | 'protocolVersion'>>;
