'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { formatPhone } from '@/lib/utils'

type Client = {
  id: string
  name: string
  phone: string
  email: string | null
  skinProfile: { fototipo: string | null; biotipo: string | null } | null
  _count: { appointments: number }
  appointments: { date: string }[]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function ClientesPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then((data: Client[]) => {
      setClients([...data].sort((a, b) => b._count.appointments - a._count.appointments))
    })
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl text-olive italic font-bold">Mis Clientes</h1>
          <p className="text-xs text-olive/40 mt-0.5">{clients.length} clientas registradas</p>
        </div>
        <button
          onClick={() => router.push('/clientes/nueva')}
          className="hidden md:flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
        >
          <Plus size={14} />
          Nueva Clienta
        </button>
      </div>

      <div className="px-4 md:px-6 py-3 md:py-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Search */}
        <div className="relative mb-3 shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full pl-9 pr-4 py-2.5 border border-olive/20 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blossom"
          />
        </div>

        {/* Table — hidden on mobile */}
        <div className="hidden md:flex flex-col bg-white rounded-xl shadow-card flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-olive/10 text-left">
                  <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Nombre</th>
                  <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Última Visita</th>
                  <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Citas</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-olive/30 text-sm italic">
                      {search ? 'Sin resultados' : 'No hay clientas registradas'}
                    </td>
                  </tr>
                )}
                {filtered.map(c => {
                  const lastVisit = c.appointments[0]?.date
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/clientes/${c.id}`)}
                      className="border-b border-olive/5 last:border-b-0 hover:bg-parchment/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blossom/20 flex items-center justify-center shrink-0">
                            <span className="text-blossom-dark text-xs font-semibold">
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-olive">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-olive/60">{formatPhone(c.phone)}</td>
                      <td className="px-4 py-3 text-sm text-olive/60">
                        {lastVisit ? formatDate(lastVisit) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-moss/20 text-olive text-xs px-2 py-0.5 rounded-full font-medium">
                          {c._count.appointments}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-olive/25">
                        <ChevronRight size={14} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card list — hidden on desktop */}
        <div className="md:hidden flex-1 overflow-y-auto divide-y divide-olive/8 pb-24">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-olive/40">Sin resultados</p>
          ) : (
            filtered.map(c => {
              const lastVisit = c.appointments[0] ? formatDate(c.appointments[0].date) : '—'
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/clientes/${c.id}`)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-olive/4 active:bg-olive/8"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blossom/25 flex items-center justify-center shrink-0">
                    <span className="text-blossom-dark font-semibold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-olive truncate">{c.name}</div>
                    <div className="text-xs text-olive/50 mt-0.5">{formatPhone(c.phone)}</div>
                  </div>
                  {/* Right side */}
                  <div className="text-right shrink-0">
                    <span className="text-xs bg-moss/20 text-olive px-2 py-0.5 rounded-full font-medium">
                      {c._count.appointments} citas
                    </span>
                    <div className="text-xs text-olive/40 mt-1">{lastVisit}</div>
                  </div>
                  <ChevronRight size={14} className="text-olive/30 shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => router.push('/clientes/nueva')}
        className="md:hidden fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-blossom-dark text-white shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
