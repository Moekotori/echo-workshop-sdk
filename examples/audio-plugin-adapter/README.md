# Local audio adapter connection probe

This standalone Node.js example exercises the optional local control channel. It is **not a VST3 host**, does not process audio, and must not be included in a Workshop profile package.

On Windows, launch ECHO with `ECHO_AUDIO_PLUGIN_ADAPTER=1`. ECHO opens a random per-session named pipe when the Workshop manager initializes and writes a private discovery file at `<userData>/audio-plugin-adapter/session.json`. No adapter is launched automatically. On other platforms this integration is not assembled.

Run this example separately, passing that local discovery file and optionally the Class IDs provided by your adapter:

```powershell
node control-client.mjs "<local session.json>" 0123456789abcdef0123456789abcdef
```

The example authenticates and acknowledges heartbeat requests. Refresh the Workshop list to see dependency state change. Even with a matching Class ID the state is `audio-core-required`: no native insert exists yet. Remove the environment variable to disable the channel, and stop the example with Ctrl+C.

Never upload, commit, log, or pass the session token as a CLI argument. The discovery file belongs to the local user and is removed on normal ECHO shutdown. ECHO sends no track paths, metadata, covers, PCM, device list, or playback history through this channel.

See [the protocol contract](../../contracts/audio-plugin-adapter.json) and [native integration requirements](../../../ECHO_AUDIO_PLUGIN_ADAPTER.md).
