'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function Nav() {
  const path = usePathname()
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        path.startsWith(href) ? 'text-olive font-medium' : 'text-olive/50 hover:text-olive'
      }`}
    >
      {label}
    </Link>
  )
  return (
    <nav className="bg-white border-b border-olive/10 px-6 h-14 flex items-center justify-between shadow-card">
      <span className="font-display text-2xl text-olive italic">Angelin</span>
      <div className="flex gap-6">
        {link('/agenda', 'Agenda')}
        {link('/clientes', 'Clientes')}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-xs text-olive/40 hover:text-olive/70 transition-colors"
      >
        Salir
      </button>
    </nav>
  )
}
