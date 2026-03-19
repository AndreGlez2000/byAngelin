import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/metrics
// Retorna KPIs del mes actual + histórico de ingresos + servicios más rentables + stock bajo
export async function GET(_req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  // Citas completadas este mes
  const completedThisMonth = await db.appointment.findMany({
    where: {
      status: 'COMPLETED',
      date: { gte: startOfMonth },
    },
    select: { pricePaid: true, service: true },
  })

  // Citas completadas mes pasado
  const completedLastMonth = await db.appointment.findMany({
    where: {
      status: 'COMPLETED',
      date: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
    select: { pricePaid: true },
  })

  const revenueThisMonth = completedThisMonth.reduce((sum, a) => sum + (a.pricePaid ?? 0), 0)
  const revenueLastMonth = completedLastMonth.reduce((sum, a) => sum + (a.pricePaid ?? 0), 0)

  // Ingresos por servicio este mes
  const revenueByService: Record<string, { revenue: number; count: number }> = {}
  for (const appt of completedThisMonth) {
    const key = appt.service
    if (!revenueByService[key]) revenueByService[key] = { revenue: 0, count: 0 }
    revenueByService[key].revenue += appt.pricePaid ?? 0
    revenueByService[key].count += 1
  }

  // Citas de hoy
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const todayAppointments = await db.appointment.findMany({
    where: { date: { gte: startOfToday, lte: endOfToday } },
    include: { client: { select: { name: true } } },
    orderBy: { date: 'asc' },
  })

  // Productos con stock bajo
  const lowStock = await db.product.findMany({
    where: {
      isActive: true,
      // stock < lowStockAlert — Prisma no soporta comparación de columnas directamente,
      // filtramos en JS después
    },
    select: { id: true, name: true, brand: true, unit: true, stock: true, lowStockAlert: true },
  })
  const lowStockFiltered = lowStock.filter(p => p.stock < p.lowStockAlert)

  return NextResponse.json({
    revenueThisMonth,
    revenueLastMonth,
    appointmentsThisMonth: completedThisMonth.length,
    appointmentsLastMonth: completedLastMonth.length,
    revenueByService: Object.entries(revenueByService)
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    todayAppointments,
    lowStock: lowStockFiltered,
  })
}
