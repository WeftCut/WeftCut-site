---
slug: mcp
locale: en
title: WeftCut MCP Server — Edit Video From Claude or Cursor
description: WeftCut is a free, open source video editor with a built-in MCP server. Connect Claude, Cursor, Codex or your own client and let an agent trim, split, keyframe, caption and export — every change visible and reversible on your timeline.
h1: Drive a real video editor over MCP
keywords: MCP video editor, video editor MCP server, MCP server for video editing, Claude video editing, edit video with Claude, Cursor video editing, AI agent video editor, agent-native video editor, control video editor with AI
faq: Questions
---

# Drive a real video editor over MCP

WeftCut is a free, open source video editor with a built-in MCP server. Connect Claude, Cursor, Codex or a client you wrote yourself, and the agent gets the same editing vocabulary you have — trim, split, keyframes, effects, captions, markers, export — landing live on your timeline while you watch.

Most editors bolt AI on as a feature: one button that does the one thing a vendor picked for you. WeftCut instead exposes the editor itself as a tool surface, and ships no models at all. The intelligence lives in whatever agent you connect.

## What the agent can actually do

The server registers roughly 66 tools, resources and prompts, covering about 40 distinct editing operations. Not a summarise-and-suggest wrapper — these are the real operations, and they mutate the real project.

- **Timeline.** Place, move, trim and split clips on an A/B-roll timeline, frame-aligned to SMPTE timecode. `auto_split_by_shot` cuts at every detected shot change; `detect_silences` finds the dead air.
- **Motion.** Keyframes with bézier easing, set and adjusted directly.
- **Look.** Per-layer effect chains, including chroma key.
- **Text.** Styled title layers, and `apply_subtitles` to bring in SRT, VTT or ASS as editable caption layers — including restyling every caption in the project in one undoable step.
- **Motifs.** Animated, parameterised overlays — lower thirds, countdowns — that render identically in preview and export. See [Motifs](/motifs/).
- **Structure.** Groups with auto-paired A/V, markers, and checkpoints.
- **Safety.** `dry_run` validates an operation before it touches anything, and undo/redo works on agent edits exactly as it does on yours.

## Connect in a minute

Open Settings → Agent, copy the snippet, paste it into your client. For Claude Desktop that is one block of JSON:

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

The port and token are generated per install — take the real values from Settings → Agent rather than copying the ones above. Cursor, Codex and any other MCP client take the same details in whatever shape they prefer.

## What stays on your machine

Everything. The server speaks MCP over streamable HTTP and binds to loopback (`127.0.0.1`) only, with bearer-token auth and DNS-rebinding protection in front of it. There is no WeftCut account, no cloud round trip, and no upload of your footage.

Your agent is the one exception, and it is one you already chose: if you connect Claude, the conversation goes wherever Claude's conversations go. The video does not — the agent sends editing commands to the app, not your media.

## You stay in control

Agent edits are not a black box that hands you a finished file.

- `begin_agent_session` flips the UI into a simplified agent mode, so it is obvious when something other than you is editing.
- Every action lands in a live change feed, in order, as it happens.
- Changes group under a checkpoint, so a whole run can be undone as one unit — or you can take the mouse back mid-run and keep editing alongside.

## Let it look before it cuts

Optional analysis runs locally and gives the agent something to reason about: shot detection, silence detection, frame comparison, transcription via Whisper or a local sidecar, and scene description through a local vision model where one is available.

These are opt-in and local-first. WeftCut bundles no models of its own.

## It is a complete editor without any of this

If you never connect an agent, nothing is missing. WeftCut is a full desktop NLE on its own: A/B-roll timeline with filmstrips and waveforms, an in-timeline bézier curve editor, effect chains, chroma key with a live eyedropper, captions, Motifs, role-based audio mixing, and export to H.264, HEVC, 10-bit AV1, ProRes or DNxHR.

## Questions

### Which MCP clients work with WeftCut?

Any of them. Claude Desktop, Cursor and Codex are the ones most people arrive with, but the server implements standard MCP over streamable HTTP, so a client you wrote this afternoon works the same way.

### Does WeftCut include an AI model?

No. WeftCut ships no models and makes no inference calls of its own. The agent you connect supplies the intelligence, and optional analysis like transcription runs locally on your machine.

### Can the agent break my project?

It can change it, which is the point — but not irreversibly. Operations can be validated with `dry_run` first, every change is listed in the change feed as it lands, edits group under a checkpoint, and undo covers agent actions exactly as it covers yours.

### Is the MCP server reachable from the network?

No. It binds to loopback only, requires a bearer token, and has DNS-rebinding protection. It is reachable from programs on your own machine and nowhere else.

### Is it really free?

Yes — MIT licensed and open source, for macOS, Windows and Linux. The bundled FFmpeg carries its own LGPL/GPL terms. See [what "AI video editor" means here](/ai-video-editor/).
