import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = await db.client.findMany({
    orderBy: { name: 'asc' },
    include: {
      skinProfile: true,
      _count: { select: { appointments: true } },
      appointments: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true },
      },
    },
  })
  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, skinProfile } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'name and phone are required' }, { status: 400 })
  }

  const client = await db.client.create({
    data: {
      name,
      phone,
      email: email ?? null,
      ...(skinProfile && {
        skinProfile: {
          create: {
            fecha: new Date(skinProfile.fecha),
            edad: skinProfile.edad ? Number(skinProfile.edad) : null,
            fototipo: skinProfile.fototipo || null,
            biotipo: skinProfile.biotipo || null,
            sensibilidad: skinProfile.sensibilidad || null,
            hidratacion: skinProfile.hidratacion || null,
            grosorPiel: skinProfile.grosorPiel || null,
            alteracionesCutaneas: skinProfile.alteracionesCutaneas || null,
            elasticidad: skinProfile.elasticidad || null,
            resistencias: skinProfile.resistencias || null,
            pigmentaciones: skinProfile.pigmentaciones || null,
            vitalidadOxigenacion: skinProfile.vitalidadOxigenacion || null,
            habitos: skinProfile.habitos || null,
            embarazo: skinProfile.embarazo || null,
            exposicionSolar: skinProfile.exposicionSolar || null,
            deporte: skinProfile.deporte || null,
            enfermedades: skinProfile.enfermedades || null,
            medicamentos: skinProfile.medicamentos || null,
            apoyoEnCasa: skinProfile.apoyoEnCasa || null,
            comentarios: skinProfile.comentarios || null,
          },
        },
      }),
    },
  })
  return NextResponse.json(client, { status: 201 })
}
