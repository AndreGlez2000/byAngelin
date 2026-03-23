import { getClientsList } from '@/lib/queries'
import { ClientesClient } from './_components/ClientesClient'

export default async function ClientesPage() {
  const clients = await getClientsList()
  const sorted = [...clients].sort((a, b) => b._count.appointments - a._count.appointments)
  return <ClientesClient initialClients={sorted} />
}
