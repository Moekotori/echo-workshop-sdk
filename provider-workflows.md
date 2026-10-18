# Provider workflows and host changes

API 2 adds the same workflow to `echo.lyrics`, `echo.metadata` and `echo.covers`.
Existing flat lyrics methods and all three `registerProvider` methods keep their
signatures and behavior. This is source SDK work for ECHO 26.10.18; it does not
publish a new SDK package or Workshop item.

Each domain has `providers.list()` / `providers.onChanged()` and
`candidates.get(trackId)`, `search(trackId, options)`, `preview(trackId, id)`,
`apply(trackId, id)`, `reject(trackId, id)`, `cancel(requestId)` and `onChanged()`.
Descriptors identify host or Workshop providers with a stable key and readiness.
Use the returned candidate ID, track ID and domain together. Preview returns only
the selected kind's data; paths, raw responses and cover cache filenames stay in
the host. Registered providers receive public track fields and an AbortSignal.

```js
const [provider] = await echo.metadata.providers.list();
const requestId = crypto.randomUUID();
const candidates = await echo.metadata.candidates.search(trackId, {
  providerKey: provider.key, requestId, query: 'Artist Song'
});
const preview = await echo.metadata.candidates.preview(trackId, candidates[0].id);
// Call after the user chooses this preview.
await echo.metadata.candidates.apply(trackId, preview.candidate.id);
```

Read, search and write have separate grants: `lyrics:read/search/write`,
`metadata:read/search/write`, `covers:read/search/write`. New grants do not inherit
the old `library:control` permission. Provider registration keeps its existing
contribution grants. Host capabilities report unavailable services on either
surface. Theme runtimes use the same workflows and permission checks as plugins.

Search returns at most 20 candidates; one runtime owns at most four searches.
Queries are at most 512 characters; staged lyrics are at most 1 MiB per batch.
Candidate pages are bounded in the host database. Complete lyrics preserve word
timing, translations, romanization and instrumental state. New candidate apply
updates the lyrics cache or library database/cover cache, with automatic sidecar
writes disabled. Existing embedded/manual field protections still apply.
This workflow does not save source-file tags or embed artwork/lyrics.

`cancel(requestId)` is scoped to the calling runtime. Workshop providers receive
the abort signal. Existing native searches that cannot cancel finish in their
host slot; the runtime discards late results. The request ID and slot remain
reserved until actual completion. Unloading a frame aborts its active lookups.
Staging is not rolled back once the host has persisted the candidate batch.

DSP, Home, Presence, Bridge and media session expose `onChanged(handler)`.
`echo.host.onChanged(handler)` combines permitted domains as `{ domain }`.
Events carry invalidations, not complete settings or diagnostics: refresh only
the affected visible state. Existing `settings.onChanged` remains the package's
own declared settings. Host setting writes, shared settings synchronization,
successful native control mutations and DSP persistence invalidate their domain;
MQTT/OBS connection transitions also invalidate Bridge. No new polling timers,
telemetry streams or snapshot cache are introduced. A returned unsubscribe
releases author handlers; runtime unload releases the shared host listeners.

The CLI mock and browser/in-app previews provide isolated bounded fixtures for
the same methods. They do not access the user's library, native audio or network.
The source contracts are `contracts/providers.json` and `contracts/controls.json`;
run the repository capability generator after changing them.
