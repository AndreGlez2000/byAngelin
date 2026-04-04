export const dynamic = "force-dynamic";
import { getAgendaData } from "@/lib/queries";
import { AgendaClient } from "./_components/AgendaClient";

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateParam(raw: string | string[] | undefined): Date | null {
  const s = typeof raw === "string" ? raw : undefined;
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const focusDate = parseDateParam(searchParams.date) ?? new Date();
  const weekStart = mondayOf(focusDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const data = await getAgendaData(weekStart, weekEnd);
  const initialAppointmentId =
    typeof searchParams.appointmentId === "string"
      ? searchParams.appointmentId
      : null;

  return (
    <AgendaClient
      initialAppointments={data.appointments}
      initialClients={data.clients}
      initialServices={data.services}
      initialFocusDate={focusDate.toISOString()}
      initialAppointmentId={initialAppointmentId}
    />
  );
}
