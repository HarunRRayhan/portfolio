import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('browser-admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('browser-tests-only')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
})

test('availability shows nested validation and overlap errors without discarding edits', async ({ page }, testInfo) => {
  await page.goto('/admin/consultations/availability')
  await page.getByLabel('Window 1 start time', { exact: true }).fill('10:00')
  await page.getByLabel('Window 1 end time', { exact: true }).fill('09:00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.locator('#availability-errors')).toContainText('after')
  await expect(page.locator('#availability-errors')).toBeFocused()
  await expect(page.getByLabel('Window 1 end time', { exact: true })).toHaveValue('09:00')
  await expect(page.getByLabel('Window 1 end time', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Window 1 end time', { exact: true }).fill('13:00')
  await page.getByRole('button', { name: 'Add window' }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.locator('#availability-errors')).toContainText('overlap')
  await expect(page.locator('#availability-errors')).toBeFocused()
  await expect(page.getByLabel('Window 2 start time', { exact: true })).toHaveValue('10:00')
  await page.screenshot({ path: testInfo.outputPath('availability-error.png') })
})

test('coupon validation preserves entered values and identifies the invalid plans', async ({ page }) => {
  await page.goto('/admin/consultations/coupons')
  await page.getByLabel('Coupon code').fill('BROWSER-VALIDATION')
  await page.getByLabel('Percent off').fill('25')
  const plans = page.getByRole('group', { name: 'Applicable plans' })
  for (const checkbox of await plans.getByRole('checkbox').all()) await checkbox.uncheck()
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(page.locator('#coupon-errors')).toBeVisible()
  await expect(page.locator('#coupon-errors')).toBeFocused()
  await expect(plans).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Coupon code')).toHaveValue('BROWSER-VALIDATION')
  await expect(page.getByLabel('Percent off')).toHaveValue('25')
  await plans.getByRole('checkbox').first().check()
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(page.locator('#coupon-errors')).toHaveCount(0)
  await expect(page.getByLabel('Coupon code')).toHaveValue('')
  await expect(page.getByText('Coupon created.', { exact: true })).toBeVisible()
  await page.getByLabel('Coupon code').fill('BROWSER-VALIDATION')
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(page.locator('#coupon-errors')).toContainText('already been taken')
})

test('booking validation preserves the note and disables competing actions while submitting', async ({ page }) => {
  await page.goto('/admin/consultations/bookings?q=Browser+validation+client')
  await page.getByRole('link', { name: /Browser validation client/ }).click()
  const note = page.getByLabel('Internal note (optional)')
  await note.fill('a'.repeat(2001))
  let release!: () => void
  const hold = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route('**/admin/consultations/bookings/*/approve', async route => {
    requests += 1
    await hold
    await route.continue()
  })
  try {
    await page.getByRole('button', { name: 'Approve', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Decline', exact: true })).toBeDisabled()
    await expect(note).toBeDisabled()
    await expect.poll(() => requests).toBe(1)
  } finally {
    release()
  }
  await expect(page.locator('#booking-errors')).toContainText('2000')
  await expect(page.locator('#booking-errors')).toBeFocused()
  await expect(note).toHaveValue('a'.repeat(2001))
  await expect(note).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled()
})

test('availability accepts only one in-flight save and announces success', async ({ page }) => {
  await page.goto('/admin/consultations/availability')
  let release!: () => void
  const hold = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route('**/admin/consultations/availability', async route => {
    if (route.request().method() !== 'PUT') return route.continue()
    requests += 1
    await hold
    await route.continue()
  })
  try {
    await page.locator('form').evaluate((form: HTMLFormElement) => {
      form.requestSubmit()
      form.requestSubmit()
    })
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Add window' })).toBeDisabled()
    await expect.poll(() => requests).toBe(1)
  } finally {
    release()
  }
  await expect(page.getByText('Availability saved.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled()
})
