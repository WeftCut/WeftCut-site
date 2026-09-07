// WIN SHOTS — recapture every still the homepage ships, on Windows, against
// the current UI. Playwright's page.screenshot is platform-independent, so
// unlike recorder.mjs's ffmpeg/avfoundation capture this needs nothing from
// macOS. Output: .work/shots/*.png (win-post.mjs turns them into webp).
//
// Two launches: the feature-grid stills stand on the full demo timeline in the
// default A/B Roll view, and the Motif still gets a deliberately bare project
// in All Tracks so the new Motif is the only thing on the timeline worth
// looking at.
//
//   node .work/harness/win-shots.mjs                 # everything
//   node .work/harness/win-shots.mjs motif-live      # one still
import fs from 'node:fs'
import path from 'node:path'
import { HARNESS_DIR, MEDIA, SHOTS, ensureDirectories } from './config.mjs'
import { launchWin, growTimeline, buildDemoTimeline, listTracks, sleep, us } from './win-setup.mjs'

ensureDirectories(SHOTS)
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const wanted = (name) => only.length === 0 || only.includes(name)

const shooter = (page) => ({
  shot: (name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`) }),
  shotClip: (name, clip) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), clip }),
})

const viewMenu = async (page, label) => {
  await page.locator('.menu-trigger', { hasText: 'View' }).click()
  await sleep(350)
  await page.locator('.app-menu-item', { hasText: label }).first().click()
  await sleep(700)
}

// ══════════════════════════════════════════════════════════════════════════
// Pass 1 — the editor: feature grid, agent settings, agent mode
// ══════════════════════════════════════════════════════════════════════════
if (!only.length || only.some((n) => n !== 'motif-live')) {
  const { app, page, mcp, invoke, hook, settle } = await launchWin({ project: 'Shots' })
  const { shot, shotClip } = shooter(page)
  const built = await buildDemoTimeline(mcp)
  // A second chroma key, on the opening clip, is what the eyedropper still
  // picks into — the ember clip's own chain is already busy carrying the blur.
  const dawnKey = await mcp.toolId('add_effect', { layer_id: built.layers.dawn, kind: 'chromakey' })
  await settle(1200)
  await growTimeline(page, 300)
  await hook('transportSeekUs', us(2.4))
  await sleep(1500)
  console.log('setup complete')

  // ── Timeline close-up: a clip row and the keyframe lane under it ────────
  if (wanted('timeline-closeup') || wanted('curve-editor')) {
    try {
      // Expand the keyframe lanes on whichever row actually carries keys.
      const twirls = page.locator('[data-testid="kf-lane-twirl"]:not([disabled])')
      const n = await twirls.count()
      for (let i = 0; i < n; i++) {
        await twirls.nth(i).click().catch(() => {})
        await sleep(500)
        if ((await page.locator('.kf-diamond.kf-sublane-diamond').count()) > 0) break
        await twirls.nth(i).click().catch(() => {})
      }
      console.log('kf sublane diamonds:', await page.locator('.kf-diamond.kf-sublane-diamond').count())
      const panel = await page.locator('.weft-dock-panel[data-panel-kind="timeline"]').boundingBox()
      const lane = await page.locator('.kf-diamond.kf-sublane-diamond').first().boundingBox()
      if (panel && lane) {
        // Frame the band that carries the story: the clip row above the keys,
        // the keys themselves and the curve they drive.
        const y = Math.max(panel.y, Math.round(lane.y - 108))
        await shotClip('timeline-closeup', {
          x: Math.round(panel.x),
          y,
          width: Math.round(panel.width),
          height: Math.min(196, Math.round(panel.y + panel.height - y)),
        })
      }
      const dia = page.locator('.kf-diamond.kf-sublane-diamond').nth(1)
      if (await dia.count()) { await dia.click().catch(() => {}); await sleep(600) }
      // Focusing a key seeks to it, and that key is where the B-roll insert is
      // fully opaque — a flat grey frame. Come back to the opening beat, with
      // the animated layer selected so the panel is showing its parameters.
      await page.locator('.timeline-layer[title^="VideoClip: 00:00:02:00"]').first().click().catch(() => {})
      await sleep(500)
      await hook('transportSeekUs', us(2.4))
      await sleep(1200)
      await shot('curve-editor')
    } catch (e) { console.log('timeline shots fail:', String(e).slice(0, 160)) }
  }

  // ── Effects: the ember clip's chain, Effect tab forward ────────────────
  if (wanted('effects')) {
    try {
      await hook('transportSeekUs', us(13.5))
      await sleep(1000)
      const clips = page.locator('.timeline-layer[title^="VideoClip:"]')
      await clips.nth((await clips.count()) - 1).click({ position: { x: 10, y: 20 } })
      await sleep(500)
      await page.locator('.weft-dock-tab-label', { hasText: 'Effect' }).first().click()
      await sleep(900)
      await shot('effects')
    } catch (e) { console.log('effects fail:', String(e).slice(0, 160)) }
  }

  // ── Eyedropper: pick the key colour straight off the program monitor ───
  if (wanted('eyedropper')) {
    try {
      // Before the B-roll insert fades up, so the frame under the loupe is the
      // opening clip itself rather than a half-opaque sandwich.
      await hook('transportSeekUs', us(1.5))
      await sleep(1000)
      // Address the opening clip by its start timecode: DOM order runs
      // top-down, so nth(0) is whatever sits on the topmost lane (the B-roll
      // insert), not the clip that carries the chroma key.
      await page.locator('.timeline-layer[title^="VideoClip: 00:00:00:00"]').first()
        .click({ position: { x: 10, y: 20 } })
      await sleep(600)
      await page.locator('.weft-dock-tab-label', { hasText: 'Effect' }).first().click()
      await sleep(800)
      const pick = page.locator('[data-testid^="effect-colorpick-"]').first()
      if (await pick.count()) {
        await pick.click()
        await sleep(800)
        const prev = await page.locator('.weft-dock-panel[data-panel-kind="preview"]').boundingBox()
        if (prev) await page.mouse.move(prev.x + prev.width * 0.26, prev.y + prev.height * 0.34, { steps: 14 })
        await sleep(900)
        await shot('eyedropper')
        await page.keyboard.press('Escape')
        await sleep(600)
      } else console.log('no colorpick button (dawn key =', dawnKey, ')')
    } catch (e) { console.log('eyedropper fail:', String(e).slice(0, 160)) }
  }

  // ── Captions panel ─────────────────────────────────────────────────────
  if (wanted('captions')) {
    try {
      await hook('transportSeekUs', us(2.4))
      await sleep(900)
      await viewMenu(page, /^Caption$/)
      await sleep(700)
      await shot('captions')
    } catch (e) { console.log('captions fail:', String(e).slice(0, 160)) }
  }

  // ── Ctrl-K palette ─────────────────────────────────────────────────────
  if (wanted('search-palette')) {
    try {
      await page.keyboard.press('Control+k')
      await sleep(900)
      await page.keyboard.type('dawn', { delay: 90 })
      await sleep(1200)
      await shot('search-palette')
      await page.keyboard.press('Escape')
      await sleep(600)
    } catch (e) { console.log('palette fail:', String(e).slice(0, 160)) }
  }

  // ── Export dialog, Video tab, codec list open ──────────────────────────
  if (wanted('export')) {
    try {
      await page.keyboard.press('Control+e')
      await sleep(2000)
      await page.locator('#export-tab-video').click().catch(() => {})
      await sleep(900)
      // The copy on the page names the codecs, so show the codec list itself
      // rather than the one word the closed control happens to display.
      const codec = page.locator('button.export-select', { hasText: /^H\.264$/ }).first()
      if (await codec.count()) { await codec.click(); await sleep(900) }
      else console.log('codec select not found')
      await shot('export')
      await page.keyboard.press('Escape')
      await sleep(500)
      await page.keyboard.press('Escape')
      await sleep(800)
    } catch (e) { console.log('export fail:', String(e).slice(0, 160)) }
  }

  // ── Settings → Agent: the connect panel and the shipped Skill ──────────
  if (wanted('connect-agent')) {
    try {
      await page.keyboard.press('Control+Comma')
      await sleep(1400)
      await page.locator('#settings-tab-agent').click()
      await sleep(1400)
      // The dev build's stdio snippet quotes this workstation's Electron and a
      // mkdtemp user-data dir. Both are artifacts of running from a checkout —
      // an installed WeftCut writes its own exe and roaming path there — so
      // they are rewritten to the installed shape, the same sanitising
      // compose.mjs does to the demo trace's ~/Videos paths.
      await page.evaluate(() => {
        const EXE = 'C:\\\\Users\\\\you\\\\AppData\\\\Local\\\\Programs\\\\WeftCut\\\\WeftCut.exe'
        const DATA = 'C:\\\\Users\\\\you\\\\AppData\\\\Roaming\\\\@weftcut\\\\desktop'
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          if (!n.nodeValue.includes('\\')) continue
          n.nodeValue = n.nodeValue
            .replace(/[A-Za-z]:\\\\?[^"\s]*?electron\.exe/gi, EXE)
            .replace(/[A-Za-z]:\\\\?[^"\s]*?weftcut-site-[A-Za-z0-9]+/gi, DATA)
        }
      })
      await sleep(400)
      await shot('connect-agent')
      await page.keyboard.press('Escape')
      await sleep(800)
    } catch (e) { console.log('connect fail:', String(e).slice(0, 200)) }
  }

  // ── Agent mode, with a real batch of agent moves behind it ─────────────
  if (wanted('agent-mode')) {
    try {
      await hook('transportSeekUs', us(12.6))
      await sleep(800)
      await mcp.tool('checkpoint', { label: 'Pre-agent: assembling the teaser' }).catch(() => {})
      await mcp.tool('begin_agent_session', { reason: 'assembling the teaser' })
      await sleep(1200)
      await mcp.tool('add_marker', { t_us: us(9), label: 'Chorus', color: { r: 250, g: 204, b: 21, a: 255 } })
      await sleep(500)
      await mcp.tool('trim_layer', { layer_id: built.layers.ember, edge: 'out', new_t_us: us(16.4) })
      await sleep(500)
      await mcp.tool('split_layer', { layer_id: built.layers.tide, at_t_us: us(9.2) })
        .catch((e) => console.log('split:', String(e).slice(0, 120)))
      await sleep(500)
      await mcp.tool('add_effect', { layer_id: built.layers.tide, kind: 'blur' }).catch(() => {})
      await sleep(500)
      await mcp.tool('apply_subtitles', {
        body: '1\n00:00:12,400 --> 00:00:15,800\nEvery move lands on your timeline\n',
      }).catch((e) => console.log('subs:', String(e).slice(0, 120)))
      await sleep(500)
      await mcp.tool('add_marker', { t_us: us(14), label: 'Outro', color: { r: 102, g: 150, b: 230, a: 255 } })
      await sleep(1600)
      await shot('agent-mode')
      await invoke('agent_session_end').catch(() => {})
      await sleep(600)
    } catch (e) { console.log('agent mode fail:', String(e).slice(0, 200)) }
  }

  await app.close()
  console.log('pass 1 done')
}

// ══════════════════════════════════════════════════════════════════════════
// Pass 2 — the Motif: one that did not exist before this run, authored
// through the same MCP surface an agent uses, rendering live on the timeline.
// ══════════════════════════════════════════════════════════════════════════
if (wanted('motif-live')) {
  const { app, page, mcp, hook, settle } = await launchWin({ project: 'MotifLive' })
  const { shot } = shooter(page)

  const ids = {}
  for (const n of ['dawn', 'tide', 'ember']) {
    ids[n] = await mcp.toolId('import_media', { path: path.join(MEDIA, `${n}.mp4`) })
  }
  const aRoll = (await listTracks(mcp)).find((t) => t.role === 'ARoll')
  const put = (name, t0, t1, srcIn = 0) =>
    mcp.tool('add_video_layer', {
      track_id: aRoll.id,
      media_id: ids[name],
      t_start_us: us(t0),
      t_end_us: us(t1),
      src_in_us: us(srcIn),
      src_out_us: us(srcIn + (t1 - t0)),
    })
  await put('dawn', 0, 5)
  await put('ember', 5, 11, 1.5)
  await put('tide', 11, 16)

  const manifest = JSON.parse(fs.readFileSync(path.join(HARNESS_DIR, 'motifs', 'ridge-callout.json'), 'utf8'))
  const html = fs.readFileSync(path.join(HARNESS_DIR, 'motifs', 'ridge-callout.html'), 'utf8')
  const draft = await mcp.tool('write_motif_draft', { manifest, html })
  const draftId = typeof draft === 'string' ? draft : (draft?.id ?? draft?.motif_id)
  console.log('motif draft:', draftId)
  await mcp.tool('add_motif', {
    motif_id: draftId,
    t_start_us: us(5.6),
    t_end_us: us(9.6),
    props: { value: 42, kicker: 'SHOTS CUT', headline: 'Aurora Ridge, act one', accent: '#6696E6' },
  })
  await settle(2000)

  await viewMenu(page, 'All Tracks')
  // All Tracks turns the Playhead panel into a "nothing is hidden for this
  // Panel to surface" notice. Close it so the Attribute panel owns the whole
  // column: a draft Motif shows its props AND its source there, which is the
  // point of the still — the agent's code and its render, side by side.
  await page.locator('.weft-dock-tab-label', { hasText: 'Playhead' }).first().click().catch(() => {})
  await sleep(400)
  await viewMenu(page, 'Close Active Panel')
  await growTimeline(page, 260)
  await hook('transportSeekUs', us(6.7))
  await sleep(2500)
  const motifClip = page.locator('.timeline-layer[title^="Motif:"]').first()
  if (await motifClip.count()) { await motifClip.click(); await sleep(1600) }
  else console.log('no motif clip found')
  console.log('attribute panel:', (await page.locator('.weft-dock-panel[data-panel-kind="attribute"]').innerText().catch(() => '')).slice(0, 600))
  // Scroll past LAYER/TRANSFORM to the props the Motif declares and the
  // source the agent wrote, and park the source on its lifecycle block —
  // `motif.define({ setup, frame })` is the part that makes "code as motion"
  // legible at a glance.
  await page.evaluate(() => {
    const panel = document.querySelector('.weft-dock-panel[data-panel-kind="attribute"]')
    for (const el of panel?.querySelectorAll('*') ?? []) {
      if (el.scrollHeight > el.clientHeight + 20 && getComputedStyle(el).overflowY !== 'visible') {
        el.scrollTop = el.scrollHeight
      }
    }
    const ta = panel?.querySelector('textarea.prop-motif-source-text')
    if (ta) {
      const lines = ta.value.split('\n')
      const at = lines.findIndex((l) => l.includes('motif.define'))
      if (at > 0) ta.scrollTop = Math.max(0, (at - 1) * (ta.scrollHeight / lines.length))
    }
  })
  await sleep(1400)
  await shot('motif-live')
  await app.close()
  console.log('pass 2 done')
}
console.log('DONE')
