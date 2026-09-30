import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('browser-admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('browser-tests-only')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
})

test('booking search and pagination retain the status and query', async ({ page }) => {
  await page.goto('/admin/consultations/bookings')
  await page.getByRole('searchbox', { name: 'Search bookings' }).fill('Browser Pagination Co')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByText('Showing 1–25 of 26 bookings')).toBeVisible()
  await page.getByRole('link', { name: 'confirmed', exact: true }).click()
  await expect(page).toHaveURL(/status=confirmed/)
  await expect(page).toHaveURL(/q=Browser\+Pagination\+Co|q=Browser%20Pagination%20Co/)
  await page.getByRole('link', { name: 'Next page' }).click()
  await expect(page.getByText('Showing 26–26 of 26 bookings')).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search bookings' })).toHaveValue('Browser Pagination Co')
  await expect(page).toHaveURL(/status=confirmed/)
  await expect(page.getByRole('link', { name: /Browser pagination client/ })).toHaveCount(1)
})

test('alternate times expose dates and slots after the former first forty', async ({ page }) => {
  await page.goto('/admin/consultations/bookings?q=Browser+validation+client')
  await page.getByRole('link', { name: /Browser validation client/ }).click()
  const availability = await page.getByText(/\d+ available times across/).textContent()
  expect(Number(availability?.match(/^\d+/)?.[0])).toBeGreaterThan(40)
  const dates = page.getByLabel('Alternate date', { exact: true })
  const options = await dates.locator('option').all()
  expect(options.length).toBeGreaterThan(1)
  await dates.selectOption(await options[options.length - 1].getAttribute('value') ?? '')
  const times = page.getByRole('group', { name: 'Alternate consultation times' })
  await times.getByRole('checkbox').last().check()
  await dates.selectOption(await options[0].getAttribute('value') ?? '')
  await times.getByRole('checkbox').first().check()
  await expect(page.getByText('2 times selected')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send proposed times' })).toBeEnabled()
})

test('paid cancellation is confirmed before one request and dismissed without one', async ({ page }, testInfo) => {
  await page.goto('/admin/consultations/bookings?q=Browser+paid+cancellation')
  await page.getByRole('link', { name: /Browser paid cancellation/ }).click()
  let requests = 0
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/admin/consultations/bookings/*/approve-cancel', async route => {
    requests += 1
    await held
    // Never forward this request: the synthetic fixture must never reach Stripe.
    await route.fulfill({ status: 303, headers: { location: route.request().url().replace('/approve-cancel', '') } })
  })
  await page.getByRole('button', { name: 'Approve cancel', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Approve cancellation?' })
  await expect(dialog).toContainText('Browser paid cancellation')
  await expect(dialog).toContainText('full payment refund')
  await expect(dialog).toContainText('$149.00')
  await expect(dialog.locator('time')).toBeVisible()
  await expect.poll(() => dialog.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('cancellation-confirmation.png'), animations: 'disabled' })
  await dialog.getByRole('button', { name: 'Go back' }).click()
  await expect(dialog).toHaveCount(0)
  expect(requests).toBe(0)
  await page.getByRole('button', { name: 'Approve cancel', exact: true }).click()
  await expect.poll(() => dialog.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
  try {
    await dialog.getByRole('button', { name: 'Confirm cancellation' }).click()
    await expect(dialog.getByRole('button', { name: 'Confirming…' })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Go back' })).toBeDisabled()
    await expect.poll(() => requests).toBe(1)
  } finally {
    release()
  }
  await expect(dialog).toHaveCount(0)
})

test('unpaid and refunded cancellations explain their actual refund consequence', async ({ page }) => {
  for (const [client, consequence] of [
    ['Browser unpaid cancellation', 'No payment refund is needed'],
    ['Browser refunded cancellation', 'already been refunded'],
  ]) {
    await page.goto(`/admin/consultations/bookings?q=${encodeURIComponent(client)}`)
    await page.getByRole('link', { name: new RegExp(client) }).click()
    await page.getByRole('button', { name: 'Approve cancel', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Approve cancellation?' })
    await expect(dialog).toContainText(consequence)
    await dialog.getByRole('button', { name: 'Go back' }).click()
  }
})

test('empty pagination pages recover with the same status and search', async ({ page }) => {
  await page.goto('/admin/consultations/bookings?q=Browser+Pagination+Co&status=confirmed&page=999')
  await page.getByRole('link', { name: 'Back to first page', exact: true }).click()
  await expect(page.getByText('Showing 1–25 of 26 bookings')).toBeVisible()
  await expect(page).toHaveURL(/status=confirmed/)
  await expect(page.getByRole('searchbox', { name: 'Search bookings' })).toHaveValue('Browser Pagination Co')
})

test('refreshed availability drops vanished proposed times before another submission', async ({ page }) => {
  await page.goto('/admin/consultations/bookings?q=Browser+validation+client')
  await page.getByRole('link', { name: /Browser validation client/ }).click()
  await page.getByRole('group', { name: 'Alternate consultation times' }).getByRole('checkbox').first().check()
  await page.getByLabel('Internal note (optional)').fill('a'.repeat(2001))
  let refreshedResponses = 0
  await page.route('**/admin/consultations/bookings/*/propose-reschedule', async route => {
    // Redirected requests are not routed individually. Fetch the real rejected
    // POST through its redirect, then update that final Inertia page response.
    const response = await route.fetch()
    const data = await response.json()
    expect(data.component).toBe('Admin/Consultations/Bookings/Show')
    expect(data.props.errors.admin_note).toContain('2000')
    refreshedResponses += 1
    await route.fulfill({ response, json: { ...data, props: { ...data.props, slots: [] } } })
  })
  // Validation rejects the note before any workflow or external notification.
  await page.getByRole('button', { name: 'Send proposed times' }).click()
  await expect(page.locator('#booking-errors')).toContainText('2000')
  expect(refreshedResponses).toBe(1)
  await expect(page.getByText('No alternate times are available.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send proposed times' })).toBeDisabled()
})
