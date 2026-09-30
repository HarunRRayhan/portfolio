import { expect, test } from '@playwright/test'

test.skip(process.env.BROWSER_TEST_SSR !== '1', 'Requires the isolated SSR renderer: BROWSER_TEST_SSR=1')

test('blog index and published article are visible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/blog`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Engineering notes', exact: true })).toBeVisible()
    const card = page.getByRole('region', { name: 'Blog articles' }).locator('article').first()
    await expect(card).toBeVisible()
    const title = await card.getByRole('heading', { level: 3 }).innerText()
    const articleUrl = await card.getByRole('link').first().getAttribute('href')
    await page.goto(new URL(articleUrl!, baseURL).href, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.locator('.blog-content')).toBeVisible()
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
  } finally {
    await context.close()
  }
})

test('hydration preserves filtered results and loads sharing only on intent', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const shareRequests: string[] = []
  page.on('request', request => {
    if (/\/Share(?:Popover|Sheet)-.*\.js/.test(request.url())) shareRequests.push(request.url())
  })
  await page.goto('/blog?topic=architecture')
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('architecture')
  const cards = page.getByRole('region', { name: 'Blog articles' }).locator('article')
  await expect(cards.first()).toBeVisible()
  // An interaction proves React has hydrated before we inspect the request graph.
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page).toHaveURL(/\/blog$/)
  expect(shareRequests).toEqual([])
  const trigger = cards.first().getByRole('button', { name: /^Share "/ })
  await trigger.click()
  await expect(page.getByText('Share link', { exact: true })).toBeVisible()
  expect(shareRequests.length).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(errors.filter(error => /hydrat|Minified React error|didn't match|does not match/i.test(error))).toEqual([])
})

test('direct article hydration retains content and opens the deferred share dialog', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/blog/production-ai-code-review-for-terraform-and-lambda-prs')
  await expect(page.locator('.blog-content')).toBeVisible()
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
  const trigger = page.getByRole('button', { name: /Share/i }).first()
  await trigger.click()
  await expect(page.getByText('Share link', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(errors.filter(error => /hydrat|Minified React error|didn't match|does not match/i.test(error))).toEqual([])
})
