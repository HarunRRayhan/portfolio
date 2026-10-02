import { expect, test } from '@playwright/test'

const lightSlot = { start: '2030-10-07T10:00:00Z', end: '2030-10-07T10:30:00Z' }
const proSlot = { start: '2030-10-08T11:00:00Z', end: '2030-10-08T12:00:00Z' }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('subscribe-popup-dismissed', '1'))
})

test('reopening the same plan restores slots and preserves entered details', async ({ page }) => {
  await page.route('**/book/availability?*', route => route.fulfill({ json: { slots: [lightSlot] } }))
  await page.goto('/consultation')
  await page.getByRole('button', { name: 'Book Light', exact: true }).click()
  await expect(page.getByRole('tab')).toHaveCount(1)
  await page.getByLabel('Name', { exact: true }).fill('Returning visitor')
  await page.getByRole('button', { name: 'All plans' }).click()
  await page.getByRole('button', { name: 'Book Light', exact: true }).click()
  await expect(page.getByRole('tab')).toHaveCount(1)
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Returning visitor')
  await expect(page.getByText('No open slots', { exact: false })).toHaveCount(0)
})

for (const failure of ['http', 'network', 'malformed'] as const) {
  test(`${failure} availability failure can be retried without losing details`, async ({ page }, testInfo) => {
    let calls = 0
    await page.route('**/book/availability?*', async route => {
      calls += 1
      if (calls > 1) return route.fulfill({ json: { slots: [lightSlot] } })
      if (failure === 'network') return route.abort('failed')
      if (failure === 'malformed') return route.fulfill({ json: { slots: [{ start: 'invalid' }] } })
      return route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    })
    await page.goto('/consultation')
    await page.getByRole('button', { name: 'Book Light', exact: true }).click()
    await page.getByLabel('Name', { exact: true }).fill('Retry visitor')
    await expect(page.getByRole('alert')).toContainText('load')
    await expect(page.getByText('No open slots', { exact: false })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Request this slot' })).toBeDisabled()
    if (failure === 'http') {
      await page.getByRole('alert').scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('availability-retry.png') })
    }
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByRole('tab')).toHaveCount(1)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Retry visitor')
  })
}

test('an empty successful response offers contact rather than a failure', async ({ page }) => {
  await page.route('**/book/availability?*', route => route.fulfill({ json: { slots: [] } }))
  await page.goto('/consultation')
  await page.getByRole('button', { name: 'Book Light', exact: true }).click()
  await expect(page.getByText('No open slots', { exact: false })).toBeVisible()
  await expect(page.locator('main').getByRole('link', { name: /send a note/i })).toHaveAttribute('href', '/contact')
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0)
})

test('a slower previous plan cannot overwrite the current plan availability', async ({ page }) => {
  let releaseLight!: () => void
  const holdLight = new Promise<void>(resolve => { releaseLight = resolve })
  let lightStarted!: () => void
  const started = new Promise<void>(resolve => { lightStarted = resolve })
  await page.route('**/book/availability?*', async route => {
    if (new URL(route.request().url()).searchParams.get('tier') === 'light') {
      lightStarted()
      await holdLight
      await route.fulfill({ json: { slots: [lightSlot] } }).catch(() => {})
    } else {
      await route.fulfill({ json: { slots: [proSlot] } })
    }
  })
  await page.goto('/consultation')
  await page.getByRole('button', { name: 'Book Light', exact: true }).click()
  await started
  const cancelled = page.waitForEvent('requestfailed', {
    predicate: request => request.url().includes('/book/availability?tier=light'),
  })
  await page.getByRole('button', { name: 'All plans' }).click()
  await cancelled
  await page.getByRole('button', { name: 'Book Pro', exact: true }).click()
  await expect(page.getByRole('tab')).toContainText('Oct 8')
  releaseLight()
  await expect(page.getByRole('tab')).toContainText('Oct 8')
  await expect(page.getByRole('tab')).toHaveCount(1)
})
