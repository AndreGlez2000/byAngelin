import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const onlyActive = searchParams.get('active') === 'true'

  const services = await db.service.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, category, duration, price, description } = await req.json()
  if (!name || !category || !duration || !price) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  const service = await db.service.create({
    data: { name, category, duration, price, description: description ?? null },
  })
  return NextResponse.json(service, { status: 201 })
}
