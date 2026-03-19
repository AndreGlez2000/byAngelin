import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/inventory/restock
// Body: { productId, quantity, reason? }
// Suma `quantity` unidades al stock y crea un InventoryLog positivo
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { productId, quantity, reason } = body

  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    return NextResponse.json({ error: 'productId and positive quantity required' }, { status: 400 })
  }

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const [updated] = await db.$transaction([
    db.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    }),
    db.inventoryLog.create({
      data: {
        productId,
        delta: quantity,
        reason: reason ?? 'restock',
      },
    }),
  ])

  return NextResponse.json(updated)
}
