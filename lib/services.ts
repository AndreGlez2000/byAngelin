export interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

export const SERVICES: Service[] = [
  { id: "facial-basico",        name: "Facial Básico",              durationMin: 60,  price: 350 },
  { id: "facial-profundo",      name: "Facial Profundo",            durationMin: 90,  price: 550 },
  { id: "hidratacion",          name: "Hidratación Intensiva",      durationMin: 60,  price: 400 },
  { id: "foterapia",            name: "Fototerapia Facial",         durationMin: 45,  price: 300 },
  { id: "limpieza-profunda",    name: "Limpieza Profunda",          durationMin: 75,  price: 450 },
  { id: "tratamiento-acne",     name: "Tratamiento para Acné",      durationMin: 60,  price: 500 },
  { id: "exfoliacion",          name: "Exfoliación Química",        durationMin: 45,  price: 350 },
  { id: "masaje-facial",        name: "Masaje Facial Relajante",    durationMin: 30,  price: 250 },
];

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getServiceNames(): string[] {
  return SERVICES.map((s) => s.name);
}
