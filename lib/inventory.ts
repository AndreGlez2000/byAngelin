import { db } from '@/lib/db'

/**
 * Descuenta inventario para una cita completada.
 * Busca el servicio por nombre, obtiene sus ingredientes y registra
 * el consumo de cada producto en InventoryLog.
 *
 * delta = -(quantityUsed / capacityPerUnit)  [fracción de envase]
 */
export async function deductInventory(appointmentId: string, serviceName: string) {
  // Busca el servicio por nombre
  const service = await db.service.findFirst({
    where: { name: serviceName },
    include: {
      serviceProducts: {
        include: { product: true },
      },
    },
  })

  if (!service || service.serviceProducts.length === 0) return

  await Promise.all(
    service.serviceProducts.map(async ({ product, quantityUsed }) => {
      const delta = -(quantityUsed / product.capacityPerUnit)

      await db.$transaction([
        db.product.update({
          where: { id: product.id },
          data: { stock: { increment: delta } },
        }),
        db.inventoryLog.create({
          data: {
            productId: product.id,
            appointmentId,
            delta,
            reason: 'service_deduction',
          },
        }),
      ])
    }),
  )
}
