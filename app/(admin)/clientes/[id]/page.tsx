import { getClientDetail } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { ClientDetailClient } from './_components/ClientDetailClient'

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClientDetail(id)
  if (!client) notFound()
  return <ClientDetailClient client={client} />
}
