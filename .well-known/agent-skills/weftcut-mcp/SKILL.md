---
name: weftcut-mcp
description: Connect to a running WeftCut desktop video editor over MCP and drive real edits — place, trim and split clips, keyframes, effect chains, captions, Motifs, markers, checkpoints, undo and export — in a project the user watches live and reviews afterwards. Use when the user asks you to edit video in WeftCut, wants their timeline changed, or asks how to wire an MCP client up to WeftCut.
license: MIT
---

# Editing video in WeftCut over MCP

WeftCut is a cross-platform desktop NLE that exposes the whole editor as an MCP
tool surface. You are not generating a file and handing it over: your calls land
in a running editor's UI in real time, every edit you commit enters the user's
undo history, and the user reviews what you changed before accepting it. You do
the editing; they audit it.

This page gets you connected and oriented. It is a published copy and can lag
the app. Once connected, the server's `initialize` instructions and the skill it
serves at `skill://weftcut/SKILL.md` (or `read_project` view "skill") describe
the running version and take precedence over anything here. Each tool's own
description carries its contract.

## Connecting

The server is **not hosted**. It runs inside the desktop app and binds to
loopback only, so there is no public endpoint to discover and nothing to
authenticate against remotely.

1. The user opens WeftCut and goes to **Settings → Agent**.
2. That panel offers a config snippet per client, and a prompt you can follow
   to configure yourself.
3. The recommended connection is the bundled `weftcut-mcp` stdio bridge. Its
   config carries no port and no token, and it keeps working across app
   restarts, port changes and token rotation. While the app is closed the
   bridge still answers, with `weftcut_status` and `launch_weftcut`.
4. HTTP-direct is the fallback for a client that cannot launch a stdio server:
   streamable HTTP on `http://127.0.0.1:<port>/mcp` with a bearer token. Use
   the URL and token the panel shows. Never guess a port.

The server is bearer-authenticated and protected against DNS rebinding. If a
connection fails, the app is not running or the token was rotated: ask the user
to open Settings → Agent again.

## How a session goes

- **Read before you write.** Read `project://tracks` (or `read_project` view
  "tracks") before your first edit. Ids come from reads, never from memory.
- **Edit the open project.** The video the user means is the project open in
  the app. Create or open another one only when the user asked for it.
- **Times are microseconds on the frame grid.** An off-grid time is snapped and
  echoed back; a time outside its layer is refused.
- **Verify from the answer.** Every edit answers with the committed record. A
  refusal names its cause and the fix: act on it, and never retry the same call
  unchanged.
- **A small change needs no ceremony.** Edit, verify, report.
- **A batch runs in a work session.** For a rough cut, a pause pass or a
  caption track, ask the user first, then call `begin_agent_session`. It takes
  a checkpoint, opens Agent view and locks the user's undo until
  `end_agent_session`. End the session on failure too.
- **Do not fight the human.** They may edit the same project while you work.
  When a commit fails for that reason, re-read and reapply.

## Leave the work reviewable

The user audits your work in the app, not from your report.

- **Activity** lists each call you make as you make it.
- **Timeline diff** shows the user everything that differs from the state they
  last approved, and they approve or revert it as a whole. Change only what the
  task needs.
- **Tacks** point the user at something to review: a pause to check, a shot to
  judge, a cut to decide. Create them in one `create_tacks` batch once your
  edits are done, and describe the content, never a timecode. A Tack's status
  is the user's answer (resolved, dismissed or still open), so read
  `project://tacks` before acting on earlier ones. Markers are the user's saved
  content: add one only when asked, never as a review mark.
- **Check before handoff.** `check_composition` checks the result against craft
  rules. It cannot see pixels: look at overlays you placed with `render_frames`.
- **A Motif you write is a proposal.** `install_motif` asks the user to approve
  it in the Motifs panel. Do not report it published.
- **Export when the user asks for a file.** `start_export`, then
  `get_export_status` for the completed output path.

## What is on the surface

- **Assembly** — place, trim, split, move and retime clips on an A/B-roll
  timeline; groups, links and nested compositions.
- **Cutting help** — `auto_split_by_shot` for shot boundaries, `detect_pauses`
  and `remove_pauses` for dead air.
- **Motion** — keyframes with bézier easing, motion paths.
- **Look** — per-layer effect chains, including chroma key; transitions.
- **Words** — styled titles; `apply_subtitles` for SRT, VTT or ASS files;
  `transcribe_clip` and `apply_transcripts` for captions from speech.
- **Graphics** — Motifs: parameterized animated overlays written as web pages,
  rendered identically in preview and export.
- **Style** — `project://taste` is the project's style, and new text and
  captions take it. Tag what you create with a `graphic_role` instead of
  styling it by hand; `restyle_to_taste` brings placed layers back.
- **Audio** — role-based gain, mute and solo.
- **History** — checkpoints, undo and redo.

Analysis tools cover shot detection, pause detection, frame comparison,
transcription and scene description, on the engines the user selected in
Settings. Never override that choice with an engine that uploads without the
user's consent. WeftCut bundles no models of its own: you are the intelligence
in the loop.

## Links

- Product: https://weftcut.com/
- MCP reference: https://github.com/WeftCut/WeftCut/blob/main/docs/mcp.md
- Source (MIT): https://github.com/WeftCut/WeftCut
