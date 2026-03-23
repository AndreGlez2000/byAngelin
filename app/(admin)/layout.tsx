import { ServerShell } from '@/components/ServerShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServerShell>
      {children}
    </ServerShell>
  )
}
