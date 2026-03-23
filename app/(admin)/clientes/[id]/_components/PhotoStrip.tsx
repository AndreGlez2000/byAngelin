'use client'
import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'

type Photo = {
  id: string
  url: string | null
  createdAt: string
  appointmentId: string | null
  service: string | null
  date: string | null
}

type Props = {
  clientId: string
  photos: Photo[]
  onUploadDone: () => void
  onOpenGallery: () => void
}

export function PhotoStrip({ clientId, photos, onUploadDone, onOpenGallery }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const MAX_VISIBLE = 3
  const visible = photos.slice(0, MAX_VISIBLE)
  const overflow = photos.length - MAX_VISIBLE

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadError(null)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1200,
        fileType: 'image/webp',
        useWebWorker: true,
      })
      const fd = new FormData()
      fd.append('file', compressed, 'photo.webp')
      const res = await fetch(`/api/clients/${clientId}/photos`, { method: 'POST', body: fd })
      if (res.ok) {
        onUploadDone()
      } else {
        setUploadError('Error al subir. Verifica la configuración de almacenamiento.')
      }
    } catch (err) {
      console.error('Upload failed', err)
      setUploadError('Error al subir la foto.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-base text-olive italic">Fotos</h3>
        {photos.length > 0 && (
          <button onClick={onOpenGallery} className="text-[10px] text-blossom-dark hover:underline">
            Ver todas
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {visible.map(photo => (
          <button
            key={photo.id}
            onClick={onOpenGallery}
            className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-olive/10"
          >
            {photo.url
              ? <img src={photo.url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-olive/10" />}
          </button>
        ))}

        {overflow > 0 && (
          <button
            onClick={onOpenGallery}
            className="w-10 h-10 rounded-lg shrink-0 bg-olive/10 flex items-center justify-center text-[10px] font-semibold text-olive/50 hover:bg-olive/20 transition-colors"
          >
            +{overflow}
          </button>
        )}

        <button
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="w-10 h-10 rounded-lg shrink-0 border border-dashed border-olive/25 flex items-center justify-center text-olive/30 hover:border-blossom/50 hover:text-blossom-dark/50 transition-colors disabled:cursor-not-allowed"
        >
          {uploading
            ? <span className="w-3.5 h-3.5 border-2 border-olive/30 border-t-blossom-dark rounded-full animate-spin" />
            : <span className="text-lg leading-none">+</span>}
        </button>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </div>

      {photos.length === 0 && !uploading && (
        <p className="text-[10px] text-olive/35 mt-1">Sin fotos aún.</p>
      )}
      {uploading && (
        <p className="text-[10px] text-olive/40 mt-1">Subiendo foto…</p>
      )}
      {uploadError && (
        <p className="text-[10px] text-blossom-dark mt-1">{uploadError}</p>
      )}
    </div>
  )
}
