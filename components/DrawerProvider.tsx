'use client'
import { useState, useEffect } from 'react'
import { MobileHeader } from '@/components/MobileHeader'
import { MobileDrawer } from '@/components/MobileDrawer'

export function DrawerProvider({ children }: { children: React.ReactNode }) {
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
    <>
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {children}
    </>
  )
}
