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
  // Soporta rangos como "50–90 min" — toma el primer número
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 60;
}

// Suma la duración total de un array de nombres de servicio
export function totalDurationMin(serviceNames: string[], services: MinService[]): number {
  return serviceNames.reduce((total, name) => {
    const svc = services.find((s) => s.name === name);
    return total + (svc ? parseDurationMin(svc.duration) : 60);
  }, 0);
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
    // appt.service puede ser "Facial A + Facial B" — suma duraciones de cada parte
    const parts = appt.service.split(" + ").map((s) => s.trim());
    const dur = totalDurationMin(parts, services);
    const apptEnd = new Date(apptStart.getTime() + dur * 60_000);
    if (newStart < apptEnd && apptStart < newEnd) return appt;
  }
  return null;
}
