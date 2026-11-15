import { execFileSync } from 'node:child_process'
import type { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string): Promise<void> {
  const url = execFileSync('php', ['tests/browser/login-link.php', email], { env: process.env, encoding: 'utf8' }).trim()
  await page.goto(url)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login/magic'))

  // Accounts that haven't agreed to the Terms yet land on the one-time welcome screen.
  if (new URL(page.url()).pathname === '/welcome') {
    await page.getByRole('checkbox', { name: /I agree to the/ }).check()
    await page.getByRole('button', { name: 'Skip passkey' }).click()
    await page.waitForURL((u) => u.pathname !== '/welcome')
    // New accounts get a one-time newsletter offer on the next page; decline it so it doesn't cover the page.
    await page.getByRole('button', { name: 'No thanks' }).click({ timeout: 5000 }).catch(() => {})
  }
}
