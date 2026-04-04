import { db } from '@/lib/db'

/**
 * Descuenta inventario para una cita completada.
 * Acepta uno o más nombres de servicio — suma el consumo de todos.
 * delta = -(quantityUsed / capacityPerUnit)  [fracción de envase]
 */
export async function deductInventory(appointmentId: string, serviceNames: string | string[]) {
  const names = Array.isArray(serviceNames) ? serviceNames : [serviceNames]

  const services = await db.service.findMany({
    where: { name: { in: names } },
    include: {
      serviceProducts: {
        include: { product: true },
      },
    },
  })

  if (services.length === 0) return

  // Acumular consumo total por producto (una cita puede usar el mismo producto en 2 servicios)
  const productDeltas = new Map<string, { productId: string; delta: number }>()

  for (const service of services) {
    for (const { product, quantityUsed } of service.serviceProducts) {
      const delta = -(quantityUsed / product.capacityPerUnit)
      const existing = productDeltas.get(product.id)
      if (existing) {
        existing.delta += delta
      } else {
        productDeltas.set(product.id, { productId: product.id, delta })
      }
    }
  }

  await Promise.all(
    Array.from(productDeltas.values()).map(async ({ productId, delta }) => {
      await db.$transaction([
        db.product.update({
          where: { id: productId },
          data: { stock: { increment: delta } },
        }),
        db.inventoryLog.create({
          data: {
            productId,
            appointmentId,
            delta,
            reason: 'service_deduction',
          },
        }),
      ])
    }),
  )
}
