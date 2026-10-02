---
slug: mcp
locale: en
title: WeftCut MCP Server — Edit Video From Claude or Cursor
description: WeftCut is a free, open source video editor with a built-in MCP server. Connect Claude, Cursor, Codex or your own client and let an agent trim, split, keyframe, caption and mix audio — every change visible and reversible on your timeline.
h1: Drive a real video editor over MCP
keywords: MCP video editor, video editor MCP server, MCP server for video editing, Claude video editing, edit video with Claude, Cursor video editing, AI agent video editor, agent-native video editor, control video editor with AI
faq: Questions
---

# Drive a real video editor over MCP

WeftCut is a free, open source video editor with a built-in MCP server. Connect Claude, Cursor, Codex or a client you wrote yourself, and the agent gets the same editing vocabulary you have — trim, split, keyframes, effects, captions, markers, audio — landing live on your timeline while you watch.

Most editors bolt AI on as a feature: one button that does the one thing a vendor picked for you. WeftCut instead exposes the editor itself as a tool surface, and ships no models at all. The intelligence lives in whatever agent you connect.

## What the agent can actually do

The MCP catalog covers the editing workflow: timeline changes, motion, captions, audio, analysis, Motif authoring and project history. These tools edit the project you see in the app. Export is started from the app’s Export UI.

- **Timeline.** Place, move, trim and split clips on an A/B-roll timeline, frame-aligned to SMPTE timecode. `auto_split_by_shot` cuts at every detected shot change; `detect_pauses` finds pauses; `remove_pauses` cuts them and closes the gaps in one undoable edit.
- **Motion.** Keyframes with bézier easing, tangent controls, motion paths and extrapolation.
- **Look.** Per-layer effect chains, including chroma key.
- **Text.** Styled title layers, and `apply_subtitles` to bring in SRT, VTT or ASS as editable caption layers — including restyling every caption in the project in one undoable step.
- **Motifs.** Parameterised motion graphics — titles, 2D drawings and 3D scenes — that render identically in preview and export. See [Motifs](/motifs/).
- **Audio.** Role-based gain and mute/solo controls, raw audio extraction, transcription and cloud voiceover.
- **Structure.** Nested compositions, linked A/V, markers and checkpoints.
- **Safety.** `dry_run` validates an operation before it touches anything, and undo/redo works on agent edits exactly as it does on yours.

## Connect in a minute

Open Settings → Agent and copy the connection prompt or client configuration. The recommended connection uses the bundled `weftcut-mcp` bridge: its configuration survives app restarts, port changes and token rotations. No separate Node installation is needed.

For clients that cannot launch a stdio server, HTTP-direct remains available. Copy the current endpoint and token from the app; do not hard-code a port. The app also ships an agent Skill covering editing and Motif authoring.

For detailed setup, see the [current connection documentation](https://github.com/WeftCut/WeftCut/blob/main/docs/mcp.md).

## What stays on your machine

Editing and export run locally. The in-app MCP server binds to loopback (`127.0.0.1`) only, with bearer-token authentication and DNS-rebinding protection.

Your connected agent follows its own provider’s data policy. Optional cloud transcription or vision sends the requested audio or frames to the provider you configure; use local engines to keep that analysis on your machine.

## You stay in control

Agent edits are not a black box that hands you a finished file.

- `begin_agent_session` flips the UI into a simplified agent mode, so it is obvious when something other than you is editing.
- Every action lands in a live change feed, in order, as it happens.
- Changes group under a checkpoint, so a whole run can be undone as one unit — or you can take the mouse back mid-run and keep editing alongside.

## Let it look before it cuts

Shot detection, pause detection and frame comparison run locally. Transcription can use a cloud provider or a downloaded local engine such as whisper.cpp or FunASR. Scene description supports local vision models or a configured cloud provider. Agents can also extract raw clip audio for their own speech workflow.

These tools are optional. The installer bundles no model weights; local engines and models are downloaded when you choose them.

## It is a complete editor without any of this

If you never connect an agent, nothing is missing. WeftCut is a full desktop NLE on its own: A/B-roll timeline with filmstrips and waveforms, an in-timeline bézier curve editor, effect chains, chroma key with a live eyedropper, captions, Motifs, role-based audio mixing, and export to H.264, HEVC, 10-bit AV1, ProRes or DNxHR.

## Questions

### Which MCP clients work with WeftCut?

Any of them. Claude Desktop, Cursor and Codex are the ones most people arrive with, but the server implements standard MCP through the bundled stdio bridge or HTTP-direct, so your own client can connect too.

### Does WeftCut include an AI model?

The installer includes no model weights. Your connected agent provides the editing intelligence. Optional speech and vision tools can use downloaded local engines or cloud providers you configure.

### Can the agent break my project?

It can change it, which is the point — but not irreversibly. Operations can be validated with `dry_run` first, every change is listed in the change feed as it lands, edits group under a checkpoint, and undo covers agent actions exactly as it covers yours.

### Is the MCP server reachable from the network?

No. It binds to loopback only, requires a bearer token, and has DNS-rebinding protection. It is reachable from programs on your own machine and nowhere else.

### Is it really free?

Yes — MIT licensed and open source, for macOS, Windows and Linux. The bundled FFmpeg carries its own LGPL/GPL terms. See [what "AI video editor" means here](/ai-video-editor/).
