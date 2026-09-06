#!/usr/bin/env node
// WeftCut site — the documentary pages.
//
// The homepage is an art-directed narrative, and CONTENT.md forbids it the
// literal language that search and retrieval actually feed on: no tool names,
// no protocol plumbing, no tech-stack copy. That rule is right for the
// homepage. These pages exist so it can stay right — same brand, plainer
// voice, one subject each.
//
// Direction of travel is the opposite of build-md.mjs: there, index.html is the
// source and Markdown is derived; here Markdown is the source and HTML is
// derived. Both end with an .md twin beside an .html page, which is all
// worker.js needs to negotiate either one.
//
// The Chinese pages are WRITTEN, not translated. They target a different
// keyword family (see SEO.md), so there is no i18n dictionary here and no
// dependency on build-i18n.mjs — which is hardcoded to index.html anyway.
//
//   node build-pages.mjs            # generate
//   node build-pages.mjs --check    # verify the committed output is current
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, 'pages')
const CHECK = process.argv.includes('--check')
const ORIGIN = 'https://weftcut.com'

const problems = []
const fail = (msg) => problems.push(msg)

// --- frontmatter -------------------------------------------------------------

const REQUIRED = ['slug', 'locale', 'title', 'description', 'keywords']

/** Split `---\nkey: value\n---\n<body>`. Values are plain strings, never YAML. */
function parseSource(text, label) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text)
  if (!match) {
    fail(`${label}: missing --- frontmatter block`)
    return null
  }
  const meta = {}
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue
    const at = line.indexOf(':')
    if (at === -1) {
      fail(`${label}: frontmatter line is not \`key: value\` — ${JSON.stringify(line)}`)
      continue
    }
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  for (const key of REQUIRED) {
    if (!meta[key]) fail(`${label}: frontmatter is missing \`${key}\``)
  }
  return { meta, body: match[2] }
}

// --- inline ------------------------------------------------------------------

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Inline Markdown. Code spans are lifted out before anything else runs, so a
 * `*` or `[` inside one can never be read as emphasis or a link — which is not
 * hypothetical here, the MCP page is full of JSON.
 */
function inline(text, label) {
  const spans = []
  // NUL-delimited rather than a bare ` 0 ` sentinel: this prose says things
  // like "up to 10 bit", and a digit-in-spaces placeholder would swallow the
  // number. Markdown source cannot contain a NUL, so the sentinel can't collide.
  let out = text.replace(/`([^`]+)`/g, (_m, code) => {
    spans.push(code)
    return `\u0000${spans.length - 1}\u0000`
  })

  out = escapeHtml(out)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label_, href) => {
    // Anything leaving the site opens with rel="noopener", same as index.html.
    const external = /^https?:\/\//.test(href) && !href.startsWith(ORIGIN)
    return `<a href="${href}"${external ? ' rel="noopener"' : ''}>${label_}</a>`
  })
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')

  if (/\*/.test(out)) fail(`${label}: unpaired \`*\` survived inline rendering`)
  return out.replace(/\u0000(\d+)\u0000/g, (_m, i) => `<code>${escapeHtml(spans[Number(i)])}</code>`)
}

// --- blocks ------------------------------------------------------------------

/**
 * The block grammar, deliberately small and deliberately strict — same bargain
 * build-md.mjs makes. A construct that isn't handled here fails the build
 * instead of silently rendering as a stray paragraph of literal syntax.
 */
function render(body, label) {
  const lines = body.split('\n')
  const html = []
  const headings = []
  let i = 0

  const flushParagraph = (buf) => {
    if (buf.length) html.push(`<p>${inline(buf.join(' '), label)}</p>`)
    return []
  }

  let paragraph = []
  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      paragraph = flushParagraph(paragraph)
      i++
      continue
    }

    // Fenced code. The info string becomes a language class and nothing else.
    if (line.startsWith('```')) {
      paragraph = flushParagraph(paragraph)
      const lang = line.slice(3).trim()
      const code = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++])
      if (i >= lines.length) fail(`${label}: unclosed code fence`)
      i++
      const cls = lang ? ` class="lang-${lang}"` : ''
      html.push(`<pre${cls}><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    const heading = /^(#{1,3}) (.+)$/.exec(line)
    if (heading) {
      paragraph = flushParagraph(paragraph)
      const level = heading[1].length
      const text = heading[2]
      // Slugs are ASCII-only, so Chinese headings fall back to a positional id
      // rather than a percent-encoded one no one can type or link to.
      const ascii = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const id = ascii || `s${headings.length + 1}`
      headings.push({ level, text, id })
      html.push(`<h${level} id="${id}">${inline(text, label)}</h${level}>`)
      i++
      continue
    }

    if (line.startsWith('> ')) {
      paragraph = flushParagraph(paragraph)
      const quote = []
      while (i < lines.length && lines[i].startsWith('> ')) quote.push(lines[i++].slice(2))
      html.push(`<blockquote><p>${inline(quote.join(' '), label)}</p></blockquote>`)
      continue
    }

    // Tables. The separator row is required — it is what tells a pipe-heavy
    // paragraph from an actual table.
    if (line.startsWith('| ')) {
      paragraph = flushParagraph(paragraph)
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
      if (rows.length < 2 || !/^\|[\s:|-]+\|$/.test(rows[1])) {
        fail(`${label}: table at ${JSON.stringify(line.slice(0, 40))} has no separator row`)
        continue
      }
      const cells = (row) =>
        row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      const head = cells(rows[0]).map((c) => `<th>${inline(c, label)}</th>`).join('')
      const rest = rows
        .slice(2)
        .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c, label)}</td>`).join('')}</tr>`)
        .join('')
      html.push(`<table><thead><tr>${head}</tr></thead><tbody>${rest}</tbody></table>`)
      continue
    }

    const bullet = /^(-|\d+\.) (.+)$/.exec(line)
    if (bullet) {
      paragraph = flushParagraph(paragraph)
      const ordered = bullet[1] !== '-'
      const items = []
      while (i < lines.length) {
        const item = /^(-|\d+\.) (.+)$/.exec(lines[i])
        if (!item || (item[1] !== '-') !== ordered) break
        items.push(item[2])
        i++
        // A following indented line continues the same item.
        while (i < lines.length && /^ {2,}\S/.test(lines[i])) {
          items[items.length - 1] += ' ' + lines[i].trim()
          i++
        }
      }
      const tag = ordered ? 'ol' : 'ul'
      html.push(
        `<${tag}>${items.map((it) => `<li>${inline(it, label)}</li>`).join('')}</${tag}>`
      )
      continue
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      paragraph = flushParagraph(paragraph)
      html.push('<hr />')
      i++
      continue
    }

    if (/^\s/.test(line)) {
      fail(`${label}: unexpected indented line — ${JSON.stringify(line.slice(0, 48))}`)
      i++
      continue
    }

    paragraph.push(line.trim())
    i++
  }
  flushParagraph(paragraph)

  return { html: html.join('\n'), headings }
}

// --- FAQ -> schema -----------------------------------------------------------

/**
 * FAQPage entries are derived from the page's own FAQ section rather than
 * duplicated in frontmatter, so the visible answer and the structured one can
 * never drift. Contract: every `###` under the FAQ `##` is a question, and the
 * paragraphs after it are its answer.
 */
function extractFaq(body, faqHeading) {
  if (!faqHeading) return []
  const section = body.split(new RegExp(`^## ${faqHeading}\\s*$`, 'm'))[1]
  if (section === undefined) return []
  const upTo = section.split(/^## /m)[0]
  const out = []
  const parts = upTo.split(/^### /m).slice(1)
  for (const part of parts) {
    const [question, ...rest] = part.split('\n')
    const answer = rest.join('\n').trim().split(/\n\s*\n/)[0]
    if (question.trim() && answer) {
      out.push({ q: question.trim(), a: answer.replace(/\s*\n\s*/g, ' ').trim() })
    }
  }
  return out
}

/** Strip the inline Markdown that has no meaning inside a JSON string. */
const plain = (s) =>
  s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

// --- page --------------------------------------------------------------------

// The appbar's own links. Order is fixed and MCP leads: it is the page the
// other two explain themselves against. A page linking to itself is kept in the
// list rather than dropped, so the bar doesn't reflow between pages — it is
// marked aria-current instead.
const DOC_NAV = [
  { slug: 'mcp', en: 'MCP', zh: 'MCP' },
  { slug: 'ai-video-editor', en: 'AI video editor', zh: 'AI 剪辑' },
  { slug: 'motifs', en: 'Motifs', zh: 'Motif' },
]

// Copied from index.html rather than shared: these two glyphs are the whole
// reason the appbar reads as the same bar, and the homepage's markup is the
// only definition of them there is.
const GLOBE_SVG =
  '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.15"><circle cx="8" cy="8" r="6.2"/><ellipse cx="8" cy="8" rx="2.65" ry="6.2"/><path d="M2.2 5.9h11.6M2.2 10.1h11.6"/></svg>'
const GH_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.6-.18-3.29-.82-3.29-3.56 0-.79.28-1.43.74-1.93-.07-.18-.32-.91.07-1.9 0 0 .6-.19 1.97.74A6.8 6.8 0 0 1 8 3.8a6.8 6.8 0 0 1 1.79.24c1.37-.93 1.97-.74 1.97-.74.39.99.14 1.72.07 1.9.46.5.74 1.14.74 1.93 0 2.75-1.69 3.38-3.3 3.56.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>'

const CHROME = {
  en: {
    brandAria: 'WeftCut — home',
    switchHref: (slug) => `/zh/${slug}/`,
    switchLang: 'zh-Hans',
    switchAria: '切换到简体中文',
    switchTitle: '简体中文',
    navLabel: 'Pages',
    docs: 'Docs',
    backHome: 'Back to weftcut.com',
    licence: 'App licensed MIT. Bundles FFmpeg (LGPL decode libs / GPL CLI sidecar).',
    copyright: '© 2026 WeftCut contributors',
    breadcrumb: 'Home',
  },
  zh: {
    brandAria: 'WeftCut — 返回首页',
    switchHref: (slug) => `/${slug}/`,
    switchLang: 'en',
    switchAria: 'Switch to English',
    switchTitle: 'English',
    navLabel: '页面',
    docs: '文档',
    backHome: '返回 weftcut.com',
    licence: '应用以 MIT 许可开源，随附 FFmpeg（LGPL 解码库 / GPL 命令行组件）。',
    copyright: '© 2026 WeftCut 贡献者',
    breadcrumb: '首页',
  },
}

function buildPage({ meta, body }, label) {
  const { slug, locale } = meta
  const chrome = CHROME[locale]
  if (!chrome) {
    fail(`${label}: unknown locale ${JSON.stringify(locale)}`)
    return null
  }

  const enUrl = `${ORIGIN}/${slug}/`
  const zhUrl = `${ORIGIN}/zh/${slug}/`
  const selfUrl = locale === 'en' ? enUrl : zhUrl
  const selfPath = locale === 'en' ? `/${slug}/` : `/zh/${slug}/`
  const homeHref = locale === 'en' ? '/' : '/zh/'
  const lang = locale === 'en' ? 'en' : 'zh-Hans'

  const { html } = render(body, label)
  const faq = extractFaq(body, meta.faq)

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: plain(meta.title),
      description: plain(meta.description),
      url: selfUrl,
      inLanguage: lang,
      keywords: meta.keywords,
      isPartOf: { '@type': 'WebSite', name: 'WeftCut', url: `${ORIGIN}/` },
      // Every page points back at the one node that describes the product, so
      // an assistant reading any of them lands on the same entity.
      about: { '@id': `${ORIGIN}/#weftcut` },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: chrome.breadcrumb, item: locale === 'en' ? `${ORIGIN}/` : `${ORIGIN}/zh/` },
          { '@type': 'ListItem', position: 2, name: plain(meta.h1 || meta.title), item: selfUrl },
        ],
      },
    },
  ]

  if (faq.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: plain(q),
        acceptedAnswer: { '@type': 'Answer', text: plain(a) },
      })),
    })
  }

  const head = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(plain(meta.title))}</title>
<meta name="description" content="${escapeHtml(plain(meta.description))}" />
<link rel="canonical" href="${selfUrl}" />
<link rel="alternate" hreflang="en" href="${enUrl}" />
<link rel="alternate" hreflang="zh-Hans" href="${zhUrl}" />
<link rel="alternate" hreflang="x-default" href="${enUrl}" />
<link rel="alternate" type="text/markdown" href="${selfPath}index.md" />
<meta name="theme-color" content="#0c0e12" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="WeftCut" />
<meta property="og:locale" content="${locale === 'en' ? 'en_US' : 'zh_CN'}" />
<meta property="og:title" content="${escapeHtml(plain(meta.title))}" />
<meta property="og:description" content="${escapeHtml(plain(meta.description))}" />
<meta property="og:url" content="${selfUrl}" />
<meta property="og:image" content="${ORIGIN}/assets/og/card-${locale}.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(plain(meta.title))}" />
<meta name="twitter:description" content="${escapeHtml(plain(meta.description))}" />
<meta name="twitter:image" content="${ORIGIN}/assets/og/card-${locale}.png" />
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="/pages.css" />
${ld.map((node) => `<script type="application/ld+json">\n${JSON.stringify(node, null, 2)}\n</script>`).join('\n')}
</head>
<body>
<header class="doc-nav">
  <div class="doc-wrap doc-nav-in">
    <a class="doc-brand" href="${homeHref}" aria-label="${chrome.brandAria}">
      <img src="/assets/icon.svg" alt="" width="26" height="26" />
      <span>WeftCut</span>
    </a>
    <nav class="doc-links" aria-label="${chrome.navLabel}">
${DOC_NAV.map((item) => {
  const href = `${locale === 'en' ? '/' : '/zh/'}${item.slug}/`
  const current = item.slug === slug ? ' aria-current="page"' : ''
  return `      <a href="${href}"${current}>${item[locale]}</a>`
}).join('\n')}
    </nav>
    <a class="doc-lang" href="${chrome.switchHref(slug)}" hreflang="${chrome.switchLang}" lang="${chrome.switchLang}" aria-label="${chrome.switchAria}" title="${chrome.switchTitle}">${GLOBE_SVG}</a>
    <a class="doc-gh" href="https://github.com/WeftCut/WeftCut" rel="noopener">${GH_SVG}<span>GitHub</span></a>
  </div>
</header>
<main class="doc-wrap doc-body">
${html}
</main>
<footer class="doc-foot">
  <div class="doc-wrap">
    <p><a href="${homeHref}">${chrome.backHome}</a> · <a href="https://github.com/WeftCut/WeftCut/tree/main/docs" rel="noopener">${chrome.docs}</a></p>
    <p>${chrome.licence}</p>
    <p>${chrome.copyright}</p>
  </div>
</footer>
</body>
</html>
`
  return { html: head, markdown: body.trim() + '\n', path: selfPath }
}

// --- run ---------------------------------------------------------------------

if (!existsSync(SRC)) {
  console.error('build-pages: no pages/ directory')
  process.exit(1)
}

const sources = readdirSync(SRC).filter((f) => f.endsWith('.md')).sort()
const written = []
let stale = 0

for (const file of sources) {
  const label = `pages/${file}`
  const parsed = parseSource(readFileSync(join(SRC, file), 'utf8'), label)
  if (!parsed) continue

  // The filename is the contract: <slug>.<locale>.md. Checking it here is what
  // stops a rename from silently publishing to the wrong URL.
  const expected = `${parsed.meta.slug}.${parsed.meta.locale}.md`
  if (file !== expected) fail(`${label}: frontmatter says it should be named ${expected}`)

  const page = buildPage(parsed, label)
  if (!page) continue

  for (const [rel, body] of [['index.html', page.html], ['index.md', page.markdown]]) {
    const out = join(ROOT, page.path.slice(1), rel)
    const current = existsSync(out) ? readFileSync(out, 'utf8') : null
    if (current === body) continue
    if (CHECK) {
      console.error(`✗ ${page.path}${rel} is stale — run: node build-pages.mjs`)
      stale++
      continue
    }
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, body)
  }
  written.push(page.path)
}

if (problems.length) {
  for (const problem of problems) console.error(`✗ ${problem}`)
  process.exit(1)
}
if (stale) process.exit(1)

console.log(
  CHECK
    ? `✓ ${written.length} pages are current`
    : `✓ wrote ${written.length} pages — ${written.join(', ')}`
)
