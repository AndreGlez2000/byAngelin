import Sidebar from '@/components/Sidebar'
import { DrawerProvider } from '@/components/DrawerProvider'

export function ServerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer + header (client) + main content */}
      <DrawerProvider>
        <main className="flex-1 overflow-y-auto bg-parchment pt-14 md:pt-0">
          {children}
        </main>
      </DrawerProvider>
    </div>
  )
}
