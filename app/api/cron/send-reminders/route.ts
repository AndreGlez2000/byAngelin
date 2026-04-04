import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import { sendReminderEmail } from '@/lib/email'

const REPLAY_WINDOW_MS = 5 * 60 * 1000
const replayCache = new Map<string, number>()

function cleanupReplayCache(now: number) {
  replayCache.forEach((expiresAt, key) => {
    if (expiresAt <= now) replayCache.delete(key)
  })
}

function parseTimestampMs(raw: string | null): number | null {
  if (!raw) return null
  if (/^\d+$/.test(raw)) {
    const value = Number(raw)
    if (!Number.isFinite(value)) return null
    return raw.length <= 10 ? value * 1000 : value
  }

  const parsed = Date.parse(raw)
  if (Number.isNaN(parsed)) return null
  return parsed
}

function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function buildSignedPayload(req: Request): string {
  const url = new URL(req.url)
  return `${req.method}:${url.pathname}${url.search}`
}

function validateCronAuth(req: Request): { ok: true; legacy: boolean } | { ok: false } {
  const legacySecret = req.headers.get('x-cron-secret')
  const timestampRaw = req.headers.get('x-cron-timestamp')
  const signature = req.headers.get('x-cron-signature')

  const hasAnyHmacHeader = Boolean(timestampRaw || signature)
  const hasBothHmacHeaders = Boolean(timestampRaw && signature)

  const cronSecret = process.env.CRON_SECRET
  const hmacSecret = process.env.CRON_HMAC_SECRET || cronSecret

  if (hasAnyHmacHeader) {
    if (!hasBothHmacHeaders || !timestampRaw || !signature || !hmacSecret) {
      return { ok: false }
    }

    const now = Date.now()
    const timestampMs = parseTimestampMs(timestampRaw)
    if (!timestampMs || Math.abs(now - timestampMs) > REPLAY_WINDOW_MS) {
      return { ok: false }
    }

    const payload = buildSignedPayload(req)
    const expected = createHmac('sha256', hmacSecret)
      .update(`${timestampRaw}.${payload}`)
      .digest('hex')

    if (!safeEquals(signature, expected)) return { ok: false }

    const idempotencyKey = req.headers.get('x-idempotency-key')?.trim()
    const replayKey = idempotencyKey || `sig:${signature}`

    cleanupReplayCache(now)
    const replayExpiresAt = replayCache.get(replayKey)
    if (replayExpiresAt && replayExpiresAt > now) {
      return { ok: false }
    }
    replayCache.set(replayKey, now + REPLAY_WINDOW_MS)

    return { ok: true, legacy: false }
  }

  if (legacySecret && cronSecret && safeEquals(legacySecret, cronSecret)) {
    return { ok: true, legacy: true }
  }

  return { ok: false }
}

// Called daily by Railway cron: GET /api/cron/send-reminders
// Finds appointments in the next 24-48h that haven't received a reminder yet.
export async function GET(req: Request) {
  const auth = validateCronAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (auth.legacy) {
    console.warn('[cron] using legacy x-cron-secret auth; migrate to HMAC headers')
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const appointments = await db.appointment.findMany({
    where: {
      date: { gte: in24h, lte: in48h },
      status: 'CONFIRMED',
      emailReminderSent: false,
      client: { email: { not: null } },
    },
    include: {
      client: { select: { name: true, email: true } },
    },
  })

  let sent = 0
  let failed = 0

  for (const appt of appointments) {
    if (!appt.client.email) continue
    try {
      await sendReminderEmail({
        to: appt.client.email,
        clientName: appt.client.name,
        service: appt.service,
        date: appt.date,
        price: appt.pricePaid ? `$${appt.pricePaid} MXN` : null,
      })
      await db.appointment.update({
        where: { id: appt.id },
        data: { emailReminderSent: true },
      })
      sent++
    } catch (err) {
      console.error(`[cron] reminder failed for appointment ${appt.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: appointments.length })
}
