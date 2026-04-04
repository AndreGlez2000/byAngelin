#!/usr/bin/env node

const { URL } = require('node:url')
const { spawnSync } = require('node:child_process')

const target = process.argv[2]

if (!target || !['local', 'staging', 'prod'].includes(target)) {
  console.error('Uso: node scripts/db-safe-push.js <local|staging|prod>')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL no está definida en el entorno actual.')
  process.exit(1)
}

let parsed
try {
  parsed = new URL(databaseUrl)
} catch {
  console.error('ERROR: DATABASE_URL no tiene formato URL válido.')
  process.exit(1)
}

const host = parsed.host
const hostname = parsed.hostname

const isLocalHost =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.endsWith('.local')

const isSupabase = hostname.includes('supabase.com')

const environmentByTarget = {
  local: 'LOCAL',
  staging: 'STAGING',
  prod: 'PRODUCCIÓN'
}

console.log(`\n[db-safe-push] Entorno objetivo: ${environmentByTarget[target]}`)
console.log(`[db-safe-push] Host detectado: ${host}\n`)

if (target === 'local' && !isLocalHost) {
  console.error('BLOQUEADO: db:push:local solo permite hosts locales (localhost/127.0.0.1).')
  process.exit(1)
}

if ((target === 'staging' || target === 'prod') && !isSupabase) {
  console.error(
    `BLOQUEADO: db:push:${target} requiere host Supabase (*.supabase.com).`
  )
  process.exit(1)
}

if (target === 'prod' && process.env.CONFIRM_PROD_DB !== 'YES_PROD') {
  console.error(
    'BLOQUEADO: para producción usá `npm run db:push:prod:confirm` (requiere CONFIRM_PROD_DB=YES_PROD).'
  )
  process.exit(1)
}

const result = spawnSync('npx', ['prisma', 'db', 'push'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32'
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('\n[db-safe-push] OK: schema sincronizado con seguridad.')
