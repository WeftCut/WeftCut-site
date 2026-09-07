// WIN TOUR — records Scene 03's "human cut" video on Windows.
//
// The macOS original (nle-tour.mjs) captured the screen with ffmpeg's
// avfoundation device; here the frames come off CDP's screencast, which is
// what the hero-session kit already uses, so nothing platform-specific is
// needed. Frames land in <videos>/tour-run/ as jpegs plus a frames.jsonl
// index of { n, ts }; win-compose.mjs turns that into a constant-rate mp4.
//
//   node .work/harness/win-tour.mjs [--norecord]
//
// Two things the old tour got wrong and this one fixes: the timeline panel is
// grown before anything is filmed (the row being trimmed used to sit half
// behind the status bar), and the tour spends its middle on Groups — precompose,
// open, ungroup — instead of repeating the blade.
import fs from 'node:fs'
import path from 'node:path'
import { VIDEOS, ensureDirectories } from './config.mjs'
import { launchWin, growTimeline, buildDemoTimeline, sleep, us } from './win-setup.mjs'

const RECORD = !process.argv.includes('--norecord')
const OUT = path.join(VIDEOS, 'tour-run')
if (RECORD) {
  fs.rmSync(OUT, { recursive: true, force: true })
  ensureDirectories(OUT)
}

const { app, page, mcp, hook, settle } = await launchWin({ project: 'Aurora Ridge' })
await buildDemoTimeline(mcp, { chromakey: false })
await settle(1500)

const viewMenu = async (label) => {
  await page.locator('.menu-trigger', { hasText: 'View' }).click()
  await sleep(300)
  await page.locator('.app-menu-item', { hasText: label }).first().click()
  await sleep(600)
}
await viewMenu('All Tracks')
// In All Tracks the Playhead panel is only a "nothing is hidden" notice, and
// the Attribute panel is what the tour actually points at.
await page.locator('.weft-dock-tab-label', { hasText: 'Playhead' }).first().click().catch(() => {})
await sleep(300)
await viewMenu('Close Active Panel')
await growTimeline(page, 372)
await hook('transportSeekUs', us(0))
await sleep(800)

// In-page cursor: pointer-events:none, follows the CDP input stream, and —
// unlike the OS cursor — is part of the page, so the screencast records it.
await page.evaluate(() => {
  if (document.getElementById('demo-cursor')) return
  const c = document.createElement('div')
  c.id = 'demo-cursor'
  c.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M5.5 3.2 18.8 10.6l-6.9 1.2-3.4 6z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>'
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));transform:translate(-100px,-100px)'
  document.documentElement.appendChild(c)
  window.addEventListener('pointermove', (e) => {
    c.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 3}px)`
  }, { capture: true, passive: true })
})
await page.mouse.move(820, 300)
await sleep(500)
console.log('setup complete')

// ── pointer helpers (CSS px) ───────────────────────────────────────────────
// Short, explicit timeout: a missing selector must fail the beat in a couple
// of seconds, not stall the whole take on Playwright's 30 s default.
const box = (loc) => loc.boundingBox({ timeout: 2500 }).catch(() => null)
const titles = () => page.evaluate(() =>
  [...document.querySelectorAll('.timeline-layer')].map((e) => e.getAttribute('title')))
const moveTo = (x, y, steps = 26) => page.mouse.move(x, y, { steps })
const click = async (x, y) => { await moveTo(x, y); await sleep(140); await page.mouse.down(); await sleep(80); await page.mouse.up() }
const clickLoc = async (loc, fx = 0.5, fy = 0.5) => {
  const b = await box(loc)
  if (!b) return null
  await click(b.x + b.width * fx, b.y + b.height * fy)
  return b
}
const drag = async (x1, y1, x2, y2, steps = 34) => {
  await moveTo(x1, y1, 20); await sleep(180)
  await page.mouse.down(); await sleep(240)
  await moveTo(x2, y2, steps); await sleep(160)
  await page.mouse.up()
}
const beat = (ms) => sleep(ms)
const mark = (s) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${s}`)

// ── recorder (CDP screencast) ─────────────────────────────────────────────
let cdp = null
let frames = 0
if (RECORD) {
  cdp = await app.context().newCDPSession(page)
  const index = fs.createWriteStream(path.join(OUT, 'frames.jsonl'))
  cdp.on('Page.screencastFrame', (f) => {
    const n = frames++
    fs.writeFileSync(path.join(OUT, `${String(n).padStart(6, '0')}.jpg`), Buffer.from(f.data, 'base64'))
    index.write(JSON.stringify({ n, ts: f.metadata.timestamp }) + '\n')
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  await cdp.send('Page.enable')
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1760, maxHeight: 940, everyNthFrame: 1 })
  console.log('recording started')
}
const T0 = Date.now()

// ── Beat 1: establish ──────────────────────────────────────────────────────
await beat(2000); mark('establish')

// ── Beat 2: playback ───────────────────────────────────────────────────────
const playBtn = page.locator('[aria-label="Play / pause"]').first()
await clickLoc(playBtn)
await beat(4000)
await clickLoc(playBtn)
mark('play/pause')
await beat(700)

// ── Beat 3: scrub the ruler ────────────────────────────────────────────────
const rb = await box(page.locator('[data-testid="timeline-ruler"]').first())
if (rb) await drag(rb.x + rb.width * 0.12, rb.y + rb.height / 2, rb.x + rb.width * 0.58, rb.y + rb.height / 2, 40)
mark('scrub')
await beat(800)

// ── Beat 4: ctrl+wheel zoom, then Home ─────────────────────────────────────
const tb = await box(page.locator('.weft-dock-panel[data-panel-visible="true"][data-panel-kind="timeline"]').first())
const overTimeline = async () => { if (tb) await moveTo(tb.x + tb.width * 0.45, tb.y + tb.height * 0.55, 14) }
await overTimeline()
await beat(250)
await page.keyboard.down('Control')
await page.mouse.wheel(0, -200); await beat(420)
await page.mouse.wheel(0, -200); await beat(420)
await page.keyboard.up('Control')
mark('zoom in')
await beat(700)
await page.keyboard.press('Home')
await beat(900)

// ── Beat 5: pre-compose two clips into a Group ─────────────────────────────
const clipAt = (tc) => page.locator(`.timeline-layer[title^="VideoClip: ${tc}"]`).first()
await clickLoc(clipAt('00:00:00:00'), 0.4, 0.4)
await beat(700)
const tide = await box(clipAt('00:00:05:12'))
if (tide) {
  await moveTo(tide.x + tide.width * 0.4, tide.y + tide.height * 0.4)
  await sleep(150)
  await page.keyboard.down('Shift')
  await page.mouse.down(); await sleep(80); await page.mouse.up()
  await page.keyboard.up('Shift')
}
mark('two clips selected')
await beat(1000)
await page.keyboard.press('Control+g')
await beat(1800)
mark('grouped')

// ── Beat 6: open the Group, then come back out ─────────────────────────────
const openGroup = page.locator('button', { hasText: /^Open group$/ }).first()
if (await openGroup.count()) { await clickLoc(openGroup); await beat(2200) }
else console.log('no Open group button')
mark('inside the group')
const timelineTab = page.locator('.weft-dock-tab-label', { hasText: /^Timeline$/ }).first()
if (await timelineTab.count()) { await clickLoc(timelineTab); await beat(1600) }
mark('back out')

// ── Beat 7: ungroup — the same edit, undone structurally ───────────────────
await clickLoc(page.locator('.timeline-layer[title^="CompositionRef"]').first(), 0.25, 0.5)
await beat(800)
const ungroup = page.locator('button', { hasText: /^Ungroup$/ }).first()
if (await ungroup.count()) { await clickLoc(ungroup); await beat(1800) }
else console.log('no Ungroup button')
mark('ungrouped')

// ── Beat 8: blade split, then delete the tail ──────────────────────────────
// Addressed by what is actually on the timeline rather than by a timecode
// predicted three edits earlier: ungroup restores the members at their own
// times, and the blade's split point follows the pointer.
const videoClips = async () => {
  const list = await titles()
  return list
    .filter((t) => t?.startsWith('VideoClip: '))
    .map((t) => ({ title: t, tc: t.slice('VideoClip: '.length, 'VideoClip: '.length + 11) }))
}
const middle = (await videoClips()).find((c) => c.tc.startsWith('00:00:05'))
console.log('blade target:', middle?.tc, 'of', (await videoClips()).map((c) => c.tc))
await page.keyboard.press('c')
await beat(700)
if (middle) await clickLoc(clipAt(middle.tc), 0.5, 0.45)
await beat(800)
await page.keyboard.press('Escape')
mark('blade split')
await beat(900)
const after = await videoClips()
console.log('after blade:', after.map((c) => c.tc))
// Both halves stay selected after a split (they are linked, and so is each
// half's audio), so clear the selection before pointing at one of them —
// otherwise the next gesture would act on all four layers at once.
if (tb) await click(tb.x + tb.width * 0.9, tb.y + tb.height - 26)
await beat(700)

// ── Beat 9: trim the second half's out edge, fully in frame ───────────────
const tail = middle ? after.filter((c) => c.tc > middle.tc && c.tc < '00:00:11').at(0) : null
console.log('trim target:', tail?.tc)
const seg = tail ? await box(clipAt(tail.tc)) : null
if (seg) {
  await drag(seg.x + seg.width - 3, seg.y + seg.height * 0.5, seg.x + seg.width - 190, seg.y + seg.height * 0.5, 42)
  mark(`trim out ${tail.tc}`)
} else console.log('no segment to trim:', after.map((c) => c.tc))
await beat(1400)

// ── Beat 10: keyframe lane and its curve ───────────────────────────────────
const twirls = page.locator('[data-testid="kf-lane-twirl"]:not([disabled])')
const tw = await twirls.count()
for (let i = 0; i < tw; i++) {
  await clickLoc(twirls.nth(i))
  await beat(600)
  if ((await page.locator('.kf-diamond.kf-sublane-diamond').count()) > 0) break
  await clickLoc(twirls.nth(i))
}
await beat(600)
const key = await box(page.locator('.kf-diamond.kf-sublane-diamond').nth(1))
if (key) {
  await click(key.x + key.width / 2, key.y + key.height / 2)
  await beat(900)
  await drag(key.x + key.width / 2, key.y + key.height / 2, key.x + key.width / 2 + 60, key.y + key.height / 2 + 16, 26)
  mark('keyframe drag')
}
await beat(1200)

// ── Beat 11: effect chain on the closing clip ──────────────────────────────
// The zoom from beat 4 is still in; the closing clip is off the right edge
// until the timeline is zoomed back out.
await overTimeline()
await page.keyboard.down('Control')
await page.mouse.wheel(0, 200); await beat(360)
await page.mouse.wheel(0, 200); await beat(360)
await page.keyboard.up('Control')
await beat(700)
await clickLoc(clipAt('00:00:12:00'), 0.12, 0.4)
await beat(700)
await clickLoc(page.locator('.weft-dock-tab-label', { hasText: 'Effect' }).first())
await beat(900)
await clickLoc(page.locator('[data-testid="effect-add"]').first())
await beat(1100)
// The picker's rows read "<name><description>", so anchor the match on the
// name rather than on the whole row.
const pick = page.locator('[role="menuitem"], [role="option"], button').filter({ hasText: /Chroma Key/ }).first()
if (await pick.count()) { await clickLoc(pick); await beat(1200); mark('added chroma key') }
else console.log('no Chroma Key item')
const strength = page.locator('[data-testid^="effect-param-"][data-testid$="-strength"]').first()
if (await strength.count()) {
  await clickLoc(strength)
  await beat(250)
  await page.keyboard.press('Control+a')
  await page.keyboard.type('14', { delay: 70 })
  await page.keyboard.press('Tab')
  mark('blur strength 14')
}
await beat(1400)

// ── Beat 12: Ctrl-K to the export dialog ───────────────────────────────────
await page.keyboard.press('Control+k')
await beat(900)
await page.keyboard.type('export', { delay: 95 })
await beat(1100)
await page.keyboard.press('Enter')
await beat(320)
// Land on Video rather than dwelling on General: the codec settings are what
// the page's caption promises, and General's Location row is a path off this
// workstation that has no business in a published video.
await page.locator('#export-tab-video').click({ timeout: 4000 }).catch(() => {})
await beat(2000)
mark('palette → export')
await clickLoc(page.locator('button', { hasText: /^Cancel$/ }).first())
await beat(1000)

// ── Beat 13: finale ────────────────────────────────────────────────────────
await page.keyboard.press('Home')
await beat(800)
await clickLoc(playBtn)
await beat(5200)
await clickLoc(playBtn)
mark('finale')
await beat(1200)

if (cdp) {
  await cdp.send('Page.stopScreencast').catch(() => {})
  await sleep(600)
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ frames, seconds: (Date.now() - T0) / 1000 }, null, 1))
  console.log(`recorded ${frames} frames over ${((Date.now() - T0) / 1000).toFixed(1)}s → ${OUT}`)
}
await app.close()
console.log('DONE')
