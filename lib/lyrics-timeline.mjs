/** Pure display timeline. Retains one supplied, sanitized current-track document. */
export function createLyricsTimeline(document) {
  let lyrics = document;
  let intervals = [];
  let starts = [];
  let ends = [];
  const lines = document?.lines ?? [];
  const ordered = lines.map((line, index) => ({ line, index })).sort((a, b) => a.line.timeMs - b.line.timeMs);
  let primaryStarts = ordered.map(item => item.line.timeMs);
  const duration = document?.durationSeconds == null ? Infinity : document.durationSeconds * 1000;
  for (let i = 0; i < ordered.length; i++) {
    const { line, index } = ordered[i];
    let next = i + 1;
    while (next < ordered.length && ordered[next].line.timeMs === line.timeMs) next++;
    const nextStart = ordered[next]?.line.timeMs ?? duration;
    const add = (value, vocalIndex) => {
      const start = value.timeMs;
      const timedEnd = value.words.reduce((end, word, wordIndex) => Math.max(end,
        word.endMs ?? value.words[wordIndex + 1]?.startMs ?? nextStart), start);
      const end = value.endMs ?? (timedEnd > start ? timedEnd : nextStart);
      intervals.push({ lineIndex: index, vocalIndex, start, end: Math.max(start, end), words: value.words });
    };
    add(line, null);
    line.backgroundVocals?.forEach((vocal, index) => add(vocal, index));
  }
  intervals.sort((a, b) => a.start - b.start);
  let maximumEnd = 0;
  for (const interval of intervals) {
    starts.push(interval.start);
    maximumEnd = Math.max(maximumEnd, interval.end);
    ends.push(maximumEnd);
  }
  const upperBound = (values, time) => {
    let low = 0, high = values.length;
    while (low < high) { const middle = (low + high) >>> 1; if (values[middle] <= time) low = middle + 1; else high = middle; }
    return low;
  };
  const progress = (time, start, end) => end > start && Number.isFinite(end)
    ? Math.max(0, Math.min(1, (time - start) / (end - start))) : 0;
  return Object.freeze({
    frameAt(positionSeconds) {
      if (!lyrics) throw Error('lyrics-timeline-disposed');
      if (!Number.isFinite(positionSeconds) || positionSeconds < 0) throw Error('lyrics-position-invalid');
      const time = Math.max(0, positionSeconds * 1000 + lyrics.offsetMs);
      const upper = upperBound(starts, time), activeLines = [], backgroundVocals = [], activeWords = [];
      for (let i = upper - 1; i >= 0 && ends[i] > time; i--) {
        const item = intervals[i];
        if (time >= item.end) continue;
        const entry = { lineIndex: item.lineIndex, progress: progress(time, item.start, item.end) };
        if (item.vocalIndex === null) activeLines.push(entry);
        else backgroundVocals.push({ ...entry, vocalIndex: item.vocalIndex });
        item.words.forEach((word, wordIndex) => {
          const end = word.endMs ?? item.words[wordIndex + 1]?.startMs ?? item.end;
          if (word.startMs <= time && time < end) activeWords.push({ lineIndex: item.lineIndex,
            vocalIndex: item.vocalIndex, wordIndex, progress: progress(time, word.startMs, end) });
        });
      }
      activeLines.sort((a, b) => a.lineIndex - b.lineIndex);
      backgroundVocals.sort((a, b) => a.lineIndex - b.lineIndex || a.vocalIndex - b.vocalIndex);
      const current = upperBound(primaryStarts, time) - 1;
      const gapStart = upper ? ends[upper - 1] : 0;
      const gapEnd = Math.min(starts[upper] ?? duration, duration);
      return { lyricPositionMs: time, currentLineIndex: current >= 0 ? ordered[current].index : -1,
        nextLineIndex: ordered[current + 1]?.index ?? -1, activeLines, backgroundVocals, activeWords,
        gap: !activeLines.length && !backgroundVocals.length && Number.isFinite(gapEnd) && gapEnd > time && gapStart <= time
          ? { startMs: gapStart, endMs: gapEnd, progress: progress(time, gapStart, gapEnd), remainingMs: gapEnd - time } : null };
    },
    dispose() { lyrics = null; intervals = []; starts = []; ends = []; primaryStarts = []; ordered.length = 0; },
  });
}
