import { defineConfig } from '@playwright/test'

// Run against an isolated local database/server, never production.
const baseURL = process.env.BROWSER_TEST_BASE_URL ?? 'http://127.0.0.1:8765'
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseURL).hostname)) {
  throw new Error('Browser regressions must run against a local server.')
}

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 10000 },
  reporter: 'list',
  outputDir: '../../reports/browser-results',
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    headless: true,
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
