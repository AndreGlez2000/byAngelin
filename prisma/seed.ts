import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(__dirname, '../.env.local') })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── helpers ─────────────────────────────────────────────────────────────────
function thisWeek(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date()
  const monday = new Date(d)
  const day = d.getDay()
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(hour, minute, 0, 0)
  monday.setDate(monday.getDate() + dayOffset)
  return monday
}

function daysAgo(n: number, hour = 10): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d
}

// ── seed ────────────────────────────────────────────────────────────────────
async function main() {
  // Limpiar citas previas para evitar duplicados al re-seedear
  await prisma.appointment.deleteMany({})
  // Admin user
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123', 12)
  await prisma.user.upsert({
    where: { email: 'angelin@admin.com' },
    update: { password: hash },
    create: { email: 'angelin@admin.com', password: hash },
  })

  // ── Clientas de prueba ───────────────────────────────────────────────────

  const sofia = await prisma.client.upsert({
    where: { phone: '5551001001' },
    update: {},
    create: {
      name: 'Sofía Martínez',
      phone: '5551001001',
      email: 'sofia@example.com',
      skinProfile: {
        create: {
          fecha: new Date('2025-01-15'),
          edad: 28,
          fototipo: 'III',
          biotipo: 'Mixta',
          sensibilidad: 'Media',
          hidratacion: 'Normal',
          grosorPiel: 'Medio',
          elasticidad: 'Buena',
          habitos: 'Bebe 2L de agua, usa SPF diario',
          comentarios: 'Interesada en tratamientos anti-edad preventivos',
        },
      },
    },
  })

  const valentina = await prisma.client.upsert({
    where: { phone: '5551002002' },
    update: {},
    create: {
      name: 'Valentina Rojas',
      phone: '5551002002',
      email: 'vale@example.com',
      skinProfile: {
        create: {
          fecha: new Date('2025-03-01'),
          edad: 35,
          fototipo: 'IV',
          biotipo: 'Grasa',
          sensibilidad: 'Alta',
          hidratacion: 'Excesiva',
          grosorPiel: 'Grueso',
          alteracionesCutaneas: 'Acné leve, poros dilatados',
          pigmentaciones: 'Manchas post-acné',
          habitos: 'Estrés alto, poco sueño',
          medicamentos: 'Anticonceptivos orales',
          comentarios: 'Solicita control de brillo y tratamiento de manchas',
        },
      },
    },
  })

  const camila = await prisma.client.upsert({
    where: { phone: '5551003003' },
    update: {},
    create: {
      name: 'Camila Torres',
      phone: '5551003003',
      skinProfile: {
        create: {
          fecha: new Date('2025-06-10'),
          edad: 42,
          fototipo: 'II',
          biotipo: 'Seca',
          sensibilidad: 'Alta',
          hidratacion: 'Escasa',
          elasticidad: 'Regular',
          exposicionSolar: 'Alta (trabajo al aire libre)',
          deporte: 'Corre 3 veces por semana',
          comentarios: 'Piel deshidratada, busca tratamientos nutritivos',
        },
      },
    },
  })

  const isabela = await prisma.client.upsert({
    where: { phone: '5551004004' },
    update: {},
    create: {
      name: 'Isabela Herrera',
      phone: '5551004004',
      email: 'isa.herrera@example.com',
    },
  })

  const mariana = await prisma.client.upsert({
    where: { phone: '5551005005' },
    update: {},
    create: {
      name: 'Mariana Vega',
      phone: '5551005005',
      skinProfile: {
        create: {
          fecha: new Date('2025-09-20'),
          edad: 23,
          fototipo: 'III',
          biotipo: 'Normal',
          sensibilidad: 'Baja',
          hidratacion: 'Normal',
          grosorPiel: 'Fino',
          elasticidad: 'Muy buena',
          habitos: 'Rutina de skincare básica',
        },
      },
    },
  })

  const daniela = await prisma.client.upsert({
    where: { phone: '5551006006' },
    update: {},
    create: {
      name: 'Daniela Cruz',
      phone: '5551006006',
      email: 'dani.cruz@example.com',
    },
  })

  // ── Citas: semana actual ─────────────────────────────────────────────────
  const thisWeekAppts = [
    { client: sofia,     day: 0, hour: 10, service: 'Limpieza Facial Profunda',        status: 'CONFIRMED' as const },
    { client: valentina, day: 0, hour: 12, service: 'Tratamiento Anti-Acné',           status: 'CONFIRMED' as const },
    { client: camila,    day: 1, hour: 11, service: 'Hidratación Profunda',            status: 'CONFIRMED' as const },
    { client: isabela,   day: 2, hour: 10, service: 'Peeling Enzimático',              status: 'CONFIRMED' as const },
    { client: mariana,   day: 2, hour: 14, service: 'Radiofrecuencia Facial',         status: 'CONFIRMED' as const },
    { client: sofia,     day: 3, hour: 9,  service: 'Consulta de Seguimiento',         status: 'CONFIRMED' as const },
    { client: daniela,   day: 4, hour: 11, service: 'Limpieza Facial Básica',         status: 'CONFIRMED' as const },
    { client: camila,    day: 5, hour: 10, service: 'Masaje Facial Lifting',           status: 'CONFIRMED' as const },
  ]

  for (const a of thisWeekAppts) {
    await prisma.appointment.create({
      data: {
        clientId: a.client.id,
        service: a.service,
        date: thisWeek(a.day, a.hour),
        status: a.status,
      },
    }).catch(() => {/* skip if already exists */})
  }

  // ── Citas: historial pasado ──────────────────────────────────────────────
  const pastAppts = [
    { client: sofia,     dago: 7,  hour: 10, service: 'Limpieza Facial Profunda',    status: 'COMPLETED' as const, notes: 'Piel reactiva al inicio, mejoró al finalizar.' },
    { client: sofia,     dago: 30, hour: 11, service: 'Peeling Químico Suave',       status: 'COMPLETED' as const, notes: 'Se usó ácido mandélico al 20%.' },
    { client: valentina, dago: 14, hour: 12, service: 'Tratamiento Anti-Acné',       status: 'COMPLETED' as const, notes: 'Zona T muy activa, aplicar luz azul próxima sesión.' },
    { client: valentina, dago: 45, hour: 10, service: 'Limpieza Facial Profunda',    status: 'COMPLETED' as const },
    { client: camila,    dago: 10, hour: 11, service: 'Hidratación Profunda',        status: 'COMPLETED' as const, notes: 'Piel muy seca, recomendar sérum de ácido hialurónico.' },
    { client: camila,    dago: 60, hour: 9,  service: 'Masaje Facial Lifting',       status: 'COMPLETED' as const },
    { client: isabela,   dago: 5,  hour: 10, service: 'Consulta Inicial',            status: 'COMPLETED' as const, notes: 'Primera visita. Piel sensible, comenzar despacio.' },
    { client: mariana,   dago: 20, hour: 14, service: 'Radiofrecuencia Facial',      status: 'COMPLETED' as const },
    { client: daniela,   dago: 3,  hour: 11, service: 'Limpieza Facial Básica',      status: 'CANCELLED' as const },
    { client: daniela,   dago: 90, hour: 10, service: 'Peeling Enzimático',          status: 'COMPLETED' as const },
  ]

  for (const a of pastAppts) {
    await prisma.appointment.create({
      data: {
        clientId: a.client.id,
        service: a.service,
        date: daysAgo(a.dago, a.hour),
        status: a.status,
        sessionNotes: a.notes ?? null,
      },
    }).catch(() => {/* skip */})
  }

  // ── Catálogo de Servicios ────────────────────────────────────────────────
  const serviciosData = [
    {
      name: 'Facial Poro Detox Q.',
      category: 'Facial',
      duration: '80 min',
      price: '$950',
      description: 'Facial de limpieza profunda, con exfoliación enzimática, extracción, alta frecuencia, mascarilla desintoxicante que purifica el poro, gel hidratante, contorno de ojos y protector solar.',
    },
    {
      name: 'Facial Deep Hydra.',
      category: 'Facial',
      duration: '70 min',
      price: '$1,250',
      description: 'Facial de hidratación profunda con boost de nutrientes, exfoliación enzimática, tonificación hamamelis, alta frecuencia, coctelería de ácido ribonucleico y colágeno hidrolizado, mascarilla de arcilla purificante e hidratante, gel ácido hialurónico, humectante vitaminas A y E, contorno de ojos y protector solar.',
    },
    {
      name: 'Facial Oxycell.',
      category: 'Facial',
      duration: '50 min',
      price: '$1,250',
      description: 'Facial oxigenante, con exfoliación enzimática, tonificación hamamelis, alta frecuencia, ampolleta de ácido ribonucleico, boost de péptidos, mascarilla oxígeno (O2), hidratante D-Pantenol, contorno de ojos y protector solar.',
    },
    {
      name: 'Facial Tensotonificante 40+',
      category: 'Facial',
      duration: '60 min',
      price: '$1,650',
      description: 'Facial Tensotónico (Lifting) para pieles maduras, con exfoliación enzimática, drenaje linfático, alta frecuencia, coctelería de ácido hialurónico, colágeno hidrolizado y oligopéptidos, boost de elastina hidrolizada, mascarilla regeneradora efecto lifting, contorno de ojos y protector solar.',
    },
    {
      name: 'Facial Hydra Calm.',
      category: 'Facial',
      duration: '50 min',
      price: '$1,400',
      description: 'Facial hidratante y calmante para pieles sensibles, con exfoliación enzimática, alta frecuencia, tonificación provitamina B5, boost de lactobacillus, mascarilla reequilibrante centella asiática, humectante desensibilizante, contorno de ojos y protector solar.',
    },
    {
      name: 'Facial Personalizado.',
      category: 'Facial',
      duration: '50–90 min',
      price: '$500 – $1,800',
      description: 'Facial evaluado según diagnóstico cutáneo personalizado, supliendo las necesidades específicas de la piel. Productos y protocolo seleccionados según diagnóstico.',
    },
    {
      name: 'Drenaje Linfático Facial',
      category: 'Extra / Complemento',
      duration: '20–30 min',
      price: '$100',
      description: 'Técnica de drenaje linfático facial con brocha de cerdas suaves que ayuda a la liberación de toxinas, desinflamando los conductos linfáticos.',
    },
    {
      name: 'Rodillos de Cuarzo y Guasha',
      category: 'Extra / Complemento',
      duration: '15–20 min',
      price: '$100',
      description: 'Masajes intencionados que mejoran la tonicidad de los músculos faciales y ayudan a la microcirculación, fomentando la regeneración celular y absorción de nutrientes.',
    },
  ]

  // Only insert services that don't already exist (by name)
  const existingServices = await prisma.service.findMany({ select: { id: true, name: true } })
  const existingNames = new Set(existingServices.map(s => s.name))
  for (const s of serviciosData) {
    if (!existingNames.has(s.name)) {
      await prisma.service.create({ data: s })
    }
  }

  // Set costIngredients on services that have protocol data
  const costMap: Record<string, number> = {
    'Facial Poro Detox Q.':        448,
    'Facial Deep Hydra.':          531,
    'Facial Oxycell.':             562,
    'Facial Tensotonificante 40+': 812,
    'Facial Hydra Calm.':          631,
  }
  const allServices = await prisma.service.findMany({ select: { id: true, name: true } })
  for (const svc of allServices) {
    if (costMap[svc.name] !== undefined) {
      await prisma.service.update({ where: { id: svc.id }, data: { costIngredients: costMap[svc.name] } })
    }
  }

  // ── Productos de inventario ──────────────────────────────────────────────

  async function upsertProduct(
    name: string,
    brand: string | null,
    unit: string,
    capacityPerUnit: number,
    costPerUnit: number,
    stock: number,
  ) {
    return prisma.product.upsert({
      where: { name },
      create: { name, brand, unit, capacityPerUnit, costPerUnit, stock, lowStockAlert: 0.2 },
      update: { brand, unit, capacityPerUnit, costPerUnit },
    })
  }

  // Aspipro — en stock (1 unidad)
  const shampoo      = await upsertProduct('Shampoo Dermolimpiador Sense',         'Aspipro',   'ml',          120, 489.21, 1)
  const locionH      = await upsertProduct('Locion Hidratante P. Sensible',         'Aspipro',   'ml',          120, 471.30, 1)
  const mascarillaR  = await upsertProduct('Mascarilla Reequilibrante P. Sensible', 'Aspipro',   'gr',           50, 536.11, 1)
  const jungGel      = await upsertProduct('Jung Gel de Limpieza Facial',           'Aspipro',   'ml',          120, 699.00, 1)
  const jungLocion   = await upsertProduct('Jung Locion Equilibrante',              'Aspipro',   'ml',           60, 439.00, 1)
  const creamaPro    = await upsertProduct('Crema Pro Control Graso',               'Aspipro',   'ml',           60, 929.00, 1)
  const jungMasca    = await upsertProduct('Jung Mascarilla Opacificadora',         'Aspipro',   'gr',           75, 759.00, 1)
  const detoxy       = await upsertProduct('Detoxy Mask',                           'Aspipro',   'gr',           50, 387.96, 1)
  const o2Mask       = await upsertProduct('O2 Mask',                              'Aspipro',   'gr',           40, 350.92, 1)
  const vTense       = await upsertProduct('V Tense Mask',                         'Aspipro',   'aplicaciones',  5, 739.81, 1)
  const moldelina    = await upsertProduct('Moldelina Set',                         'Aspipro',   'aplicaciones',  5, 1017.59, 1)
  const ionoRNA      = await upsertProduct('Iono RNA',                             'Aspipro',   'aplicaciones',  5, 415.74, 1)
  const ah5050       = await upsertProduct('Ah 50/50',                             'Aspipro',   'aplicaciones',  5, 536.11, 1)
  const serumL       = await upsertProduct('Serum L',                              'Aspipro',   'ml',           45, 647.22, 1)
  const serumM       = await upsertProduct('Serum M',                              'Aspipro',   'ml',           45, 647.22, 1)
  const serumB       = await upsertProduct('Serum B',                              'Aspipro',   'ml',           45, 647.22, 1)
  const peelQ        = await upsertProduct('Peel-Q',                               'Aspipro',   'gr',          100, 647.22, 1)
  const revif        = await upsertProduct('Revif Oxygen',                         'Aspipro',   'gr',           30, 767.59, 1)
  const biEffect     = await upsertProduct('Bi-Effect Hidratante',                 'Aspipro',   'ml',          120, 693.51, 1)
  const microdacyn   = await upsertProduct('Microdacyn',                           'Bodega A.', 'ml',          250, 257.00, 1)
  const yoen         = await upsertProduct('Yoen Hidrotonic',                      null,        'ml',          120,   0.00, 1)

  // Videlca — stock = 0 (por comprar)
  const shambala   = await upsertProduct('Shambala',    'Videlca', 'gr', 50, 0, 0)
  const huit       = await upsertProduct('Huit',        'Videlca', 'gr', 30, 0, 0)
  const mite       = await upsertProduct('Mite',        'Videlca', 'gr', 30, 0, 0)
  const porcelain  = await upsertProduct('Porcelain Mineral', 'Videlca', 'gr', 50, 0, 0)
  const desincrust = await upsertProduct('Desincrustant', 'Videlca', 'ml', 120, 0, 0)
  await upsertProduct('Body & Soul Aromachology',           'Videlca', 'ml',           120, 0, 0)
  await upsertProduct('Oleum',                             'Videlca', 'ml',           120, 0, 0)
  await upsertProduct('Vial PDRN',                         'Videlca', 'aplicaciones',   5, 0, 0)
  await upsertProduct('Vial Vita C',                       'Videlca', 'aplicaciones',   5, 0, 0)
  await upsertProduct('Gel Conductor Neutro',              'Videlca', 'ml',           250, 0, 0)
  await upsertProduct('Serum Niacinamida',                 'Videlca', 'ml',            30, 0, 0)
  await upsertProduct('Serum Whitning milk',               'Videlca', 'ml',            30, 0, 0)
  await upsertProduct('AHA 20% Mandelico',                 'Videlca', 'ml',            30, 0, 0)
  await upsertProduct('PHA 20% Miel',                      'Videlca', 'ml',            30, 0, 0)
  await upsertProduct('Hilos Koreanos',                    'Videlca', 'aplicaciones',  10, 0, 0)
  await upsertProduct('Mascarilla Cacao',                  'Videlca', 'gr',            50, 0, 0)
  await upsertProduct('Mascarilla Whitning',               'Videlca', 'gr',            50, 0, 0)
  await upsertProduct('Mascarilla ARROZ Y COLAGENO',       'Videlca', 'gr',            50, 0, 0)
  await upsertProduct('Mascarilla Plástica BOTOX',         'Videlca', 'aplicaciones',   5, 0, 0)
  await upsertProduct('Mascarilla Plástica LIFTING',       'Videlca', 'aplicaciones',   5, 0, 0)
  await upsertProduct('Mascarilla Plástica FRUTOS ROJOS',  'Videlca', 'aplicaciones',   5, 0, 0)
  await upsertProduct('Mascarilla Plástica AH',            'Videlca', 'aplicaciones',   5, 0, 0)
  await upsertProduct('Acido Lactico',                     'Videlca', 'ml',            30, 0, 0)
  await upsertProduct('Acido Salicilico',                  'Videlca', 'ml',            30, 0, 0)
  await upsertProduct('Acido Glicolico',                   'Videlca', 'ml',            30, 0, 0)

  // ── ServiceProduct mappings ────────────────────────────────────────────────

  const svcMap = new Map(allServices.map(s => [s.name, s.id]))

  const mappings = [
    // Facial Poro Detox Q.
    { svc: 'Facial Poro Detox Q.',        prod: shampoo,    qty: 5  },
    { svc: 'Facial Poro Detox Q.',        prod: peelQ,      qty: 10 },
    { svc: 'Facial Poro Detox Q.',        prod: yoen,        qty: 2  },
    { svc: 'Facial Poro Detox Q.',        prod: desincrust,  qty: 3  },
    { svc: 'Facial Poro Detox Q.',        prod: microdacyn,  qty: 2  },
    { svc: 'Facial Poro Detox Q.',        prod: detoxy,      qty: 10 },
    { svc: 'Facial Poro Detox Q.',        prod: biEffect,    qty: 5  },
    { svc: 'Facial Poro Detox Q.',        prod: mite,        qty: 1  },
    { svc: 'Facial Poro Detox Q.',        prod: porcelain,   qty: 5  },
    // Facial Deep Hydra.
    { svc: 'Facial Deep Hydra.',          prod: shampoo,    qty: 5  },
    { svc: 'Facial Deep Hydra.',          prod: peelQ,      qty: 10 },
    { svc: 'Facial Deep Hydra.',          prod: yoen,        qty: 2  },
    { svc: 'Facial Deep Hydra.',          prod: ionoRNA,     qty: 1  },
    { svc: 'Facial Deep Hydra.',          prod: serumB,      qty: 5  },
    { svc: 'Facial Deep Hydra.',          prod: biEffect,    qty: 5  },
    { svc: 'Facial Deep Hydra.',          prod: shambala,    qty: 5  },
    { svc: 'Facial Deep Hydra.',          prod: mite,        qty: 1  },
    { svc: 'Facial Deep Hydra.',          prod: porcelain,   qty: 5  },
    // Facial Oxycell.
    { svc: 'Facial Oxycell.',             prod: shampoo,    qty: 5  },
    { svc: 'Facial Oxycell.',             prod: peelQ,      qty: 10 },
    { svc: 'Facial Oxycell.',             prod: yoen,        qty: 2  },
    { svc: 'Facial Oxycell.',             prod: ionoRNA,     qty: 1  },
    { svc: 'Facial Oxycell.',             prod: serumL,      qty: 5  },
    { svc: 'Facial Oxycell.',             prod: o2Mask,      qty: 10 },
    { svc: 'Facial Oxycell.',             prod: shambala,    qty: 5  },
    { svc: 'Facial Oxycell.',             prod: mite,        qty: 1  },
    { svc: 'Facial Oxycell.',             prod: porcelain,   qty: 5  },
    // Facial Tensotonificante 40+
    { svc: 'Facial Tensotonificante 40+', prod: shampoo,    qty: 5  },
    { svc: 'Facial Tensotonificante 40+', prod: peelQ,      qty: 10 },
    { svc: 'Facial Tensotonificante 40+', prod: yoen,        qty: 2  },
    { svc: 'Facial Tensotonificante 40+', prod: ah5050,      qty: 1  },
    { svc: 'Facial Tensotonificante 40+', prod: serumB,      qty: 5  },
    { svc: 'Facial Tensotonificante 40+', prod: vTense,      qty: 1  },
    { svc: 'Facial Tensotonificante 40+', prod: moldelina,   qty: 1  },
    { svc: 'Facial Tensotonificante 40+', prod: mite,        qty: 1  },
    { svc: 'Facial Tensotonificante 40+', prod: porcelain,   qty: 5  },
    // Facial Hydra Calm.
    { svc: 'Facial Hydra Calm.',          prod: shampoo,    qty: 5  },
    { svc: 'Facial Hydra Calm.',          prod: peelQ,      qty: 10 },
    { svc: 'Facial Hydra Calm.',          prod: locionH,     qty: 2  },
    { svc: 'Facial Hydra Calm.',          prod: serumM,      qty: 5  },
    { svc: 'Facial Hydra Calm.',          prod: mascarillaR, qty: 5  },
    { svc: 'Facial Hydra Calm.',          prod: huit,        qty: 2  },
    { svc: 'Facial Hydra Calm.',          prod: revif,       qty: 5  },
    { svc: 'Facial Hydra Calm.',          prod: mite,        qty: 1  },
    { svc: 'Facial Hydra Calm.',          prod: porcelain,   qty: 5  },
    // Facial Control Oil
    { svc: 'Facial Control Oil',          prod: jungGel,    qty: 5  },
    { svc: 'Facial Control Oil',          prod: peelQ,      qty: 10 },
    { svc: 'Facial Control Oil',          prod: jungLocion,  qty: 5  },
    { svc: 'Facial Control Oil',          prod: jungMasca,   qty: 5  },
    { svc: 'Facial Control Oil',          prod: creamaPro,   qty: 5  },
    { svc: 'Facial Control Oil',          prod: biEffect,    qty: 5  },
    { svc: 'Facial Control Oil',          prod: mite,        qty: 1  },
    { svc: 'Facial Control Oil',          prod: porcelain,   qty: 5  },
  ]

  // Ensure "Facial Control Oil" service exists
  if (!svcMap.has('Facial Control Oil')) {
    const newSvc = await prisma.service.create({
      data: { name: 'Facial Control Oil', category: 'Facial', duration: '50 min', price: '$1,000', isActive: true },
    })
    svcMap.set('Facial Control Oil', newSvc.id)
  }

  for (const m of mappings) {
    const serviceId = svcMap.get(m.svc)
    if (!serviceId) { console.warn(`Service not found: ${m.svc}`); continue }
    await prisma.serviceProduct.upsert({
      where: { serviceId_productId: { serviceId, productId: m.prod.id } },
      create: { serviceId, productId: m.prod.id, quantityUsed: m.qty },
      update: { quantityUsed: m.qty },
    })
  }

  console.log('✓ Seed completo — 6 clientas, citas esta semana + historial + 9 servicios + 46 productos + mappings')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
