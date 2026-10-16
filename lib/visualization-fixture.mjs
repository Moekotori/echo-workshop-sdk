/** Portable SDK fixture: never claims to contain native audio samples. */
export function createVisualizationFixture(options = {}, trackId = null) {
  const visualization = {
    waveformSamples: Number.isFinite(options.waveformSamples) ? Math.max(0, Math.min(2048, Math.floor(options.waveformSamples))) : 256,
    intervalMs: Number.isFinite(options.intervalMs) ? Math.max(16, Math.min(1000, Math.floor(options.intervalMs))) : 100,
    spectrum: options.spectrum !== false, levels: options.levels !== false,
  };
  return {
    trackId, visualization,
    visualizationLimits: { maximumWaveformSamples: 2048, maximumMeterChannels: 32,
      minimumIntervalMs: 16, maximumIntervalMs: 1000, waveformLayout: 'mono', continuous: false },
    ...(visualization.levels ? { levels: { peakDb: null, rmsDb: null, source: null, channels: [] } } : {}),
    waveform: null,
    ...(visualization.spectrum ? { spectrum: { bands: [], energy: 0, transient: 0, state: 'none' } } : {}),
  };
}
