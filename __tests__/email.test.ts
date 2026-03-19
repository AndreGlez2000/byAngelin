import { vi, describe, it, expect, beforeEach } from 'vitest'

// Hoist sendMailMock so it's available inside vi.mock factory
const { sendMailMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
}))

// Mock nodemailer before importing lib/email
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
