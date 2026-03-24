import { getAgendaData } from '@/lib/queries'
import { AgendaClient } from './_components/AgendaClient'

function mondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function AgendaPage() {
  const weekStart = mondayOf(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const data = await getAgendaData(weekStart, weekEnd)
  return (
    <AgendaClient
      initialAppointments={data.appointments}
      initialClients={data.clients}
      initialServices={data.services}
    />
  )
}
