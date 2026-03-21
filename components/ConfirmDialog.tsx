type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-olive/20 flex items-center justify-center p-4 z-50">
      <div className="bg-parchment rounded-2xl shadow-modal p-6 w-full max-w-xs">
        <div className="flex flex-col items-center text-center gap-3">
          <p className="font-display text-xl italic font-bold text-olive">Confirmar eliminación</p>
          <p className="text-xs text-olive/60 leading-snug -mt-1">{message}</p>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-blossom-dark text-white text-sm py-2.5 rounded-lg hover:bg-blossom transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
