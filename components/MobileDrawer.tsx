'use client'
import Sidebar from '@/components/Sidebar'

export function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer panel */}
      <div className="md:hidden fixed top-0 left-0 z-50 h-full">
        <Sidebar onClose={onClose} />
      </div>
    </>
  )
}
