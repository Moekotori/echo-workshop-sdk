# 歌词创作 / Lyrics authoring

本页描述源码候选新增能力；需要包含本次接口更新的 ECHO 构建（清单最低版本 `26.9.13`）。
这不代表 GitHub/Steam 起步包已经发布。旧客户端会拒绝未知字段，不会静默按旧样式加载。

## 选择合适的入口

| 想做什么 | 入口 |
| --- | --- |
| 改全局主题 CSS、页面外观 | `theme.stylesheet`；保留宿主功能 |
| 自己排歌词、封面、按钮，复用同步歌词 | `lyrics-style.scene` |
| 自己写逐字特效、Canvas/WebGL、字体和布局 | `theme.runtime.presentation: "lyrics-view"` |
| 只画背景，保留原歌词和控件 | `theme.runtime.presentation: "lyrics-background"` |
| 重写整个应用界面 | `theme.runtime.presentation: "shell"` |

包含视觉组合更新的宿主将主题、`lyrics-view` 和背景 runtime 分别保存，可以混搭；旧构建仍只有一个选择。混搭时，自绘歌词页面应使用透明背景。见 [主题部件与预览](theme-parts.md)。
应用歌词 runtime 不改全局配色。当前只接管主播放队列的普通歌词页，电台、一起听和 AirPlay 接收页保持原显示。它在普通歌词页可见时挂载；离开页面、禁用或退出会释放 iframe、状态订阅和计时器。
若另选了声明式歌词场景，该场景优先；切回内置歌词布局可使用 runtime。
声明式场景暂不提供自带字体文件；自带字体走 runtime 的已验证 `.woff/.woff2` 资源通道。

## 声明式歌词细节

在 `slot: "lyrics"` 的 `options` 中设置：

```json
{
  "wordHighlightEnabled": true,
  "textDirection": "vertical",
  "scrollAnchor": 0.4,
  "scrollDurationMs": 300,
  "parts": {
    "activeLine": { "opacity": 1, "color": "$text" },
    "futureLine": { "opacity": 0.35 },
    "pastLine": { "opacity": 0.2 },
    "primary": { "fontSize": "40px", "textAlign": "center" },
    "translation": { "fontSize": "18px", "color": "$muted" },
    "romanization": { "fontSize": "14px", "fontStyle": "italic" },
    "currentWord": { "color": "$accent", "transform": "translateY(-2px)" },
    "passedWord": { "color": "$text" },
    "futureWord": { "color": "$muted" }
  }
}
```

`parts` 支持 `line / activeLine / pastLine / futureLine / primary / translation / romanization / word / currentWord / passedWord / futureWord`。
每一部分使用现有样式白名单（每块最多 48 个属性），只作用于当前槽，不写作者选择器。
单个部件显式指定词颜色时使用实色；未指定时保持原有渐变高亮。

`textDirection` 为 `horizontal / vertical`，宿主负责排字。
`scrollAnchor` 为 0.1–0.9 的容器高度比例；`scrollDurationMs` 为 0–2000，0 表示直接定位。省略保持旧行为。
当前、前后行槽可设置 `wordHighlightEnabled: true`，使用已有歌词逐字时间；只有当前行推进高亮，不凭空生成逐字事实。
这些单行槽也可显示译文、罗马音、竖排和 `parts`。

普通文本单行槽（未开逐字）可使用 `lineTransition: default / none / fade / slide / scale`，`lineTransitionMs: 0–2000`。
完整歌词列表用 `scrollDurationMs` 控制跟随，逐字单行用词样式控制表现；`lineTransition` 不改变这两者。减少动效偏好仍优先。

`scene.hostChrome.backButton` 可设 `sizePx: 32–80`、`borderRadiusPx: 0–40`、`color / backgroundColor / borderColor`。
播放按钮槽的 `options.controlAccent` 可改内部强调色。无需为自己的包修改 ECHO CSS；旧官方包的历史覆盖保留兼容。

## 代码模式和同步

```json
{
  "runtime": {
    "entry": "ui/index.html",
    "presentation": "lyrics-view",
    "capabilities": ["playback:read", "playback:control", "lyrics:read"]
  }
}
```

支持能力：`playback:read / playback:control / lyrics:read / audio:spectrum / storage`。
不提供全曲库、全局导航、窗口管理。当前曲 `lyrics:get` 可读，指定其它曲会被拒绝。
宿主始终提供位于现有标题栏内、不占歌词布局空间的返回箭头以及原播放器；返回沿用歌词页导航，回到进入歌词前的页面，不取消已应用的歌词主题。歌词模式不显示额外的“退出自定义 UI”按钮，仍保留主进程 `Ctrl+Shift+Esc` 紧急退出；出错或 10 秒未 ready/pong 会恢复宿主歌词。完整应用 shell 主题继续显示宿主退出按钮。

新增协议 1 消息（shell 也支持歌词变化和时钟）：

- `init.features`: `lyrics-events`、`clock`，用于能力探测。
- `echo:workshop-ui:lyrics`: `{trackId, revision, lyrics}`。只在当前曲或歌词版本改变、重新握手时发送整份有界文档。同曲重新匹配/删除也会更新。
- `echo:workshop-ui:clock`: `{clock, motion}`。只读宿主状态锚点，最多约 10 Hz；隐藏窗口降频。`clock` 有曲目 ID、状态、秒进度、时长、播放速度、generation 及 `sampledAtMs`。
- `echo:workshop-ui:ping`: 回 `echo:workshop-ui:pong`。渲染失败主动发 `echo:workshop-ui:error`。

`sampledAtMs` 与子页面 `performance.timeOrigin + performance.now()` 使用同一时间基准。
仅 playing 时按速度插值绘制；暂停、seek、换曲、generation 变化以新锚点为准。示例最多外推 1500 ms，不能以画面时钟决定播放完成或切歌。
`motion.frameIntervalMs === null` 时停止 RAF，仅画静态帧。离开页面应释放引用和 GPU 资源。
每个 runtime 仅缓存当前曲文档；沿用 800 行、每行 48 个 timing segment、整体 256 KiB 上限，不逐帧传整份歌词。

新版宿主还提供可选的行 `endMs`、`agentId` 和 `backgroundVocals`（每行最多 8 组），可做对唱排版和和声逐词效果；词文本保留原始空格。旧宿主会省略这些字段。
`lyrics-view` 也可声明 `library:read` / `library:control` 以读取/切换当前歌曲喜欢状态，及 `window:control` 以切换全屏。此 presentation 中仅接受当前曲的 `library:getLiked` / `library:toggleLiked` 与 `window:toggleFullscreen`；不开放曲库枚举、编辑、队列管理或其他窗口操作。
音量状态可包含 `fixedVolumeEnabled`、`volumeLocked` 和 `volumeLockReason`（`fixed` / `dsd` / null）。声明 `playback:control` 的界面可显式发送 `setFixedVolume` `{enabled:boolean}`；它只改变固定音量设置，不绕过 DSD 自动锁定。锁定时 `setVolume` 返回明确错误，不能假报成功。
上述限制属于运行时消息预算，与创意工坊内容包大小无关。工坊外层内容与 ZIP 导入不再设置总字节配额；校验仍检查路径、文件清单、哈希、文件类型及各运行时解析预算。

`echo-workshop-ui-runtime.d.ts` 提供完整歌词、逐字时间、clock 和事件类型，以及 `EchoWorkshopUiLyricsResult`。
运行示例见 [Lyric Ink](examples/lyrics-view-runtime/README.md)。素材只用同包相对路径；自带字体需记录来源、许可和分发权，不需要开放网络或系统权限。

## 只读音频信息事件（源码候选）

包含本次音频事件更新的宿主在 `init.features` 声明 `audio-events`，通过
`echo:workshop-ui:audio` 推送当前曲 `trackId` 和有权限读取的字段。
`playback:read` 允许 `audio`（codec、文件 sampleRate、bitDepth、实际 deviceSampleRate、
outputDevice 显示名称、outputBackend、outputMode、replayGainDb/replayGainActive）；
`audio:spectrum` 允许 `levels`（peakDb/rmsDb/source/channels）、`waveform` 与 `spectrum`。未获能力的字段不发送。
`levels.channels` 按 native 输出声道顺序提供全部声道的 Peak/RMS（dBFS），最多 32 路：立体声为左、右，单声道只有一项，缺少真实声道遥测时为空数组。
`waveform` 为 `{samples, sampleRate, channels: 1, source: "native_post_dsp"}` 或 `null`；
`samples` 默认提供 native 分析窗口最新的 256 个单声道时域采样点，保留正负号及超过 `[-1, 1]` 的有限幅值，
`sampleRate` 是分析降采样后的实际采样率。它是间断的可视化快照；暂停或宿主不支持时为 `null`，不根据频谱伪造。
作者可在 `echo:workshop-ui:ready` 中附加 `audioVisualization: { waveformSamples: 2048 }`，
按需选择 0～2048 点；0 表示不发送波形，可再次发送 ready 调整。作者自行决定示波器缩放、削波显示和可视分析方式。
还可配置 `intervalMs: 16～1000`、`spectrum: false`、`levels: false`，按需减少字段或提高推送频率；
实际更新受 native 状态事件、可见性和渲染预算约束。完整主题音频事件默认 100 ms，歌词背景默认 33 ms。
运行中发送 `{type:"echo:workshop-ui:audio-configure",audioVisualization:{waveformSamples:1024,intervalMs:33,spectrum:false}}`
即可替换配置，无需重新 ready；未填写的选项恢复默认值。
发送命令 `audio:getVisualization` 可即时查询，payload 使用同样的波形及字段选项，结果从 `echo:workshop-ui:result.value` 读取，
不会修改推送配置。`init.audioVisualizationLimits` 和快照 `visualizationLimits` 声明宿主上限；普通插件可调用
`echo.audio.getVisualization({waveformSamples:2048,spectrum:false})`，同样要求 `audio:spectrum`。
独立歌词背景（`runtime.presentation: "lyrics-background"`）在 `echo:workshop-ui:state` 中接收相同的 `levels` 与 `waveform`；完整主题和歌词视图使用 `echo:workshop-ui:audio`。两种形式共用本节参数及[运行时类型声明](./echo-workshop-ui-runtime.d.ts)。
这是可选的协议 1 扩展；旧客户端不提供音频信息时作者应显示不可用，不能从模拟数据补齐。

音频信息还可包含 `channels` 与 `bitrate`（bit/s）。当前曲快照可提供
`trackNo`、`genre`、`bpm`、`bpmEstimated` 与 `beatOffsetMs`；这些元数据只在变化时随时钟发送。

### 精细 Canvas 音频统计

`init.features` 中的 `canvas-audio` 表示宿主提供以下 `audio:canvas` 只读接口。
该能力独立于普通 `audio:spectrum`，不会为本样式额外开启原生 128 段频谱分析：

- `audio:getCanvasProfile` `{trackId}`：当前本地曲的原版 1400 段波形、480 段 RMS、
  估算响度/动态范围、文件字节数与扩展名；或 `pending / unavailable`。
- `audio:getCanvasSpectrum` `{trackId,positionSeconds}`：最多 32 个频谱帧，60 Hz 时间轴，
  每帧 8192 个 byte 频率值以 base64 编码。参数为 16384 点 FFT、Blackman 窗、
  0.8 平滑、−100 至 −30 dB 映射；这是原文件的显示分析，不能当成实时 DSP 输出电平。
- `audio:canvasHeartbeat` `{trackId}` 与 `audio:releaseCanvas`：维护/释放当前可见视图的租约。

时钟仍由 Audio Core 提供。位置不得离当前宿主进度超过 3 秒，只能访问当前本地曲，
不能传路径、读取其它曲或得到 PCM。Native FFmpeg 解码与统计在独立 worker 中分批完成，
不保存整曲音频；最多两个租约，受 memory broker、可见性、空闲与解码超时限制。
离开页面、切歌、隐藏或内存压力上升会停止任务。旧宿主未声明 `canvas-audio` 时不要调用，
也不要把低分辨率频谱或归一化能量数据当成同一种分析。

电平单位为 dBFS：`native_post_dsp` 表示宿主原生 DSP 后测量，
`pre_native_estimated_post_dsp` 在本事件中只提供其 **输入 Peak/RMS**，不提供估算输出。
不是独立 L/R 声道电平。ReplayGain 为宿主实际应用的 ReplayGain，不是总 DSP 增益或音量。
源采样率与设备实际采样率分别显示，不以请求值代替设备事实。

事件复用现有 Audio Core 状态订阅，最高 10 Hz 并遵守可见性/帧预算，无额外 IPC 轮询。
隐藏时停止推送，卸载时移除订阅和定时器；暂停/停止清空电平与频谱，切歌按 trackId 隔离。
原生宿主提供 128 个从低频到高频排列的对数频率探测值，归一化到 0–1；旧宿主或非原生回退仍可能只有 32 段，作者应以 `bands.length` 为准，不硬编码段数。真实有效状态为 `pcm`，`priming`/`fallback` 不应显示为稳定 PCM 数据。128 段提高探测密度，分析窗仍为 2048 个采样，不代表低频分辨能力提高四倍。
本事件不提供 PCM、文件路径、设备 ID、设备枚举或访问能力，不增加外联。

### 当前曲 AMLL 匹配

`lyrics-view` / `shell` 可显式声明 `lyrics:match`，请求 `lyrics:matchAmll`，payload 为 `{ trackId }`。
宿主只允许当前正在播放的歌曲，复用现有 AMLL 提供者和联网歌词设置，只应用自动接受条件满足的同步歌词。
返回 `{ trackId, matched }`；无可靠结果保留原歌词，不清缓存。每个 runtime 最多一个在途请求及一个结果缓存。
歌曲或主题改变后，异步结果不得再发起应用；网络请求仍由既有宿主超时回收。不要把这类请求放入播放控制的串行队列。
该命令不授予网络、候选列表、平台 ID 或文件权限。实际 AMLL 文档的 `lyrics` 事件/`lyrics:get` 返回可选 `attribution: 'AMLL'`。
来源标记应以当前曲文档为准，不能仅凭 match 返回成功、歌词标题或任意来源字符串推断。
