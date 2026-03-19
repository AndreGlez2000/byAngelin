import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

type Ctx = { params: { id: string } }

const skinFields = [
  'fecha', 'edad', 'fototipo', 'biotipo', 'sensibilidad', 'hidratacion',
  'grosorPiel', 'alteracionesCutaneas', 'elasticidad', 'resistencias',
  'pigmentaciones', 'vitalidadOxigenacion', 'habitos', 'embarazo',
  'exposicionSolar', 'deporte', 'enfermedades', 'medicamentos',
  'apoyoEnCasa', 'comentarios',
] as const

function pickFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const f of skinFields) {
    if (f in body) {
      if (f === 'fecha') data.fecha = new Date(body.fecha as string)
      else if (f === 'edad') data.edad = body.edad != null ? Number(body.edad) : null
      else data[f] = body[f] ?? null
    }
  }
  return data
}

// POST /api/clients/[id]/skin-profile — crear ficha de piel
export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.fecha) return NextResponse.json({ error: 'fecha requerida' }, { status: 400 })

  const profile = await db.skinProfile.create({
    data: {
      clientId: params.id,
      ...pickFields(body),
    } as Parameters<typeof db.skinProfile.create>[0]['data'],
  })

  return NextResponse.json(profile, { status: 201 })
}

// PATCH /api/clients/[id]/skin-profile — actualizar ficha de piel
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const profile = await db.skinProfile.update({
    where: { clientId: params.id },
    data: pickFields(body) as Parameters<typeof db.skinProfile.update>[0]['data'],
  })

  return NextResponse.json(profile)
}
