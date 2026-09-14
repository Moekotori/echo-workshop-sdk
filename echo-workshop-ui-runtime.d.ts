/** ECHO Workshop theme UI runtime bridge. Protocol version 1. See echo-workshop-sdk.json. */

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
  | 'audio:spectrum'
  | 'storage';

type EchoWorkshopUiCommand =
  | 'navigate'
  | 'play'
  | 'pause'
  | 'playPause'
  | 'previous'
  | 'next'
  | 'seek'
  | 'setVolume'
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
  | 'lyrics:get'
  | 'audio:getSpectrum'
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
  | 'window:close';

interface EchoWorkshopUiTrack {
  id: string;
  title?: string;
  artist?: string | null;
  album?: string | null;
  durationSeconds?: number | null;
  coverUrl?: string | null;
  liked?: boolean;
}

interface EchoWorkshopUiAppearance {
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

interface EchoWorkshopUiReadyMessage {
  type: 'echo:workshop-ui:ready';
  protocolVersion?: 1;
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
  features?: Array<'lyrics-events' | 'clock'>;
}

interface EchoWorkshopUiStateMessage {
  type: 'echo:workshop-ui:state';
  protocolVersion: 1;
  /** Background runtimes stop RAF when null, and respect the host frame budget. */
  motion?: { frameIntervalMs: number | null };
  playback?: {
    state: string;
    currentTrackId: string | null;
    positionSeconds: number;
    durationSeconds: number;
    volume: number | null;
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
    bands: number[];
    energy: number;
    transient: number;
    state: string;
  };
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
  | EchoWorkshopUiInitMessage
  | EchoWorkshopUiStateMessage
  | EchoWorkshopUiResultMessage
  | EchoWorkshopUiLyricsMessage
  | EchoWorkshopUiClockMessage
  | EchoWorkshopUiPingMessage;

type EchoWorkshopUiFrameMessage =
  | EchoWorkshopUiReadyMessage
  | EchoWorkshopUiCommandMessage
  | EchoWorkshopUiPongMessage
  | EchoWorkshopUiErrorMessage;

/** Sanitized, bounded document returned by lyrics:get and pushed when its revision changes. */
interface EchoWorkshopUiLyricWord { text: string; startMs: number; endMs: number | null; }
interface EchoWorkshopUiLyricLine {
  timeMs: number;
  text: string;
  translation: string | null;
  romanization: string | null;
  kana: string | null;
  words: EchoWorkshopUiLyricWord[];
}
interface EchoWorkshopUiLyrics {
  kind: 'empty' | 'plain' | 'synced' | 'instrumental';
  title: string; artist: string; album: string | null;
  durationSeconds: number | null; offsetMs: number;
  provider: 'none' | 'local' | 'manual' | 'cached' | 'remote';
  lines: EchoWorkshopUiLyricLine[];
  plainText: string | null; syncedText: string | null;
}
interface EchoWorkshopUiLyricsMessage {
  type: 'echo:workshop-ui:lyrics'; protocolVersion: 1;
  trackId: string | null; revision: number; lyrics: EchoWorkshopUiLyrics | null;
}
interface EchoWorkshopUiClockMessage {
  type: 'echo:workshop-ui:clock'; protocolVersion: 1;
  clock: {
    currentTrackId: string | null; state: string;
    positionSeconds: number; durationSeconds: number; playbackRate: number;
    /** Host browser performance.timeOrigin + performance.now(), milliseconds. */
    sampledAtMs: number; generation: number | null;
  };
  motion: { frameIntervalMs: number | null };
}
interface EchoWorkshopUiPingMessage { type: 'echo:workshop-ui:ping'; protocolVersion: 1; }
interface EchoWorkshopUiPongMessage { type: 'echo:workshop-ui:pong'; protocolVersion: 1; }
interface EchoWorkshopUiErrorMessage { type: 'echo:workshop-ui:error'; protocolVersion: 1; }
type EchoWorkshopUiLyricsResult = EchoWorkshopUiResultMessage<EchoWorkshopUiLyrics | null>;
