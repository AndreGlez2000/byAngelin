import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

  const appointment = await db.appointment.create({
    data: {
      clientId,
      service,
      date: new Date(date),
      sessionNotes: sessionNotes ?? null,
    },
    include: { client: { select: { id: true, name: true, phone: true } } },
  })
  return NextResponse.json(appointment, { status: 201 })
}
