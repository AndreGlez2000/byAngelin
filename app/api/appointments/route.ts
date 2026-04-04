import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { parseDurationMin, findOverlap, totalDurationMin } from "@/lib/appointments";
import { createCalendarEvent } from "@/lib/google-calendar";

async function resolveServices(serviceIds: string[]) {
  const svcs = await db.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, name: true, duration: true, price: true },
  });
  const label = svcs.map((s) => s.name).join(" + ");
  const durationMin = totalDurationMin(
    svcs.map((s) => s.name),
    svcs,
  );
  return { svcs, label, durationMin };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const appointments = await db.appointment.findMany({
    where: {
      ...(from && { date: { gte: new Date(from) } }),
      ...(to && { date: { lte: new Date(to) } }),
    },
    orderBy: { date: "asc" },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      services: { include: { service: { select: { id: true, name: true, price: true } } } },
      receipt: { select: { id: true, totalAmount: true, paymentMethod: true } },
    },
  });
  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, service, serviceIds, date, sessionNotes } = body;

  if (!clientId || (!service && (!serviceIds || serviceIds.length === 0)) || !date) {
    return NextResponse.json(
      { error: "clientId, service (or serviceIds), and date are required" },
      { status: 400 },
    );
  }

  // Resolve service label and duration
  let resolvedService = service as string;
  let durationMin: number;
  let resolvedServiceIds: string[] | undefined;

  if (serviceIds?.length) {
    const resolved = await resolveServices(serviceIds as string[]);
    resolvedService = resolved.label;
    durationMin = resolved.durationMin;
    resolvedServiceIds = serviceIds as string[];
  } else {
    // Overlap check (legacy single-service path)
    const svc = await db.service.findFirst({
      where: { name: service },
      select: { duration: true },
    });
    durationMin = svc ? parseDurationMin(svc.duration) : 60;
  }

  // Overlap check
  const newStart = new Date(date);
  const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

  // Fetch appointments that could overlap (window: newStart - 4h to newEnd)
  const candidates = await db.appointment.findMany({
    where: {
      date: {
        gte: new Date(newStart.getTime() - 4 * 60 * 60_000),
        lte: newEnd,
      },
    },
    select: { id: true, date: true, service: true },
  });

  // Get durations for all candidate services
  const candidateServiceNames = Array.from(
    new Set(candidates.map((c) => c.service)),
  );
  const candidateServices = await db.service.findMany({
    where: { name: { in: candidateServiceNames } },
    select: { name: true, duration: true },
  });

  const conflict = findOverlap(
    newStart,
    durationMin,
    candidates.map((c) => ({ ...c, date: c.date.toISOString() })),
    candidateServices,
  );
  if (conflict) {
    return NextResponse.json(
      { error: "Ya existe una cita en ese horario" },
      { status: 409 },
    );
  }

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      email: true,
      _count: { select: { appointments: true } },
    },
  });

  const appointment = await db.appointment.create({
    data: {
      clientId,
      service: resolvedService,
      date: new Date(date),
      sessionNotes: sessionNotes ?? null,
      ...(resolvedServiceIds?.length && {
        services: {
          create: resolvedServiceIds.map((serviceId: string) => ({ serviceId })),
        },
      }),
    },
    include: {
      client: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  // Send confirmation email if client has email
  if (client?.email) {
    const isFirstVisit = client._count.appointments === 0;
    sendConfirmationEmail({
      to: client.email,
      clientName: client.name,
      service: resolvedService,
      date: new Date(date),
      price: null,
      isFirstVisit,
    }).catch((err) => console.error("[email] confirmation failed:", err));

    // Mark email as sent
    await db.appointment.update({
      where: { id: appointment.id },
      data: { emailConfirmationSent: true },
    });
  }

  // Create Google Calendar event — failure does NOT block appointment creation
  const gcalUser = session.user?.id
    ? { id: session.user.id }
    : session.user?.email
      ? await db.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

  const gcalEventId = gcalUser?.id
    ? await createCalendarEvent({
        userId: gcalUser.id,
        summary: `${resolvedService} — ${client?.name ?? "Cliente"}`,
        start: new Date(date),
        durationMin,
      }).catch((err) => {
        console.error("[gcal] create failed:", err);
        return null;
      })
    : null;

  if (gcalEventId) {
    await db.appointment.update({
      where: { id: appointment.id },
      data: { gcalEventId },
    });
  }

  return NextResponse.json(appointment, { status: 201 });
}
