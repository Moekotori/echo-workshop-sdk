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

`lyrics-view` 与背景 runtime 共用当前启用的主题 runtime 选择，一次运行一个。
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
宿主始终提供返回、退出以及原播放器；出错或 10 秒未 ready/pong 会恢复宿主歌词。

新增协议 1 消息（shell 也支持歌词变化和时钟）：

- `init.features`: `lyrics-events`、`clock`，用于能力探测。
- `echo:workshop-ui:lyrics`: `{trackId, revision, lyrics}`。只在当前曲或歌词版本改变、重新握手时发送整份有界文档。同曲重新匹配/删除也会更新。
- `echo:workshop-ui:clock`: `{clock, motion}`。只读宿主状态锚点，最多约 10 Hz；隐藏窗口降频。`clock` 有曲目 ID、状态、秒进度、时长、播放速度、generation 及 `sampledAtMs`。
- `echo:workshop-ui:ping`: 回 `echo:workshop-ui:pong`。渲染失败主动发 `echo:workshop-ui:error`。

`sampledAtMs` 与子页面 `performance.timeOrigin + performance.now()` 使用同一时间基准。
仅 playing 时按速度插值绘制；暂停、seek、换曲、generation 变化以新锚点为准。示例最多外推 1500 ms，不能以画面时钟决定播放完成或切歌。
`motion.frameIntervalMs === null` 时停止 RAF，仅画静态帧。离开页面应释放引用和 GPU 资源。
每个 runtime 仅缓存当前曲文档；沿用 800 行、每行 48 个 timing segment、整体 256 KiB 上限，不逐帧传整份歌词。

`echo-workshop-ui-runtime.d.ts` 提供完整歌词、逐字时间、clock 和事件类型，以及 `EchoWorkshopUiLyricsResult`。
运行示例见 [Lyric Ink](examples/lyrics-view-runtime/README.md)。素材只用同包相对路径；自带字体需记录来源、许可和分发权，不需要开放网络或系统权限。
