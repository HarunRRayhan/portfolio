import { expect, test } from '@playwright/test'
import { loginAs } from './login'

const lightSlot = { start: '2030-10-07T10:00:00Z', end: '2030-10-07T10:30:00Z' }
const proSlot = { start: '2030-10-08T11:00:00Z', end: '2030-10-08T12:00:00Z' }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('subscribe-popup-dismissed', '1'))
})

test('a guest sees Sponsor on GitHub and a sign-in that keeps the query', async ({ page }) => {
  await page.goto('/consultation?sa_ref=abc&coupon=X')
  await expect(page.getByRole('link', { name: 'Sponsor on GitHub' }).first()).toHaveAttribute('target', '_blank')
  await expect(page.getByRole('button', { name: 'Book this call' })).toHaveCount(0)
  const href = await page.getByRole('link', { name: 'Sign in with GitHub' }).getAttribute('href')
  expect(href).toContain('github')
  expect(new URL(href!, page.url()).searchParams.get('redirect')).toBe('/consultation?sa_ref=abc&coupon=X')
})

test.describe('signed in', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'browser-client@example.test')
  })

  test('the booking form asks for business details instead of an email', async ({ page }) => {
    await page.route('**/book/availability?*', route => route.fulfill({ json: { slots: [lightSlot] } }))
    await page.goto('/consultation')
    await page.getByRole('button', { name: 'Book this call' }).first().click()
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Browser test client')
    const bookingForm = page.locator('form', { has: page.getByRole('button', { name: 'Request this slot' }) })
    await expect(bookingForm.locator('input[type="email"]')).toHaveCount(0)
    await expect(page.getByLabel('Company name')).toBeVisible()
    await expect(page.getByLabel('Website')).toBeVisible()
    await expect(page.getByLabel('What do you need help with?')).toBeVisible()
    await expect(page.getByText('Updates go to browser-client@example.test.')).toBeVisible()
  })

  test('reopening the same credit restores slots and preserves entered details', async ({ page }) => {
    await page.route('**/book/availability?*', route => route.fulfill({ json: { slots: [lightSlot] } }))
    await page.goto('/consultation')
    await page.getByRole('button', { name: 'Book this call' }).first().click()
    await expect(page.getByRole('tab')).toHaveCount(1)
    await page.getByLabel('Name', { exact: true }).fill('Returning visitor')
    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Book this call' }).first().click()
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
      await page.getByRole('button', { name: 'Book this call' }).first().click()
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
    await page.getByRole('button', { name: 'Book this call' }).first().click()
    await expect(page.getByText('No open slots', { exact: false })).toBeVisible()
    await expect(page.locator('main').getByRole('link', { name: /send a note/i })).toHaveAttribute('href', '/contact')
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0)
  })

  test('a slower previous credit cannot overwrite the current credit availability', async ({ page }) => {
    let releaseLight!: () => void
    const holdLight = new Promise<void>(resolve => { releaseLight = resolve })
    let lightStarted!: () => void
    const started = new Promise<void>(resolve => { lightStarted = resolve })
    await page.route('**/book/availability?*', async route => {
      if (new URL(route.request().url()).searchParams.get('tier') === 'pro') {
        lightStarted()
        await holdLight
        await route.fulfill({ json: { slots: [lightSlot] } }).catch(() => {})
      } else {
        await route.fulfill({ json: { slots: [proSlot] } })
      }
    })
    await page.goto('/consultation')
    await page.getByRole('button', { name: 'Book this call' }).first().click()
    await started
    const cancelled = page.waitForEvent('requestfailed', {
      predicate: request => request.url().includes('/book/availability?tier=pro'),
    })
    await page.getByRole('button', { name: 'Back' }).click()
    await cancelled
    await page.getByRole('button', { name: 'Book this call' }).nth(1).click()
    await expect(page.getByRole('tab')).toContainText('Oct 8')
    releaseLight()
    await expect(page.getByRole('tab')).toContainText('Oct 8')
    await expect(page.getByRole('tab')).toHaveCount(1)
  })
})
