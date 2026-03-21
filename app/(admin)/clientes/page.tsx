'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ChevronRight } from 'lucide-react'

type Client = {
  id: string
  name: string
  phone: string
  email: string | null
  skinProfile: { fototipo: string | null; biotipo: string | null } | null
  _count: { appointments: number }
  appointments: { date: string }[]
}

type Filter = 'todas' | 'activas' | 'inactivas'

function isActiva(client: Client): boolean {
  if (!client.appointments[0]) return false
  const last = new Date(client.appointments[0].date)
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  return last > threeMonthsAgo
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
  const [filter, setFilter] = useState<Filter>('todas')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients)
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const activa = isActiva(c)
    const matchFilter =
      filter === 'todas' ? true : filter === 'activas' ? activa : !activa
    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl text-olive italic">Mis Clientes</h1>
          <p className="text-xs text-olive/40 mt-0.5">{clients.length} clientas registradas</p>
        </div>
        <button
          onClick={() => router.push('/clientes/nueva')}
          className="flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
        >
          <Plus size={14} />
          Nueva Clienta
        </button>
      </div>

      <div className="px-4 md:px-6 py-3 md:py-4 flex-1 overflow-auto">
        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="w-full pl-9 pr-4 py-2.5 border border-olive/20 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blossom"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4">
          {(['todas', 'activas', 'inactivas'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-olive-dark text-white'
                  : 'text-olive/50 hover:bg-white/60 hover:text-olive'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table — hidden on mobile */}
        <div className="hidden md:block bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-olive/10 text-left">
                <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Nombre</th>
                <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Teléfono</th>
                <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Tipo Piel</th>
                <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Última Visita</th>
                <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Visitas</th>
                <th className="px-4 py-3 text-[10px] text-olive/40 uppercase tracking-widest font-medium">Estado</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-olive/30 text-sm italic">
                    {search ? 'Sin resultados' : 'No hay clientas registradas'}
                  </td>
                </tr>
              )}
              {filtered.map(c => {
                const activa = isActiva(c)
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
                          {c.skinProfile?.biotipo && (
                            <div className="text-xs text-olive/40 italic">{c.skinProfile.biotipo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-olive/60">{c.phone}</td>
                    <td className="px-4 py-3 text-sm text-olive/60">{c.skinProfile?.fototipo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-olive/60">
                      {lastVisit ? formatDate(lastVisit) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-moss/20 text-olive text-xs px-2 py-0.5 rounded-full font-medium">
                        {c._count.appointments}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        activa ? 'bg-moss/25 text-olive-dark' : 'bg-olive/10 text-olive/50'
                      }`}>
                        {activa ? 'Activa' : 'Inactiva'}
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

        {/* Mobile card list — hidden on desktop */}
        <div className="md:hidden divide-y divide-olive/8">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-olive/40">Sin resultados</p>
          ) : (
            filtered.map(c => {
              const activa = isActiva(c)
              const lastVisit = c.appointments[0] ? formatDate(c.appointments[0].date) : '—'
              const skinType = c.skinProfile?.fototipo || c.skinProfile?.biotipo || null
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
                    <div className="text-xs text-olive/50 mt-0.5">{c.phone}</div>
                    {skinType && (
                      <div className="text-xs text-olive/40">{skinType}</div>
                    )}
                  </div>
                  {/* Right side */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      activa
                        ? 'bg-moss/20 text-moss'
                        : 'bg-olive/10 text-olive/50'
                    }`}>
                      {activa ? 'Activa' : 'Inactiva'}
                    </div>
                    <div className="text-xs text-olive/40 mt-1">{lastVisit}</div>
                  </div>
                  <ChevronRight size={14} className="text-olive/30 shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
