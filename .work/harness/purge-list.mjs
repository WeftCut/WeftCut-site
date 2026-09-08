// Which deployed URLs need a manual cache purge after a `_headers` edit.
//
// Assets are cached `max-age=0, must-revalidate` and the edge revalidates by
// ETag, which is computed over the body — so a path whose body is byte-identical
// revalidates 304 and keeps Cloudflare's *stored* header set, including the
// header just fixed. A path whose body changed in the same deploy picks the new
// headers up on its own, and needs nothing.
//
// So the list worth purging is: path blocks whose header set changed, minus the
// paths whose body changed too, minus the patterns that aren't fetchable URLs
// (`/*`, `/assets/*`, the `:skill` placeholder — Cloudflare's Custom Purge takes
// literal URLs).
//
//   node .work/harness/purge-list.mjs            # working tree vs HEAD
//   node .work/harness/purge-list.mjs origin/main
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const base = process.argv[2] ?? 'HEAD'
const ORIGIN = 'https://weftcut.com'
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })

/** `_headers` as { "/path": "its header lines" }. Comments and blanks dropped. */
function parseHeaders(text) {
  const blocks = new Map()
  let path = null
  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue
    if (!raw.startsWith(' ') && !raw.startsWith('\t')) {
      path = raw.trim()
      blocks.set(path, [])
    } else if (path) {
      blocks.get(path).push(raw.trim())
    }
  }
  return new Map([...blocks].map(([p, lines]) => [p, lines.join('\n')]))
}

const now = parseHeaders(readFileSync(join(ROOT, '_headers'), 'utf8'))
const then = parseHeaders(git('show', `${base}:_headers`))

// Repo files changed against `base`, as the URL each is served at. Cloudflare
// resolves a directory URL to its index.html, so both spellings count.
const changedBodies = new Set(
  git('diff', '--name-only', base)
    .split('\n')
    .filter(Boolean)
    .flatMap((f) => {
      const url = '/' + f.replaceAll('\\', '/')
      return url.endsWith('/index.html') ? [url, url.slice(0, -'index.html'.length)] : [url]
    })
)

// Custom Purge needs a literal URL; these three can't be one.
const fetchable = (path) => !path.includes('*') && !path.includes(':')

const rows = [...now].map(([path, headers]) => ({
  path,
  headersChanged: then.get(path) !== headers,
  bodyChanged: changedBodies.has(path),
  fetchable: fetchable(path),
}))

const needPurge = rows.filter((r) => r.headersChanged && !r.bodyChanged && r.fetchable)
const selfHealing = rows.filter((r) => r.headersChanged && r.bodyChanged)
const unpurgeable = rows.filter((r) => r.headersChanged && !r.bodyChanged && !r.fetchable)

console.log(
  `_headers: ${rows.length} path block(s), ${rows.filter((r) => r.headersChanged).length} changed vs ${base}.`
)
if (selfHealing.length) {
  console.log(`\n${selfHealing.length} pick the new headers up unaided (body changed too):`)
  for (const r of selfHealing) console.log('  ' + r.path)
}
if (unpurgeable.length) {
  console.log(`\n${unpurgeable.length} changed but aren't literal URLs — purge by hostname if it matters:`)
  for (const r of unpurgeable) console.log('  ' + r.path)
}
if (!needPurge.length) {
  console.log('\nNothing to purge.')
} else {
  console.log(`\n${needPurge.length} URL(s) keep the old header set until purged:\n`)
  for (const r of needPurge) console.log(ORIGIN + r.path)
  console.log(
    '\nCloudflare → Caching → Configuration → Purge Cache → Custom Purge.' +
      '\nConfirm the new rule is live first with a cache-busted query, e.g. ?cb=1.'
  )
}
