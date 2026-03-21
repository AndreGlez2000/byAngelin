'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { MobileDrawer } from '@/components/MobileDrawer'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile header — hidden on desktop */}
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />

      {/* Mobile drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-parchment pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
