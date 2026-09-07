// WIN COMPOSE — turn a CDP screencast frame dump into a constant-rate mp4.
//
//   node .work/harness/win-compose.mjs [<runDir>] [<out.mp4>]
//
// Screencast frames only arrive when the page repaints, so the dump is
// irregularly spaced. Rather than duplicating files to a fixed grid (what the
// hero-session composer does), this hands ffmpeg a concat list carrying each
// frame's real on-screen duration and lets `-r 30` resample it — same result,
// no thousands of copies.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { FFMPEG, VIDEOS } from './config.mjs'

const RUN = process.argv[2] ? path.resolve(process.argv[2]) : path.join(VIDEOS, 'tour-run')
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : path.join(VIDEOS, 'nle-tour.mp4')

const frames = fs.readFileSync(path.join(RUN, 'frames.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l))
  .sort((a, b) => a.ts - b.ts)
if (!frames.length) throw new Error(`no frames in ${RUN}`)

const span = frames.at(-1).ts - frames[0].ts
console.log(`${frames.length} frames over ${span.toFixed(1)}s (${(frames.length / span).toFixed(1)} fps captured)`)

const lines = []
for (let i = 0; i < frames.length; i++) {
  const dur = i + 1 < frames.length
    ? Math.max(1 / 240, frames[i + 1].ts - frames[i].ts)
    : 1 / 30
  lines.push(`file '${String(frames[i].n).padStart(6, '0')}.jpg'`)
  lines.push(`duration ${dur.toFixed(5)}`)
}
// The concat demuxer ignores the final entry's duration unless the file is
// repeated, so name the last frame twice.
lines.push(`file '${String(frames.at(-1).n).padStart(6, '0')}.jpg'`)
const list = path.join(RUN, 'concat.txt')
fs.writeFileSync(list, lines.join('\n') + '\n')

fs.mkdirSync(path.dirname(OUT), { recursive: true })
execFileSync(FFMPEG, [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
  '-vf', 'scale=1600:-2,fps=30',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-an',
  OUT,
], { cwd: RUN, stdio: 'inherit' })
console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2) + ' MB')
