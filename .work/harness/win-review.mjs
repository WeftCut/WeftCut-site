// WIN REVIEW — screenshot the built page's scenes, and the lightbox open, so
// a capture run can be checked in place rather than as loose files.
//
//   npm start   (in another shell)
//   node .work/harness/win-review.mjs [http://127.0.0.1:8080/]
import path from 'node:path'
import { chromium } from 'playwright'
import { REVIEW_OUTPUT, ensureDirectories } from './config.mjs'

const URL = process.argv[2] ?? 'http://127.0.0.1:8080/'
ensureDirectories(REVIEW_OUTPUT)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '.rv{opacity:1!important;transform:none!important}' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const shotSection = async (id, name) => {
  const el = page.locator(`#${id}`)
  await el.scrollIntoViewIfNeeded()
  await sleep(900)
  await el.screenshot({ path: path.join(REVIEW_OUTPUT, `${name}.png`) })
  console.log('shot', name)
}
await shotSection('agent', 'scene01')
await shotSection('motifs', 'scene02')
await shotSection('editor', 'scene03')

// Lightbox: open the first Scene 03 still and shoot the whole viewport.
const img = page.locator('#editor .fcard .film img').nth(1)
await img.scrollIntoViewIfNeeded()
await sleep(400)
await img.click()
await sleep(700)
await page.screenshot({ path: path.join(REVIEW_OUTPUT, 'lightbox.png') })
console.log('lightbox open:', await page.locator('.lightbox').count())
await page.keyboard.press('Escape')
await sleep(400)
console.log('lightbox after Escape:', await page.locator('.lightbox').count())
await browser.close()
console.log('DONE →', REVIEW_OUTPUT)
