import { execFileSync } from 'node:child_process'
import type { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string): Promise<void> {
  const url = execFileSync('php', ['tests/browser/login-link.php', email], { env: process.env, encoding: 'utf8' }).trim()
  await page.goto(url)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login/magic'))

  // Accounts that haven't agreed to the Terms yet land on the one-time welcome screen.
  if (new URL(page.url()).pathname === '/welcome') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Skip passkey' }).click()
    await page.waitForURL((u) => u.pathname !== '/welcome')
  }
}
