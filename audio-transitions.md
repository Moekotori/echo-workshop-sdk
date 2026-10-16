# Offline windows and scheduled transitions

These additive API 2 interfaces require a host containing the implementation;
older hosts reject their action names. Check availability before offering them.

`audio.offline.open({ trackId, sampleRate, channels, sampleFormat })` accepts
`s16le` (default) and `f32le`. `audio.offline.seek(sessionId, positionSeconds)`
replaces the decoder using accurate input-side seeking. It drops old buffered PCM
and keeps the session identity. A pending read must finish before seek. Reads stay
frame aligned and bounded to 128 KiB. Two source sessions may be open globally,
including two from one plugin; each expires after two idle minutes. Permission
`audio:offline-read` and the existing per-track subscriber confirmation still apply.

`queue.reorder(queueIds)` requires `queue:control`. Supply the exact permutation
of every queue identity, including the current item. Missing, duplicate or foreign
IDs reject the entire operation. This preserves item objects and current playback.
`queue.get()` currently exposes at most 500 items; a truncated snapshot alone is
insufficient to reorder a larger queue. Keep the original complete identities if
your plugin created that queue.

`playback.nextAt(positionSeconds)` requires `playback:control`. The argument is
an absolute media position in the **currently playing track**, not wall time or a
delay. The native host converts it to its output-frame clock. The transition
window ends at that position. Without a registered provider it is a zero-frame
hard cut to the exact next queue item. A second call from the same runtime
cancels its previous pending schedule before preparing a replacement.

Register a provider using `audio.transition.registerProvider(id, meta, provider)`.
Declare `audio:transition` and `playback:control`; reading source PCM additionally
requires `audio:offline-read`. `meta` may contain a display name. Registration
returns a promise for an async unregister function. One provider per plugin and
four registered providers globally are allowed; `nextAt` uses the caller's provider.
There is one global preparation slot.

The host calls `windowFrames({ sampleRate, plan })`, then
`prepare({ from, to, plan, sampleRate, channels, sessionId })`. Identities contain
track and queue IDs, never local paths. The incoming duration may be unknown (0);
opening its offline session returns the decoded-source duration. A plan includes
`positionSeconds`, `currentFadeStartSeconds`, `nextStartSeconds` and `windowFrames`.
After `windowFrames`, `currentFadeStartSeconds` is the outgoing window's start.

The host pulls `render({ frameOffset, frameCount, progress })` sequentially in
chunks of at most 4096 frames **before arming playback**. Return an interleaved
`Float32Array` or number array with exactly `frameCount * channels` finite samples
(absolute values no greater than 8). Progress is the start offset divided by the
window length. The prepared PCM resides only in the native host; main and renderer
transport one chunk at a time. `rewritesSamples()` must return a boolean. A false
return declares that the provider leaves samples outside its window untouched;
the host bypasses provider processing there. The normal user DSP/output pipeline
still applies; this is not a whole-pipeline Bit-Perfect certification.

The current implementation supports local daemon PCM playback at unity speed,
8–48 kHz and one or two channels, without SRC rate changes, SDM, ReplayGain, CUE
ranges or laboratory mixing. The maximum window is 16 seconds (6,144,000 PCM bytes
at 48 kHz stereo). Preparation expires after 15 seconds; each plugin callback
has a five-second deadline. The start of the window must still be at least
250 ms ahead when arming. Late or incomplete material is rejected; if the native
next deck misses its start deadline, the host cancels the transition and keeps
the outgoing deck playing. It never shifts the requested beat silently.

Queue revisions, seek, track replacement and stop invalidate preparation. Closing
the registering iframe, disabling the plugin, unregistering the provider or
discarding the plan releases pending requests and native window data.

`events.on('transition:committed', handler)` requires `playback:read`. It fires
from the validated native identity-commit event, with plan/queue identities,
`outputFrame` and `sourcePositionSeconds`. It is suitable for bookkeeping; a
resolved `nextAt` promise only confirms preparation/arming, not audible commit.
The event also reports native Smart Transitions. SDK mock previews cannot verify
the native clock or produce an audible scheduled commit.
