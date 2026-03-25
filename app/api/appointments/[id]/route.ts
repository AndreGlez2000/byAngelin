import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deductInventory } from "@/lib/inventory";
import { AppointmentStatus } from "@prisma/client";
import { parseDurationMin, findOverlap } from "@/lib/appointments";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const appointment = await db.appointment.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!appointment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appointment);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    service,
    date,
    status,
    sessionNotes,
    gcalEventId,
    pricePaid,
    paymentMethod,
  } = body;

  if (status && !Object.values(AppointmentStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Fetch current appointment once — used by overlap check, wasCompleted logic, and gcal sync
  const current = await db.appointment.findUnique({
    where: { id },
    select: { date: true, service: true, status: true, gcalEventId: true },
  });
  if (!current)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Overlap check (only if date or service is changing)
  if (date !== undefined || service !== undefined) {
    const newStart = date !== undefined ? new Date(date) : current.date;
    const newService = service !== undefined ? service : current.service;

    const svc = await db.service.findFirst({
      where: { name: newService },
      select: { duration: true },
    });
    const durationMin = svc ? parseDurationMin(svc.duration) : 60;
    const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

    const candidates = await db.appointment.findMany({
      where: {
        id: { not: id },
        date: {
          gte: new Date(newStart.getTime() - 4 * 60 * 60_000),
          lte: newEnd,
        },
      },
      select: { id: true, date: true, service: true },
    });

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
  }

  // wasCompleted uses current.status fetched above — no second DB call needed
  const wasCompleted = status === "COMPLETED" && current.status !== "COMPLETED";

  const appointment = await db.appointment.update({
    where: { id },
    data: {
      ...(service !== undefined && { service }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(status !== undefined && { status }),
      ...(sessionNotes !== undefined && { sessionNotes }),
      ...(gcalEventId !== undefined && { gcalEventId }),
      ...(pricePaid !== undefined && { pricePaid }),
      ...(paymentMethod !== undefined && { paymentMethod }),
    },
    include: { client: { select: { id: true, name: true, phone: true } } },
  });

  if (wasCompleted) {
    await deductInventory(id, appointment.service);
  }

  // Sync Google Calendar when date or service changes
  if (current.gcalEventId && (date !== undefined || service !== undefined)) {
    const newStart = date !== undefined ? new Date(date) : current.date;
    const newService = service !== undefined ? service : current.service;
    const svcData = await db.service.findFirst({
      where: { name: newService },
      select: { duration: true },
    });
    const gcalDuration = svcData ? parseDurationMin(svcData.duration) : 60;

    updateCalendarEvent({
      eventId: current.gcalEventId,
      summary: `${newService} — ${appointment.client.name}`,
      start: newStart,
      durationMin: gcalDuration,
    }).catch((err) => console.error("[gcal] update failed:", err));
  }

  return NextResponse.json(appointment);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Fetch gcalEventId before deletion so we can clean up the calendar event
  const appt = await db.appointment.findUnique({
    where: { id },
    select: { gcalEventId: true },
  });

  await db.appointment.delete({ where: { id } });

  // Fire-and-forget — calendar cleanup does not block the response
  if (appt?.gcalEventId) {
    deleteCalendarEvent(appt.gcalEventId).catch((err) =>
      console.error("[gcal] delete failed:", err),
    );
  }

  return new NextResponse(null, { status: 204 });
}
