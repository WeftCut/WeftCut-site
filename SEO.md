# WeftCut site — SEO & GEO working notes

Working notes, like README.md and CONTENT.md. Deliberately absent from
`build-dist.mjs`'s SHIP allowlist, so it never answers a public GET.

## The bet, and what it gives up

**GEO first, long-tail SEO second.** Head terms are conceded on purpose.

`ai video editor` and `ai video editing software` belong to Adobe, CapCut,
Descript, Runway, Veed and Canva — each with a dedicated page, years of
authority and thousands of referring domains. weftcut.com was registered in
2026 and has no inbound links. Chasing those terms would buy nothing for at
least a year. They appear on the site as *word surface* so a retrieval system
can match them; they are not ranking targets.

The winnable middle is `MCP video editor`, `claude video editing`,
`open source AI video editor`, `offline AI video editing` — and, in Chinese,
the genuinely high-volume 「AI剪辑」 family.

**`agent cut` / `agent-native` are positioning, not keywords.** Near-zero search
demand in any language. They stay in the copy because owning an uncontested
phrase is free upside in an LLM's answer space, but no traffic forecast depends
on anyone searching for them.

### The part that actually limits us

GEO has two layers, and they are not the same problem:

1. **Legibility** — can an agent read the page. This site is close to the
   ceiling already: `llms.txt` per locale, `Accept: text/markdown` negotiation
   in `worker.js`, RFC 9727 api-catalog, MCP server card, agent-skills, three
   (now four) JSON-LD nodes, WebMCP tools in `index.js`. Further polish here has
   almost no marginal return.
2. **Corroboration** — has a model seen the product *somewhere else*. Here we
   are at zero: no release, no stars at the time of writing, no registry
   listing, no mention anywhere.

`llms.txt` serves an agent that already has the URL. It does not help anyone
find us. **Every remaining unit of GEO effort belongs to layer 2**, which is
mostly off-site and mostly gated on shipping v1.

## Keyword matrix

Tiers are by winnability, not by volume. T1 is uncontested and low-volume; T2
is where the real demand is; T4 is incidental capture.

### English

| Tier | Landing page | Terms |
| --- | --- | --- |
| T1 — uncontested, high intent | `/mcp` | `MCP video editor` · `video editor MCP server` · `MCP server for video editing` · `Claude video editing` · `edit video with Claude` · `Cursor video editing` · `AI agent video editor` · `control video editor with AI` |
| T2 — real volume, long tail reachable | `/ai-video-editor` | `open source AI video editor` · `free AI video editor` · `AI video editor no watermark` · `local AI video editing` · `offline AI video editor` · `AI video editor Linux` · `AI video editor no subscription` |
| T3 — category we own outright | `/motifs` | `animated lower third` · `countdown overlay video` · `programmatic motion graphics` · `code-driven video overlay` · `reusable overlay template` |
| T4 — incidental, no dedicated page | homepage + wherever true | `10-bit AV1 export` · `ProRes export on Windows` · `ProRes on Linux` · `DNxHR export` · `free chroma key video editor` · `SRT VTT ASS subtitle editor` · `bézier keyframe curve editor` · `open source NLE` |
| Brand — no traffic forecast | site-wide phrasing | `agent-native video editor` · `agent cut` |
| Conceded — surface only | — | `ai video editor` · `ai video editing software` · `ai video editing tool` |

### Chinese — deliberately *not* a mirror

「AI剪辑」 has real search volume that `ai cut` does not. The zh page targets its
own demand rather than translating ours, and the competitive field (剪映, 必剪)
leaves an open-source / no-watermark / nothing-leaves-your-machine gap we
genuinely fill.

| Tier | Landing page | Terms |
| --- | --- | --- |
| T1 | `/zh/mcp` | MCP 视频剪辑 · MCP 剪辑 · Claude 剪视频 · AI Agent 剪辑 · 智能体剪辑 · Cursor 剪视频 |
| T2 — the main battleground | `/zh/ai-video-editor` | **AI剪辑 · AI视频剪辑 · AI剪辑软件** · AI剪辑工具 · 开源剪辑软件 · 开源视频剪辑 · 免费剪辑软件无水印 · **剪映替代** · 本地AI剪辑 · 离线剪辑 · 不上传云端 |
| T3 | `/zh/motifs` | 动态字幕条 · 下三分之一 · 倒计时动画 · 可复用动效模板 |
| T4 | homepage | 10bit AV1 导出 · ProRes 导出 · 非线性剪辑软件 · Linux 视频剪辑软件 · Mac 免费剪辑软件 |

Two terms are worth more than their volume because each is *also* a true
differentiator: `offline AI video editing` / 「本地AI剪辑」 (no bundled models,
analysis runs locally) and 「剪映替代」 (open source, no watermark, nothing
uploaded).

## Site structure

Two indexable URLs became eight. The homepage is not a keyword target: it is an
art-directed narrative whose own spec (`CONTENT.md`) forbids the literal,
mechanical language search and retrieval feed on — "no tool/function names, no
protocol plumbing, no tech-stack section in visible copy". That rule is right
for the homepage. The new pages exist so it can stay right.

| URL | Voice | Source |
| --- | --- | --- |
| `/`, `/zh/` | cinematic, per CONTENT.md | `index.html` + `i18n/zh.json` |
| `/mcp`, `/zh/mcp` | plain, documentary | `pages/*.md` → `build-pages.mjs` |
| `/ai-video-editor`, `/zh/…` | plain, documentary | same |
| `/motifs`, `/zh/motifs` | plain, documentary | same |

The zh pages are **written, not translated**, so they do not go through
`build-i18n.mjs` — which is hardcoded to a single source file anyway
(`SOURCE = index.html`) and would need reworking to serve more.

## Done (batch 1)

- Homepage `<title>` / `description` / OG / Twitter rewritten for word surface.
  Visible copy, layout, animation and narrative untouched.
  - en: `WeftCut — Open Source AI Video Editor for MCP Agents`
  - zh: `WeftCut — 免费开源的 AI 视频剪辑软件，支持 Claude 等 AI Agent`
- `SoftwareApplication` gained `keywords` (localized per page) and an `author`.
- New `SoftwareSourceCode` node — "is it really open source" is the fact most
  often asked of this product and the one that most needs corroborating outside
  marketing prose. Languages are the repo's real top two, not an aspiration.
- Epilogue CTA no longer links to `/releases/latest`, which 404s until v1. It
  now degrades to the same `btn-pending` span the hero already used.
- Both `llms.txt` carry the alias terms a retrieval system may match on.
- Product repo: description rewritten, 20 topics added (it had none).

## Done (batch 2)

- `build-pages.mjs` — Markdown to HTML, zero dependencies, strict grammar. It
  emits both `<slug>/index.html` and the `.md` twin beside it, so content
  negotiation works on the new routes with no extra step.
- Six pages written: `/mcp/`, `/ai-video-editor/`, `/motifs/` and their Chinese
  counterparts. FAQPage schema is *derived from* each page's own FAQ section
  rather than restated in frontmatter, so the visible answer and the structured
  one cannot drift.
- `pages.css` — standalone. It does not share `index.css`, partly for weight and
  partly because that file's WenKai webfont is an exact subset of the homepage's
  Chinese headings: any new hanzi would have rendered as .notdef.
- Wired through `build-sitemap.mjs` (now 8 URLs, with a per-page hreflang group
  rather than one global set), `build-dist.mjs`, `worker.js`, `wrangler.jsonc`,
  `_headers` (12 blocks) and both `llms.txt`.
- `.well-known/api-catalog` now lists `/mcp/` as a `service-doc` ahead of the
  GitHub copy.

- The pages carry the homepage's appbar — same blur, same brand lockup, same two
  pill shapes, numbers copied from `index.css` rather than approximated — plus a
  middle section linking across all three, so the set is navigable without
  returning to the homepage. The current page stays in the bar and is marked
  `aria-current` rather than dropped, so the bar never reflows between pages.

### Still open

**The homepage does not link out to them.** The three pages link to each other
through the appbar and back to `/` through the brand, and the sitemap lists all
eight URLs — so they will be indexed. But no link points *from* the homepage
*to* them, which is the direction that passes the most signal. Fixing it means
touching the homepage's visible chrome, which is out of scope by agreement.

**Not visually verified.** No browser is installed on the build machine, so
`pages.css` has never been rendered. It has been checked by reading, not by
looking. `npm start`, then `http://127.0.0.1:8080/mcp/`.

## Off-site — the part that actually moves GEO

### Now, no release required

- [x] GitHub topics + description
- [ ] Product repo README: lead paragraph should open with the same
      "free, open-source AI video editor" phrasing as the site
- [ ] Repo social preview image (Settings → Social preview) — reuse
      `assets/og/card-en.png`
- [ ] Google Search Console + Bing Webmaster verification (DNS TXT, or a static
      file — do **not** add a verification script tag)
- [x] IndexNow key published at the host root, listed in `build-dist.mjs`'s SHIP
      allowlist. Reaches Bing, Yandex, Seznam, Naver — **not Google**, which
      never adopted the protocol, so Search Console stays a separate errand.
- [ ] Cloudflare **Crawler Hints** (Caching → Configuration): the automatic half
      of the same protocol, free on every plan, one toggle. Worth having, but it
      fires when Cloudflare observes content *change* — a freshness signal, not
      a discovery one. On a site nobody has crawled yet it does nothing, which
      is why the seed below is a separate step.
- [ ] One-time seed: POST all eight sitemap URLs to `api.indexnow.org` once the
      key file is live. Deliberately not scripted in the repo — Crawler Hints
      covers every subsequent change, so this runs exactly once.
- [ ] DNSSEC, per README's outstanding list — unrelated to SEO but a trust
      signal that costs one dashboard visit

### After v1 ships

Ordered by authority-per-hour. Verify each still exists at submission time; the
MCP directory ecosystem moves fast.

- [ ] `modelcontextprotocol/servers` community list (PR) — highest authority
- [ ] MCP directories: mcp.so, glama.ai, smithery.ai, PulseMCP
- [ ] `awesome-mcp-servers`; awesome-video / awesome-electron where it fits
- [ ] AlternativeTo — the listing that captures "CapCut alternative" / 「剪映替代」
- [ ] Package managers: Homebrew cask, AUR, Flathub. High-authority backlinks
      *and* how Linux users actually find editors
- [ ] Show HN; r/editors, r/linux, r/ClaudeAI
- [ ] Chinese: 少数派, V2EX, 掘金, 知乎, B站

## Measurement

No front-end analytics. Nothing is added to the page.

**Crawl (leading indicator).** Cloudflare request analytics already sees what a
JS beacon never could: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot`,
`Google-Extended`, `Bingbot`. For this site — where a real share of readers are
agents — that is the more informative dataset. Watch for the Markdown twin being
negotiated (`Content-Location: /index.md`), which means an agent read the page
the way it was meant to.

**Search.** Search Console and Bing Webmaster, verified by DNS or static file.

**GEO (lagging indicator).** No automated method exists. Run the probe set
below by hand, monthly, against Claude, ChatGPT and Perplexity. Record: date,
model, whether WeftCut appeared at all, whether it was cited with a URL, and
which URL. The interesting signal is the *first* month it appears unprompted.

### Probe set — English

1. What open source video editors can an AI agent control?
2. Is there an MCP server for video editing?
3. How can I edit video with Claude?
4. What's a free AI video editor that doesn't upload my footage?
5. Open source alternatives to Descript or CapCut with AI features
6. Can Claude Desktop edit a video timeline?

### Probe set — Chinese

1. 有哪些开源的 AI 剪辑软件？
2. 能不能用 Claude 剪视频？
3. 有没有支持 MCP 的视频剪辑软件？
4. 剪映有什么开源替代品？
5. 有没有不上传云端、在本地跑的 AI 剪辑工具？
