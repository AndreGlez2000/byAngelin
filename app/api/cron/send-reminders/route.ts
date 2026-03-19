import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendReminderEmail } from '@/lib/email'

// Called daily by Railway cron: GET /api/cron/send-reminders
// Finds appointments in the next 24-48h that haven't received a reminder yet.
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
