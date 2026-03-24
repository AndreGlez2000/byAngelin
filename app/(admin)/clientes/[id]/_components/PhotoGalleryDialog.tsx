"use client";
import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type Photo = {
  id: string;
  url: string | null;
  createdAt: string;
  appointmentId: string | null;
  service: string | null;
  date: string | null;
};

type Group = {
  appointmentId: string | null;
  service: string | null;
  date: string | null;
  photos: Photo[];
};

type Props = {
  clientId: string;
  clientName: string;
  groups: Group[];
  allPhotos: Photo[];
  onClose: () => void;
  onPhotoClick: (photo: Photo) => void;
  onUploadDone: () => void;
};

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function PhotoGalleryDialog({
  clientId,
  clientName,
  groups,
  allPhotos,
  onClose,
  onPhotoClick,
  onUploadDone,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadApptIdRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const totalPhotos = allPhotos.length;
  const totalSessions = groups.filter((g) => g.appointmentId !== null).length;

  function openPicker(appointmentId: string | null) {
    if (uploading) return;
    uploadApptIdRef.current = appointmentId;
    inputRef.current?.click();
  }

  function openCamera(appointmentId: string | null) {
    if (uploading) return;
    uploadApptIdRef.current = appointmentId;
    cameraInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1200,
        fileType: "image/webp",
        useWebWorker: true,
      });
      const fd = new FormData();
      fd.append("file", compressed, "photo.webp");
      if (uploadApptIdRef.current)
        fd.append("appointmentId", uploadApptIdRef.current);
      const res = await fetch(`/api/clients/${clientId}/photos`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        onUploadDone();
      } else {
        setUploadError(
          "Error al subir. Verifica la configuración de almacenamiento.",
        );
      }
    } catch (err) {
      console.error("Upload failed", err);
      setUploadError("Error al subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden h-full md:h-auto md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-0 border-b border-olive/10 shrink-0">
          <div className="flex items-center justify-between pb-4">
            <div>
              <div className="font-display text-base text-olive italic font-bold">
                Fotos — {clientName}
              </div>
              <div className="text-[10px] text-olive/40 mt-0.5">
                {totalPhotos} fotos · {totalSessions} sesiones
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Camera button — mobile only */}
              <button
                onClick={() => openCamera(null)}
                disabled={uploading}
                className="md:hidden w-8 h-8 rounded-lg bg-blossom-dark/10 border border-blossom/25 flex items-center justify-center text-blossom-dark disabled:opacity-50"
                title="Tomar foto"
              >
                <Camera size={15} />
              </button>
              <button
                onClick={() => openPicker(null)}
                disabled={uploading}
                className="flex items-center gap-1.5 bg-blossom-dark text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blossom transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Subiendo…
                  </>
                ) : (
                  "+ Subir foto"
                )}
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-olive/[0.08] hover:bg-olive/15 flex items-center justify-center text-olive/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          {uploadError && (
            <div className="text-[10px] text-blossom-dark pb-3">
              {uploadError}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-olive/30">
              <p className="text-sm italic">Sin fotos aún.</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.appointmentId ?? "sin-cita"} className="mt-4">
              {/* Group header */}
              <div className="flex items-center gap-2 pb-2 border-b border-olive/[0.08] mb-3">
                {group.appointmentId !== null ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-moss/70 shrink-0" />
                ) : (
                  <span className="text-xs text-olive/30 shrink-0">—</span>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-olive">
                    {group.service ?? "Sin cita"}
                  </span>
                  {group.date && (
                    <span className="text-[10px] text-olive/40 ml-2">
                      {formatDate(group.date)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openCamera(group.appointmentId)}
                    disabled={uploading}
                    className="md:hidden w-6 h-6 rounded-md bg-blossom/[0.08] border border-blossom/20 flex items-center justify-center text-blossom-dark disabled:opacity-50"
                    title="Tomar foto"
                  >
                    <Camera size={12} />
                  </button>
                  <button
                    onClick={() => openPicker(group.appointmentId)}
                    disabled={uploading}
                    className="text-[10px] text-blossom-dark border border-blossom/25 bg-blossom/[0.08] px-2.5 py-1 rounded-full hover:bg-blossom/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Photos */}
              {group.photos.length === 0 ? (
                <p className="text-[10px] text-olive/35 pb-2">
                  Sin fotos en esta sesión.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {group.photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => onPhotoClick(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-olive/10 active:scale-95 transition-transform"
                    >
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-olive/10" />
                      )}
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
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
