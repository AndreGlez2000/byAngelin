import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.playwright/auth.json')

setup('login y guardar sesión', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('correo@angelin.com')).toBeVisible()

  await page.fill('[name="email"]', 'angelin')
  await page.fill('[name="password"]', process.env.ADMIN_PASSWORD ?? 'admin123')
  await page.click('[type="submit"]')

  await page.waitForURL('**/agenda', { timeout: 10_000 })
  await page.context().storageState({ path: authFile })
})
