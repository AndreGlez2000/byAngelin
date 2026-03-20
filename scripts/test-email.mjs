#!/usr/bin/env node
/**
 * Test email sender
 * Usage:
 *   node scripts/test-email.mjs <email> <tipo>
 *
 * Tipos: confirmacion | recordatorio
 *
 * Examples:
 *   node scripts/test-email.mjs test@example.com confirmacion
 *   node scripts/test-email.mjs test@example.com recordatorio
 */

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
} catch {
  console.error('No se encontró .env.local — asegúrate de correr este script desde la raíz del proyecto')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const nodemailer = require('nodemailer')

const [,, toArg, tipoArg] = process.argv

if (!toArg || !tipoArg) {
  console.error('Uso: node scripts/test-email.mjs <correo> <tipo>')
  console.error('Tipos disponibles: confirmacion | recordatorio')
  process.exit(1)
}

const tipo = tipoArg.toLowerCase()
if (!['confirmacion', 'recordatorio'].includes(tipo)) {
  console.error(`Tipo inválido: "${tipoArg}". Usa: confirmacion | recordatorio`)
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `Angelin Esthetician <${process.env.GMAIL_USER}>`

// --- Datos de prueba ---
const testData = {
  clientName: 'María Martínez',
  service: 'Facial Hidratante',
  date: 'vie., 20 de marzo de 2026',
  time: '11:00 a. m.',
  price: '$850 MXN',
}

// Plantillas HTML inline (sin React Email, para correr sin compilar)
function confirmacionHtml({ clientName, service, date, time, price, isFirstVisit }) {
  const primerVisita = isFirstVisit ? `
    <div style="border:1px solid #F4B1C1;background:#fff6f8;border-radius:8px;padding:14px 18px;margin-top:20px;">
      <p style="margin:0;font-size:13px;color:#8a4a5a;font-family:Inter,sans-serif;">
        🌿 <strong>Primera visita:</strong> Por favor llega 15 minutos antes para completar tu ficha de cliente.
      </p>
    </div>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Cita confirmada</title></head>
<body style="background:#E2E2D1;margin:0;padding:32px 0;font-family:Inter,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#5D6345;padding:32px;text-align:center;">
      <div style="display:inline-block;border:1.5px dashed rgba(255,255,255,.5);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;color:#fff;font-family:serif;margin-bottom:12px;">AE</div>
      <p style="color:rgba(255,255,255,.85);margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Angelin Esthetician</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#5D6345;font-size:20px;margin:0 0 6px;">Cita confirmada ✓</h2>
      <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Hola, ${clientName}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#9ca3af;width:40%;">Servicio</td><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#374151;font-weight:600;">${service}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#9ca3af;">Fecha</td><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#374151;">${date}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#9ca3af;">Hora</td><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#374151;">${time}</td></tr>
        <tr><td style="padding:10px 0;color:#9ca3af;">Precio</td><td style="padding:10px 0;color:#374151;">${price}</td></tr>
      </table>
      ${primerVisita}
      <p style="margin-top:28px;font-size:12px;color:#9ca3af;text-align:center;">
        Si necesitas cancelar o reagendar, contáctanos con al menos 24 horas de anticipación.
      </p>
    </div>
  </div>
</body>
</html>`
}

function recordatorioHtml({ clientName, service, date, time, price }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Recordatorio de cita</title></head>
<body style="background:#E2E2D1;margin:0;padding:32px 0;font-family:Inter,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#5D6345;padding:32px;text-align:center;">
      <div style="display:inline-block;border:1.5px dashed rgba(255,255,255,.5);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;color:#fff;font-family:serif;margin-bottom:12px;">AE</div>
      <p style="color:rgba(255,255,255,.85);margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Angelin Esthetician</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#5D6345;font-size:20px;margin:0 0 6px;">Tu cita es mañana 🌿</h2>
      <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Hola, ${clientName} — te recordamos que tienes una cita mañana.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#9ca3af;width:40%;">Servicio</td><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#374151;font-weight:600;">${service}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#9ca3af;">Fecha</td><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#374151;">${date}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#9ca3af;">Hora</td><td style="padding:10px 0;border-bottom:1px solid #f0f0e8;color:#374151;">${time}</td></tr>
        <tr><td style="padding:10px 0;color:#9ca3af;">Precio</td><td style="padding:10px 0;color:#374151;">${price}</td></tr>
      </table>
      <p style="margin-top:28px;font-size:12px;color:#9ca3af;text-align:center;">
        Si necesitas cancelar, por favor avísanos hoy mismo.
      </p>
    </div>
  </div>
</body>
</html>`
}

// --- Enviar ---
let subject, html

if (tipo === 'confirmacion') {
  subject = `Cita confirmada — ${testData.service}`
  html = confirmacionHtml({ ...testData, isFirstVisit: true })
} else {
  subject = `Recordatorio: tu cita es mañana — ${testData.service}`
  html = recordatorioHtml(testData)
}

console.log(`Enviando correo de ${tipo} a ${toArg}...`)

try {
  await transporter.verify()
  console.log('Conexión SMTP verificada ✓')
} catch (err) {
  console.error('Error de conexión SMTP:', err.message)
  process.exit(1)
}

try {
  const info = await transporter.sendMail({ from: FROM, to: toArg, subject, html })
  console.log(`✓ Correo enviado — messageId: ${info.messageId}`)
} catch (err) {
  console.error('Error al enviar:', err.message)
  process.exit(1)
}
