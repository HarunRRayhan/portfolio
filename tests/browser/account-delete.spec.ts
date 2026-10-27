import { expect, test } from '@playwright/test'
import { loginAs } from './login'

test('a deleted account can be restored by signing in within 30 days', async ({ page }) => {
  const email = `delete-${Date.now()}@example.test`
  await loginAs(page, email)

  await page.goto('/profile')
  await page.getByRole('button', { name: 'Delete Account' }).click()
  await page.getByPlaceholder('Your email').fill(email)
  await page.getByRole('dialog').getByRole('button', { name: 'Delete Account' }).click()
  await expect(page).toHaveURL(/\/$/)

  await loginAs(page, email)
  await expect(page).toHaveURL(/\/account\/restore$/)
  await expect(page.getByRole('heading', { name: 'This account is scheduled for deletion' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore my account' }).click()
  await expect(page).not.toHaveURL(/\/account\/restore$/)

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/profile$/)
})
