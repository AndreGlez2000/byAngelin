import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(__dirname, '../.env.local') })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123', 12)
  await prisma.user.upsert({
    where: { email: 'angelin@admin.com' },
    update: {},
    create: {
      email: 'angelin@admin.com',
      password: hash,
    },
  })
  console.log('Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
