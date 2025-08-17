'use client'

import { cn } from '@/lib/utils'
import { TopBar } from '@/components/layout/top-bar'
import GlobalSidebar from '@/components/layout/global-sidebar-new'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <GlobalSidebar />
      <main className={cn("flex-1", className)}>
        {children}
      </main>
    </div>
  )
}