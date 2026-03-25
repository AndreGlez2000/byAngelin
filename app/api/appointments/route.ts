import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { parseDurationMin, findOverlap } from "@/lib/appointments";
import { createCalendarEvent } from "@/lib/google-calendar";

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
    include: { client: { select: { id: true, name: true, phone: true } } },
  });
  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, service, date, sessionNotes } = body;

  if (!clientId || !service || !date) {
    return NextResponse.json(
      { error: "clientId, service, and date are required" },
      { status: 400 },
    );
  }

  // Overlap check
  const newStart = new Date(date);
  const svc = await db.service.findFirst({
    where: { name: service },
    select: { duration: true },
  });
  const durationMin = svc ? parseDurationMin(svc.duration) : 60;
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
      service,
      date: new Date(date),
      sessionNotes: sessionNotes ?? null,
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
      service,
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
  const gcalEventId = await createCalendarEvent({
    summary: `${service} — ${client?.name ?? "Cliente"}`,
    start: new Date(date),
    durationMin,
  }).catch((err) => {
    console.error("[gcal] create failed:", err);
    return null;
  });

  if (gcalEventId) {
    await db.appointment.update({
      where: { id: appointment.id },
      data: { gcalEventId },
    });
  }

  return NextResponse.json(appointment, { status: 201 });
}
