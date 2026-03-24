type MinAppointment = {
  id: string;
  date: string;
  service: string;
};

type MinService = {
  name: string;
  duration: string;
};

export function parseDurationMin(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 60;
}

export function findOverlap<A extends MinAppointment>(
  newStart: Date,
  newDurationMin: number,
  appointments: A[],
  services: MinService[],
  excludeId?: string,
): A | null {
  const newEnd = new Date(newStart.getTime() + newDurationMin * 60_000);
  for (const appt of appointments) {
    if (excludeId && appt.id === excludeId) continue;
    const apptStart = new Date(appt.date);
    const svc = services.find((s) => s.name === appt.service);
    const dur = svc ? parseDurationMin(svc.duration) : 60;
    const apptEnd = new Date(apptStart.getTime() + dur * 60_000);
    if (newStart < apptEnd && apptStart < newEnd) return appt;
  }
  return null;
}
