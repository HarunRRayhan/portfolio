import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('subscribe-popup-dismissed', '1'))
})

test('blog prioritizes the first cover and supplies smaller local image candidates', async ({ page }, testInfo) => {
  await page.goto('/blog')
  const covers = page.getByRole('region', { name: 'Blog articles' }).locator('article img')
  await expect(covers.first()).toHaveAttribute('loading', 'eager')
  await expect(covers.first()).toHaveAttribute('fetchpriority', 'high')
  await expect(covers.nth(1)).toHaveAttribute('loading', 'lazy')
  const responsive = covers.first() // The current lead article uses a versioned local cover.
  await expect(responsive).toHaveAttribute('srcset', /card-variants\/.*480\.webp 480w/)
  await expect(responsive).toHaveAttribute('sizes', /100vw/)
  await responsive.scrollIntoViewIfNeeded()
  await expect.poll(() => responsive.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && image.currentSrc.includes('/card-variants/'))).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('blog-mobile.png') })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.reload()
  await expect(covers.first()).toBeVisible()
  await expect(page.locator('header')).toHaveCount(1)
  await page.screenshot({ path: testInfo.outputPath('blog-desktop.png') })
})

test('directory images defer loading and badge links remain unique', async ({ page }) => {
  let badgeRequests = 0
  await page.route('**/badges/earlyhunt-badge-light.svg', route => {
    badgeRequests += 1
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="265" height="58"></svg>' })
  })
  await page.goto('/blog')
  const badges = page.getByRole('region', { name: 'Featured directory badges' })
  await expect(badges.locator('img').first()).toHaveAttribute('loading', 'lazy')
  expect(await badges.locator('img:not([loading="lazy"])').count()).toBe(0)
  const links = await badges.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))
  expect(new Set(links).size).toBe(links.length)
  expect(badgeRequests).toBe(0)
  await badges.scrollIntoViewIfNeeded()
  await expect.poll(() => badgeRequests).toBeGreaterThan(0)
  await expect(badges.getByRole('link', { name: 'Feature On Launch Vault', exact: true })).toHaveCount(1)
})

test('a thumbnail publication delay falls back to the local original cover', async ({ page }) => {
  let missingRequests = 0
  await page.route('**/blog-assets/card-variants/**', route => {
    missingRequests += 1
    return route.fulfill({ status: 404, body: '' })
  })
  // Hold hydration until the SSR image has already failed. React's onError
  // cannot observe an error that happened before its listeners were attached.
  let allowHydration = () => {}
  if (process.env.BROWSER_TEST_SSR === '1') {
    const hydrationGate = new Promise<void>(resolve => { allowHydration = resolve })
    await page.route('**/build/**/*.js', async route => {
      await hydrationGate
      await route.continue()
    })
  }
  const first = page.getByRole('region', { name: 'Blog articles' }).locator('article img').first()
  try {
    await page.goto('/blog?q=MCP%20Authentication', { waitUntil: 'commit' })
    await expect.poll(() => missingRequests).toBeGreaterThan(0)
    if (process.env.BROWSER_TEST_SSR === '1') {
      await expect.poll(() => first.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0 && image.hasAttribute('srcset'))).toBe(true)
    }
  } finally {
    allowHydration()
  }
  await expect.poll(() => first.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && !image.currentSrc.includes('/card-variants/') && !image.hasAttribute('srcset'))).toBe(true)
})


test('Launch Llama keeps its link and serves its image without a third-party request', async ({ page }) => {
  const remoteRequests: string[] = []
  page.on('request', request => {
    if (request.url().startsWith('https://tools.launchllama.co/')) remoteRequests.push(request.url())
  })
  await page.goto('/consultation')
  const badge = page.getByRole('link', { name: 'Featured on Launch Llama Tools', exact: true })
  await expect(badge).toHaveAttribute('href', 'https://tools.launchllama.co?utm_source=badge&utm_medium=referral')
  await expect(badge.locator('img')).toHaveAttribute('src', '/images/directory-badges/launch-llama.png')
  await badge.scrollIntoViewIfNeeded()
  await expect.poll(() => badge.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  expect(remoteRequests).toEqual([])
})
