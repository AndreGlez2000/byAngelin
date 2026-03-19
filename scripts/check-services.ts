import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(__dirname, '../.env.local') })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

prisma.service.findMany({ orderBy: { name: 'asc' } })
  .then(rows => {
    console.log('Total servicios:', rows.length)
    rows.forEach(r => console.log(' -', r.isActive ? '[activo]' : '[inactivo]', r.name, '-', r.price))
  })
  .finally(() => prisma.$disconnect())
