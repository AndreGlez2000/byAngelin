import { db } from '@/lib/db'

export async function createReceipt(
  appointmentId: string,
  totalAmount: number,
  paymentMethod: string,
  notes?: string,
) {
  // Idempotent — if receipt already exists, skip (appointment could be re-completed edge case)
  const existing = await db.receipt.findUnique({ where: { appointmentId } })
  if (existing) return existing

  return db.receipt.create({
    data: {
      appointmentId,
      totalAmount,
      paymentMethod,
      notes: notes ?? null,
    },
  })
}

export async function getReceiptWithDetails(appointmentId: string) {
  return db.receipt.findUnique({
    where: { appointmentId },
    include: {
      appointment: {
        include: {
          client: { select: { id: true, name: true, phone: true, email: true } },
          services: {
            include: {
              service: { select: { id: true, name: true, price: true, duration: true } },
            },
          },
        },
      },
    },
  })
}
