import { createProviderPreview } from './provider-preview.mjs';
import { createLibraryPreview } from './library-preview.mjs';
import { createRuntimePreviewApi } from './runtime-preview-api.mjs';
import { createRuntimeControlPreview } from './runtime-control-preview.mjs';
import { createSteamPresenceSettingsTools } from './steam-presence-settings.mjs';
import { createExtensionsPreview } from './extensions-preview.mjs';
import { createQueuePreview } from './queue-preview.mjs';
import { createLyricsAuthoringPreview } from './lyrics-authoring-preview.mjs';
import { createWorkshopPayloadTransfer } from './payload-transfer.mjs';
/** Browser author preview for both the official SDK and legacy runtime protocol. */
export const runtimePreviewHtml = ({ capabilities = [], settings = [], fixtureTrack, fixtureTracks, fixtureAlbum, pluginApiContract, themeUiCapabilities, createVisualizationFixture }) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ECHO UI runtime preview</title>
  <style>
    html,body{margin:0;height:100%;background:#0b1017;color:#eaf4ff;font:14px system-ui}
    .wrap{height:100%;display:grid;grid-template-rows:1fr auto}
    iframe{width:100%;height:100%;border:0;background:#0000}
    .note{padding:8px 14px;background:#151f2d;color:#9db3c7}
  </style>
</head>
<body>
  <div class="wrap">
    <iframe id="frame" sandbox="allow-scripts" src="/ui/index.html" title="Workshop UI runtime"></iframe>
    <p class="note">Local fixture host. Playback, library and queue replies are fake and never read your real library.</p>
  </div>
  <script>
    const frame = document.getElementById('frame');
    const createVisualizationFixture = ${createVisualizationFixture.toString()};
    let audioVisualization = {};
    const state = {
      playback: { state: 'paused', currentTrackId: 'fixture-track-01', positionSeconds: 12, durationSeconds: 221, volume: 0.8 },
      currentTrack: ${JSON.stringify(fixtureTrack)},
      queue: { currentQueueId: 'q1', canGoPrevious: false, canGoNext: true, items: ${JSON.stringify(fixtureTracks)}.map((track,index)=>({queueId:'q'+(index+1),track})) },
    };
    const reply = (source, requestId, ok, value, error) => source.postMessage({
      type: 'echo:workshop-ui:result', protocolVersion: 1, requestId, ok, ...(value !== undefined ? { value } : {}), ...(error ? { error } : {}),
    }, '*');
    const sendState = (source) => source.postMessage({ type: 'echo:workshop-ui:state', protocolVersion: 1, ...state,
      queue: { ...state.queue, items: state.queue.items.slice(0,500) },
      ...createVisualizationFixture(audioVisualization, state.playback.currentTrackId) }, '*');
    const sdkContext = () => ({ surface:'runtime',panel:null,presentation:null,visible:true,locale:'en',direction:'ltr',colorScheme:'dark',reducedMotion:false,
      viewport:{width:frame.clientWidth,height:frame.clientHeight},appearance:{accent:'#7ad4ff',accentText:'#7ad4ff',panel:'#121b26',text:'#f4fbff',heading:'#f4fbff',muted:'#8eabc0',appBg:'#0c1219',border:'#2a3d52',player:'#121b26'} });
    const sdkTransfer = (${createWorkshopPayloadTransfer.toString()})({post:(source,data)=>source.postMessage(data,'*'),accept:(source,header)=>source===frame.contentWindow&&header.type==='request'});
    window.addEventListener('pagehide',()=>sdkTransfer.disposeTarget());
    const sdkSend = (source,data) => { void sdkTransfer.send(source,data).catch(console.error); };
    const sdkEvent = (source,eventName,payload) => sdkSend(source,{channel:'echo:workshop-plugin',version:1,type:'event',eventName,payload});
    const permissions = new Set(${JSON.stringify(capabilities)});
    const pluginEventPermissions = ${JSON.stringify(pluginApiContract.events)};
    const sdkState = source => {
      if(permissions.has('playback:read'))sdkEvent(source,'playback:status',state.playback);
      if(permissions.has('queue:read'))sdkEvent(source,'queue:changed',preview.run('queue:get'));
    };
    const preview = (${createRuntimePreviewApi.toString()})({ capabilities:${JSON.stringify(capabilities)}, actions:${JSON.stringify(pluginApiContract.actions)},
      tracks:${JSON.stringify(fixtureTracks)},albums:[${JSON.stringify(fixtureAlbum)}],state,context:sdkContext,
      settings:${JSON.stringify(settings)},lyrics:{kind:'plain',offsetMs:0,lines:[],plainText:'Local fixture lyrics'},changed:()=>sendState(frame.contentWindow),emit:(event,payload)=>{
        if(event.startsWith('ui:')||pluginEventPermissions[event]===null||permissions.has(pluginEventPermissions[event]))sdkEvent(frame.contentWindow,event,payload);
      } },(emit)=>(${createRuntimeControlPreview.toString()})(emit,${createSteamPresenceSettingsTools.toString()}),${createExtensionsPreview.toString()},${createQueuePreview.toString()},${createLyricsAuthoringPreview.toString()},${createLibraryPreview.toString()},${createProviderPreview.toString()});
    const layoutObserver = new ResizeObserver(() => preview.contextChanged());
    layoutObserver.observe(frame);
    window.addEventListener('pagehide', () => layoutObserver.disconnect());
    window.addEventListener('message', (event) => {
      let data = event.data;
      if (!data || typeof data !== 'object' || event.source !== frame.contentWindow) return;
      if(data.channel==='echo:workshop-plugin'&&data.version===1){
        const received=sdkTransfer.receive(event.source,data);
        if(received.handled&&!received.message)return;
        data=received.message||data;
        if(data.type==='ready'){sdkEvent(event.source,'ui:context-changed',sdkContext());sdkState(event.source);return;}
        if(data.type!=='request')return;
        try{const value=preview.run(data.action,data.payload||{});sdkSend(event.source,{channel:data.channel,version:1,type:'response',requestId:data.requestId,ok:true,value});}
        catch(error){sdkSend(event.source,{channel:data.channel,version:1,type:'response',requestId:data.requestId,ok:false,error:error.message});}
        return;
      }
      if (data.type === 'echo:workshop-ui:ready') {
        audioVisualization = data.audioVisualization || {};
        event.source.postMessage({
          type: 'echo:workshop-ui:init', protocolVersion: 1, theme: { id: 'local-preview', version: 'dev' },
          capabilities: ${JSON.stringify(themeUiCapabilities)},
          audioVisualizationLimits: createVisualizationFixture().visualizationLimits,
          appearance: { accent: '#7ad4ff', accentText: '#7ad4ff', panel: '#121b26', text: '#f4fbff', heading: '#f4fbff', muted: '#8eabc0', appBg: '#0c1219', border: '#2a3d52', player: '#121b26' },
        }, '*');
        sendState(event.source);
        return;
      }
      if (data.type === 'echo:workshop-ui:audio-configure') {
        audioVisualization = data.audioVisualization || {}; sendState(event.source); return;
      }
      if (data.type !== 'echo:workshop-ui:command') return;
      const payload = data.payload && typeof data.payload === 'object' ? data.payload : {};
      if (data.command === 'audio:getVisualization') {
        reply(event.source, data.requestId, true, createVisualizationFixture(payload, state.playback.currentTrackId)); return;
      }
      if (data.command === 'audio:getSpectrogram') {
        reply(event.source, data.requestId, false, null, 'spectrogram-local-track-required'); return;
      }
      if (data.command === 'library:listTracks') {
        const search = String(payload.search || '').toLowerCase();
        const items = ${JSON.stringify(fixtureTracks)}.filter((track) => !search || track.title.toLowerCase().includes(search) || track.artist.toLowerCase().includes(search));
        reply(event.source, data.requestId, true, { page: 1, pageSize: 40, total: items.length, hasMore: false, items });
        return;
      }
      if (data.command === 'play' || data.command === 'playPause') state.playback.state = state.playback.state === 'playing' ? 'paused' : 'playing';
      if (data.command === 'pause') state.playback.state = 'paused';
      if (data.command === 'queue:playTrack') {
        const track = ${JSON.stringify(fixtureTracks)}.find((item) => item.id === payload.trackId) || ${JSON.stringify(fixtureTrack)};
        state.currentTrack = track;
        state.playback.currentTrackId = track.id;
        state.playback.state = 'playing';
      }
      reply(event.source, data.requestId, true, null);
      sendState(event.source);
    });
  </script>
</body>
</html>`;

