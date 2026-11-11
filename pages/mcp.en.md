---
slug: mcp
locale: en
title: WeftCut MCP Server — Edit Video From Claude or Cursor
description: WeftCut is a free, open source video editor with a built-in MCP server. Connect Claude, Cursor, Codex or your own client and let an agent trim, split, keyframe, caption and mix audio — then review what it changed on your timeline, and approve or revert it.
h1: Drive a real video editor over MCP
keywords: MCP video editor, video editor MCP server, MCP server for video editing, Claude video editing, edit video with Claude, Cursor video editing, AI agent video editor, agent-native video editor, control video editor with AI
faq: Questions
---

# Drive a real video editor over MCP

WeftCut is a free, open source video editor with a built-in MCP server. Connect Claude, Cursor, Codex or a client you wrote yourself, and the agent gets the same editing vocabulary you have — trim, split, keyframes, effects, captions, markers, audio — landing live on your timeline while you watch. When it is done, you review what changed and approve or revert it.

Most editors bolt AI on as a feature: one button that does the one thing a vendor picked for you. WeftCut instead exposes the editor itself as a tool surface, and ships no models at all. The intelligence lives in whatever agent you connect.

## What the agent can actually do

The MCP catalog covers the editing workflow: timeline changes, motion, captions, audio, analysis, Motif authoring, project history, review and export. These tools edit the project you see in the app.

- **Timeline.** Place, move, trim and split clips on an A/B-roll timeline, frame-aligned to SMPTE timecode. `auto_split_by_shot` cuts at every detected shot change; `detect_pauses` finds pauses; `remove_pauses` cuts them and closes the gaps in one undoable edit.
- **Motion.** Keyframes with bézier easing, tangent controls, motion paths and extrapolation.
- **Look.** Per-layer effect chains, including chroma key, and transitions between clips.
- **Text.** Styled title layers; `apply_subtitles` lays an SRT, VTT or ASS file out as editable caption layers, and `apply_transcripts` does the same for transcribed speech. Every caption in the project can be restyled in one undoable step.
- **Motifs.** Parameterised motion graphics — titles, 2D drawings and 3D scenes — that render identically in preview and export. See [Motifs](/motifs/).
- **Style.** A project's look is data, not the model's habit. `TASTE.md` in the project folder picks a style and overrides its colours, fonts and caption look. New titles, lower thirds and captions take it whichever agent is driving, and `restyle_to_taste` brings placed ones back to it.
- **Audio.** Role-based gain and mute/solo controls, raw audio extraction, transcription and cloud voiceover.
- **Structure.** Nested compositions, linked A/V, markers and checkpoints.
- **Review.** `create_tacks` pins notes and questions to the passages they concern, `render_frames` lets the agent look at the composed picture, and `check_composition` checks the result against craft rules before handoff.
- **Export.** `start_export` renders the file with your presets and reports the finished output's path. The job runs in the app like one you started yourself.
- **Safety.** A call commits whole or is refused whole, and a refusal names its cause. Undo and redo work on agent edits exactly as they do on yours.

## Connect in a minute

Open Settings → Agent and copy the connection prompt or client configuration. The recommended connection uses the bundled `weftcut-mcp` bridge: its configuration survives app restarts, port changes and token rotations. No separate Node installation is needed.

For clients that cannot launch a stdio server, HTTP-direct remains available. Copy the current endpoint and token from the app; do not hard-code a port. The app also ships an agent Skill covering editing and Motif authoring.

For detailed setup, see the [current connection documentation](https://github.com/WeftCut/WeftCut/blob/main/docs/mcp.md).

## What stays on your machine

Editing and export run locally. The in-app MCP server binds to loopback (`127.0.0.1`) only, with bearer-token authentication and DNS-rebinding protection.

Your connected agent follows its own provider’s data policy. Optional cloud transcription or vision sends the requested audio or frames to the provider you configure; use local engines to keep that analysis on your machine.

## The agent does the work. You audit it.

Handing an editor to an agent only pays off if checking the work is cheaper than doing it yourself. So review is built into the editor, not left to a chat log. This is why WeftCut has Timeline diff and Tacks.

- **Watch it happen.** For a longer run, `begin_agent_session` takes a checkpoint and opens Agent view: the preview, a compact timeline, and an Activity list of every call the agent makes, as it makes it. Your undo is locked for the run so a stray Ctrl-Z cannot land in the middle of it; the reason is shown, and Unlock is yours.
- **Tacks put the conversation on the footage.** The agent pins a note, an issue or a question to the time range it concerns. You jump there, play it, then resolve or dismiss it, and the agent reads your answer. A Tack follows the content it covers and is marked outdated when what plays there changes.
- **Timeline diff shows the result, not the log.** The Changes tab compares the project with your review baseline — the state when you opened it, or when you last chose Approve all: every addition, removal and modification, with before and after details, highlighted on the timeline. Approve all makes the result your new baseline. Revert all restores the baseline in one undoable step. Both include your own edits since the baseline.
- **The app checks before you do.** When a session ends, WeftCut checks the cut against craft rules that have a right answer — a title held too briefly, a caption line too long, text off the frame — and hands the findings back to the agent first. Whether the cut is good stays your call.

Try: "Find the pauses in this interview and leave Tacks on the ones worth cutting. Let me review them before you edit." Review the passages, tell the agent which to cut, then approve or revert the result in Timeline diff.

Tacks and the review baseline last for the current project opening. They are not saved or exported; convert a Tack into a marker to keep it.

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

It can change it, which is the point — but not irreversibly. A work session starts from a checkpoint, every edit the agent commits is a step in your undo history, and Timeline diff lists everything that differs from the state you last approved, with Revert all one click away.

### How do I check what the agent did?

Open Changes in Agent view. Timeline diff lists what was added, removed and modified since you last approved, with before and after details and highlights on the timeline. Activity shows each call the agent made, and Tacks mark the passages it wants you to look at. Approve all accepts the result; Revert all restores the baseline.

### Is the MCP server reachable from the network?

No. It binds to loopback only, requires a bearer token, and has DNS-rebinding protection. It is reachable from programs on your own machine and nowhere else.

### Is it really free?

Yes — MIT licensed and open source, for macOS, Windows and Linux. The bundled FFmpeg carries its own LGPL/GPL terms. See [what "AI video editor" means here](/ai-video-editor/).
