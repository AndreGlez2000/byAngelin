'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, AlertTriangle, Package } from 'lucide-react'

type RevenueByService = { service: string; revenue: number; count: number }
type TodayAppointment = {
  id: string
  service: string
  date: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  client: { id: string; name: string }
}
type LowStockItem = {
  id: string
  name: string
  brand: string | null
  unit: string
  stock: number
  lowStockAlert: number
}
type Metrics = {
  revenueThisMonth: number
  revenueLastMonth: number
  appointmentsThisMonth: number
  appointmentsLastMonth: number
  revenueByService: RevenueByService[]
  todayAppointments: TodayAppointment[]
  lowStock: LowStockItem[]
}

function mxn(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

function pctChange(current: number, prev: number): { value: number; up: boolean } | null {
  if (prev === 0) return null
  const value = Math.round(((current - prev) / prev) * 100)
  return { value: Math.abs(value), up: current >= prev }
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/dashboard/metrics')
      .then(r => r.json())
      .then(data => { setMetrics(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-olive/40 text-sm">Cargando…</div>
      </div>
    )
  }

  if (!metrics) return null

  const revChange = pctChange(metrics.revenueThisMonth, metrics.revenueLastMonth)
  const apptChange = pctChange(metrics.appointmentsThisMonth, metrics.appointmentsLastMonth)

  const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const now = new Date()
  const monthLabel = MONTHS_LONG[now.getMonth()]
  const prevMonthLabel = MONTHS_LONG[(now.getMonth() + 11) % 12].slice(0, 3)

  const ticketPromedio = metrics.appointmentsThisMonth > 0
    ? Math.round(metrics.revenueThisMonth / metrics.appointmentsThisMonth)
    : 0

  const firstConfirmedIdx = metrics.todayAppointments.findIndex(x => x.status === 'CONFIRMED')

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-olive italic font-bold capitalize">{monthLabel}</h1>
        <p className="text-sm text-olive/40 mt-0.5">Resumen del negocio</p>
      </div>

      {/* 3 KPI cards */}
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
        <KpiCard
          label="Ingresos"
          value={mxn(metrics.revenueThisMonth)}
          sub={`${mxn(metrics.revenueLastMonth)} ${prevMonthLabel}`}
          change={revChange}
        />
        <KpiCard
          label="Citas completadas"
          value={String(metrics.appointmentsThisMonth)}
          sub={`${metrics.appointmentsLastMonth} ${prevMonthLabel}`}
          change={apptChange}
        />
        <KpiCard
          label="Ticket promedio"
          value={mxn(ticketPromedio)}
          sub="este mes"
          change={null}
        />
      </div>

      {/* Body: citas + stock */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4 items-start">

        {/* Citas de hoy — timeline */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-olive/8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-olive">Citas de hoy</h2>
            <span className="text-xs text-olive/40">{metrics.todayAppointments.length} total</span>
          </div>
          {metrics.todayAppointments.length === 0 ? (
            <p className="px-4 py-6 text-sm text-olive/40 text-center">Ninguna cita hoy.</p>
          ) : (
            <div className="divide-y divide-olive/5 max-h-64 overflow-y-auto">
              {metrics.todayAppointments.map((a, i) => {
                const time = new Date(a.date).toLocaleTimeString('es-MX', {
                  hour: '2-digit', minute: '2-digit', hour12: false,
                })
                const isNext = a.status === 'CONFIRMED' && i === firstConfirmedIdx
                const borderColor =
                  a.status === 'COMPLETED' ? 'border-l-moss' :
                  a.status === 'CANCELLED' ? 'border-l-olive/20' :
                  'border-l-blossom-dark'
                const bgColor =
                  a.status === 'COMPLETED' ? 'bg-moss/5' :
                  a.status === 'CANCELLED' ? 'opacity-60' : ''
                return (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/clientes/${a.client.id}`)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 border-l-[3px] hover:bg-olive/5 transition-colors ${borderColor} ${bgColor}`}
                  >
                    <div className={`font-mono text-[11px] font-bold shrink-0 w-9 ${
                      a.status === 'COMPLETED' ? 'text-moss' : a.status === 'CANCELLED' ? 'text-olive/30' : 'text-blossom-dark'
                    }`}>{time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-olive truncate">{a.client.name}</div>
                      <div className="text-xs text-olive/50 truncate">{a.service}</div>
                    </div>
                    {isNext && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-medium shrink-0">
                        ahora
                      </span>
                    )}
                    {a.status === 'COMPLETED' && (
                      <span className="text-[10px] bg-moss/10 text-moss rounded px-1.5 py-0.5 font-medium shrink-0">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Stock bajo — scrollable */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-olive/8 flex items-center gap-2">
            {metrics.lowStock.length > 0 && (
              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            )}
            <h2 className="text-sm font-semibold text-olive">Stock bajo</h2>
            {metrics.lowStock.length > 0 && (
              <span className="ml-auto text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                {metrics.lowStock.length}
              </span>
            )}
          </div>
          {metrics.lowStock.length === 0 ? (
            <div className="px-4 py-6 flex flex-col items-center gap-1.5">
              <Package size={20} className="text-olive/20" />
              <p className="text-xs text-olive/40">Todo el inventario está bien.</p>
            </div>
          ) : (
            <div className="divide-y divide-olive/5 max-h-64 overflow-y-auto">
              {metrics.lowStock.map(p => (
                <div key={p.id} className="px-4 py-3">
                  <div className="text-xs font-medium text-olive truncate">{p.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.brand && <span className="text-[10px] text-olive/40">{p.brand} ·</span>}
                    <span className="text-[10px] text-amber-600 font-medium">
                      {p.stock.toFixed(2)} {p.unit}
                    </span>
                    <span className="text-[10px] text-olive/30">/ alerta: {p.lowStockAlert}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top servicios */}
      {metrics.revenueByService.length > 0 && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-olive/8">
            <h2 className="text-sm font-semibold text-olive">Top servicios · histórico</h2>
          </div>
          <div className="divide-y divide-olive/5 max-h-64 overflow-y-auto">
            {metrics.revenueByService.map(item => {
              const maxRevenue = metrics.revenueByService[0].revenue
              const pct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              return (
                <div key={item.service} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-olive truncate">{item.service}</div>
                    <div className="mt-1.5 h-1.5 bg-olive/6 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blossom-dark/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-olive">{mxn(item.revenue)}</div>
                    <div className="text-[10px] text-olive/40 mt-0.5">{item.count} cita{item.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  label, value, sub, change,
}: {
  label: string
  value: string
  sub: string
  change: { value: number; up: boolean } | null
}) {
  return (
    <div className="bg-white rounded-xl shadow-card px-4 py-3 shrink-0 min-w-[160px] md:min-w-0">
      <div className="text-[10px] text-olive/40 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-semibold text-olive leading-none">{value}</div>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className="text-[11px] text-olive/40">{sub}</span>
        {change && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${change.up ? 'text-moss' : 'text-red-400'}`}>
            {change.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change.value}%
          </span>
        )}
      </div>
    </div>
  )
}
