---
name: blog-cover-generator
description: Use when a blog post at resources/blog/posts/{slug}.md needs a cover image built at public/blog-assets/{slug}/cover.jpg. Builds the gradient + title + icon-badge + footer template used across harun.dev/blog posts and renders it at exactly 1600x840. Not for writing post body content or picking which post to cover.
---

# blog-cover-generator

Builds a `cover.jpg` that matches the site's existing cover convention: a
diagonal gradient background, the post title centered in bold white type, a
row of colored icon badges for the post's tech stack, and a footer bar with
the site domain and social handle. No stock photos, no AI-generated art —
it's a rendered HTML/CSS composite, same as the rest of the blog's covers.

## Before building

Look at 2-3 recent `public/blog-assets/*/cover.jpg` files to catch drift in
the convention (colors already in heavy rotation, footer wording, badge
count). Pay attention to which gradient colors the last few posts used —
pick something that doesn't repeat the immediately preceding post.

## Template structure

Fixed 1600x840 canvas, four layers:

1. **Background** — `linear-gradient(135deg, <dark> 0%, <mid> 45%, <accent> 100%)`.
   Pick colors that fit the post's topic (e.g. AWS-orange-adjacent for infra
   posts, cooler teal/indigo for AI posts) but keep the dark-to-mid-to-accent
   diagonal structure.
2. **Title** — centered, bold (weight 800), ~54px, white, `line-height: 1.28`,
   positioned around `top: 190px`. Use the post's exact frontmatter `title`
   (including any colon subtitle), manually wrapped with `<br>` into 2-4
   roughly balanced lines (~20-30 characters per line).
3. **Icon badges** — a centered flex row around `top: 520px`, 80x80px rounded
   squares (`border-radius: 14px`), one per core technology in the post,
   3-5 badges total. See the icon library below.
4. **Footer** — bottom bar (`bottom: 40px`, `left/right: 60px`), globe icon +
   `harun.dev` bottom-left, X/LinkedIn/Facebook glyphs + `@HarunRRayhan`
   bottom-right. **Always `harun.dev`** — the old `blog.harun.dev` subdomain
   now redirects to it, so never use it in a new cover.

## Icon library (color + glyph conventions observed on the site)

Reuse these when the post covers the same technology, so badges stay
recognizable across posts:

- **AWS Lambda** — orange `#ec7211` square, white bold serif `&lambda;` (λ)
  character rendered as text, not a hand-drawn path (a symmetric triangle
  reads as a Latin "A", not lambda).
- **Amazon Bedrock** — magenta `#e5197f` square, a node/circuit SVG (4 outer
  circles connected by lines to a center circle) — distinct from a generic
  "AI" glyph.
- **Fastify** — near-black `#111111` square, a bolt/lightning SVG path.
- **Validation / security-check** — emerald `#0f9d78` square, a shield
  outline with a checkmark inside.
- **General "AI"** — teal/green square, a brain-or-circuit glyph (keep it
  visually distinct from the Bedrock node icon).
- **Terraform** — purple square, the Terraform "T" mark or a stacked-layers
  glyph.
- **IAM / lock-down** — darker purple or near-black square, a padlock glyph.
- **S3** — green square, a bucket glyph.
- **DynamoDB** — indigo/blue square, a stacked-disks glyph.

For any technology not in this list, design a new simple line-art SVG
(stroke-width 2.2-2.8, white stroke or fill, viewBox 40-44) in a color not
already used by the other badges in the same cover, and add it to this list
so later covers stay consistent.

Reference implementation of the badge markup (Lambda + Bedrock shown, same
pattern for the rest):

```html
<div class="badge" style="background:#ec7211;">
  <span style="font-size:46px; font-weight:700; color:#fff; font-family: Georgia, 'Times New Roman', serif;">&lambda;</span>
</div>
<div class="badge" style="background:#e5197f;">
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="10" cy="10" r="3.4" stroke="#fff" stroke-width="2.4"/>
    <circle cx="34" cy="10" r="3.4" stroke="#fff" stroke-width="2.4"/>
    <circle cx="10" cy="34" r="3.4" stroke="#fff" stroke-width="2.4"/>
    <circle cx="34" cy="34" r="3.4" stroke="#fff" stroke-width="2.4"/>
    <circle cx="22" cy="22" r="4.2" stroke="#fff" stroke-width="2.4"/>
    <line x1="12.8" y1="11.6" x2="19" y2="19" stroke="#fff" stroke-width="2.2"/>
    <line x1="31.2" y1="11.6" x2="25" y2="19" stroke="#fff" stroke-width="2.2"/>
    <line x1="12.8" y1="32.4" x2="19" y2="25" stroke="#fff" stroke-width="2.2"/>
    <line x1="31.2" y1="32.4" x2="25" y2="25" stroke="#fff" stroke-width="2.2"/>
  </svg>
</div>
```

Full working template (background, title, badges, footer) is at
`references/cover-template.html` in this skill directory — copy it, swap the
gradient/title/badges, keep the footer as-is.

## Render process

Playwright's `browser_navigate` blocks `file://` URLs, and its screenshot
tool only writes inside the repo (`.playwright-mcp/` or repo root) — so the
render has to go through a local HTTP server:

1. Write the filled-in template to a scratch `.html` file.
2. Serve its directory: `python3 -m http.server <port> &` (background it,
   pick a free port, run it from the scratch dir so the URL is just
   `cover-template.html`).
3. Load the deferred Playwright tools if not already available:
   `ToolSearch("select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_resize,mcp__plugin_playwright_playwright__browser_take_screenshot")`.
4. `browser_resize` to exactly `1600x840`.
5. `browser_navigate` to `http://127.0.0.1:<port>/cover-template.html`.
6. `browser_take_screenshot` with `type: "jpeg"`, `scale: "css"`,
   `fullPage: false`, saved to `.playwright-mcp/cover-render.jpg` (must be
   inside the tool's allowed roots — repo root or `.playwright-mcp/`).
7. Confirm the output is exactly 1600x840 with `file cover-render.jpg`.
8. Copy it to `public/blog-assets/{slug}/cover.jpg`, overwriting whatever's
   there.
9. Kill the local HTTP server and delete the scratch `.html` and rendered
   `.jpg` from wherever they landed outside the final destination — check
   `git status --short` before committing to make sure nothing stray (like a
   screenshot left at the repo root) got added.

## What this skill doesn't do

- Doesn't touch the post's markdown/frontmatter beyond confirming the title
  and `coverImageUrl` path it needs.
- Doesn't commit, branch, PR, or deploy — that's a separate step.
- Doesn't source or embed real photos. If a post genuinely needs a photo
  background (rare — only 2-3 older covers do this), that's a different
  convention; ask before deviating from the gradient template.
