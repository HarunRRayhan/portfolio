import { expect, test } from '@playwright/test'

const migrationArticle = 'When Your App Outgrows the Tool That Built It'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('subscribe-popup-dismissed', '1'))
})

test('mobile readers reach articles without scrolling through the intro and statistics', async ({ page }, testInfo) => {
  await page.goto('/blog')
  const articles = page.getByRole('region', { name: 'Blog articles' }).locator('article')
  await expect(articles.first()).toBeVisible()
  const box = await articles.first().boundingBox()
  expect(box?.y).toBeLessThan(700)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Engineering notes')
  await expect(articles.first()).toContainText('all-time views')
  await page.screenshot({ path: testInfo.outputPath('blog-mobile.png') })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: testInfo.outputPath('blog-desktop.png') })
})

test('search finds titles, descriptions, and topics without refetching the catalog', async ({ page }) => {
  await page.goto('/blog')
  const articles = page.getByRole('region', { name: 'Blog articles' }).locator('article')
  const title = (await articles.first().getByRole('heading', { level: 3 }).innerText()).trim()
  let requests = 0
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/blog') requests += 1
  })

  await page.getByLabel('Search articles', { exact: true }).fill(title.toUpperCase())
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(articles).toHaveCount(1)
  await expect(articles.first().getByRole('heading', { level: 3 })).toHaveText(title)

  await page.getByLabel('Search articles', { exact: true }).fill('15-year-old ERP')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(articles).toHaveCount(1)
  await expect(articles.first()).toContainText(migrationArticle)

  await page.getByLabel('Search articles', { exact: true }).fill('ARCHITECTURE')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(articles.filter({ has: page.getByRole('heading', { name: migrationArticle, exact: true }) })).toHaveCount(1)
  expect(requests).toBe(0)
})

test('combined topic and search filters survive sharing, reload, and back navigation', async ({ page, baseURL }) => {
  await page.goto('/blog')
  const search = page.getByLabel('Search articles', { exact: true })
  const topic = page.getByLabel('Topic', { exact: true })
  const articles = page.getByRole('region', { name: 'Blog articles' }).locator('article')
  await expect(articles.first()).toBeVisible()
  const originalCount = await articles.count()
  await search.fill('15-year-old ERP')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(articles).toHaveCount(1)
  await topic.selectOption('architecture')
  await expect(topic).toHaveValue('architecture')
  await expect(page).toHaveURL(/topic=architecture/)
  await expect.poll(async () => {
    const canonicals = await page.locator('link[rel="canonical"]').evaluateAll(
      links => links.map(link => link.getAttribute('href')),
    )
    return canonicals.length > 0 && canonicals.every(href => href === `${baseURL}/blog`)
  }).toBe(true)
  const historyLength = await page.evaluate(() => window.history.length)
  await page.reload()
  await expect(search).toHaveValue('15-year-old ERP')
  await expect(topic).toHaveValue('architecture')
  await expect(articles).toHaveCount(1)
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength)
  await page.goBack()
  await expect(topic).toHaveValue('')
  await expect(search).toHaveValue('15-year-old ERP')
  await page.goBack()
  await expect(search).toHaveValue('')
  await expect(articles).toHaveCount(originalCount)
  await page.goForward()
  await expect(search).toHaveValue('15-year-old ERP')
  await expect(articles).toHaveCount(1)
})

test('empty results explain recovery and reset restores the full archive', async ({ page }) => {
  await page.goto('/blog')
  const region = page.getByRole('region', { name: 'Blog articles' })
  await expect(region.locator('article').first()).toBeVisible()
  const originalCount = await region.locator('article').count()
  await page.getByLabel('Search articles', { exact: true }).fill('no-article-has-this-query-7a831')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'No articles found' })).toBeVisible()
  await expect(region.getByRole('status')).toHaveText(`0 of ${originalCount} articles`)
  await page.getByRole('button', { name: 'Show all articles' }).click()
  await expect(region.locator('article')).toHaveCount(originalCount)
  await expect(page.getByLabel('Search articles', { exact: true })).toHaveValue('')
  await expect(page).toHaveURL(/\/blog$/)
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)

  await page.getByLabel('Topic', { exact: true }).selectOption('architecture')
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(region.locator('article')).toHaveCount(originalCount)
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('')
})

test('unknown shared topics remain visible and recoverable', async ({ page }) => {
  await page.goto('/blog?topic=unknown-topic-7a831')
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('unknown-topic-7a831')
  await expect(page.getByRole('heading', { name: 'No articles found' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('region', { name: 'Blog articles' }).locator('article').first()).toBeVisible()
})
