// Records each [data-blog-activity] on a post to public/blog-assets/{slug}/activity-{id}[-{algorithm}].gif.
// Used by `blog:crosspost`, which embeds these where platforms can't run the React figure.
// Usage: node scripts/capture-activity-gifs.mjs <slug>... (needs a local server: BASE_URL, default http://127.0.0.1:8000)
// Drafts need an admin session: set CAPTURE_EMAIL and CAPTURE_PASSWORD for a local admin user.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:8000'
const FRAMES = 40
const FRAME_MS = 200

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' })
const page = await browser.newPage({
  viewport: { width: 900, height: 1000 },
  // mountBlogActivities skips automated browsers (importers keep the GIF fallback); look like a visitor.
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
})
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }))

if (process.env.CAPTURE_EMAIL) {
  await page.goto(`${base}/login`)
  await page.fill('input[name=email]', process.env.CAPTURE_EMAIL)
  await page.fill('input[name=password]', process.env.CAPTURE_PASSWORD ?? '')
  await Promise.all([page.waitForURL((url) => !url.pathname.startsWith('/login')), page.keyboard.press('Enter')])
}

for (const slug of process.argv.slice(2)) {
  const meta = readFileSync(`resources/blog/posts/${slug}.md`, 'utf8')
  const token = /^draft:\s*true/m.test(meta) ? /^draftToken:\s*"(.+?)"/m.exec(meta)?.[1] : null
  await page.goto(`${base}/blog/${slug}${token ? `/draft/${token}` : ''}`, { waitUntil: 'networkidle' })

  const nodes = page.locator('[data-blog-activity]')
  for (let i = 0; i < (await nodes.count()); i++) {
    const node = nodes.nth(i)
    const id = await node.getAttribute('data-blog-activity')
    const algorithm = await node.getAttribute('data-algorithm')
    const out = `public/blog-assets/${slug}/activity-${id}${algorithm ? `-${algorithm}` : ''}.gif`
    const dir = mkdtempSync(join(tmpdir(), 'activity-'))

    await node.scrollIntoViewIfNeeded()
    for (let f = 0; f < FRAMES; f++) {
      await node.screenshot({ path: join(dir, `f${String(f).padStart(3, '0')}.png`) })
      await page.waitForTimeout(FRAME_MS)
    }

    mkdirSync(`public/blog-assets/${slug}`, { recursive: true })
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-framerate', String(1000 / (FRAME_MS + 60)), '-i', join(dir, 'f%03d.png'),
      '-vf', 'scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer',
      out,
    ])
    rmSync(dir, { recursive: true })
    console.log(out)
  }
}

await browser.close()
