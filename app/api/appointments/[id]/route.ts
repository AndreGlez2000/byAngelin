import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deductInventory } from '@/lib/inventory'
import { AppointmentStatus } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const appointment = await db.appointment.findUnique({
    where: { id },
    include: { client: true },
  })
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(appointment)
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { service, date, status, sessionNotes, gcalEventId, pricePaid, paymentMethod } = body

  if (status && !Object.values(AppointmentStatus).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verificar si la cita va a pasar a COMPLETED (para descontar inventario)
  const wasCompleted = status === 'COMPLETED'
  let previousStatus: string | null = null

  if (wasCompleted) {
    const current = await db.appointment.findUnique({ where: { id }, select: { status: true, service: true } })
    previousStatus = current?.status ?? null
  }

  const appointment = await db.appointment.update({
    where: { id },
    data: {
      ...(service !== undefined && { service }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(status !== undefined && { status }),
      ...(sessionNotes !== undefined && { sessionNotes }),
      ...(gcalEventId !== undefined && { gcalEventId }),
      ...(pricePaid !== undefined && { pricePaid }),
      ...(paymentMethod !== undefined && { paymentMethod }),
    },
    include: { client: { select: { id: true, name: true, phone: true } } },
  })

  // Descontar inventario solo si cambió a COMPLETED (evita doble descuento)
  if (wasCompleted && previousStatus !== 'COMPLETED') {
    await deductInventory(id, appointment.service)
  }

  return NextResponse.json(appointment)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.appointment.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
