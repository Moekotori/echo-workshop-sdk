// Generated from contracts/library.json.
/// <reference path="./echo-workshop-library-models.d.ts" />
type EchoWorkshopLibrarySort = "default" | "createdAsc" | "createdDesc" | "yearAsc" | "yearDesc" | "titleAsc" | "titleDesc" | "trackCountAsc" | "trackCountDesc" | "albumCountDesc" | "durationAsc" | "durationDesc" | "fileModifiedAsc" | "fileModifiedDesc" | "qualityAsc" | "qualityDesc" | "codecAsc" | "codecDesc" | "audioSpecAsc" | "audioSpecDesc" | "bitrateAsc" | "bitrateDesc" | "bpmAsc" | "bpmDesc" | "trackNumber" | "frequent" | "playCountAsc" | "playCountDesc" | "lastPlayed" | "random" | "title" | "artist" | "artistDesc" | "artistAlbum" | "album" | "albumDesc" | "recent" | "addedAsc";
interface EchoWorkshopLibraryQuery {
  sort?: "default" | "createdAsc" | "createdDesc" | "yearAsc" | "yearDesc" | "titleAsc" | "titleDesc" | "trackCountAsc" | "trackCountDesc" | "albumCountDesc" | "durationAsc" | "durationDesc" | "fileModifiedAsc" | "fileModifiedDesc" | "qualityAsc" | "qualityDesc" | "codecAsc" | "codecDesc" | "audioSpecAsc" | "audioSpecDesc" | "bitrateAsc" | "bitrateDesc" | "bpmAsc" | "bpmDesc" | "trackNumber" | "frequent" | "playCountAsc" | "playCountDesc" | "lastPlayed" | "random" | "title" | "artist" | "artistDesc" | "artistAlbum" | "album" | "albumDesc" | "recent" | "addedAsc";
  audioFormatFilter?: "all" | "sampleRate44100" | "sampleRate48000" | "sampleRate88200" | "sampleRate96000" | "sampleRate176400" | "sampleRate192000" | "sampleRate352800" | "sampleRate384000" | "dsd" | "otherSampleRate";
  fileFormatFilter?: "all" | "flac" | "mp3" | "wav" | "aiff" | "alac" | "aac" | "ogg" | "opus" | "dsd" | "other";
  vocalFilter?: "all" | "instrumental" | "excludeInstrumental";
  lyricsFilter?: "all" | "withLyrics" | "withoutLyrics" | "withWordTiming" | "withoutWordTiming";
  artistGrouping?: "split" | "albumArtist";
  duplicateMode?: "strict" | "balanced" | "aggressive";
  hideDuplicates?: boolean;
  showDuplicatesOnly?: boolean;
  showOsuOnly?: boolean;
  excludeOsuAlbums?: boolean;
  collapseAlbumVersions?: boolean;
  sorts?: EchoWorkshopLibrarySort[]; sourceProvider?: 'local' | 'remote'; sourceId?: string; folderIds?: string[]; personalTagId?: string;
}
interface EchoWorkshopLibraryApi {
  onChanged(handler: (change: unknown) => unknown): EchoWorkshopUnsubscribe;
  getSummary(): Promise<EchoWorkshopLibrarySummary>;
  getTracks(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
  getAlbums(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopAlbum>>;
  getArtists(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopArtist>>;
  getGenres(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopGenre>>;
  getAlbumTracks(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
  getArtistTracks(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
  getArtistAlbums(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopAlbum>>;
  getGenreTracks(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopTrack>>;
  getGenreAlbums(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopAlbum>>;
  getTrack(trackId: string): Promise<EchoWorkshopTrack>;
  getTracksByIds(trackIds: string[]): Promise<EchoWorkshopTrack[]>;
  getPlaylists(): Promise<EchoWorkshopPlaylist[]>;
  getPlaylistItems(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
  playlists: {
    onChanged(handler: (change: unknown) => unknown): EchoWorkshopUnsubscribe;
    getItems(id: string, query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
    create(input: { name: string; description?: string }): Promise<EchoWorkshopPlaylist>;
    addTracks(playlistId: string, trackIds: string[]): Promise<EchoWorkshopPlaylistItem[]>;
    update(playlistId: string, patch: EchoWorkshopPlaylistPatch): Promise<EchoWorkshopPlaylist>;
    removeItems(playlistId: string, itemIds: string[]): Promise<{ affectedCount: number }>;
    list(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylist>>;
    get(playlistId: string): Promise<EchoWorkshopPlaylist>;
    delete(playlistId: string): Promise<null>;
    moveItem(playlistId: string, itemId: string, position: number): Promise<null>;
    getRules(playlistId: string): Promise<EchoWorkshopSmartRules>;
    previewRules(input: EchoWorkshopSmartInput): Promise<EchoWorkshopSmartPreview>;
    createSmart(input: EchoWorkshopSmartInput): Promise<EchoWorkshopPlaylist>;
    updateRules(playlistId: string, input: EchoWorkshopSmartInput): Promise<EchoWorkshopPlaylist>;
    freeze(playlistId: string, name?: string): Promise<EchoWorkshopPlaylist>;
  };
  getLikedTracks(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
  favorites: {
    onChanged(handler: (change: unknown) => unknown): EchoWorkshopUnsubscribe;
    getTracks(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
    getTrackStates(trackIds: string[]): Promise<Record<string, boolean>>;
    getAlbums(query?: EchoWorkshopPageQuery): Promise<EchoWorkshopPage<EchoWorkshopPlaylistItem>>;
    getAlbumStates(albumIds: string[]): Promise<Record<string, boolean>>;
    setTrack(trackId: string, liked: boolean): Promise<EchoWorkshopLikedTrackResult>;
    setAlbum(albumId: string, liked: boolean): Promise<EchoWorkshopLikedAlbumResult>;
    moveTrack(itemId: string, position: number): Promise<null>;
  };
  getLikedTrackIds(trackIds: string[]): Promise<Record<string, boolean>>;
  toggleTrackLiked(trackId: string): Promise<EchoWorkshopLikedTrackResult>;
  toggleAlbumLiked(albumId: string): Promise<EchoWorkshopLikedAlbumResult>;
  createPlaylist(input: { name: string; description?: string }): Promise<EchoWorkshopPlaylist>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<EchoWorkshopPlaylistItem[]>;
  updatePlaylist(playlistId: string, patch: EchoWorkshopPlaylistPatch): Promise<EchoWorkshopPlaylist>;
  removePlaylistItems(playlistId: string, itemIds: string[]): Promise<{ affectedCount: number }>;
  tags: {
    onChanged(handler: (change: unknown) => unknown): EchoWorkshopUnsubscribe;
    list(target?: EchoWorkshopTagTarget): Promise<EchoWorkshopPersonalTag[]>;
    change(change: EchoWorkshopTagChange): Promise<null>;
    getItems(tagId: string, page?: number): Promise<EchoWorkshopPage<EchoWorkshopTagItem>>;
  };
  listenLater: {
    onChanged(handler: (change: unknown) => unknown): EchoWorkshopUnsubscribe;
    list(query?: { page?: number; search?: string; completed?: boolean }): Promise<EchoWorkshopPage<EchoWorkshopListenLaterEntry>>;
    get(albumId: string): Promise<EchoWorkshopListenLaterEntry | null>;
    change(change: { albumId: string; action: 'add' | 'remove' | 'complete' | 'reset' }): Promise<null>;
  };
  playQuery(query: EchoWorkshopPageQuery, trackId?: string): Promise<EchoWorkshopCollectionPlayResult>;
}
