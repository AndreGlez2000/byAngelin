import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendConfirmationEmail } from '@/lib/email'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const appointments = await db.appointment.findMany({
    where: {
      ...(from && { date: { gte: new Date(from) } }),
      ...(to && { date: { lte: new Date(to) } }),
    },
    orderBy: { date: 'asc' },
    include: { client: { select: { id: true, name: true, phone: true } } },
  })
  return NextResponse.json(appointments)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { clientId, service, date, sessionNotes } = body

  if (!clientId || !service || !date) {
    return NextResponse.json({ error: 'clientId, service, and date are required' }, { status: 400 })
  }

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { name: true, email: true, _count: { select: { appointments: true } } },
  })

  const appointment = await db.appointment.create({
    data: {
      clientId,
      service,
      date: new Date(date),
      sessionNotes: sessionNotes ?? null,
    },
    include: { client: { select: { id: true, name: true, phone: true, email: true } } },
  })

  // Send confirmation email if client has email
  if (client?.email) {
    const isFirstVisit = client._count.appointments === 0
    sendConfirmationEmail({
      to: client.email,
      clientName: client.name,
      service,
      date: new Date(date),
      price: null,
      isFirstVisit,
    }).catch(err => console.error('[email] confirmation failed:', err))

    // Mark email as sent
    await db.appointment.update({
      where: { id: appointment.id },
      data: { emailConfirmationSent: true },
    })
  }

  return NextResponse.json(appointment, { status: 201 })
}
