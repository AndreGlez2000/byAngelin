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
    include: {
      serviceProducts: {
        include: { product: { select: { id: true, name: true, brand: true, unit: true, capacityPerUnit: true, costPerUnit: true } } },
      },
    },
  })
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, category, duration, price, description, products } = await req.json()
  if (!name || !category || !duration || !price) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Calcular costo de ingredientes a partir de los productos vinculados
  let costIngredients: number | null = null
  if (Array.isArray(products) && products.length > 0) {
    const productIds = products.map((p: { productId: string }) => p.productId)
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, costPerUnit: true, capacityPerUnit: true },
    })
    const priceMap = Object.fromEntries(dbProducts.map(p => [p.id, p]))
    costIngredients = products.reduce((sum: number, p: { productId: string; quantityUsed: number }) => {
      const prod = priceMap[p.productId]
      if (!prod) return sum
      return sum + (p.quantityUsed * prod.costPerUnit) / prod.capacityPerUnit
    }, 0)
  }

  const service = await db.service.create({
    data: {
      name, category, duration, price,
      description: description ?? null,
      costIngredients,
      serviceProducts: Array.isArray(products) && products.length > 0
        ? { create: products.map((p: { productId: string; quantityUsed: number }) => ({ productId: p.productId, quantityUsed: p.quantityUsed })) }
        : undefined,
    },
    include: {
      serviceProducts: {
        include: { product: { select: { id: true, name: true, brand: true, unit: true, capacityPerUnit: true, costPerUnit: true } } },
      },
    },
  })
  return NextResponse.json(service, { status: 201 })
}
