'use client'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

const PATH_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/agenda': 'Agenda',
  '/clientes': 'Clientas',
  '/servicios': 'Servicios',
  '/inventario': 'Inventario',
}

function getTitle(path: string): string {
  if (path === '/') return 'Inicio'
  const key = Object.keys(PATH_TITLES).find(k => k !== '/' && path.startsWith(k))
  return key ? PATH_TITLES[key] : 'Angelin'
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const path = usePathname()
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-olive-dark h-14 flex items-center px-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>
      <span className="flex-1 text-center font-display text-lg italic text-white/90">
        {getTitle(path)}
      </span>
      {/* spacer to keep title centered */}
      <div className="w-10" />
    </header>
  )
}
