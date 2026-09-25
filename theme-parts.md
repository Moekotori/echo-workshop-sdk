# Stable theme parts v1 / 稳定主题部件

Source candidate for hosts containing the visual composition update (declare minimum ECHO 26.9.14).
The public contract is [contracts/theme-parts.json](contracts/theme-parts.json), also exported as `@echo/workshop-sdk/contracts/theme-parts`.

宿主在根元素声明 `data-echo-theme-api="1"`，在支持的部件上提供 `data-echo-part`，以及空格分隔的 `data-echo-state`。
作者使用 `~=` 选择部件和状态，不依赖本体 class 名、DOM 层级或 React 组件名称。
新增部件兼容 v1；现有公开名称不会在 v1 内重命名。内部 DOM 不属于兼容承诺。

| Part | Scope |
| --- | --- |
| `titlebar`, `sidebar`, `navigation` | 标题栏、侧栏、导航项 |
| `player`, `player-button` | 播放栏、传输控制按钮 |
| `track-row`, `album-card` | 本地歌曲行、专辑卡片 |
| `menu`, `menu-item` | 已接入的上下文菜单及其 ARIA 菜单项 |
| `lyrics-line`, `lyrics-word` | 宿主歌词行、词 |

状态包括 `active / selected / playing / disabled`，仅在宿主提供对应事实时出现。
悬停、键盘焦点仍使用 `:hover / :focus-visible`。歌词逐字状态和进度优先使用歌词 SDK 的 `parts` 接口。
未列出的页面、第三方界面和 sandbox 内部不承诺这些标记。

Semantic aliases: `--echo-surface`, `--echo-background`, `--echo-text`, `--echo-muted`, `--echo-accent`, `--echo-border`.
They resolve to the host's semantic theme variables and follow light/dark changes.

放到主题的 `stylesheet` 文件中：

```css
html[data-workshop-theme-pack="your.theme.id"] [data-echo-part~="sidebar"] {
  background: var(--echo-surface);
  color: var(--echo-text);
}
html[data-workshop-theme-pack="your.theme.id"] [data-echo-part~="navigation"][data-echo-state~="active"] {
  font-weight: 700;
  color: var(--echo-accent);
}
html[data-workshop-theme-pack="your.theme.id"] [data-echo-part~="track-row"]:hover {
  background: color-mix(in srgb, var(--echo-accent) 8%, var(--echo-surface));
}
html[data-workshop-theme-pack="your.theme.id"] [data-echo-part~="player-button"]:focus-visible {
  outline: 2px solid var(--echo-accent);
  outline-offset: 3px;
}
```

These hooks add presentation freedom only. They do not expose the parent DOM to a runtime frame, filesystem, raw IPC, or audio buffers.
The host adapter observes mounted/recycled UI nodes and relevant state attributes; it keeps no global row cache and does not observe playback styles or scan the library on each tick.

## Composition and host preview

主题、歌词自绘、歌词背景分别保存选择。应用其中一层不替换其它层的记录；禁用作品只使对应层失效。旧的单选择记录会在首次应用另一层时兼容保留，损坏记录不自动修复或恢复启用。
完整 shell 界面接管时，其余层暂时不绘制；退出后恢复已选层。声明式歌词场景仍优先于歌词自绘。

混搭背景与自绘歌词时，歌词 runtime 的 `html/body` 应使用透明背景；不透明画布/页面会按作者设计遮住底层。
多个 runtime 共用宿主音频事实和渲染预算，按层登记需求，关闭一层不会释放其它层的频谱订阅。

创作台保存主题或歌词项目后，可打开“宿主渲染预览”。它提供生产歌词渲染器、生产主题样式解析和受限 runtime 文件通道；主题壳展示核心部件，未模拟整个曲库与所有业务页面。
预览使用明确标注的模拟歌曲/频谱；播放、暂停、seek 不会调用真实播放控制。支持深浅色、窄窗口、换曲、长歌词、无译文和无歌词。
保存磁盘文件后默认约两秒刷新；内容未变化时不重新校验整个包。每个窗口一个资源会话，最多四个；关闭后撤销资源，文件被修改或哈希不符时拒绝读取。
运行时的未模拟命令返回 `preview-command-unavailable`。预览不能替代最终应用内启用、真实音频同步和发布验收。
