'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, CalendarDays, DollarSign, AlertTriangle, Package } from 'lucide-react'

type RevenueByService = { service: string; revenue: number; count: number }
type TodayAppointment = {
  id: string
  service: string
  date: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  client: { name: string }
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

const STATUS_LABEL = { CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }
const STATUS_DOT: Record<string, string> = {
  CONFIRMED: 'bg-blossom-dark',
  COMPLETED: 'bg-moss',
  CANCELLED: 'bg-olive/30',
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

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-olive italic capitalize">{monthLabel}</h1>
        <p className="text-sm text-olive/40 mt-0.5">Resumen del negocio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          icon={<DollarSign size={18} className="text-blossom-dark" />}
          label="Ingresos este mes"
          value={mxn(metrics.revenueThisMonth)}
          sub={`${mxn(metrics.revenueLastMonth)} el mes pasado`}
          change={revChange}
        />
        <KpiCard
          icon={<CalendarDays size={18} className="text-blossom-dark" />}
          label="Citas completadas"
          value={String(metrics.appointmentsThisMonth)}
          sub={`${metrics.appointmentsLastMonth} el mes pasado`}
          change={apptChange}
        />
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-[3fr_2fr] gap-4 items-start">

        {/* Ingresos por servicio */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-olive/8">
            <h2 className="text-sm font-semibold text-olive">Ingresos por servicio · {monthLabel}</h2>
          </div>
          {metrics.revenueByService.length === 0 ? (
            <p className="px-5 py-6 text-sm text-olive/40">Sin ingresos registrados este mes.</p>
          ) : (
            <div className="divide-y divide-olive/5">
              {metrics.revenueByService.slice(0, 8).map(item => {
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
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Citas de hoy */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-olive/8 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-olive">Citas de hoy</h2>
              <span className="text-xs text-olive/40">{metrics.todayAppointments.length} total</span>
            </div>
            {metrics.todayAppointments.length === 0 ? (
              <p className="px-4 py-5 text-sm text-olive/40 text-center">Ninguna cita hoy.</p>
            ) : (
              <div className="divide-y divide-olive/5">
                {metrics.todayAppointments.map(a => {
                  const time = new Date(a.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
                  return (
                    <div key={a.id} className="px-4 py-2.5 flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? 'bg-olive/20'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-olive truncate">{a.client.name}</div>
                        <div className="text-[10px] text-olive/50 truncate">{a.service}</div>
                      </div>
                      <div className="text-[10px] text-olive/40 font-mono shrink-0">{time}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stock bajo */}
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
              <div className="px-4 py-5 flex flex-col items-center gap-1.5">
                <Package size={20} className="text-olive/20" />
                <p className="text-xs text-olive/40">Todo el inventario está bien.</p>
              </div>
            ) : (
              <div className="divide-y divide-olive/5">
                {metrics.lowStock.map(p => (
                  <div key={p.id} className="px-4 py-2.5">
                    <div className="text-xs font-medium text-olive truncate">{p.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.brand && <span className="text-[10px] text-olive/40">{p.brand} ·</span>}
                      <span className="text-[10px] text-amber-600 font-medium">
                        {p.stock.toFixed(2)} {p.unit}
                      </span>
                      <span className="text-[10px] text-olive/30">/ alerta en {p.lowStockAlert}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, change,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  change: { value: number; up: boolean } | null
}) {
  return (
    <div className="bg-white rounded-xl shadow-card px-5 py-4 flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-blossom/15 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-olive/40 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-semibold text-olive leading-none">{value}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-olive/40">{sub}</span>
          {change && (
            <span className={`flex items-center gap-0.5 text-[11px] font-medium ${change.up ? 'text-moss' : 'text-red-400'}`}>
              {change.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {change.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
