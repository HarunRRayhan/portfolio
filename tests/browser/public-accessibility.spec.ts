import { expect, test, type Locator } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  if (!testInfo.title.startsWith('idle newsletter')) {
    await page.addInitScript(() => sessionStorage.setItem('subscribe-popup-dismissed', '1'))
  }
})

test('contact form asks for a note without a service menu', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.getByLabel(/^Name/)).toBeVisible()
  await expect(page.getByLabel(/^Email/)).toBeVisible()
  await expect(page.getByLabel(/^Message/)).toBeVisible()
  await expect(page.getByLabel('Services', { exact: true })).toHaveCount(0)
})

test('newsletter dialog contains focus, closes with Escape and restores its trigger', async ({ page }) => {
  await page.goto('/contact')
  const trigger = page.getByRole('button', { name: 'Subscribe to newsletter', exact: true })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Subscribe', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Subscribe', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('idle newsletter dialog restores the control that was focused before opening', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/contact')
  const message = page.getByLabel(/^Message/)
  await message.focus()
  // Use real time: Framer's native animation timeline is not advanced by the fake clock.
  // Keyboard activity restarts the visitor's idle timer.
  await page.keyboard.press('ArrowRight')
  const dialog = page.getByRole('dialog', { name: 'Subscribe', exact: true })
  await expect(dialog).toBeVisible({ timeout: 65_000 })
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(message).toBeFocused()
})

test('desktop More toggles and dismisses with Escape or focus leaving', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/contact')
  const more = page.getByRole('button', { name: 'More', exact: true })
  await more.focus()
  await page.keyboard.press('Enter')
  await expect(more).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Enter')
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /Case Studies Real engagements/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await expect(more).toBeFocused()
  await more.press('Enter')
  await page.getByLabel(/^Message/).focus()
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  const consultation = page.locator('header').getByRole('link', { name: 'Consultation', exact: true })
  await expect(consultation.locator('button')).toHaveCount(0)
})

test('signed-in account disclosure has a name and restores focus on Escape', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('browser-admin@example.test')
  await page.getByLabel('Password', { exact: true }).fill('browser-tests-only')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/contact')
  const account = page.getByRole('button', { name: 'Account', exact: true })
  await account.focus()
  await page.keyboard.press('Enter')
  await expect(account).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(page.locator('header').getByRole('link', { name: 'Dashboard', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(account).toHaveAttribute('aria-expanded', 'false')
  await expect(account).toBeFocused()
})

async function contrast(locator: Locator) {
  return locator.evaluate(element => {
    const probe = document.createElement('canvas').getContext('2d')!
    const rgb = (color: string) => {
      probe.fillStyle = color
      probe.fillRect(0, 0, 1, 1)
      return Array.from(probe.getImageData(0, 0, 1, 1).data).slice(0, 3)
    }
    const luminance = (values: number[]) => {
      const linear = values.map(value => {
        const channel = value / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      })
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
    }
    let parent: Element | null = element
    let background = 'white'
    while (parent) {
      const candidate = getComputedStyle(parent).backgroundColor
      if (candidate !== 'rgba(0, 0, 0, 0)' && candidate !== 'transparent') {
        background = candidate
        break
      }
      parent = parent.parentElement
    }
    const foreground = luminance(rgb(getComputedStyle(element).color))
    const backdrop = luminance(rgb(background))
    return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05)
  })
}

test('consultation pricing text and feature symbols have readable contrast', async ({ page }) => {
  await page.goto('/consultation')
  expect(await contrast(page.getByRole('button', { name: 'Book Max', exact: true }))).toBeGreaterThanOrEqual(4.5)
  expect(await contrast(page.getByText('Recommended', { exact: true }))).toBeGreaterThanOrEqual(4.5)
  for (const label of await page.getByText('/ one time', { exact: true }).all()) {
    expect(await contrast(label)).toBeGreaterThanOrEqual(4.5)
  }
  const included = page.getByRole('img', { name: 'Included', exact: true })
  await expect(included.first()).toBeVisible()
  expect(await contrast(included.first())).toBeGreaterThanOrEqual(3)
})
