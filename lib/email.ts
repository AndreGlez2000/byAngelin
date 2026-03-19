import nodemailer from 'nodemailer'
import { render } from '@react-email/components'
import { ConfirmacionCita } from '@/emails/ConfirmacionCita'
import { RecordatorioCita } from '@/emails/RecordatorioCita'

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

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export async function sendConfirmationEmail(params: {
  to: string
  clientName: string
  service: string
  date: Date
  price?: string | null
  isFirstVisit: boolean
}) {
  const html = await render(
    ConfirmacionCita({
      clientName: params.clientName,
      service: params.service,
      date: formatDate(params.date),
      time: formatTime(params.date),
      price: params.price ?? 'Por definir',
      isFirstVisit: params.isFirstVisit,
    })
  )

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `Cita confirmada — ${params.service}`,
    html,
  })
}

export async function sendReminderEmail(params: {
  to: string
  clientName: string
  service: string
  date: Date
  price?: string | null
}) {
  const html = await render(
    RecordatorioCita({
      clientName: params.clientName,
      service: params.service,
      date: formatDate(params.date),
      time: formatTime(params.date),
      price: params.price ?? 'Por definir',
    })
  )

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `Recordatorio: tu cita es mañana — ${params.service}`,
    html,
  })
}
