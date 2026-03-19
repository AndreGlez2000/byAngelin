import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Cargar sesión guardada si existe
const authFile = path.join(__dirname, '../.playwright/auth.json')
test.use({
  storageState: fs.existsSync(authFile) ? authFile : undefined,
})

test.describe('Login', () => {
  test('muestra split layout con panel olive y formulario', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Angelin/)
    // Panel izquierdo (script font logo)
    await expect(page.locator('text=Ae')).toBeVisible()
    await expect(page.locator('text=Bienvenida de vuelta')).toBeVisible()
    await expect(page.locator('[name="email"]')).toBeVisible()
    await expect(page.locator('[name="password"]')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/login.png', fullPage: true })
  })
})

test.describe('Agenda', () => {
  test('muestra sidebar y calendario de 7 columnas', async ({ page }) => {
    await page.goto('/agenda')
    // Sidebar
    await expect(page.locator('text=Angelin').first()).toBeVisible()
    await expect(page.locator('text=Agenda').first()).toBeVisible()
    await expect(page.locator('text=Clientas').first()).toBeVisible()
    // Header semana
    await expect(page.locator('text=Semana')).toBeVisible()
    await expect(page.locator('text=Nueva Cita')).toBeVisible()
    // 7 columnas (headers de días)
    for (const day of ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible()
    }
    await page.screenshot({ path: 'e2e/screenshots/agenda.png', fullPage: true })
  })

  test('abre modal Nueva Cita', async ({ page }) => {
    await page.goto('/agenda')
    await page.click('text=Nueva Cita')
    await expect(page.locator('text=Clienta').first()).toBeVisible()
    await expect(page.locator('text=Servicio')).toBeVisible()
    await expect(page.locator('text=Cancelar')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/modal-nueva-cita.png', fullPage: true })
  })
})

test.describe('Clientes', () => {
  test('muestra tabla con columnas correctas', async ({ page }) => {
    await page.goto('/clientes')
    await expect(page.locator('text=Mis Clientes')).toBeVisible()
    await expect(page.locator('text=Nueva Clienta')).toBeVisible()
    // Columnas de la tabla
    await expect(page.locator('text=Nombre').first()).toBeVisible()
    await expect(page.locator('text=Teléfono').first()).toBeVisible()
    await expect(page.locator('text=Tipo Piel').first()).toBeVisible()
    await expect(page.locator('text=Visitas').first()).toBeVisible()
    await expect(page.locator('text=Estado').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/clientes.png', fullPage: true })
  })

  test('abre página Nueva Clienta con formulario completo', async ({ page }) => {
    await page.goto('/clientes')
    await page.click('text=Nueva Clienta')
    await page.waitForURL('**/clientes/nueva')
    await expect(page.locator('text=Nueva Clienta').first()).toBeVisible()
    await expect(page.locator('text=Datos de Identificación')).toBeVisible()
    await expect(page.locator('text=Análisis de Piel')).toBeVisible()
    await expect(page.locator('text=Estilo de Vida')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/nueva-clienta.png', fullPage: true })
  })
})
