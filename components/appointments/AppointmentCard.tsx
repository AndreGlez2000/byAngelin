import React from "react"
import Link from "next/link"
import { Sparkles, CheckCircle2, XCircle, Receipt, FileText, ImageIcon } from "lucide-react"

export type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED"

export type BaseAppointment = {
  id: string
  service?: string | null
  services?: Array<{ service: { name: string; price?: string } }>
  date: string
  status: AppointmentStatus
  sessionNotes?: string | null
  pricePaid?: number | null
  paymentMethod?: string | null
  receipt?: { id: string } | null
  client?: { id: string; name: string } | null
}

interface AppointmentCardProps {
  appointment: BaseAppointment
  displayStatus?: AppointmentStatus
  context?: "agenda" | "history"
  highlighted?: boolean
  onClick?: (appt: BaseAppointment) => void
  onReceiptClick?: (appt: BaseAppointment, e: React.MouseEvent) => void
  className?: string
  serviceDuration?: string | null
  id?: string
  photoCount?: number
  receiptLoading?: boolean
}

export function AppointmentCard({
  appointment,
  displayStatus,
  context = "agenda",
  highlighted = false,
  onClick,
  onReceiptClick,
  className = "",
  serviceDuration,
  id,
  photoCount,
  receiptLoading = false,
}: AppointmentCardProps) {
  const status = displayStatus || appointment.status

  // Resolve service name
  let serviceName = "Servicio sin especificar"
  if (appointment.services && appointment.services.length > 0) {
    serviceName = appointment.services.map((s) => s.service.name).join(" + ")
  } else if (appointment.service) {
    serviceName = appointment.service
  }

  // Format time and date
  const dateObj = new Date(appointment.date)
  const time = dateObj.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  
  const isHistory = context === "history"
  const historyDateString = isHistory 
    ? dateObj.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) 
    : ""
    
  const displayTimeOrDate = isHistory ? `${historyDateString} · ${time}` : time

  // Format price if available
  const hasPrice = appointment.pricePaid != null
  const priceFormatted = hasPrice
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
        appointment.pricePaid!
      )
    : null

  const showClientInfo = context === "agenda" && appointment.client
  
  // Base classes and handlers
  const wrapperClasses = `relative overflow-hidden w-full text-left transition-all ${className} ${
    onClick ? "cursor-pointer" : ""
  } ${highlighted ? "ring-2 ring-blossom-dark ring-offset-1" : ""}`

  const handleClick = () => {
    if (onClick) onClick(appointment)
  }

  // 1. CONFIRMED: Premium Dark
  if (status === "CONFIRMED") {
    return (
      <div
        id={id || `appt-card-${appointment.id}`}
        onClick={handleClick}
        className={`${wrapperClasses} bg-olive-dark rounded-xl shadow-sm hover:shadow-md hover:bg-olive/90 active:scale-[0.98] transition-all`}
      >
        <Sparkles className="absolute -right-3 -top-3 opacity-10 text-parchment" size={50} />
        <div className="relative z-10 p-3">
          {/* Hora en top */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-parchment/50 uppercase tracking-widest">
              {displayTimeOrDate}
            </span>
            {appointment.sessionNotes && <FileText size={10} className="text-white/30" />}
          </div>
          {/* Nombre */}
          {showClientInfo ? (
            <Link
              href={`/clientes/${appointment.client!.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-white text-sm leading-tight block truncate hover:text-parchment transition-colors"
            >
              {appointment.client!.name}
            </Link>
          ) : (
            <p className="font-semibold text-white text-sm leading-tight truncate">
              {serviceName}
            </p>
          )}
          {/* Servicio */}
          {showClientInfo && (
            <p className="text-[11px] text-white/55 mt-0.5 truncate">{serviceName}</p>
          )}
          {/* Precio */}
          {hasPrice && (
            <p className="text-xs text-parchment/70 font-mono mt-1.5">{priceFormatted}</p>
          )}
        </div>
      </div>
    )
  }

  // 2. COMPLETED: Mismo layout que CONFIRMED, fondo crema
  if (status === "COMPLETED") {
    return (
      <div
        id={id || `appt-card-${appointment.id}`}
        onClick={handleClick}
        className={`${wrapperClasses} bg-white border border-olive/15 rounded-xl shadow-sm hover:bg-parchment/40 active:scale-[0.98] transition-all`}
      >
        <div className="relative z-10 p-3">
          {/* Hora + ícono — mismo patrón que CONFIRMED */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-olive/40 uppercase tracking-widest">
              {displayTimeOrDate}
            </span>
            <CheckCircle2 size={11} className="text-moss/60 shrink-0" />
          </div>
          {/* Nombre — mismo peso tipográfico */}
          {showClientInfo ? (
            <Link
              href={`/clientes/${appointment.client!.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-olive-dark text-sm leading-tight block truncate hover:text-moss-dark transition-colors"
            >
              {appointment.client!.name}
            </Link>
          ) : (
            <p className="font-semibold text-olive-dark text-sm leading-tight truncate">{serviceName}</p>
          )}
          {/* Servicio */}
          {showClientInfo && (
            <p className="text-[11px] text-olive/50 mt-0.5 truncate">{serviceName}</p>
          )}
          {/* Precio + recibo */}
          <div className="flex items-center justify-between mt-1.5">
            {hasPrice && (
              <p className="text-xs text-olive/60 font-mono">{priceFormatted}</p>
            )}
            {appointment.receipt && onReceiptClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onReceiptClick(appointment, e) }}
                disabled={receiptLoading}
                className="text-[10px] flex items-center gap-1 text-moss-dark hover:text-moss font-medium transition-colors ml-auto disabled:opacity-60 disabled:cursor-wait"
              >
                <Receipt size={10} /> {receiptLoading ? "Abriendo..." : "Recibo"}
              </button>
            )}
            {appointment.sessionNotes && !appointment.receipt && (
              <FileText size={10} className="text-olive/30 ml-auto" />
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. CANCELLED: Mismo layout, muteado
  return (
    <div
      id={id || `appt-card-${appointment.id}`}
      onClick={handleClick}
      className={`${wrapperClasses} bg-white/50 border border-dashed border-olive/15 rounded-xl opacity-45 hover:opacity-70 active:scale-[0.98] transition-all`}
    >
      <div className="relative z-10 p-3">
        {/* Hora + ícono — mismo patrón */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-olive/40 uppercase tracking-widest">
            {displayTimeOrDate}
          </span>
          <XCircle size={11} className="text-olive/30 shrink-0" />
        </div>
        {/* Nombre tachado */}
        {showClientInfo ? (
          <p className="font-semibold text-sm text-olive/40 leading-tight truncate line-through decoration-olive/20">
            {appointment.client!.name}
          </p>
        ) : (
          <p className="font-semibold text-sm text-olive/40 leading-tight truncate line-through decoration-olive/20">{serviceName}</p>
        )}
        {/* Servicio */}
        {showClientInfo && (
          <p className="text-[11px] text-olive/30 mt-0.5 truncate">{serviceName}</p>
        )}
      </div>
    </div>
  )
}
