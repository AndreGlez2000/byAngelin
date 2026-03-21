import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { products, ...rest } = await req.json()

  let costIngredients: number | null | undefined = undefined
  if (Array.isArray(products)) {
    if (products.length === 0) {
      costIngredients = null
    } else {
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

    // Reemplazar todos los serviceProducts
    await db.serviceProduct.deleteMany({ where: { serviceId: id } })
    if (products.length > 0) {
      await db.serviceProduct.createMany({
        data: products.map((p: { productId: string; quantityUsed: number }) => ({
          serviceId: id,
          productId: p.productId,
          quantityUsed: p.quantityUsed,
        })),
      })
    }
  }

  const service = await db.service.update({
    where: { id },
    data: { ...rest, ...(costIngredients !== undefined ? { costIngredients } : {}) },
    include: {
      serviceProducts: {
        include: { product: { select: { id: true, name: true, brand: true, unit: true, capacityPerUnit: true, costPerUnit: true } } },
      },
    },
  })
  return NextResponse.json(service)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.service.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
