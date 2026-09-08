// Shoot the hero's download CTA in each platform state it can reach.
//
// Platform detection is the one thing on this page a single screenshot can't
// review: the served HTML shows the fallback, and every other state depends on
// what the browser reports. So each state is faked at the navigator level —
// userAgent, platform, maxTouchPoints and the high-entropy architecture hint —
// and shot separately.
//
//   npm start &                                   # serve.mjs on :8080
//   node .work/harness/download-shots.mjs
//   node .work/harness/download-shots.mjs http://127.0.0.1:8080/zh/ zh
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://127.0.0.1:8080/'
const tag = process.argv[3] ?? 'en'
const OUT = '.work/review/download/state'
const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const CHROME_LINUX = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

// architecture: null leaves getHighEntropyValues undefined, i.e. a browser that
// won't say — Safari and Firefox, and the reason the first pass has to guess.
const STATES = [
  // Chromium freezes navigator.platform and the UA's CPU tokens (Linux always
  // "x86_64", Windows always "Win64; x64"), so its states carry the truth in
  // the hints only. Firefox states have no userAgentData and speak through
  // the string.
  { name: 'windows', platform: 'Win32', ua: CHROME_WIN, hint: 'Windows', architecture: 'x86', bitness: '64' },
  { name: 'windows-arm', platform: 'Win32', ua: CHROME_WIN, hint: 'Windows', architecture: 'arm', bitness: '64' },
  { name: 'windows-32', platform: 'Win32', ua: CHROME_WIN, hint: 'Windows', architecture: 'x86', bitness: '32' },
  { name: 'windows-32-ff', platform: 'Win32', ua: 'Mozilla/5.0 (Windows NT 10.0; rv:141.0) Gecko/20100101 Firefox/141.0', architecture: null },
  { name: 'windows-wow64-ff', platform: 'Win32', ua: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:141.0) Gecko/20100101 Firefox/141.0', architecture: null },
  { name: 'macos-arm', platform: 'MacIntel', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', architecture: null },
  { name: 'macos-intel', platform: 'MacIntel', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', hint: 'macOS', architecture: 'x86', bitness: '64' },
  { name: 'linux-x64', platform: 'Linux x86_64', ua: CHROME_LINUX, hint: 'Linux', architecture: 'x86', bitness: '64' },
  { name: 'linux-arm', platform: 'Linux x86_64', ua: CHROME_LINUX, hint: 'Linux', architecture: 'arm', bitness: '64' },
  { name: 'linux-arm-ff', platform: 'Linux aarch64', ua: 'Mozilla/5.0 (X11; Linux aarch64; rv:141.0) Gecko/20100101 Firefox/141.0', architecture: null },
  { name: 'linux-i686-ff', platform: 'Linux i686', ua: 'Mozilla/5.0 (X11; Linux i686; rv:141.0) Gecko/20100101 Firefox/141.0', architecture: null },
  { name: 'android', platform: 'Linux armv8l', ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', hint: 'Android', architecture: 'arm', bitness: '64', touch: 5, viewport: { width: 412, height: 915 } },
  { name: 'ipad', platform: 'MacIntel', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', architecture: null, touch: 5, viewport: { width: 834, height: 1112 } },
]

const browser = await chromium.launch()

for (const state of STATES) {
  const ctx = await browser.newContext({
    userAgent: state.ua,
    deviceScaleFactor: 2,
    viewport: state.viewport ?? { width: 1440, height: 900 },
  })
  await ctx.addInitScript(
    ([platform, hint, architecture, bitness, touch]) => {
      Object.defineProperty(navigator, 'platform', { get: () => platform })
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => touch })
      if (hint) {
        Object.defineProperty(navigator, 'userAgentData', {
          get: () => ({
            platform: hint,
            getHighEntropyValues: architecture
              ? async () => ({ architecture, bitness })
              : undefined,
          }),
        })
      } else {
        // Safari and Firefox expose no userAgentData at all.
        Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
      }
    },
    [state.platform, state.hint, state.architecture, state.bitness ?? null, state.touch ?? 0]
  )
  const page = await ctx.newPage()
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(600)

  const cta = page.locator('#downloadButton')
  console.log(
    `${state.name.padEnd(12)} ${(await cta.textContent()).trim().padEnd(24)} → ${await cta.getAttribute('href')}`
  )
  console.log(`             note: ${(await page.locator('#downloadNote').textContent()).trim() || '(empty)'}`)
  const hidden = await page.locator('.dl-list li[hidden]').evaluateAll((els) => els.map((el) => el.dataset.target))
  console.log(`             list hides: ${hidden.join(', ') || '(nothing)'}`)

  await page.locator('.dl-menu').evaluate((el) => { el.open = true })
  await page.waitForTimeout(200)
  await page.locator('.hero').screenshot({ path: `${OUT}-${tag}-${state.name}.png` })
  await ctx.close()
}

await browser.close()
console.log(`done → ${OUT}-${tag}-*.png`)
