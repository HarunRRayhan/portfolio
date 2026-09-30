import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.addInitScript(() => sessionStorage.setItem('subscribe-popup-dismissed', '1'))
})

async function expectMetadata(page: Page, canonical: string) {
  await expect(page.locator('head title')).toHaveCount(1)
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', canonical)
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1)
  await expect(page.locator('head meta[property="og:url"]')).toHaveCount(1)
  await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', canonical)
  await expect(page.locator('head meta[property="og:description"]')).toHaveCount(1)
  await expect(page.locator('head meta[name="twitter:description"]')).toHaveCount(1)
}

async function articleSchemas(page: Page) {
  return page.locator('head script[type="application/ld+json"]').evaluateAll(scripts =>
    scripts.map(script => JSON.parse(script.textContent ?? '{}')).filter(graph => graph['@type'] === 'BlogPosting'),
  )
}

test('hard loads and SPA article navigation keep one current canonical, description, and schema', async ({ page, baseURL }) => {
  await page.goto('/contact')
  await expectMetadata(page, `${baseURL}/contact`)
  const contactDescription = await page.locator('head meta[name="description"]').getAttribute('content')
  // A full reload would hide stale-head bugs. This marker proves the links use Inertia.
  await page.evaluate(() => { (window as any).__seoNavigationMarker = 'same-document' })
  await page.locator('header').getByRole('link', { name: 'Blog', exact: true }).click()
  await expect(page).toHaveURL(`${baseURL}/blog`)
  await expectMetadata(page, `${baseURL}/blog`)
  await expect(page.locator('head meta[name="description"]')).not.toHaveAttribute('content', contactDescription!)

  const cards = page.getByRole('region', { name: 'Blog articles' }).locator('article')
  const href = await cards.first().getByRole('link').first().getAttribute('href')
  await cards.first().getByRole('link').first().click()
  await expect(page).toHaveURL(`${baseURL}${href}`)
  await expectMetadata(page, `${baseURL}${href}`)
  await expect.poll(() => articleSchemas(page)).toEqual([
    expect.objectContaining({ mainEntityOfPage: `${baseURL}${href}` }),
  ])
  expect(await page.evaluate(() => (window as any).__seoNavigationMarker)).toBe('same-document')

  await page.goBack()
  await expectMetadata(page, `${baseURL}/blog`)
  await expect.poll(() => articleSchemas(page)).toEqual([])
  const secondHref = await cards.nth(1).getByRole('link').first().getAttribute('href')
  await cards.nth(1).getByRole('link').first().click()
  await expectMetadata(page, `${baseURL}${secondHref}`)
  await expect.poll(() => articleSchemas(page)).toEqual([
    expect.objectContaining({ mainEntityOfPage: `${baseURL}${secondHref}` }),
  ])
  await page.reload()
  await expectMetadata(page, `${baseURL}${secondHref}`)
  await expect.poll(() => articleSchemas(page)).toEqual([
    expect.objectContaining({ mainEntityOfPage: `${baseURL}${secondHref}` }),
  ])
})

test('service schemas are removed when leaving for sponsor and bio metadata works without the public layout', async ({ page, baseURL }) => {
  await page.goto('/services/devops')
  await expectMetadata(page, `${baseURL}/services/devops`)
  await expect.poll(() => page.locator('head script[type="application/ld+json"]').evaluateAll(scripts => scripts.filter(script => JSON.parse(script.textContent ?? '{}')['@type'] === 'FAQPage').length)).toBe(1)
  await page.locator('footer').getByRole('link', { name: 'Sponsor', exact: true }).click()
  await expectMetadata(page, `${baseURL}/sponsor-me`)
  await expect.poll(() => page.locator('head script[type="application/ld+json"]').evaluateAll(scripts => scripts.filter(script => JSON.parse(script.textContent ?? '{}')['@type'] === 'FAQPage').length)).toBe(0)
  await expect(page).toHaveTitle(/Why Sponsor My Work/)
  await page.goto('/bio')
  await expectMetadata(page, `${baseURL}/bio`)
  await page.getByRole('link', { name: 'বাংলা প্রোফাইল', exact: true }).click()
  await expectMetadata(page, `${baseURL}/hrr`)
})

test('SPA entry to sign in clears public page metadata and schema', async ({ page, baseURL }) => {
  await page.goto('/blog')
  await expectMetadata(page, `${baseURL}/blog`)
  await page.getByRole('link', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(`${baseURL}/login`)
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('head meta[name="description"]')).toHaveCount(0)
  await expect(page.locator('head script[data-inertia^="seo-jsonld-"]')).toHaveCount(0)
})
