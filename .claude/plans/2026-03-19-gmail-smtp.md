# Gmail SMTP Email System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Resend with Nodemailer + Gmail App Password so transactional emails send from `angelinesthetician@gmail.com` at zero cost with no custom domain.

**Architecture:** Swap only `lib/email.ts` — remove the Resend client, create a Nodemailer Gmail SMTP transporter. The public interface (`sendConfirmationEmail` / `sendReminderEmail`) stays identical so no callers change. React Email templates render to HTML string the same way.

**Tech Stack:** `nodemailer`, `@types/nodemailer`, `@react-email/components` (render), Gmail SMTP (`smtp.gmail.com:587`)

---

## File Map

| File | Action |
|------|--------|
| `lib/email.ts` | Rewrite — swap Resend for Nodemailer |
| `package.json` | Remove `resend`, add `nodemailer` + `@types/nodemailer` |
| `__tests__/email.test.ts` | Create — unit test with mocked transporter |

**Unchanged:** `emails/ConfirmacionCita.tsx`, `emails/RecordatorioCita.tsx`, `app/api/appointments/route.ts`, `app/api/cron/send-reminders/route.ts`, `prisma/schema.prisma`

---

## Task 1: Swap npm dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove resend, add nodemailer**

```bash
cd /c/Users/andre/projects/angelin-app
npm uninstall resend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

- [ ] **Step 2: Verify packages**

```bash
grep -E "nodemailer|resend" package.json
```

Expected: `nodemailer` present, `resend` absent.

- [ ] **Step 3: Commit**

```bash
rtk git add package.json package-lock.json
rtk git commit -m "chore: swap resend for nodemailer"
```

---

## Task 2: Rewrite lib/email.ts

**Files:**
- Modify: `lib/email.ts`

- [ ] **Step 1: Replace the file content**

Replace `lib/email.ts` with:

```typescript
import nodemailer from 'nodemailer'
import { render } from '@react-email/components'
import { ConfirmacionCita } from '@/emails/ConfirmacionCita'
import { RecordatorioCita } from '@/emails/RecordatorioCita'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `Angelin Esthetician <${process.env.GMAIL_USER}>`

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export async function sendConfirmationEmail(params: {
  to: string
  clientName: string
  service: string
  date: Date
  price?: string | null
  isFirstVisit: boolean
}) {
  const html = await render(
    ConfirmacionCita({
      clientName: params.clientName,
      service: params.service,
      date: formatDate(params.date),
      time: formatTime(params.date),
      price: params.price ?? 'Por definir',
      isFirstVisit: params.isFirstVisit,
    })
  )

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `Cita confirmada — ${params.service}`,
    html,
  })
}

export async function sendReminderEmail(params: {
  to: string
  clientName: string
  service: string
  date: Date
  price?: string | null
}) {
  const html = await render(
    RecordatorioCita({
      clientName: params.clientName,
      service: params.service,
      date: formatDate(params.date),
      time: formatTime(params.date),
      price: params.price ?? 'Por definir',
    })
  )

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `Recordatorio: tu cita es mañana — ${params.service}`,
    html,
  })
}
```

- [ ] **Step 2: Type-check**

```bash
cd /c/Users/andre/projects/angelin-app
npx tsc --noEmit; echo "EXIT:$?"
```

Expected: `EXIT:0`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/email.ts
rtk git commit -m "feat: replace Resend with Nodemailer Gmail SMTP"
```

---

## Task 3: Unit test with mocked transporter

**Files:**
- Create: `__tests__/email.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// __tests__/email.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock nodemailer before importing lib/email
const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-id' })
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
  },
}))

// Mock react-email render
vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>test</html>'),
  Html: ({ children }: any) => children,
  Head: ({ children }: any) => children,
  Body: ({ children }: any) => children,
  Container: ({ children }: any) => children,
  Section: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  Preview: ({ children }: any) => children,
  Font: () => null,
}))

// Mock email templates
vi.mock('@/emails/ConfirmacionCita', () => ({ ConfirmacionCita: vi.fn() }))
vi.mock('@/emails/RecordatorioCita', () => ({ RecordatorioCita: vi.fn() }))

import { sendConfirmationEmail, sendReminderEmail } from '@/lib/email'

describe('sendConfirmationEmail', () => {
  beforeEach(() => sendMailMock.mockClear())

  it('calls sendMail with correct subject and recipient', async () => {
    await sendConfirmationEmail({
      to: 'cliente@example.com',
      clientName: 'María',
      service: 'Facial Hidratante',
      date: new Date('2026-03-21T10:00:00'),
      price: '$850 MXN',
      isFirstVisit: false,
    })

    expect(sendMailMock).toHaveBeenCalledOnce()
    const call = sendMailMock.mock.calls[0][0]
    expect(call.to).toBe('cliente@example.com')
    expect(call.subject).toContain('Facial Hidratante')
    expect(call.html).toBe('<html>test</html>')
  })

  it('includes primera visita flag in template props when isFirstVisit=true', async () => {
    const { ConfirmacionCita } = await import('@/emails/ConfirmacionCita')
    await sendConfirmationEmail({
      to: 'cliente@example.com',
      clientName: 'María',
      service: 'Facial',
      date: new Date('2026-03-21T10:00:00'),
      price: null,
      isFirstVisit: true,
    })
    expect(ConfirmacionCita).toHaveBeenCalledWith(
      expect.objectContaining({ isFirstVisit: true })
    )
  })
})

describe('sendReminderEmail', () => {
  beforeEach(() => sendMailMock.mockClear())

  it('calls sendMail with reminder subject', async () => {
    await sendReminderEmail({
      to: 'cliente@example.com',
      clientName: 'María',
      service: 'Limpieza Profunda',
      date: new Date('2026-03-22T11:00:00'),
      price: '$700 MXN',
    })

    expect(sendMailMock).toHaveBeenCalledOnce()
    const call = sendMailMock.mock.calls[0][0]
    expect(call.subject).toContain('mañana')
    expect(call.subject).toContain('Limpieza Profunda')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /c/Users/andre/projects/angelin-app
npx vitest run __tests__/email.test.ts
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
rtk git add __tests__/email.test.ts
rtk git commit -m "test: unit tests for email module with mocked transporter"
```

---

## Task 4: Configure Gmail App Password (manual, one-time)

This task is performed in a browser, not in code.

- [ ] **Step 1: Enable 2-Step Verification**

1. Go to [myaccount.google.com](https://myaccount.google.com) logged in as `angelinesthetician@gmail.com`
2. Security → 2-Step Verification → Enable

- [ ] **Step 2: Generate App Password**

1. Security → 2-Step Verification → scroll to bottom → **App Passwords**
2. Select app: **Mail** | Select device: **Other** → name it `angelin-app`
3. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

- [ ] **Step 3: Add to .env**

Open `.env` in the project root and add:

```
GMAIL_USER=angelinesthetician@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

Remove `RESEND_API_KEY` if present.

**Do NOT commit `.env` — it is already in `.gitignore`.**

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd /c/Users/andre/projects/angelin-app
npm run dev
```

- [ ] **Step 2: Create a test appointment**

In the app, create a new appointment for a client that has your own email address (`angelinesthetician@gmail.com` or any email you can check).

- [ ] **Step 3: Verify confirmation email**

Check the inbox. Should receive:
- Subject: `Cita confirmada — [service name]`
- Heritage design (olive colors, Pinyon Script AE logo)
- Correct service, date, time, price

- [ ] **Step 4: Verify first-visit note**

If the client has no previous appointments, the email should include the pink box: "🌿 Primera visita: Por favor llega 15 minutos antes..."

- [ ] **Step 5: Test cron reminder (optional)**

```bash
curl -H "x-cron-secret: angelin-cron-2026" http://localhost:3000/api/cron/send-reminders
```

Expected response: `{"sent":N,"failed":0,"total":N}`
