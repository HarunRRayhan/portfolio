import { execFileSync } from 'node:child_process'
import type { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string): Promise<void> {
  const url = execFileSync('php', ['tests/browser/login-link.php', email], { env: process.env, encoding: 'utf8' }).trim()
  await page.goto(url)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login/magic'))
}
