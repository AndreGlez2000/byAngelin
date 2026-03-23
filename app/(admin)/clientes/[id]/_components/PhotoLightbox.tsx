'use client'
import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

type Photo = {
  id: string
  url: string | null
  createdAt: string
  appointmentId: string | null
  service: string | null
  date: string | null
}

type Props = {
  photos: Photo[]
  initialId: string
  onClose: () => void
  onDelete: (photoId: string) => void
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function PhotoLightbox({ photos, initialId, onClose, onDelete }: Props) {
  const [index, setIndex] = useState(() => {
    const i = photos.findIndex(p => p.id === initialId)
    return i >= 0 ? i : 0
  })
  const touchStartX = useRef<number | null>(null)
  const photo = photos[index]
  const total = photos.length

  function prev() { setIndex(i => (i > 0 ? i - 1 : i)) }
  function next() { setIndex(i => (i < total - 1 ? i + 1 : i)) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center"
      onClick={onClose}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) { dx < 0 ? next() : prev() }
        touchStartX.current = null
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
      >
        <X size={16} />
      </button>

      {/* ESC hint */}
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/20 tracking-wide select-none pointer-events-none">
        ESC para cerrar
      </span>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); prev() }}
        disabled={index === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); next() }}
        disabled={index === total - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* Photo card */}
      <div
        className="bg-[#1e1c18] rounded-2xl overflow-hidden w-full max-w-sm mx-16 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full aspect-[4/3] bg-black/40 flex items-center justify-center">
          {photo.url
            ? <img src={photo.url} alt="" className="w-full h-full object-contain" />
            : <div className="text-white/20 text-sm">Sin imagen</div>}
        </div>

        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="mb-3">
            <div className="text-sm font-semibold text-white/85">{photo.service ?? 'Sin cita'}</div>
            {photo.date && (
              <div className="text-[10px] text-white/40 mt-0.5">{formatDate(photo.date)}</div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/25">{index + 1} de {total}</span>
            <button
              onClick={() => onDelete(photo.id)}
              className="flex items-center gap-1.5 text-[10px] text-blossom-dark/80 border border-blossom/20 bg-blossom/10 px-3 py-1.5 rounded-lg hover:bg-blossom/20 transition-colors"
            >
              <Trash2 size={11} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
