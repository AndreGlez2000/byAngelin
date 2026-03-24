import { db } from "@/lib/db";

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
  );
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    completedThisMonth,
    completedLastMonth,
    allCompleted,
    todayAppointments,
    lowStock,
  ] = await Promise.all([
    db.appointment.findMany({
      where: { status: "COMPLETED", date: { gte: startOfMonth } },
      select: { pricePaid: true, service: true },
    }),
    db.appointment.findMany({
      where: {
        status: "COMPLETED",
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      select: { pricePaid: true },
    }),
    db.appointment.findMany({
      where: { status: "COMPLETED" },
      select: { pricePaid: true, service: true },
    }),
    db.appointment.findMany({
      where: { date: { gte: startOfToday, lte: endOfToday } },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: "asc" },
    }),
    db.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        brand: true,
        unit: true,
        stock: true,
        lowStockAlert: true,
      },
    }),
  ]);

  const revenueThisMonth = completedThisMonth.reduce(
    (sum, a) => sum + (a.pricePaid ?? 0),
    0,
  );
  const revenueLastMonth = completedLastMonth.reduce(
    (sum, a) => sum + (a.pricePaid ?? 0),
    0,
  );

  const revenueByService: Record<string, { revenue: number; count: number }> =
    {};
  for (const appt of allCompleted) {
    const key = appt.service;
    if (!revenueByService[key])
      revenueByService[key] = { revenue: 0, count: 0 };
    revenueByService[key].revenue += appt.pricePaid ?? 0;
    revenueByService[key].count += 1;
  }

  return {
    revenueThisMonth,
    revenueLastMonth,
    appointmentsThisMonth: completedThisMonth.length,
    appointmentsLastMonth: completedLastMonth.length,
    revenueByService: Object.entries(revenueByService)
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    todayAppointments,
    lowStock: lowStock.filter((p) => p.stock < p.lowStockAlert),
  };
}

export async function getClientsList() {
  return db.client.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      _count: { select: { appointments: true } },
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
  });
}

export async function getProducts() {
  return db.product.findMany({
    where: { isActive: true },
    orderBy: [{ brand: "asc" }, { name: "asc" }],
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
  });
}

export async function getClientDetail(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      skinProfile: true,
      appointments: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          service: true,
          date: true,
          status: true,
          sessionNotes: true,
          pricePaid: true,
          paymentMethod: true,
        },
      },
    },
  });
}

export async function getAgendaData(from: Date, to: Date) {
  const [appointments, clients, services] = await Promise.all([
    db.appointment.findMany({
      where: { date: { gte: from, lte: to } },
      include: { client: { select: { id: true, name: true, phone: true } } },
      orderBy: { date: "asc" },
    }),
    db.client.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
    db.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        duration: true,
        price: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);
  return { appointments, clients, services };
}

export async function getServicesWithProducts() {
  return db.service.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      serviceProducts: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              unit: true,
              capacityPerUnit: true,
              costPerUnit: true,
            },
          },
        },
      },
    },
  });
}
