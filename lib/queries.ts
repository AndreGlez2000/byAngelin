import { db } from "@/lib/db";

export type ServiceStat = {
  service: string;
  count: number;
  revenue: number;
  appointments: {
    id: string;
    date: Date;
    clientId: string;
    clientName: string;
    pricePaid: number | null;
    paymentMethod: string | null;
  }[];
};

// month: cualquier Date dentro del mes deseado. Default: mes actual.
export async function getDashboardMetrics(month?: Date) {
  const ref = month ?? new Date();
  const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
  const startOfLastMonth = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  const endOfLastMonth = new Date(ref.getFullYear(), ref.getMonth(), 0, 23, 59, 59);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [completedThisMonth, completedLastMonth, todayAppointments] =
    await Promise.all([
      db.appointment.findMany({
        where: {
          status: "COMPLETED",
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: {
          id: true,
          service: true,
          pricePaid: true,
          paymentMethod: true,
          date: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      }),
      db.appointment.findMany({
        where: {
          status: "COMPLETED",
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        select: { pricePaid: true },
      }),
      db.appointment.findMany({
        where: { date: { gte: startOfToday, lte: endOfToday } },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { date: "asc" },
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

  // Agrupar por servicio con lista de citas para click-through
  const serviceMap = new Map<string, ServiceStat>();
  for (const appt of completedThisMonth) {
    const existing = serviceMap.get(appt.service);
    const apptEntry = {
      id: appt.id,
      date: appt.date,
      clientId: appt.client.id,
      clientName: appt.client.name,
      pricePaid: appt.pricePaid,
      paymentMethod: appt.paymentMethod,
    };
    if (existing) {
      existing.count += 1;
      existing.revenue += appt.pricePaid ?? 0;
      existing.appointments.push(apptEntry);
    } else {
      serviceMap.set(appt.service, {
        service: appt.service,
        count: 1,
        revenue: appt.pricePaid ?? 0,
        appointments: [apptEntry],
      });
    }
  }

  const serviceStats = Array.from(serviceMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  // Lista plana de todas las citas del mes para el modal de "Citas completadas"
  const allCompletedThisMonth = completedThisMonth.map((a) => ({
    id: a.id,
    date: a.date,
    service: a.service,
    clientId: a.client.id,
    clientName: a.client.name,
    pricePaid: a.pricePaid,
    paymentMethod: a.paymentMethod,
  }));

  return {
    revenueThisMonth,
    revenueLastMonth,
    appointmentsThisMonth: completedThisMonth.length,
    appointmentsLastMonth: completedLastMonth.length,
    serviceStats,
    allCompletedThisMonth,
    todayAppointments,
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
          services: {
            select: {
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true,
                },
              },
            },
          },
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
      include: {
        client: { select: { id: true, name: true, phone: true } },
        receipt: {
          select: { id: true, totalAmount: true, paymentMethod: true },
        },
        services: {
          include: {
            service: {
              select: { id: true, name: true, price: true, duration: true },
            },
          },
        },
      },
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
