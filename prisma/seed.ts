import { config } from 'dotenv'
import path from 'path'

// Carga el env correcto según NODE_ENV:
//   development → .env.development.local (BD local Docker)
//   production  → .env.local (Supabase)
const envFile = process.env.NODE_ENV === 'production' ? '.env.local' : '.env.development.local'
config({ path: path.resolve(__dirname, '..', envFile) })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Fechas evergreen para que el dashboard siempre tenga datos del mes actual:
// - month=1 => hace 2 meses
// - month=2 => mes pasado
// - month=3 => mes actual
const now = new Date()
const seedStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)

function d(month: number, day: number, hour: number, min = 0): Date {
  return new Date(
    seedStart.getFullYear(),
    seedStart.getMonth() + (month - 1),
    day,
    hour,
    min,
    0,
    0,
  )
}

function costPerUse(qty: number, costPerUnit: number, capacityPerUnit: number) {
  return (qty * costPerUnit) / capacityPerUnit
}

async function main() {
  // ── Wipe total ────────────────────────────────────────────────────────────
  await prisma.inventoryLog.deleteMany()
  await prisma.serviceProduct.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.skinProfile.deleteMany()
  await prisma.client.deleteMany()
  await prisma.service.deleteMany()
  await prisma.product.deleteMany()
  console.log('✓ Base limpia')

  // ── Admin ─────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123', 12)
  await prisma.user.upsert({
    where: { email: 'angelin@admin.com' },
    update: { password: hash },
    create: { email: 'angelin@admin.com', password: hash },
  })

  // ── Productos ─────────────────────────────────────────────────────────────
  // stock = nivel realista después de ~3 meses de uso
  // lowStockAlert = 10% de capacityPerUnit

  type P = { id: string; costPerUnit: number; capacityPerUnit: number }

  async function mkProduct(
    name: string, brand: string | null, unit: string,
    capacity: number, cost: number, stock: number,
  ): Promise<P> {
    const p = await prisma.product.create({
      data: {
        name, brand, unit,
        capacityPerUnit: capacity,
        costPerUnit: cost,
        stock,
        lowStockAlert: Math.round(capacity * 0.1 * 100) / 100,
      },
    })
    return { id: p.id, costPerUnit: cost, capacityPerUnit: capacity }
  }

  // Aspipro — en stock, niveles realistas post-uso
  const shampoo    = await mkProduct('Shampoo Dermolimpiador Sense',         'Aspipro', 'ml',          120,  489.21,  72)
  const locionH    = await mkProduct('Locion Hidratante P. Sensible',         'Aspipro', 'ml',          120,  471.30,  88)
  const mascarR    = await mkProduct('Mascarilla Reequilibrante P. Sensible', 'Aspipro', 'gr',           50,  536.11,  38)
  const jungGel    = await mkProduct('Jung Gel de Limpieza Facial',           'Aspipro', 'ml',          120,  699.00,  75)
  const jungLoc    = await mkProduct('Jung Locion Equilibrante',              'Aspipro', 'ml',           60,  439.00,  28)
  const creamaPro  = await mkProduct('Crema Pro Control Graso',               'Aspipro', 'ml',           60,  929.00,  42)
  const jungMasca  = await mkProduct('Jung Mascarilla Opacificadora',         'Aspipro', 'gr',           75,  759.00,  55)
  const detoxy     = await mkProduct('Detoxy Mask',                           'Aspipro', 'gr',           50,  387.96,  18)  // bajo
  const o2Mask     = await mkProduct('O2 Mask',                              'Aspipro', 'gr',           40,  350.92,  22)
  const vTense     = await mkProduct('V Tense Mask',                         'Aspipro', 'aplicaciones',  5,  739.81,   3)
  const moldelina  = await mkProduct('Moldelina Set',                         'Aspipro', 'aplicaciones',  5, 1017.59,   2)
  const ionoRNA    = await mkProduct('Iono RNA',                             'Aspipro', 'aplicaciones',  5,  415.74,   4)
  const ah5050     = await mkProduct('Ah 50/50',                             'Aspipro', 'aplicaciones',  5,  536.11,   3)
  const serumL     = await mkProduct('Serum L',                              'Aspipro', 'ml',           45,  647.22,  35)
  const serumM     = await mkProduct('Serum M',                              'Aspipro', 'ml',           45,  647.22,  30)
  const serumB     = await mkProduct('Serum B',                              'Aspipro', 'ml',           45,  647.22,  18)  // bajo
  const peelQ      = await mkProduct('Peel-Q',                               'Aspipro', 'gr',          100,  647.22,  45)
  const revif      = await mkProduct('Revif Oxygen',                         'Aspipro', 'gr',           30,  767.59,   8)  // bajo
  const biEffect   = await mkProduct('Bi-Effect Hidratante',                 'Aspipro', 'ml',          120,  693.51,  65)
  const microdacyn = await mkProduct('Microdacyn',                           'Bodega A.','ml',          250,  257.00, 195)
  const yoen       = await mkProduct('Yoen Hidrotonic',                      null,       'ml',          120,    0.00,  95)

  // Videlca — usados en servicios, con stock parcial
  const shambala  = await mkProduct('Shambala',         'Videlca', 'gr',           50, 350.00, 25)
  const huit      = await mkProduct('Huit',             'Videlca', 'gr',           30, 280.00, 12)
  const mite      = await mkProduct('Mite',             'Videlca', 'gr',           30, 420.00,  8)
  const porcelain = await mkProduct('Porcelain Mineral','Videlca', 'gr',           50, 380.00, 12)  // bajo
  const desincr   = await mkProduct('Desincrustant',    'Videlca', 'ml',          120, 320.00, 88)

  // Videlca — por comprar (stock 0)
  await mkProduct('Body & Soul Aromachology',          'Videlca', 'ml',          120,    0,  0)
  await mkProduct('Oleum',                             'Videlca', 'ml',          120,    0,  0)
  await mkProduct('Vial PDRN',                         'Videlca', 'aplicaciones',  5,    0,  0)
  await mkProduct('Vial Vita C',                       'Videlca', 'aplicaciones',  5,    0,  0)
  await mkProduct('Gel Conductor Neutro',              'Videlca', 'ml',          250,    0,  0)
  await mkProduct('Serum Niacinamida',                 'Videlca', 'ml',           30,    0,  0)
  await mkProduct('Serum Whitning milk',               'Videlca', 'ml',           30,    0,  0)
  await mkProduct('AHA 20% Mandelico',                 'Videlca', 'ml',           30,    0,  0)
  await mkProduct('PHA 20% Miel',                      'Videlca', 'ml',           30,    0,  0)
  await mkProduct('Hilos Koreanos',                    'Videlca', 'aplicaciones', 10,    0,  0)
  await mkProduct('Mascarilla Cacao',                  'Videlca', 'gr',           50,    0,  0)
  await mkProduct('Mascarilla Whitning',               'Videlca', 'gr',           50,    0,  0)
  await mkProduct('Mascarilla ARROZ Y COLAGENO',       'Videlca', 'gr',           50,    0,  0)
  await mkProduct('Mascarilla Plástica BOTOX',         'Videlca', 'aplicaciones',  5,    0,  0)
  await mkProduct('Mascarilla Plástica LIFTING',       'Videlca', 'aplicaciones',  5,    0,  0)
  await mkProduct('Mascarilla Plástica FRUTOS ROJOS',  'Videlca', 'aplicaciones',  5,    0,  0)
  await mkProduct('Mascarilla Plástica AH',            'Videlca', 'aplicaciones',  5,    0,  0)
  await mkProduct('Acido Lactico',                     'Videlca', 'ml',           30,    0,  0)
  await mkProduct('Acido Salicilico',                  'Videlca', 'ml',           30,    0,  0)
  await mkProduct('Acido Glicolico',                   'Videlca', 'ml',           30,    0,  0)

  console.log('✓ Productos creados')

  // ── Servicios + ServiceProduct mappings ───────────────────────────────────

  type SPLine = { prod: P; qty: number }

  async function mkService(
    name: string, category: string, duration: string, price: string,
    description: string | null, lines: SPLine[],
  ) {
    const costIngredients = lines.reduce(
      (sum, l) => sum + costPerUse(l.qty, l.prod.costPerUnit, l.prod.capacityPerUnit), 0
    )
    const svc = await prisma.service.create({
      data: {
        name, category, duration, price,
        description,
        costIngredients: Math.round(costIngredients * 100) / 100,
        serviceProducts: {
          create: lines.map(l => ({ productId: l.prod.id, quantityUsed: l.qty })),
        },
      },
    })
    return svc
  }

  const svcPoroDetox = await mkService(
    'Facial Poro Detox Q.', 'Facial', '80 min', '$950',
    'Facial de limpieza profunda, con exfoliación enzimática, extracción, alta frecuencia, mascarilla desintoxicante que purifica el poro, gel hidratante, contorno de ojos y protector solar.',
    [
      { prod: shampoo,   qty: 5  },
      { prod: peelQ,     qty: 10 },
      { prod: yoen,      qty: 2  },
      { prod: desincr,   qty: 3  },
      { prod: microdacyn,qty: 2  },
      { prod: detoxy,    qty: 10 },
      { prod: biEffect,  qty: 5  },
      { prod: mite,      qty: 1  },
      { prod: porcelain, qty: 5  },
    ],
  )

  const svcDeepHydra = await mkService(
    'Facial Deep Hydra.', 'Facial', '70 min', '$1,250',
    'Facial de hidratación profunda con boost de nutrientes, exfoliación enzimática, tonificación hamamelis, alta frecuencia, coctelería de ácido ribonucleico y colágeno hidrolizado, mascarilla de arcilla purificante e hidratante, gel ácido hialurónico, humectante vitaminas A y E, contorno de ojos y protector solar.',
    [
      { prod: shampoo,  qty: 5  },
      { prod: peelQ,    qty: 10 },
      { prod: yoen,     qty: 2  },
      { prod: ionoRNA,  qty: 1  },
      { prod: serumB,   qty: 5  },
      { prod: biEffect, qty: 5  },
      { prod: shambala, qty: 5  },
      { prod: mite,     qty: 1  },
      { prod: porcelain,qty: 5  },
    ],
  )

  const svcOxycell = await mkService(
    'Facial Oxycell.', 'Facial', '50 min', '$1,250',
    'Facial oxigenante, con exfoliación enzimática, tonificación hamamelis, alta frecuencia, ampolleta de ácido ribonucleico, boost de péptidos, mascarilla oxígeno (O2), hidratante D-Pantenol, contorno de ojos y protector solar.',
    [
      { prod: shampoo,  qty: 5  },
      { prod: peelQ,    qty: 10 },
      { prod: yoen,     qty: 2  },
      { prod: ionoRNA,  qty: 1  },
      { prod: serumL,   qty: 5  },
      { prod: o2Mask,   qty: 10 },
      { prod: shambala, qty: 5  },
      { prod: mite,     qty: 1  },
      { prod: porcelain,qty: 5  },
    ],
  )

  const svcTenso = await mkService(
    'Facial Tensotonificante 40+', 'Facial', '60 min', '$1,650',
    'Facial Tensotónico (Lifting) para pieles maduras, con exfoliación enzimática, drenaje linfático, alta frecuencia, coctelería de ácido hialurónico, colágeno hidrolizado y oligopéptidos, boost de elastina hidrolizada, mascarilla regeneradora efecto lifting, contorno de ojos y protector solar.',
    [
      { prod: shampoo,  qty: 5  },
      { prod: peelQ,    qty: 10 },
      { prod: yoen,     qty: 2  },
      { prod: ah5050,   qty: 1  },
      { prod: serumB,   qty: 5  },
      { prod: vTense,   qty: 1  },
      { prod: moldelina,qty: 1  },
      { prod: mite,     qty: 1  },
      { prod: porcelain,qty: 5  },
    ],
  )

  const svcHydraCalm = await mkService(
    'Facial Hydra Calm.', 'Facial', '50 min', '$1,400',
    'Facial hidratante y calmante para pieles sensibles, con exfoliación enzimática, alta frecuencia, tonificación provitamina B5, boost de lactobacillus, mascarilla reequilibrante centella asiática, humectante desensibilizante, contorno de ojos y protector solar.',
    [
      { prod: shampoo,  qty: 5  },
      { prod: peelQ,    qty: 10 },
      { prod: locionH,  qty: 2  },
      { prod: serumM,   qty: 5  },
      { prod: mascarR,  qty: 5  },
      { prod: huit,     qty: 2  },
      { prod: revif,    qty: 5  },
      { prod: mite,     qty: 1  },
      { prod: porcelain,qty: 5  },
    ],
  )

  const svcControlOil = await mkService(
    'Facial Control Oil', 'Facial', '50 min', '$1,000',
    'Facial para piel grasa y mixta, con limpieza enzimática, tonificación equilibrante, alta frecuencia, mascarilla opacificadora, crema control graso, contorno de ojos y protector solar.',
    [
      { prod: jungGel,   qty: 5  },
      { prod: peelQ,     qty: 10 },
      { prod: jungLoc,   qty: 5  },
      { prod: jungMasca, qty: 5  },
      { prod: creamaPro, qty: 5  },
      { prod: biEffect,  qty: 5  },
      { prod: mite,      qty: 1  },
      { prod: porcelain, qty: 5  },
    ],
  )

  await mkService(
    'Facial Personalizado.', 'Facial', '50–90 min', '$500 – $1,800',
    'Facial evaluado según diagnóstico cutáneo personalizado, supliendo las necesidades específicas de la piel.',
    [],
  )

  await mkService(
    'Drenaje Linfático Facial', 'Extra / Complemento', '20–30 min', '$100',
    'Técnica de drenaje linfático facial con brocha de cerdas suaves que ayuda a la liberación de toxinas, desinflamando los conductos linfáticos.',
    [],
  )

  await mkService(
    'Rodillos de Cuarzo y Guasha', 'Extra / Complemento', '15–20 min', '$100',
    'Masajes intencionados que mejoran la tonicidad de los músculos faciales y ayudan a la microcirculación.',
    [],
  )

  console.log('✓ Servicios creados')

  // ── Clientas ──────────────────────────────────────────────────────────────

  const sofia = await prisma.client.create({
    data: {
      name: 'Sofía Martínez', phone: '6641001001', email: 'sofia.mtz@gmail.com',
      skinProfile: { create: {
        fecha: new Date('2025-10-08'), edad: 28, fototipo: 'III', biotipo: 'Mixta',
        sensibilidad: 'Media', hidratacion: 'Normal', grosorPiel: 'Medio',
        elasticidad: 'Buena', habitos: 'Bebe 2L agua, SPF diario',
        comentarios: 'Interesada en tratamientos anti-edad preventivos. Responde bien a hidratación profunda.',
      }},
    },
  })

  const valentina = await prisma.client.create({
    data: {
      name: 'Valentina Rojas', phone: '6641002002', email: 'vale.rojas@hotmail.com',
      skinProfile: { create: {
        fecha: new Date('2025-11-15'), edad: 35, fototipo: 'IV', biotipo: 'Grasa',
        sensibilidad: 'Alta', hidratacion: 'Excesiva', grosorPiel: 'Grueso',
        alteracionesCutaneas: 'Acné leve, poros dilatados',
        pigmentaciones: 'Manchas post-acné en mejillas',
        habitos: 'Estrés alto, poco sueño', medicamentos: 'Anticonceptivos orales',
        comentarios: 'Solicita control de brillo y tratamiento de manchas. Zona T muy activa.',
      }},
    },
  })

  const camila = await prisma.client.create({
    data: {
      name: 'Camila Torres', phone: '6641003003',
      skinProfile: { create: {
        fecha: new Date('2025-10-20'), edad: 44, fototipo: 'II', biotipo: 'Seca',
        sensibilidad: 'Alta', hidratacion: 'Escasa', grosorPiel: 'Fino',
        elasticidad: 'Regular', exposicionSolar: 'Alta (trabajo al aire libre)',
        deporte: 'Corre 3 veces/semana',
        comentarios: 'Piel muy deshidratada y tirante. Responde excelente al Tensotonificante. Signos de fotoenvejecimiento.',
      }},
    },
  })

  const isabela = await prisma.client.create({
    data: {
      name: 'Isabela Herrera', phone: '6641004004', email: 'isa.herrera@gmail.com',
      skinProfile: { create: {
        fecha: new Date('2025-12-01'), edad: 31, fototipo: 'III', biotipo: 'Normal',
        sensibilidad: 'Baja', hidratacion: 'Normal', grosorPiel: 'Medio',
        elasticidad: 'Buena', habitos: 'Skincare básico, no usa SPF diario',
        comentarios: 'Piel en buen estado general. Viene por mantenimiento.',
      }},
    },
  })

  const mariana = await prisma.client.create({
    data: {
      name: 'Mariana Vega', phone: '6641005005',
      skinProfile: { create: {
        fecha: new Date('2025-12-10'), edad: 24, fototipo: 'III', biotipo: 'Normal',
        sensibilidad: 'Baja', hidratacion: 'Normal', grosorPiel: 'Fino',
        elasticidad: 'Muy buena', habitos: 'Buena rutina AM/PM, SPF diario',
        comentarios: 'Piel joven y sana. Busca brillo y uniformidad.',
      }},
    },
  })

  const daniela = await prisma.client.create({
    data: {
      name: 'Daniela Cruz', phone: '6641006006', email: 'dani.cruz@outlook.com',
      skinProfile: { create: {
        fecha: new Date('2025-11-05'), edad: 29, fototipo: 'IV', biotipo: 'Mixta',
        sensibilidad: 'Media', hidratacion: 'Normal', grosorPiel: 'Medio',
        alteracionesCutaneas: 'Poros levemente dilatados en nariz',
        habitos: 'Poca rutina, come mucho procesado',
        comentarios: 'Empezando a cuidar su piel. Muy entusiasta.',
      }},
    },
  })

  const ana = await prisma.client.create({
    data: {
      name: 'Ana Leal', phone: '6641007007',
      skinProfile: { create: {
        fecha: new Date('2026-01-17'), edad: 27, fototipo: 'III', biotipo: 'Grasa',
        sensibilidad: 'Media', hidratacion: 'Excesiva', grosorPiel: 'Grueso',
        alteracionesCutaneas: 'Brotes ocasionales en mentón',
        habitos: 'Sin rutina establecida',
        comentarios: 'Viene por recomendación de Valentina. Objetivo: limpiar poros y controlar brote.',
      }},
    },
  })

  const renata = await prisma.client.create({
    data: {
      name: 'Renata Soto', phone: '6641008008', email: 'renata.soto@gmail.com',
      skinProfile: { create: {
        fecha: new Date('2026-01-21'), edad: 48, fototipo: 'II', biotipo: 'Seca',
        sensibilidad: 'Alta', hidratacion: 'Escasa', grosorPiel: 'Fino',
        elasticidad: 'Regular',
        alteracionesCutaneas: 'Líneas de expresión marcadas, flacidez leve',
        habitos: 'Usa retinol en casa, SPF diario',
        enfermedades: 'Hipotiroidismo controlado',
        comentarios: 'Clienta de alto valor. Prioriza el lifting y regeneración. Piel sensible al calor.',
      }},
    },
  })

  console.log('✓ Clientas creadas')

  // ── Citas ─────────────────────────────────────────────────────────────────

  type ApptDef = {
    client: { id: string }
    date: Date
    service: string
    status: 'COMPLETED' | 'CONFIRMED' | 'CANCELLED'
    pricePaid?: number
    paymentMethod?: string
    sessionNotes?: string
  }

  const appts: ApptDef[] = [
    // ── Enero 2026 ─────────────────────────────────────────────────────────
    { client: sofia,     date: d(1, 6,  10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: valentina, date: d(1, 6,  12),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Efectivo' },
    { client: camila,    date: d(1, 7,  11),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Transferencia' },
    { client: isabela,   date: d(1, 8,  10),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Tarjeta' },
    { client: mariana,   date: d(1, 10, 10),    service: svcOxycell.name,     status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },

    { client: sofia,     date: d(1, 13, 10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: daniela,   date: d(1, 13, 12),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Efectivo' },
    { client: valentina, date: d(1, 14, 11),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Efectivo',
      sessionNotes: 'Zona T muy activa, aplicar luz azul próxima sesión.' },
    { client: camila,    date: d(1, 15, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },
    { client: ana,       date: d(1, 17, 10),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo',
      sessionNotes: 'Primera visita. Brote leve en mentón. Extracción suave.' },

    { client: isabela,   date: d(1, 20, 10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Tarjeta' },
    { client: renata,    date: d(1, 21, 11),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Transferencia',
      sessionNotes: 'Primera visita. Piel muy sensible al calor, reducir tiempo de alta frecuencia.' },
    { client: sofia,     date: d(1, 22, 10),    service: svcOxycell.name,     status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: valentina, date: d(1, 22, 12),    service: svcControlOil.name,  status:'CANCELLED' },
    { client: camila,    date: d(1, 24, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },

    { client: daniela,   date: d(1, 27, 10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Efectivo' },
    { client: mariana,   date: d(1, 27, 12),    service: svcOxycell.name,     status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: ana,       date: d(1, 28, 11),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Efectivo' },
    { client: renata,    date: d(1, 29, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },
    { client: sofia,     date: d(1, 31, 10),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Transferencia' },

    // ── Febrero 2026 ───────────────────────────────────────────────────────
    { client: isabela,   date: d(2, 3,  10),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Tarjeta' },
    { client: valentina, date: d(2, 3,  12),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo' },
    { client: camila,    date: d(2, 4,  11),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Transferencia' },
    { client: daniela,   date: d(2, 5,  10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Efectivo' },
    { client: renata,    date: d(2, 7,  10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },

    { client: sofia,     date: d(2, 10, 10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: ana,       date: d(2, 10, 12),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo',
      sessionNotes: 'Brote reducido notablemente. Continuar con Poro Detox una sesión más.' },
    { client: mariana,   date: d(2, 11, 11),    service: svcOxycell.name,     status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: valentina, date: d(2, 12, 10),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Efectivo' },
    { client: camila,    date: d(2, 14, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia',
      sessionNotes: 'Especial 14 de febrero. Piel muy receptiva hoy.' },

    { client: isabela,   date: d(2, 17, 10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Tarjeta' },
    { client: sofia,     date: d(2, 17, 12),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Transferencia' },
    { client: daniela,   date: d(2, 18, 11),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Efectivo' },
    { client: renata,    date: d(2, 19, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia',
      sessionNotes: 'Excelente respuesta al lifting. Reducir sesiones a una por mes.' },
    { client: ana,       date: d(2, 21, 10),    service: svcOxycell.name,     status:'COMPLETED', pricePaid:1250, paymentMethod:'Efectivo' },

    { client: valentina, date: d(2, 24, 10),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo',
      sessionNotes: 'Mejora visible en zona T. Poros menos dilatados. Seguir con Control Oil.' },
    { client: camila,    date: d(2, 24, 12),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },
    { client: mariana,   date: d(2, 25, 11),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: sofia,     date: d(2, 26, 10),    service: svcOxycell.name,     status:'CANCELLED' },
    { client: isabela,   date: d(2, 28, 10),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Tarjeta' },

    // ── Marzo 2026 ─────────────────────────────────────────────────────────
    { client: renata,    date: d(3, 3,  10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },
    { client: daniela,   date: d(3, 3,  12),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo' },
    { client: ana,       date: d(3, 4,  11),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Efectivo',
      sessionNotes: 'Sin brote activo. Piel estable. Cambiar a mantenimiento mensual.' },
    { client: valentina, date: d(3, 5,  10),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Efectivo' },
    { client: sofia,     date: d(3, 7,  10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },

    { client: camila,    date: d(3, 10, 10),    service: svcOxycell.name,     status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: isabela,   date: d(3, 10, 12),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Tarjeta' },
    { client: mariana,   date: d(3, 11, 11),    service: svcHydraCalm.name,   status:'COMPLETED', pricePaid:1400, paymentMethod:'Transferencia' },
    { client: renata,    date: d(3, 12, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },
    { client: ana,       date: d(3, 14, 10),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo',
      sessionNotes: 'Primera sesión sin ningún brote activo. Gran avance desde enero.' },

    { client: sofia,     date: d(3, 17, 10),    service: svcDeepHydra.name,   status:'COMPLETED', pricePaid:1250, paymentMethod:'Transferencia' },
    { client: daniela,   date: d(3, 17, 12),    service: svcControlOil.name,  status:'COMPLETED', pricePaid:1000, paymentMethod:'Efectivo' },
    { client: valentina, date: d(3, 18, 11),    service: svcPoroDetox.name,   status:'COMPLETED', pricePaid: 950, paymentMethod:'Efectivo',
      sessionNotes: 'Piel mejoró notablemente desde enero. Considerar transición a Deep Hydra.' },
    { client: camila,    date: d(3, 19, 10),    service: svcTenso.name,       status:'COMPLETED', pricePaid:1650, paymentMethod:'Transferencia' },

    // ── Semana actual + próxima (CONFIRMED) ────────────────────────────────
    { client: isabela,   date: d(3, 20, 10),    service: svcHydraCalm.name,   status:'CONFIRMED' },
    { client: renata,    date: d(3, 20, 12),    service: svcTenso.name,       status:'CONFIRMED' },
    { client: ana,       date: d(3, 21, 10),    service: svcOxycell.name,     status:'CONFIRMED' },
    { client: sofia,     date: d(3, 24, 10),    service: svcDeepHydra.name,   status:'CONFIRMED' },
    { client: mariana,   date: d(3, 24, 12, 30),service: svcOxycell.name,     status:'CONFIRMED' },
    { client: valentina, date: d(3, 25, 11),    service: svcControlOil.name,  status:'CONFIRMED' },
    { client: daniela,   date: d(3, 26, 10),    service: svcHydraCalm.name,   status:'CONFIRMED' },
    { client: camila,    date: d(3, 28, 9),     service: svcTenso.name,       status:'CONFIRMED' },
  ]

  for (const a of appts) {
    await prisma.appointment.create({
      data: {
        clientId: a.client.id,
        service: a.service,
        date: a.date,
        status: a.status,
        pricePaid: a.pricePaid ?? null,
        paymentMethod: a.paymentMethod ?? null,
        sessionNotes: a.sessionNotes ?? null,
      },
    })
  }

  const totalCompleted = appts.filter(a => a.status === 'COMPLETED').length
  const totalRevenue = appts.reduce((s, a) => s + (a.pricePaid ?? 0), 0)
  console.log(`✓ ${appts.length} citas creadas — ${totalCompleted} completadas — $${totalRevenue.toLocaleString()} ingresos totales`)
  console.log('\n✅ Seed completo')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
