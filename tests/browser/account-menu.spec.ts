import { expect, test } from '@playwright/test'
import { loginAs } from './login'

test.use({ viewport: { width: 1280, height: 800 } })

test('the sidebar account menu reaches every profile setting and logs out', async ({ page }) => {
  await loginAs(page, 'browser-admin@example.test')
  await expect(page).toHaveURL(/\/admin\/dashboard$/)

  const openMenu = () => page.getByRole('button', { name: 'Account menu' }).click()

  await openMenu()
  await page.getByRole('link', { name: 'Passkeys' }).click()
  await expect(page).toHaveURL(/\/profile#passkeys$/)
  await expect(page.getByRole('heading', { name: 'Passkeys' })).toBeInViewport()

  await openMenu()
  await page.getByRole('link', { name: 'Delete account' }).click()
  await expect(page).toHaveURL(/\/profile#delete-account$/)
  await expect(page.getByRole('button', { name: 'Delete account' })).toBeInViewport()

  await openMenu()
  await page.getByRole('link', { name: 'Profile details' }).click()
  await expect(page.getByLabel('Name', { exact: true })).toBeVisible()

  await openMenu()
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).not.toHaveURL(/\/profile/)
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login/)
})

test('a customer only sees their own account, not admin pages', async ({ page }) => {
  await loginAs(page, `customer-${Date.now()}@example.test`)

  await page.goto('/profile')
  const sidebar = page.locator('aside')
  await expect(sidebar.getByRole('button', { name: 'Overview' })).toHaveCount(0)
  await sidebar.getByRole('button', { name: 'Account menu' }).click()
  await expect(page.getByRole('link', { name: 'Profile details' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto('/blog')
  await page.locator('header').getByRole('button', { name: 'Account', exact: true }).click()
  await page.locator('header').getByRole('link', { name: 'Account' }).click()
  await expect(page).toHaveURL(/\/profile$/)
})
