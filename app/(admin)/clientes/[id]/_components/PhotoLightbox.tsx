'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Trash2 } from 'lucide-react'

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex(i => Math.min(total - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, total])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 bg-black z-[60] flex flex-col select-none"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) dx < 0
          ? setIndex(i => Math.min(total - 1, i + 1))
          : setIndex(i => Math.max(0, i - 1))
        touchStartX.current = null
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>
        <span className="text-sm text-white/50 tabular-nums">{index + 1} / {total}</span>
        <div className="w-9" />
      </div>

      {/* Image — fills all available space */}
      <div className="flex-1 relative min-h-0">
        {photo.url
          ? <img
              src={photo.url}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
          : <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">Sin imagen</div>
        }

        {/* Invisible left tap zone — previous */}
        {index > 0 && (
          <button
            onClick={() => setIndex(i => i - 1)}
            className="absolute left-0 top-0 bottom-0 w-1/3"
            aria-label="Foto anterior"
          />
        )}
        {/* Invisible right tap zone — next */}
        {index < total - 1 && (
          <button
            onClick={() => setIndex(i => i + 1)}
            className="absolute right-0 top-0 bottom-0 w-1/3"
            aria-label="Siguiente foto"
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-5 pt-3 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/85 truncate">
              {photo.service ?? 'Sin cita'}
            </p>
            {photo.date && (
              <p className="text-xs text-white/40 mt-0.5">{formatDate(photo.date)}</p>
            )}
          </div>
          <button
            onClick={() => onDelete(photo.id)}
            className="shrink-0 flex items-center gap-1.5 text-xs text-blossom/90 border border-blossom/30 bg-blossom/[0.12] px-3 py-2 rounded-xl hover:bg-blossom/25 transition-colors"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
