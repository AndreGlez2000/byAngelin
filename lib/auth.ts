import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { NextAuthOptions } from 'next-auth'

type AttemptState = {
  attempts: number[]
  lockUntil: number
  lockLevel: number
}

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5
const LOCK_STEPS_MS = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000]
const MAX_ENTRIES = 5000
const loginAttempts = new Map<string, AttemptState>()

function resolveIp(headers?: Record<string, string>): string {
  const forwardedFor = headers?.['x-forwarded-for']?.split(',')[0]?.trim()
  const realIp = headers?.['x-real-ip']?.trim()
  return forwardedFor || realIp || 'unknown-ip'
}

function getLimiterKey(headers: Record<string, string> | undefined, identifier: string): string {
  const ip = resolveIp(headers)
  return `${ip}|${identifier.toLowerCase()}`
}

function getState(key: string, now: number): AttemptState {
  const existing = loginAttempts.get(key)
  if (!existing) {
    const created = { attempts: [], lockUntil: 0, lockLevel: 0 }
    loginAttempts.set(key, created)
    return created
  }

  existing.attempts = existing.attempts.filter((ts) => now - ts <= ATTEMPT_WINDOW_MS)
  if (existing.lockUntil <= now && existing.attempts.length === 0) {
    existing.lockLevel = 0
  }
  return existing
}

function cleanupLimiter(now: number) {
  if (loginAttempts.size <= MAX_ENTRIES) return
  loginAttempts.forEach((state, key) => {
    const hasRecentAttempts = state.attempts.some((ts: number) => now - ts <= ATTEMPT_WINDOW_MS)
    if (state.lockUntil <= now && !hasRecentAttempts) {
      loginAttempts.delete(key)
    }
  })
}

function isLocked(key: string, now: number): boolean {
  return getState(key, now).lockUntil > now
}

function registerFailure(key: string, now: number) {
  const state = getState(key, now)
  state.attempts.push(now)

  if (state.attempts.length >= MAX_FAILED_ATTEMPTS) {
    state.lockLevel = Math.min(state.lockLevel + 1, LOCK_STEPS_MS.length)
    state.lockUntil = now + LOCK_STEPS_MS[state.lockLevel - 1]
    state.attempts = []
  }

  cleanupLimiter(now)
}

function registerSuccess(key: string) {
  loginAttempts.delete(key)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.includes('@')
          ? credentials.email
          : `${credentials.email}@admin.com`

        const now = Date.now()
        const limiterKey = getLimiterKey(req?.headers, email)
        if (isLocked(limiterKey, now)) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user) {
          registerFailure(limiterKey, now)
          return null
        }

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) {
          registerFailure(limiterKey, now)
          return null
        }

        registerSuccess(limiterKey)
        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        ;(token as { id?: string }).id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && (token as { id?: string }).id) {
        ;(session.user as { id?: string }).id = (token as { id?: string }).id
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
