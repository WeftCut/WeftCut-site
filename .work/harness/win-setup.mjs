// Windows-native launch + demo-project builder shared by the capture scripts.
//
// The original `recorder.mjs` fits the window to a macOS screen and records
// with avfoundation; on Windows the window is sized through Electron itself
// (content bounds are DIPs, which are the renderer's CSS pixels) and the
// capture happens over CDP. Everything below is the part both capture scripts
// need: a 1600x852 CSS viewport, an MCP client, and one demo timeline.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { MAIN, MEDIA, PROJECTS, assertDesktopBuild, ensureDirectories } from './config.mjs'
import { McpClient, sleep, us } from './mcp.mjs'

export const VIEWPORT = { width: 1600, height: 852 }

export async function launchWin({ project }) {
  assertDesktopBuild()
  ensureDirectories(PROJECTS)
  fs.rmSync(path.join(PROJECTS, project), { recursive: true, force: true })
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weftcut-site-'))
  const app = await electron.launch({
    args: ['--lang=en-US', `--user-data-dir=${userDataDir}`, MAIN],
    env: { ...process.env, LANG: 'en_US.UTF-8', WEFTCUT_SUPPRESS_ELEVATION_NOTICE: '1' },
  })
  const page = await app.firstWindow({ timeout: 60_000 })
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {})
  await page.addStyleTag({ content: '.dev-splash-toggle{display:none!important}' }).catch(() => {})
  await page.waitForFunction(
    () => typeof window.__weftcutTest?.newProjectAndEnter === 'function',
    undefined,
    { timeout: 90_000 },
  )

  const win = await app.browserWindow(page)
  await win.evaluate((bw, v) => {
    bw.setContentBounds({ x: 0, y: 0, ...v })
    bw.setAlwaysOnTop(true, 'screen-saver')
    bw.focus()
  }, VIEWPORT)
  await sleep(600)

  await page.evaluate(
    ([name, parentFolder]) =>
      window.__weftcutTest.newProjectAndEnter({
        parentFolder,
        name,
        canvas: { width: 1920, height: 1080, fpsNum: 30, fpsDen: 1 },
      }),
    [project, PROJECTS],
  )
  await page.locator('.splash-screen').waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {})

  const mcp = await McpClient.connect(userDataDir)
  const invoke = (cmd, args = {}) => page.evaluate(([c, a]) => window.api.backend.invoke(c, a), [cmd, args])
  const hook = (name, args) => page.evaluate(([n, a]) => window.__weftcutTest[n](a), [name, args])
  const settle = async (extraMs = 0) => {
    await page.locator('.derivatives-pill').waitFor({ state: 'detached', timeout: 120_000 }).catch(() => {})
    if (extraMs) await sleep(extraMs)
  }
  return { app, page, win, mcp, invoke, hook, settle, userDataDir }
}

/// Give the timeline most of the window. The tour's whole complaint was that
/// the row being edited sat half-hidden behind the status bar, so the sash
/// between the preview column and the timeline gets dragged up before anything
/// is filmed, and the result is asserted rather than hoped for.
export async function growTimeline(page, targetHeight = 380) {
  const panel = page.locator('.weft-dock-panel[data-panel-kind="timeline"]')
  const before = await panel.boundingBox()
  if (!before) return null
  const sashes = page.locator('.dv-sash')
  const n = await sashes.count()
  for (let i = 0; i < n; i++) {
    const b = await sashes.nth(i).boundingBox()
    // The horizontal sash immediately above the timeline panel. Dockview lays
    // it just outside the panel, so allow the whole tab strip's worth of gap.
    if (!b || b.width < 600 || b.height > 14) continue
    if (b.y > before.y || before.y - b.y > 80) continue
    const dy = targetHeight - before.height
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width / 2, b.y - dy, { steps: 18 })
    await page.mouse.up()
    await sleep(700)
    break
  }
  const after = await panel.boundingBox()
  console.log(`timeline height: ${Math.round(before.height)} → ${Math.round(after?.height ?? 0)}`)
  return after
}

export async function listTracks(mcp) {
  const res = await mcp.readResource('project://tracks')
  return res?.tracks ?? res
}

/// The "Aurora Ridge" demo timeline the stills and the tour both stand on:
/// three acts on the A roll, a B-roll insert with an eased opacity fade and a
/// blur, a crossfade, a lower third, captions and a marker.
export async function buildDemoTimeline(mcp, { chromakey = true } = {}) {
  const ids = {}
  for (const n of ['dawn', 'tide', 'ember', 'mono_silent']) {
    ids[n] = await mcp.toolId('import_media', { path: path.join(MEDIA, `${n}.mp4`) })
  }
  // The reserved rolls carry no label — the row name is rendered from `role`,
  // so matching on the label is what used to strand the clips on B roll and
  // spawn a duplicate "B-roll" track next to the real one.
  const trackList = await listTracks(mcp)
  const aRoll = trackList.find((t) => t.role === 'ARoll') ?? trackList.at(-1)
  const bRoll = trackList.find((t) => t.role === 'BRoll')
  const lid = (r) => (typeof r === 'string' ? r : (r.video_layer_id ?? r.layer_id))
  const put = async (name, trackId, t0, t1, srcIn = 0) =>
    lid(await mcp.tool('add_video_layer', {
      track_id: trackId,
      media_id: ids[name],
      t_start_us: us(t0),
      t_end_us: us(t1),
      src_in_us: us(srcIn),
      src_out_us: us(srcIn + (t1 - t0)),
    }))

  const dawn = await put('dawn', aRoll.id, 0, 6)
  const tide = await put('tide', aRoll.id, 6, 12)
  const ember = await put('ember', aRoll.id, 12, 17, 2)
  const insertTrack = bRoll?.id ?? (await mcp.toolId('add_track', { label: 'B-roll' }))
  const mono = await put('mono_silent', insertTrack, 2, 8)

  let motifId = 'lower-third'
  try {
    const motifs = await mcp.tool('list_motifs')
    const lt = (motifs ?? []).find((m) => /lower/i.test(m.id + (m.name ?? '')))
    if (lt) motifId = lt.id
  } catch {}
  await mcp.tool('add_motif', {
    motif_id: motifId,
    t_start_us: us(1),
    t_end_us: us(5),
    props: { title: 'The Coast at Dawn', subtitle: 'WeftCut', accent: '#6696E6' },
  })

  const mk = (t, v, interp) =>
    mcp.tool('set_keyframe', { layer_id: mono, param_key: 'opacity', t_us: us(t), value: v, ...(interp ? { interp } : {}) })
  await mk(2, 0)
  await mk(3, 1, { kind: 'Bezier', p1: [0.32, 0], p2: [0.2, 1] })
  await mk(7, 1)
  await mk(8, 0, { kind: 'Bezier', p1: [0.8, 0], p2: [0.68, 1] })

  await mcp.tool('apply_subtitles', {
    body: '1\n00:00:01,000 --> 00:00:03,500\nA real timeline, frame-accurate\n\n2\n00:00:06,000 --> 00:00:09,000\nKeyframes, effects, captions, audio\n',
  })
  await mcp.tool('add_transition', { from_layer_id: dawn, to_layer_id: tide, duration_us: us(0.6), kind: 'Crossfade' })
  const blur = await mcp.toolId('add_effect', { layer_id: ember, kind: 'blur' })
  await mcp.tool('update_effect', { layer_id: ember, effect_id: blur, patch: { params: { strength: { mode: 'Static', value: 6 } } } })
  if (chromakey) await mcp.tool('add_effect', { layer_id: ember, kind: 'chromakey' })
  await mcp.tool('add_marker', { t_us: us(6), label: 'Verse 2', color: { r: 250, g: 204, b: 21, a: 255 } })

  return { ids, aRoll: aRoll.id, insertTrack, layers: { dawn, tide, ember, mono } }
}

export { sleep, us }
