import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/inventory — lista todos los productos con su stock actual
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      brand: true,
      unit: true,
      capacityPerUnit: true,
      costPerUnit: true,
      stock: true,
      lowStockAlert: true,
    },
  })

  return NextResponse.json(products)
}

// POST /api/inventory — crear producto
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, brand, unit, capacityPerUnit, costPerUnit, lowStockAlert, stock } = body

  if (!name || !unit || !capacityPerUnit || !costPerUnit) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const product = await db.product.create({
    data: {
      name,
      brand: brand || null,
      unit,
      capacityPerUnit: Number(capacityPerUnit),
      costPerUnit: Number(costPerUnit),
      lowStockAlert: lowStockAlert != null ? Number(lowStockAlert) : 1,
      stock: stock != null ? Number(stock) : 0,
    },
    select: { id: true, name: true, brand: true, unit: true, capacityPerUnit: true, costPerUnit: true, stock: true, lowStockAlert: true },
  })

  return NextResponse.json(product, { status: 201 })
}
