/** Authoring format v1. ECHO validates ranges and total paint budgets on import. */
export type EchoAfterglowColor = 'transparent' | 'bg' | 'fg' | 'accent' | 'accent2' | 'ghostA' | 'ghostB' | `#${string}`;
export interface EchoAfterglowMotion {
  floatX?: number;
  floatY?: number;
  speed?: number;
  spin?: number;
  phase?: number;
}
export interface EchoAfterglowLayerBase {
  x?: number; y?: number;
  width?: number; height?: number; radius?: number;
  color?: EchoAfterglowColor; stroke?: EchoAfterglowColor;
  opacity?: number; rotation?: number; strokeWidth?: number;
  motion?: EchoAfterglowMotion;
}
export type EchoAfterglowLayer = EchoAfterglowLayerBase & (
  | { type: 'circle' | 'ellipse' | 'rect' | 'line' }
  | { type: 'polygon'; points: [number, number][] }
  | { type: 'text'; text: string; fontSize?: number }
  | { type: 'particles'; count?: number }
);
export interface EchoAfterglowScene {
  id: string;
  title: string;
  layers: EchoAfterglowLayer[];
}
export interface EchoAfterglowScenePack {
  schemaVersion: 1;
  mode?: 'mix' | 'only';
  scenes: EchoAfterglowScene[];
}
export interface EchoAfterglowLyricsStyle {
  type: 'echo-workshop-lyrics-style';
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  settings?: { lyricsPageStyle?: 'jizura' };
  scene: {
    schemaVersion: 1;
    background: 'theme';
    root: { id: string; type: 'group'; children: [] };
    afterglow: EchoAfterglowScenePack;
  };
}
