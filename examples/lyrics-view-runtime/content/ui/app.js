// No parent DOM, dependencies, network or audio access. Font files may be bundled
// as ui/*.woff2 and referenced with @font-face in app.css (record their license).
let documentState = null, clock = null, frameIntervalMs = null;
let currentIndex = -2, words = [], raf = null, lastDraw = -Infinity, request = 0;
const line = document.getElementById('line');
const post = message => parent.postMessage({ protocolVersion: 1, ...message }, '*');
const command = (name, payload = {}) => post({ type: 'echo:workshop-ui:command', requestId: String(++request), command: name, payload });
const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
const position = () => {
  if (!clock) return 0;
  const elapsed = Math.max(0, Math.min(1500, performance.timeOrigin + performance.now() - clock.sampledAtMs));
  return Math.min(clock.durationSeconds || Infinity, clock.positionSeconds + (clock.state === 'playing' ? elapsed * clock.playbackRate / 1000 : 0)) * 1000;
};
function draw() {
  const lyrics = documentState?.trackId === clock?.currentTrackId ? documentState?.lyrics : null;
  const lines = lyrics?.lines ?? [];
  const time = position() + (lyrics?.offsetMs ?? 0);
  let index = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].timeMs <= time) index = i;
  if (index !== currentIndex) {
    currentIndex = index;
    words = [];
    line.replaceChildren();
    const active = lines[index];
    if (active?.words?.length) {
      words = active.words.map(word => { const span = document.createElement('span'); span.className = 'word'; span.textContent = word.text; line.append(span); return span; });
    } else line.textContent = active?.text || (lyrics?.kind === 'instrumental' ? '纯音乐' : '等待歌词…');
    document.getElementById('previous').textContent = lines[index - 1]?.text ?? '';
    document.getElementById('next').textContent = lines[index + 1]?.text ?? '';
    document.getElementById('translation').textContent = active?.translation ?? '';
  }
  const active = lines[index];
  words.forEach((element, i) => {
    const word = active.words[i];
    const end = word.endMs ?? active.words[i + 1]?.startMs ?? lines[index + 1]?.timeMs ?? word.startMs + 1000;
    element.style.setProperty('--progress', String(Math.max(0, Math.min(1, (time - word.startMs) / Math.max(1, end - word.startMs)))));
  });
}
function tick(now) {
  raf = null;
  if (now - lastDraw >= (frameIntervalMs ?? Infinity)) { lastDraw = now; draw(); }
  if (frameIntervalMs !== null && clock?.state === 'playing' && !document.hidden) raf = requestAnimationFrame(tick);
}
const restart = () => { stop(); draw(); if (frameIntervalMs !== null && clock?.state === 'playing' && !document.hidden) raf = requestAnimationFrame(tick); };
window.addEventListener('message', event => {
  if (event.source !== parent || event.data?.protocolVersion !== 1) return;
  const message = event.data;
  if (message.type === 'echo:workshop-ui:ping') { post({ type: 'echo:workshop-ui:pong' }); return; }
  if (message.type === 'echo:workshop-ui:init') {
    const appearance = message.appearance;
    if (appearance) for (const [key, value] of Object.entries({ bg: appearance.appBg, text: appearance.text, muted: appearance.muted, accent: appearance.accent })) if (typeof value === 'string') document.documentElement.style.setProperty(`--${key}`, value);
  } else if (message.type === 'echo:workshop-ui:lyrics') {
    documentState = message; currentIndex = -2;
    document.getElementById('title').textContent = message.lyrics?.title || 'LYRIC INK';
  } else if (message.type === 'echo:workshop-ui:clock') {
    clock = message.clock; frameIntervalMs = message.motion?.frameIntervalMs ?? null;
  }
  restart();
});
document.getElementById('play').onclick = () => command('playPause');
line.onclick = () => { const lyrics = documentState?.lyrics; const active = lyrics?.lines[currentIndex]; if (active && documentState.trackId === clock?.currentTrackId) command('seek', { positionSeconds: Math.max(0, (active.timeMs - lyrics.offsetMs) / 1000) }); };
document.addEventListener('visibilitychange', restart);
window.addEventListener('pagehide', () => { stop(); words = []; documentState = null; clock = null; });
post({ type: 'echo:workshop-ui:ready' });
