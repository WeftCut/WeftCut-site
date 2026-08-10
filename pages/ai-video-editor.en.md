---
slug: ai-video-editor
locale: en
title: Open Source AI Video Editor — Free and Fully Local | WeftCut
description: WeftCut is a free, open source AI video editor for macOS, Windows and Linux. No subscription, no watermark, no upload — it bundles no AI models and your footage never leaves your machine.
h1: What "AI video editor" means in WeftCut
keywords: open source AI video editor, free AI video editor, AI video editor no watermark, local AI video editing, offline AI video editor, AI video editor Linux, AI video editor no subscription, AI agent video editor
faq: Questions
---

# What "AI video editor" means in WeftCut

WeftCut is a free, open source AI video editor for macOS, Windows and Linux. It is worth being precise about that phrase, because it usually means something quite different from what happens here.

## The short answer: it ships no AI models

Most tools called AI video editors run models the vendor chose, on the vendor's servers, on footage you uploaded. WeftCut does none of that. There is no bundled model, no inference endpoint, no account, and nothing to upload.

What it has instead is an open door. The whole editor is exposed to whatever AI agent you already use — Claude, Cursor, Codex, or your own — over the standard Model Context Protocol, on your own machine. The agent brings the intelligence; WeftCut brings the timeline, and the agent's edits land on it live where you can see and undo them. That is covered in detail on [the MCP page](/mcp/).

So: the AI is real, and it does real editing. It just isn't ours, and it isn't running somewhere you can't see.

## How that differs from a typical cloud AI editor

| | Typical cloud AI editor | WeftCut |
| --- | --- | --- |
| Where your footage goes | uploaded to the vendor | stays on your machine |
| Where the AI runs | the vendor's models, their choice | the agent you already chose |
| Price | subscription, often per seat | free |
| Watermark | common on free tiers | none |
| Export ceiling | depends on your tier | 10-bit AV1, ProRes, DNxHR |
| Source code | closed | open, MIT, auditable |
| Works offline | no | yes, apart from your agent |

The row that matters most depends on who you are. For a lot of people it is the first one.

## What an agent actually does here

Plain requests, real edits:

- "Cut the silences out of this interview and tighten the pauses."
- "Split this take at every shot change and label the scenes."
- "Restyle every caption — larger, with a soft shadow."

Each of those becomes ordinary timeline operations you can inspect, adjust or undo. Optional analysis — transcription, shot detection, silence detection, scene description — also runs locally, so the agent can look at the footage before it cuts without the footage going anywhere.

## It is a serious editor with the AI switched off

Connect nothing and you still have a complete non-linear editor:

- A/B-roll timeline with filmstrip thumbnails and audio waveforms, frame-aligned to SMPTE timecode
- Keyframe animation with a bézier curve editor, edited in the timeline
- Per-layer effect chains, including chroma key with a live eyedropper
- Titles and captions, importing SRT, VTT and ASS as editable layers
- [Motifs](/motifs/): animated, reusable overlays like lower thirds and countdowns
- Role-based audio mixing for dialogue, music and effects
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

No. Editing and export are local, and the optional analysis features are local too. WeftCut has no account system and no server to upload to.

### Does it work without an internet connection?

The editor does, completely. The only part that needs a network is the AI agent you connect, because that agent is a separate program talking to its own provider.

### Does it run on Linux?

Yes — macOS, Windows and Linux get one desktop app with the same feature set, including 10-bit AV1 and ProRes export.

### Which AI models does it use?

None of its own. WeftCut bundles no models. The agent you connect supplies the intelligence, and optional local analysis uses on-device tools such as Whisper for transcription.
