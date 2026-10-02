---
slug: motifs
locale: en
title: Motifs — 2D Animation, 3D Scenes and Motion Graphics | WeftCut
description: Motifs are parameterised animated overlays in WeftCut — animated titles, 2D drawings and 3D scenes — that your AI agent can write from a plain description, and that render identically in preview and export.
h1: Code as motion
keywords: animated lower third, lower third generator, countdown overlay video, programmatic motion graphics, code-driven video overlay, reusable overlay template, motion graphics in video editor, animated titles
faq: Questions
---

# Code as motion

A Motif is an animated overlay in WeftCut — an animated title, a 2D drawing, a 3D scene — defined as parameterised code rather than as a flattened clip. Your agent already knows how to write code. Motifs are how that turns into motion.

## What a Motif actually is

Not a video file you drop on the timeline, and not a preset with three sliders. A Motif is a small parameterised web overlay: it has its own controls, it plays on the timeline like any other layer, and its parameters stay editable after it is placed.

The important property is that it renders pixel-identically in preview and in export. What you scrub past is what lands in the file — no separate render path, no surprise at the end.

## Start from something that exists

WeftCut ships a catalog of starting points, with live previews in the picker:

- **Lower thirds** — name-and-title cards that animate in and out
- **Countdowns** — timers that run to a beat you set
- **Text effects** — animated titles and callouts

Pick one, adjust its controls, and it is on the timeline. Nothing here requires an agent.

## Or have your agent write one

This is where it gets interesting, because the thing an LLM is genuinely good at — writing small, precise, parameterised code — is exactly what a Motif is.

1. **Describe.** Tell your agent what you want, whether that is a title, a lower third, a callout, or a design that does not exist yet.
2. **Preview.** The agent turns the idea into a Motif you can play on the timeline immediately.
3. **Polish.** Refine it in context — adjust the parameters, or ask for a change — until it is right.

Our showcase project includes a portrait drawn stroke by stroke: the outline appears first, followed by hair and accessories. Its controls change the stroke color, line weight, detail level and drawing duration. [Watch the real export on the homepage](/#motifs).

Motifs can also build 3D scenes using WebGL and packaged local assets. These custom examples extend the built-in catalog; they are authored designs, not bundled presets.

## Parameters, not copies

Because a Motif is parameterised, the finished look is reusable. Change the text and it is a different card, not a different asset. Use it again in the next edit and it stays one thing to maintain, not a folder of near-identical exports.

That also makes them good to hand to an agent in bulk: restyling or repopulating a set of overlays is a parameter change, not a redraw.

## How this fits the rest of the editor

Motifs are one layer type among many. They sit on the same timeline as your clips, captions and effects, their layer transforms and opacity support keyframes, and they export through the same path to H.264, HEVC, 10-bit AV1, ProRes or DNxHR.

An agent connected over MCP can create, place and adjust them alongside every other editing operation — see [the MCP page](/mcp/) for what that connection looks like.

## Questions

### Do I need an AI agent to use Motifs?

No. The built-in catalog works on its own, with normal controls in the picker. The agent is for when you want something the catalog does not have.

### Will a Motif look different after export?

No. Motifs render identically in preview and export — the same overlay you scrub past is the one that lands in the file.

### Can I make a Motif that isn't in the catalog?

Yes. That is what the describe-preview-polish loop is for: your agent writes a new one from your description rather than picking the closest existing option.

### Can I reuse a Motif across projects?

Yes. A Motif is parameterised, so the same overlay carries to the next edit and you change its values rather than rebuilding it.

### Is this free?

Yes — Motifs are part of WeftCut, which is free and open source under the MIT license for macOS, Windows and Linux. See [the overview](/ai-video-editor/).
