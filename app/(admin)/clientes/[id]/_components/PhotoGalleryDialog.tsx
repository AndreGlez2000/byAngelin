'use client'
import { useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

type Photo = {
  id: string
  url: string | null
  createdAt: string
  appointmentId: string | null
  service: string | null
  date: string | null
}

type Group = {
  appointmentId: string | null
  service: string | null
  date: string | null
  photos: Photo[]
}

type Props = {
  clientId: string
  clientName: string
  groups: Group[]
  allPhotos: Photo[]
  onClose: () => void
  onPhotoClick: (photo: Photo) => void
  onUploadDone: () => void
  onDeleteDone: () => void
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function PhotoGalleryDialog({
  clientId, clientName, groups, allPhotos, onClose, onPhotoClick, onUploadDone, onDeleteDone,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadApptIdRef = useRef<string | null>(null)

  const totalPhotos = allPhotos.length
  const totalSessions = groups.filter(g => g.appointmentId !== null).length

  function openPicker(appointmentId: string | null) {
    uploadApptIdRef.current = appointmentId
    inputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1200,
        fileType: 'image/webp',
        useWebWorker: true,
      })
      const fd = new FormData()
      fd.append('file', compressed, 'photo.webp')
      if (uploadApptIdRef.current) fd.append('appointmentId', uploadApptIdRef.current)
      const res = await fetch(`/api/clients/${clientId}/photos`, { method: 'POST', body: fd })
      if (res.ok) onUploadDone()
    } catch (err) {
      console.error('Upload failed', err)
    }
  }

  async function handleDelete(photoId: string, e: React.MouseEvent) {
    e.stopPropagation()
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    if (res.ok) onDeleteDone()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden h-full md:h-auto md:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-olive/10 shrink-0">
          <div>
            <div className="font-display text-base text-olive italic font-bold">Fotos — {clientName}</div>
            <div className="text-[10px] text-olive/40 mt-0.5">{totalPhotos} fotos · {totalSessions} sesiones</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openPicker(null)}
              className="flex items-center gap-1.5 bg-blossom-dark text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blossom transition-colors"
            >
              + Subir foto
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-olive/[0.08] hover:bg-olive/15 flex items-center justify-center text-olive/50 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-olive/30">
              <p className="text-sm italic">Sin fotos aún.</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.appointmentId ?? 'sin-cita'} className="mt-4">
              {/* Group header */}
              <div className="flex items-center gap-2 pb-2 border-b border-olive/[0.08] mb-3">
                {group.appointmentId !== null
                  ? <span className="w-1.5 h-1.5 rounded-full bg-moss/70 shrink-0" />
                  : <span className="text-xs text-olive/30 shrink-0">—</span>}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-olive">{group.service ?? 'Sin cita'}</span>
                  {group.date && (
                    <span className="text-[10px] text-olive/40 ml-2">{formatDate(group.date)}</span>
                  )}
                </div>
                <button
                  onClick={() => openPicker(group.appointmentId)}
                  className="text-[10px] text-blossom-dark border border-blossom/25 bg-blossom/[0.08] px-2.5 py-1 rounded-full hover:bg-blossom/15 transition-colors shrink-0"
                >
                  + Agregar
                </button>
              </div>

              {/* Photos */}
              {group.photos.length === 0 ? (
                <p className="text-[10px] text-olive/35 pb-2">Sin fotos en esta sesión.</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {group.photos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => onPhotoClick(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-olive/10 group"
                    >
                      {photo.url
                        ? <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-olive/10" />}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => handleDelete(photo.id, e)}
                          className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
