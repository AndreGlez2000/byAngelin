'use client'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

type Client = { id: string; name: string; phone: string }
type Appointment = {
  id: string
  service: string
  date: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  sessionNotes: string | null
  pricePaid?: number | null
  paymentMethod?: string | null
  client: Client
}

const STATUS_LABEL = { CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }
const STATUS_BG = {
  CONFIRMED: 'bg-moss/25',
  COMPLETED: 'bg-olive/8',
  CANCELLED: 'bg-blossom/25',
}
const STATUS_DOT = {
  CONFIRMED: 'bg-moss',
  COMPLETED: 'bg-olive/30',
  CANCELLED: 'bg-blossom-dark',
}
const STATUS_TEXT = {
  CONFIRMED: 'text-moss',
  COMPLETED: 'text-olive/40',
  CANCELLED: 'text-blossom-dark',
}
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DAY_NAMES_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Props {
  selectedDay: Date
  today: Date
  appointments: Appointment[]
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
  onNewAppointment: () => void
  onEdit: (appt: Appointment) => void
  onDelete: (id: string) => void
}

export function MobileDayView({
  selectedDay, today, appointments, onPrevDay, onNextDay, onToday,
  onNewAppointment, onEdit, onDelete,
}: Props) {
  const isToday =
    selectedDay.toDateString() === today.toDateString()

  const dayAppts = appointments
    .filter(a => {
      const d = new Date(a.date)
      return (
        d.getFullYear() === selectedDay.getFullYear() &&
        d.getMonth() === selectedDay.getMonth() &&
        d.getDate() === selectedDay.getDate()
      )
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="flex flex-col h-full">
      {/* Day nav header */}
      <div className="px-4 py-3 border-b border-olive/10 bg-parchment shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevDay}
            className="p-2 -ml-2 text-olive/50 hover:text-olive transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className={`text-base font-semibold ${isToday ? 'text-blossom-dark' : 'text-olive'}`}>
              {DAY_NAMES_LONG[selectedDay.getDay()]}
            </div>
            <div className="text-xs text-olive/50">
              {selectedDay.getDate()} {MONTHS_SHORT[selectedDay.getMonth()]} {selectedDay.getFullYear()}
            </div>
          </div>
          <button
            onClick={onNextDay}
            className="p-2 -mr-2 text-olive/50 hover:text-olive transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {!isToday && (
          <div className="mt-2">
            <button
              onClick={onToday}
              className="text-xs text-blossom-dark border border-blossom/30 px-3 py-1 rounded-full"
            >
              Hoy
            </button>
          </div>
        )}
      </div>

      {/* Appointments list */}
      <div className="flex-1 overflow-y-auto">
        {dayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-sm text-olive/40">Sin citas este día</p>
          </div>
        ) : (
          <div className="divide-y divide-olive/8">
            {dayAppts.map(appt => {
              const apptDate = new Date(appt.date)
              const time = apptDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
              return (
                <div
                  key={appt.id}
                  onClick={() => onEdit(appt)}
                  className={`px-4 py-3.5 cursor-pointer active:opacity-70 transition-opacity ${STATUS_BG[appt.status]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[appt.status]}`} />
                        <span className="text-xs text-olive/50">{time}</span>
                        <span className={`text-xs ${STATUS_TEXT[appt.status]}`}>{STATUS_LABEL[appt.status]}</span>
                      </div>
                      <Link
                        href={`/clientes/${appt.client.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-sm font-semibold text-olive truncate block hover:text-blossom-dark hover:underline transition-colors"
                      >
                        {appt.client.name}
                      </Link>
                      <div className="text-xs text-olive/60 truncate">{appt.service}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onNewAppointment}
        className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-blossom-dark text-white shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
      >
        <Plus size={24} />
      </button>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-olive/10 bg-parchment shrink-0">
        {(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
            <span className="text-xs text-olive/50">{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
