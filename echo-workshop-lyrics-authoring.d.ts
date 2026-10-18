/** Display-only helpers and bounded host snapshots for lyrics authors. */
type EchoWorkshopAsyncUnsubscribe = () => Promise<void>;
interface EchoWorkshopLyricsDisplayPreferences {
  fontFamily: string | null; fontUrl: string | null;
  fontSizePx: number; secondaryFontSizePx: number | null;
  activeFontScalePercent?: number; lineSpacingPercent?: number;
  textDirection?: 'horizontal' | 'vertical'; translationEnabled: boolean; romanizationEnabled: boolean;
  wordHighlightEnabled?: boolean; smartAlignmentEnabled?: boolean;
}
interface EchoWorkshopLyricsTimelineFrame {
  lyricPositionMs: number; currentLineIndex: number; nextLineIndex: number;
  activeLines: Array<{ lineIndex: number; progress: number }>;
  backgroundVocals: Array<{ lineIndex: number; vocalIndex: number; progress: number }>;
  activeWords: Array<{ lineIndex: number; vocalIndex: number | null; wordIndex: number; progress: number }>;
  /** A gap in supplied lyric timings, not a claim that the audio contains no vocals. */
  gap: { startMs: number; endMs: number; progress: number; remainingMs: number } | null;
}
interface EchoWorkshopLyricsTimeline {
  /** Seconds from the host playback clock; applies the document's offset exactly once. */
  frameAt(positionSeconds: number): EchoWorkshopLyricsTimelineFrame;
  dispose(): void;
}
interface EchoWorkshopArtworkPalette { trackId: string | null; colors: readonly string[]; }
interface EchoWorkshopRuntimeLayout {
  viewport: { width: number; height: number };
  safeInsets: { top: number; right: number; bottom: number; left: number };
  occlusions: Array<{ kind: 'titlebar' | 'player'; x: number; y: number; width: number; height: number }>;
}
interface EchoWorkshopRuntimeRenderBudget {
  mode: 'active' | 'unfocused' | 'hidden' | 'pressure' | 'moving'; visible: boolean;
  frameIntervalMs: number | null; allowDecorativeMotion: boolean; reducedMotion: boolean;
}
