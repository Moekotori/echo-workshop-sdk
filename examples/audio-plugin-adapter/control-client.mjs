// Local developer connection probe. This file is not Workshop item content.
import { readFile } from 'node:fs/promises';
import { connect } from 'node:net';
import { randomUUID } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';

const [discoveryPath, ...pluginClassIds] = process.argv.slice(2);
if (!discoveryPath || pluginClassIds.length > 256 ||
    pluginClassIds.some(id => !/^[a-f0-9]{32}$/iu.test(id))) {
  throw new Error('Usage: node control-client.mjs <local session.json> [VST3 class IDs...]');
}
const session = JSON.parse(await readFile(discoveryPath, 'utf8'));
if (session.protocol !== 'echo.audio-plugin-adapter' || session.version !== 1 ||
    typeof session.endpoint !== 'string' ||
    !/^\\\\\.\\pipe\\echo-audio-plugin-adapter-[a-f0-9-]{36}$/u.test(session.endpoint) ||
    typeof session.token !== 'string' || !/^[a-f0-9]{64}$/u.test(session.token)) {
  throw new Error('Invalid local adapter discovery file.');
}
const socket = connect(session.endpoint);
const handshakeId = randomUUID();
const decoder = new StringDecoder('utf8');
let buffer = '';
let authenticated = false;
const handshakeTimeout = setTimeout(() => socket.destroy(), 2000);
socket.on('connect', () => {
  socket.write(JSON.stringify({
    id: handshakeId, method: 'adapter:handshake',
    payload: {
      protocol: session.protocol, version: session.version, token: session.token,
      name: 'ECHO adapter connection probe', pluginClassIds,
    },
  }) + '\n');
});
socket.on('data', chunk => {
  if (Buffer.byteLength(buffer) + chunk.length > 262144) { socket.destroy(); return; }
  buffer += decoder.write(chunk);
  let end;
  while ((end = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, end);
    buffer = buffer.slice(end + 1);
    try {
      const message = JSON.parse(line);
      if (!authenticated && message.id === handshakeId && message.result?.success === true &&
          message.result.audioTransport === 'unavailable') {
        authenticated = true;
        clearTimeout(handshakeTimeout);
        console.log('Control channel connected. Native audio processing is unavailable.');
      } else if (authenticated && message.method === 'adapter:ping' && typeof message.id === 'string') {
        socket.write(JSON.stringify({ id: message.id, result: { success: true } }) + '\n');
      } else {
        socket.destroy();
      }
    } catch { socket.destroy(); }
  }
});
socket.on('error', () => { process.exitCode = 1; });
socket.on('close', () => {
  clearTimeout(handshakeTimeout);
  console.log('Control channel closed.');
});
process.once('SIGINT', () => socket.destroy());
