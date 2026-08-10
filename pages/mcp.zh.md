---
slug: mcp
locale: zh
title: MCP 视频剪辑 —— 让 Claude、Cursor 直接操作时间线 | WeftCut
description: WeftCut 是一款内置 MCP 服务的免费开源剪辑软件。接入 Claude、Cursor、Codex 或你自己写的客户端，让 AI agent 完成切分、修剪、关键帧、字幕与导出，每一步都在时间线上可见、可撤销。
h1: 让 AI Agent 直接操作真实的剪辑时间线
keywords: MCP 视频剪辑, MCP 剪辑, Claude 剪视频, Cursor 剪视频, AI Agent 剪辑, 智能体剪辑, AI 剪辑软件, 开源剪辑软件, 用 AI 剪视频
faq: 常见问题
---

# 让 AI Agent 直接操作真实的剪辑时间线

WeftCut 是一款免费开源的视频剪辑软件，内置 MCP 服务。接入 Claude、Cursor、Codex 或你自己写的客户端之后，agent 拿到的是和你完全一样的剪辑能力——切分、修剪、关键帧、特效、字幕、标记、导出——并且实时落在你眼前的时间线上。

大多数剪辑软件把 AI 当成一个附加功能：一个按钮，做厂商替你选定的那一件事。WeftCut 的做法是把编辑器本身开放成工具接口，同时一个模型都不内置。智能来自你接入的那个 agent。

## Agent 具体能做什么

MCP 服务注册了约 66 个 tools、resources 与 prompts，覆盖约 40 项独立的剪辑操作。这不是"总结一下、给点建议"式的外壳，而是真实操作，直接改动真实的工程。

- **时间线**：在 A/B 卷时间线上放置、移动、修剪、切分片段，按 SMPTE 时间码对齐到帧。`auto_split_by_shot` 在每个镜头切换处下刀，`detect_silences` 找出静音段。
- **动效**：带贝塞尔缓动的关键帧，可直接设置与调整。
- **画面**：分层特效链，含色度键抠像。
- **文字**：带样式的标题层；`apply_subtitles` 可把 SRT、VTT、ASS 导入为可编辑的字幕层，并支持一步撤销地重排全片字幕样式。
- **Motif**：参数化的动态叠加层，比如字幕条和倒计时，预览与导出像素一致。详见 [Motif 说明](/zh/motifs/)。
- **结构**：音视频自动配对的分组、标记，以及检查点。
- **安全网**：`dry_run` 可以在真正改动之前先校验一次；agent 的每一步都能像你自己的操作一样撤销与重做。

## 一分钟接入

打开「设置 → Agent」，复制配置，粘贴到你的客户端。以 Claude Desktop 为例，就是一段 JSON：

```json
{
  "mcpServers": {
    "weftcut": {
      "url": "http://127.0.0.1:50831/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

端口和 token 每次安装都不同，请从「设置 → Agent」里取实际值，不要照抄上面这份。Cursor、Codex 以及其他 MCP 客户端填的是同样的信息，只是格式各有不同。

## 什么会留在本机

全部。MCP 服务通过 streamable HTTP 提供，只绑定回环地址（`127.0.0.1`），前面有 bearer token 鉴权和 DNS 重绑定防护。没有 WeftCut 账号，没有云端往返，素材不会被上传。

唯一的例外是你自己选择的那个 agent：如果你接的是 Claude，对话内容自然走 Claude 的通道。但视频不走——agent 发给应用的是剪辑指令，不是你的素材。

## 主动权始终在你手里

Agent 的改动不是一个黑箱，也不是甩给你一个成片。

- `begin_agent_session` 会把界面切换到简洁的 agent 模式，让"现在不是你在剪"这件事一目了然。
- 每一次操作都按顺序落进实时变更记录里。
- 改动会归到一个检查点下，整轮操作可以作为一个整体撤销；你也可以中途接手，和 agent 并行地继续剪。

## 让它先看清楚再下刀

可选的分析能力全部在本机运行，给 agent 提供判断依据：镜头检测、静音检测、画面比对、基于 Whisper 或本地组件的转写，以及在具备条件时通过本地视觉模型完成的画面描述。

这些都是可选项，且优先本地。WeftCut 自身不附带任何模型。

## 不接 agent 也是一台完整的剪辑软件

如果你从不接入 agent，功能也并不残缺。WeftCut 本身就是完整的桌面非线性剪辑软件：带缩略帧与波形的 A/B 卷时间线、时间线内的贝塞尔曲线编辑器、特效链、带实时吸管的色度键、字幕、Motif、按角色分组的音频混音，以及 H.264、HEVC、10-bit AV1、ProRes、DNxHR 导出。

## 常见问题

### 支持哪些 MCP 客户端？

都支持。最常见的是 Claude Desktop、Cursor 和 Codex，但服务端实现的是标准 MCP over streamable HTTP，你今天下午自己写的客户端一样能用。

### WeftCut 自带 AI 模型吗？

不带。WeftCut 不内置任何模型，也不会自行发起推理请求。智能来自你接入的 agent；转写等可选分析在你本机运行。

### Agent 会不会把我的工程搞坏？

它会改动工程——这本来就是目的——但不会不可挽回。操作可以先用 `dry_run` 校验，每一步都实时进入变更记录，改动归入检查点，撤销对 agent 的操作和对你自己的操作完全一致。

### 这个 MCP 服务会暴露在局域网里吗？

不会。它只绑定回环地址，需要 bearer token，并带有 DNS 重绑定防护。只有你本机上的程序能访问它。

### 真的免费吗？

是。MIT 许可开源，支持 macOS、Windows 与 Linux；随附的 FFmpeg 遵循其自身的 LGPL/GPL 条款。也可以看看[这里说的"AI 剪辑"到底指什么](/zh/ai-video-editor/)。
