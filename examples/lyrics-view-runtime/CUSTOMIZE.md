# 自定义主题

包 id：`echo.lyric-ink`
当前层：`runtime`

| 层 | 命令 | 作用 |
| --- | --- | --- |
| colors | `--preset colors` | 只改深浅色 |
| skin | `--preset skin` | 声明式外壳 |
| stylesheet | `scaffold . --preset stylesheet` | 整包 CSS |
| runtime | `scaffold . --preset runtime` | 沙箱自定义界面 |

CSS 必须写在 `html[data-workshop-theme-pack="echo.lyric-ink"]` 下。不能用 FINAL / nyanCat / darkSideMoon 当 basePreset。

## 日常命令

```powershell
npm run next
npm run check
npm run dev
npm run guide
```

`next` 先列当前质量报告的待办（每条带修复命令），再列宿主还允许加的槽位、能力或换档。这些命令永不上传。

## 卡住了？

- `npm run snippet` 列出常用代码片段（标注所需权限）；编辑器里输入 `echo-` 前缀可直接展开同一批片段。
- `npm run fix` 修复预览图、minEchoVersion 和缺失的 README / CUSTOMIZE / .gitignore。
- 报错对照表：`npm run guide -- troubleshoot`，完整版见 SDK 包里的 TROUBLESHOOTING.md。
