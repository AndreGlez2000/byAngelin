export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return raw
}
