# 做出你的第一个 ECHO 插件

目标：先运行一个会显示播放状态的功能，再改一句提示，在 ECHO 里看到自己的修改。第一次无需网络或系统权限，也无需发布到 Steam。

## 1. 准备 SDK

在 ECHO「创意工坊 → 创作」获取 SDK，或解包 GitHub Release 中实际列出的 SDK 下载包。安装 Node.js 20 或更新版本，然后在 SDK 文件夹打开终端。

```sh
node bin/echo-workshop-sdk.mjs doctor
node bin/echo-workshop-sdk.mjs example hello-plugin ./my-first-plugin
cd my-first-plugin
```

预期结果：doctor 显示成功；项目内出现 `src/plugin.js`、`content/`、`.echo-sdk/` 和 `package.json`。项目已携带本地工具，不需要再安装 npm 依赖。

如果你只想先在 ECHO 里试着改代码，也可以直接在创作台选择「做一个 ECHO 工具」。创建后用「代码与界面」编辑插件包内的文件。这条路径的文件保存在 `.echo` JSON 包内，独立 SDK 项目则使用 `src/` 源文件。

## 2. 改一句提示

打开 `src/plugin.js`。示例注册的功能 ID 是 `hello-echo`，外层清单已经声明了这个功能及 `playback:read` 权限。先保留 ID，把通知内容改成：

```js
echo.commands.register('hello-echo', { title: 'Hello ECHO' }, async () => {
  const status = await echo.playback.getStatus();
  await echo.ui.notify(status.currentTrackId
    ? '我的第一个插件：已经有歌曲了！'
    : '我的第一个插件：先选一首歌曲试试。');
});
```

`echo.commands.register` 注册执行逻辑；`echo.playback.getStatus` 读取宿主状态；`echo.ui.notify` 把结果显示给用户。

保存源文件后运行：

```sh
npm run check
npm run dev
```

预期结果：检查没有 blocker，dev 输出本地作者控制台地址。用浏览器打开终端给出的地址，尝试示例命令；这里使用模拟播放状态。关闭服务时在终端按 Ctrl+C。

`check` 会把 `src/plugin.js` 同步进 `content/community.echo`，更新清单和哈希。不要手改哈希，也不要同时把 SDK 项目的 `.echo` 文件当源代码编辑。

## 3. 在 ECHO 中看到结果

1. 打开 ECHO「创意工坊」，点击「导入本地包」，选择整个 `my-first-plugin` 项目文件夹。
2. 在「已安装」启用它，检查权限说明。本例只需要读取播放状态。
3. 按 Ctrl+Shift+P 打开插件菜单，搜索项目名称或 `Hello ECHO`，运行功能。
4. 预期看到你写的中文提示。选择一首本地歌曲后再运行，对比另一种状态。

再次修改时：保存 `src/plugin.js` → `npm run check` → 在 ECHO 重新导入同一项目。重新启用或批准时按客户端提示操作。

## 4. 增加真正的功能

先从 SDK 目录查询，而不是猜方法名称：

```sh
npm run snippet
npm run guide -- types
```

例如要读曲库，先用 SDK 命令给项目加入 `library:read`，再使用 `echo.library` 的公开方法。功能标题和入口来自 `content/community.echo` 的 `manifest.contributes`；改变脚本里的注册标题不等于改变宿主菜单标题。

每次加功能都回答四件事：用户从哪里打开、需要什么权限、成功后看到什么、失败后怎样恢复。为用户收集参数可以用 command 的 `parameters`；要显示更复杂内容再添加 HTML 面板。

## 卡住时先检查这里

| 现象 | 下一步 |
| --- | --- |
| 找不到 node 或 npm | 安装 Node 20+，重新打开终端 |
| npm 找不到 package.json | 先进入生成的项目文件夹 |
| 提示权限不足 | 查看 API 要求，在清单声明对应权限；重新检查和导入 |
| 改了代码但 ECHO 没变化 | 确认已运行 check，再重新导入同一项目 |
| 已启用但菜单没有功能 | 检查 contributes.commands 的 ID 与注册 ID 一致，并在功能管理里检查是否隐藏 |
| mock 成功而 ECHO 失败 | 检查宿主版本和功能可用性；模拟环境通过不能代替真实客户端试用 |

## 最后再发布

先确认本地功能可用，再到 ECHO 创作台打开项目，补齐展示图、描述、兼容版本、标签和素材授权。保存、准备包体、查看发布预览，最后选择可见性并确认发布。

本教程中的 SDK 命令不会上传；只有你在创作台明确执行发布才上传到 Steam。
