# Lyric Ink / 歌词自绘示例

`lyrics-view` only replaces the lyrics page. This is a source-candidate feature;
use an ECHO build containing the lyrics-view update (minimum declared version
26.9.13). No GitHub or Steam publication is implied.

```sh
node ../../bin/echo-workshop-sdk.mjs fix .
node ../../bin/echo-workshop-sdk.mjs check .
```

在创作台导入、启用并应用，然后打开歌词页。若已选择声明式歌词场景，先切回内置歌词布局。
本示例只替换歌词区域，不修改全局主题。它使用宿主逐字时间，支持换词、seek、暂停、明暗颜色及帧预算；10 秒内不响应心跳时宿主恢复原界面。

修改 `content/ui/app.css` 自由改变排版、颜色和逐字表现；修改 `app.js` 可换成 Canvas/WebGL。
自有且允许分发的 `.woff/.woff2` 可放在 `content/ui/`，在 CSS 中用相对 `@font-face` 引用，运行 `sync` 更新哈希，并记录字体来源和许可。示例不附带第三方字体或音乐。

Only `playback:read`, `playback:control`, `lyrics:read`, `audio:spectrum`, and
`storage` may be declared. Declare only what you use. `lyrics:get` is restricted
to the current track in this presentation. The host owns Back/Exit and playback.
See [the author contract](../../lyrics-authoring.md).
