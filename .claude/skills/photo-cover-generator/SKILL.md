---
name: photo-cover-generator
description: Use when a cover image needs a license-free photo background and real technology logos, instead of the flat-gradient badge template. Applies to blog posts, case studies, and service pages.
---

# photo-cover-generator

Builds a `cover.jpg` with a license-free photo background (dark scrim for
legibility), the title centered in bold white type, real logo badges for the
technologies involved, and the standard footer bar. This is the newer house
style, requested to replace the flat-gradient-plus-hand-drawn-icon template
for posts/pages where the reviewer wants something that looks less generic.

## 1. Pick and download a background photo

Use Chrome browser automation to source the photo — no API key needed:

1. Load the tools if not already available:
   `ToolSearch("select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__find")`
2. Create a tab, navigate to `https://www.pexels.com/search/<query>/` with a
   query that matches the subject (e.g. "server room", "cloud computing",
   "data center", "network cables", "control room" — avoid literal tech-brand
   names, Pexels won't have those).
3. Pick a photo with a fairly dark or uncluttered area where title text and
   badges will sit (roughly the top-third and a horizontal band around 60%
   down). Open it, find the direct image URL (the `images.pexels.com/photos/...`
   CDN URL, not the pexels.com page URL).
4. Download it with `curl -o photo.jpg "<direct-image-url>"` into your scratch
   working directory. Pexels photos are free to use for commercial purposes,
   no attribution required (Pexels License) — still note the photo's Pexels
   page URL in your final report so the source is traceable.
5. If Pexels search/download fails or the browser tools misbehave after 2-3
   attempts, stop and say so rather than looping — ask how to proceed.

## 2. Get real logos (not hand-drawn icons)

Use simpleicons.org's public CDN — no auth, no download-and-host needed at
render time:

```
curl -o logo-1.svg "https://cdn.simpleicons.org/<slug>"
curl -o logo-2.svg "https://cdn.simpleicons.org/<slug>/<hex-color-no-#>"
```

Find the right slug from https://simpleicons.org (lowercase, e.g. `php`,
`symfony`, `docker`, `kubernetes`, `postgresql`, `amazonaws`, `terraform`).
Pass a hex color (no `#`) as a second path segment to recolor a monochrome
mark if the default doesn't read well against the white badge background —
default (no color param) usually returns the brand's official color already,
which is normally right.

Use 3-5 logos, matching the actual technologies named in the content (not
generic stand-ins). If a technology has no simpleicons entry, ask before
substituting a placeholder — don't invent a mark.

## 3. Composite and render

1. Copy `references/cover-template.html` to a scratch dir alongside
   `photo.jpg` and the downloaded `logo-*.svg` files.
2. Fill in the title (wrapped into 2-4 balanced lines, ~20-30 characters
   each) and the badge `<img>` sources.
3. Serve the scratch dir: `python3 -m http.server <port> &`.
4. Load Playwright tools if needed:
   `ToolSearch("select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_resize,mcp__plugin_playwright_playwright__browser_take_screenshot")`.
5. `browser_resize` to exactly `1600x840`, `browser_navigate` to
   `http://127.0.0.1:<port>/cover-template.html`.
6. `browser_take_screenshot` with `type: "jpeg"`, `scale: "css"`,
   `fullPage: false`.
7. Confirm the output is exactly 1600x840 with `file`.
8. Copy it to the destination path given by whoever dispatched you (blog:
   `public/blog-assets/{slug}/cover.jpg`; case study:
   `public/case-studies-assets/{slug}/cover.jpg`; service page:
   `public/service-assets/{slug}/cover.jpg`).
9. Kill the local HTTP server and delete the scratch dir's HTML/photo/logo/
   render files — `git status --short` before finishing to confirm nothing
   stray got added to the repo.

## What this skill doesn't do

- Doesn't write or edit post/case-study/service page content.
- Doesn't commit, branch, PR, or deploy.
- Doesn't wire the image into the page's `<Head>`/`og:image` tag — that's a
  code change, hand off to whichever agent owns that file.
