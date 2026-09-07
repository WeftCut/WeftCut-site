// WIN POST — move this run's captures into assets/.
//
// Deliberately NOT postprocess.mjs: that one sweeps every png in .work/shots,
// which still holds stills from earlier (macOS) runs. This names the files it
// ships, so a stale png can never ride along.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { ASSETS, FFMPEG, SHOTS, VIDEOS, ensureDirectories } from './config.mjs'

const SHIP_SHOTS = [
  'connect-agent',
  'agent-mode',
  'motif-live',
  'timeline-closeup',
  'curve-editor',
  'effects',
  'eyedropper',
  'captions',
  'search-palette',
  'export',
]
const POSTER_AT = process.env.WEFTCUT_TOUR_POSTER ?? '52'

const assetShots = path.join(ASSETS, 'shots')
const assetVideos = path.join(ASSETS, 'video')
ensureDirectories(assetShots, assetVideos)
const run = (args) => execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })

for (const name of SHIP_SHOTS) {
  const src = path.join(SHOTS, `${name}.png`)
  if (!fs.existsSync(src)) { console.log('MISSING', src); continue }
  const out = path.join(assetShots, `${name}.webp`)
  run(['-i', src, '-vf', 'scale=1600:-2', '-c:v', 'libwebp', '-quality', '85', out])
  console.log(`${name}.webp`, (fs.statSync(out).size / 1024).toFixed(0) + ' KB')
}

const tour = path.join(VIDEOS, 'nle-tour.mp4')
if (fs.existsSync(tour)) {
  fs.copyFileSync(tour, path.join(assetVideos, 'nle-tour.mp4'))
  run(['-i', tour, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-an',
    path.join(assetVideos, 'nle-tour.webm')])
  run(['-ss', POSTER_AT, '-i', tour, '-frames:v', '1', '-q:v', '4',
    path.join(assetVideos, 'nle-tour-poster.jpg')])
  for (const f of ['nle-tour.mp4', 'nle-tour.webm', 'nle-tour-poster.jpg']) {
    console.log(f, (fs.statSync(path.join(assetVideos, f)).size / 1e6).toFixed(2) + ' MB')
  }
} else console.log('MISSING', tour)
