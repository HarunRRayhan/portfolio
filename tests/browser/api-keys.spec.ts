import { expect, test } from '@playwright/test'

test('new API keys use explicit permissions and expiry and can be revoked', async ({ page }, testInfo) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('browser-admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('browser-tests-only')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await page.goto('/admin/api-keys')
  await expect(page.getByRole('checkbox', { name: 'Create links', exact: true })).toBeChecked()
  expect(await page.getByRole('checkbox').count()).toBe(4)
  await expect(page.getByLabel('Expires at (your local time)')).not.toHaveValue('')
  await page.getByLabel('Name', { exact: true }).fill('Browser scoped integration')
  await page.getByRole('button', { name: 'Create API key', exact: true }).click()
  await expect(page.getByText('Copy this key now.')).toBeVisible()
  const row = page.getByRole('row').filter({ hasText: 'Browser scoped integration' })
  await expect(row).toContainText('Create links')
  await expect(row).not.toContainText('Legacy: unrestricted')
  // Hide the disposable test credential in screenshots too.
  await page.screenshot({ path: testInfo.outputPath('api-key-created.png'), mask: [page.locator('code')] })
  page.once('dialog', dialog => dialog.accept())
  await row.getByRole('button', { name: 'Revoke' }).click()
  await expect(row).toHaveCount(0)
})
