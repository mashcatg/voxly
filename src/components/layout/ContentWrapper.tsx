'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useMediaQuery } from '@/hooks/use-media-query'

interface ContentWrapperProps {
  children: ReactNode
  className?: string
}

export function ContentWrapper({ children, className }: ContentWrapperProps) {
  const { isOpen } = useSidebarStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        // Adjust margin and width when sidebar is open on desktop
        isOpen && !isMobile ? "lg:ml-[250px] lg:w-[calc(100%-250px)]" : "",
        className
      )}
    >
      {children}
    </div>
  )
}