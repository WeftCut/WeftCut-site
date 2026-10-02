---
slug: ai-video-editor
locale: en
title: Open Source AI Video Editor — Free, Local Editing | WeftCut
description: WeftCut is a free, open source AI video editor for macOS, Windows and Linux. No subscription or watermark. Editing and export run locally; optional speech and vision tools use local engines or cloud providers you configure.
h1: What "AI video editor" means in WeftCut
keywords: open source AI video editor, free AI video editor, AI video editor no watermark, local AI video editing, offline AI video editor, AI video editor Linux, AI video editor no subscription, AI agent video editor
faq: Questions
---

# What "AI video editor" means in WeftCut

WeftCut is a free, open source AI video editor for macOS, Windows and Linux. It is worth being precise about that phrase, because it usually means something quite different from what happens here.

## The short answer: it ships no AI models

Most tools called AI video editors run models the vendor chose, on the vendor's servers, on footage you uploaded. WeftCut does none of that. The installer bundles no model weights, and editing and export run on your machine. Optional speech and vision tools can use downloaded local engines or cloud providers you configure.

What it has instead is an open door. The whole editor is exposed to whatever AI agent you already use — Claude, Cursor, Codex, or your own — over the standard Model Context Protocol, on your own machine. The agent brings the intelligence; WeftCut brings the timeline, and the agent's edits land on it live where you can see and undo them. That is covered in detail on [the MCP page](/mcp/).

So: the AI is real, and it does real editing. It just isn't ours, and it isn't running somewhere you can't see.

## How that differs from a typical cloud AI editor

| | Typical cloud AI editor | WeftCut |
| --- | --- | --- |
| Where your footage goes | uploaded to the vendor | local editing; optional cloud analysis |
| Where the AI runs | the vendor's models, their choice | the agent you already chose |
| Price | subscription, often per seat | free |
| Watermark | common on free tiers | none |
| Export ceiling | depends on your tier | 10-bit AV1, ProRes, DNxHR |
| Source code | closed | open, MIT, auditable |
| Works offline | no | editing and export; downloaded local engines |

The row that matters most depends on who you are. For a lot of people it is the first one.

## What an agent actually does here

Plain requests, real edits:

- "Cut the silences out of this interview and tighten the pauses."
- "Split this take at every shot change and label the scenes."
- "Restyle every caption — larger, with a soft shadow."

Each of those becomes ordinary timeline operations you can inspect, adjust or undo. Shot detection, pause detection and frame comparison run locally. Transcription and scene description can use local engines or your configured cloud provider, so the agent can look and listen before it cuts.

## It is a serious editor with the AI switched off

Connect nothing and you still have a complete non-linear editor:

- A/B-roll timeline with filmstrip thumbnails and audio waveforms, frame-aligned to SMPTE timecode
- Keyframe animation with a bézier curve editor, edited in the timeline
- Per-layer effect chains, including chroma key with a live eyedropper
- Titles and captions, importing SRT, VTT and ASS as editable layers
- [Motifs](/motifs/): reusable motion graphics, from titles to 2D drawings and 3D scenes
- Role-based audio mixing for dialogue, music, effects and voiceover, with live meters and denoise
- A Ctrl-K palette over commands, media, clips, captions and markers

## Platforms and export

One desktop app for macOS, Windows and Linux, with the same feature set on each. Export to H.264, HEVC, AV1 up to 10-bit, ProRes or DNxHR, using hardware or software encoders, either the full timeline or a selected range.

Linux gets the same build as everyone else, which is not true of most editors in this category.

## Questions

### Is WeftCut free?

Yes — free and open source under the MIT license, with no paid tier and no per-seat cost. The bundled FFmpeg carries its own LGPL/GPL terms.

### Does it add a watermark?

No. There is no watermark on any export, at any resolution, in any format.

### Does my video get uploaded anywhere?

Editing and export are local. If you configure a cloud transcription or vision provider, the requested audio or frames are sent to that provider. Use local engines to keep analysis on your machine; your connected agent has its own data policy.

### Does it work without an internet connection?

Editing and export work offline. Local speech and vision analysis work after the engine and model downloads are complete. Cloud analysis, cloud voiceover and a cloud-backed agent need a network connection.

### Does it run on Linux?

Yes — macOS, Windows and Linux get one desktop app with the same feature set, including 10-bit AV1 and ProRes export.

### Which AI models does it use?

The connected agent supplies the editing intelligence. WeftCut bundles no model weights. For optional analysis, choose local engines such as whisper.cpp or FunASR, or configure a cloud speech or vision provider.
