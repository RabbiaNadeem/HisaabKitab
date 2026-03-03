import React from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/store/uiStore'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content — shifts right when sidebar open */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin-left] duration-300 ease-in-out',
          sidebarOpen ? 'ml-64' : 'ml-16',
        )}
      >
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
