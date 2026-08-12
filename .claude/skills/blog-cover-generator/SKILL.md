---
name: blog-cover-generator
description: Use when a blog post at resources/blog/posts/{slug}.md needs a cover image built at public/blog-assets/{slug}/cover.jpg. Builds the title + icon-badge + footer template used across harun.dev/blog posts, either over a gradient or a darkened stock photo, and renders it at exactly 1600x840 (same aspect ratio as the 1200x630 OG image, so it doubles as og:image). Not for writing post body content or picking which post to cover.
---

# blog-cover-generator

Builds a `cover.jpg` that matches the site's existing cover convention: the
post title centered in bold white type, a row of colored icon badges for its
tech stack, and a footer bar with the site domain and social handle — over
either a diagonal gradient (the default, most posts) or a darkened stock
photo (a documented alternate style, see below). It's always a rendered
HTML/CSS composite, never a bare, undesigned photo and never AI-generated
art.

`1600x840` is the exact same aspect ratio as the standard OG image size
(`1200x630` — both are 1.9048:1), so the same file works as `og:image`
without a separate crop.

## Before building

Look at 2-3 recent `public/blog-assets/*/cover.jpg` files to catch drift in
the convention (colors already in heavy rotation, footer wording, badge
count). Pay attention to which gradient colors the last few posts used —
pick something that doesn't repeat the immediately preceding post.

## Gradient vs. photo background

Default to the gradient template — it's what most covers use. Use the photo
variant only when asked, or when the post has a specific real-world image
that fits (a screenshot, a stock photo tied to the post's premise). As of
this writing two posts use it: `lock-down-bedrock-iam-lambda-data-leak` and
`ai-endpoints-post-generate-validation-lambda-bedrock-fastify`. Look at
those two for the exact treatment before building a new one.

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
   `harun.dev` bottom-left, X/LinkedIn/Facebook glyphs + `@harundotdev`
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

## Photo-background variant

Same title/badge/footer layout, but the `.cover` background is a full-bleed
photo instead of a gradient, darkened enough that white text and photo
detail both stay legible:

```css
.bg {
  position: absolute; inset: 0;
  background: url('stock-bg.jpg') center/cover no-repeat;
  filter: brightness(0.5) saturate(0.75);
}
.overlay {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(4,8,12,0.68) 0%, rgba(6,12,16,0.5) 45%, rgba(4,8,12,0.72) 100%);
}
.title {
  /* same as the gradient template, plus a stronger shadow so it reads over busy photo detail */
  text-shadow: 0 6px 20px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.6);
}
.badge {
  /* add a drop shadow so badges separate from the photo instead of blending in */
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}
```

Put `.bg` and `.overlay` as the first two children of `.cover`, before the
title. Everything else (title markup, badges, footer) is unchanged from the
gradient template.

## Render process

Playwright's `browser_navigate` blocks `file://` URLs, and its screenshot
tool only writes inside the repo (`.playwright-mcp/` or repo root) — so the
render has to go through a local HTTP server:

1. Write the filled-in template to a scratch `.html` file. If it's the photo
   variant, put the source image next to it in the same scratch dir (e.g.
   `stock-bg.jpg`) so the `url('stock-bg.jpg')` reference resolves.
2. Serve its directory: `python3 -m http.server <port> &` (background it,
   pick a free port, run it from the scratch dir so the URL is just
   `cover-template.html`).
3. Load the deferred Playwright tools if not already available:
   `ToolSearch("select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_resize,mcp__plugin_playwright_playwright__browser_take_screenshot,mcp__plugin_playwright_playwright__browser_evaluate")`.
4. `browser_resize` to `1600x840`, then verify with
   `browser_evaluate(() => ({w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio}))`.
   **This environment's `devicePixelRatio` isn't always 1** — if the reported
   `innerWidth`/`innerHeight` don't come back as exactly 1600x840, re-issue
   `browser_resize` with the request scaled by `dpr` (e.g. dpr 0.75 needs a
   `1200x630` resize request to land on an actual 1600x840 viewport) and
   re-check. Skipping this check produces a screenshot with the real content
   squeezed into a corner and the rest padded solid white — check for that
   visually before moving on.
5. `browser_navigate` to `http://127.0.0.1:<port>/cover-template.html`.
6. `browser_take_screenshot` with `type: "jpeg"`, `scale: "css"`,
   `fullPage: false`, saved to `.playwright-mcp/cover-render.jpg` (must be
   inside the tool's allowed roots — repo root or `.playwright-mcp/`). Don't
   use an element-targeted screenshot (`target: '.cover'`) as a shortcut
   around the dpr issue — it hits the same padding bug.
7. Confirm the output is exactly 1600x840 with `file cover-render.jpg`, and
   spot-check a corner pixel isn't plain white (`python3 -c "from PIL import
   Image; print(Image.open('cover-render.jpg').getpixel((1590,830)))"`) — a
   corner still showing `(255,255,255)` means the dpr padding bug hit and
   step 4 needs redoing. If the render lands at a smaller same-ratio size
   (e.g. `1200x630`), upscale losslessly with
   `Image.resize((1600,840), Image.LANCZOS)` rather than re-rendering.
8. Copy it to `public/blog-assets/{slug}/cover.jpg`, overwriting whatever's
   there.
9. Kill the local HTTP server and delete the scratch `.html`, source photo,
   and rendered `.jpg` from wherever they landed outside the final
   destination — check `git status --short` before committing to make sure
   nothing stray (a leftover screenshot or a stray `.playwright-mcp/` dir at
   the repo root) got added.

## What this skill doesn't do

- Doesn't touch the post's markdown/frontmatter beyond confirming the title
  and `coverImageUrl` path it needs.
- Doesn't commit, branch, PR, or deploy — that's a separate step.
- Doesn't default to a photo background — that's an intentional per-post
  choice (see "Gradient vs. photo background" above), not the norm.
- Doesn't source a new stock photo on its own initiative. If a post needs
  one and doesn't already have a downloaded candidate, ask first rather than
  picking one.
