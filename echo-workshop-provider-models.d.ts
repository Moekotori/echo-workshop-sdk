type EchoWorkshopProviderKind = 'lyrics' | 'metadata' | 'covers';
interface EchoWorkshopProviderDescriptor {
  key: string;
  kind: EchoWorkshopProviderKind;
  title: string;
  origin: 'host' | 'workshop';
  ready: boolean;
}
interface EchoWorkshopCandidateSearch {
  providerKey: string;
  requestId: string;
  query?: string;
}
interface EchoWorkshopCandidate {
  id: string;
  trackId: string;
  providerKey: string;
  kind: EchoWorkshopProviderKind;
  title: string | null;
  artist: string | null;
  album: string | null;
  score: number | null;
}
interface EchoWorkshopCandidatePreview {
  candidate: EchoWorkshopCandidate;
  lyrics?: EchoWorkshopSandboxLyrics | null;
  metadata?: { title: string | null; artist: string | null; album: string | null; albumArtist: string | null;
    year: number | null; genre: string | null; trackNo: number | null; discNo: number | null };
  coverUrl?: string | null;
  text?: string;
  format?: 'lrc' | 'ttml' | 'txt';
}
