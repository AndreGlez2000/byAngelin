import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/inventory/[id] — editar producto
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, brand, unit, capacityPerUnit, costPerUnit, lowStockAlert } = body

  const product = await db.product.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(brand !== undefined && { brand: brand || null }),
      ...(unit !== undefined && { unit }),
      ...(capacityPerUnit !== undefined && { capacityPerUnit: Number(capacityPerUnit) }),
      ...(costPerUnit !== undefined && { costPerUnit: Number(costPerUnit) }),
      ...(lowStockAlert !== undefined && { lowStockAlert: Number(lowStockAlert) }),
    },
    select: { id: true, name: true, brand: true, unit: true, capacityPerUnit: true, costPerUnit: true, stock: true, lowStockAlert: true },
  })

  return NextResponse.json(product)
}

// DELETE /api/inventory/[id] — desactivar producto (soft delete)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.product.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
