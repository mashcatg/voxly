'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ConversationSidebar } from '@/components/chat/conversation-sidebar-new'
import { cn } from '@/lib/utils'
import { useClickOutside, useMediaQuery } from '@/hooks/use-click-outside'
import { useSidebarStore } from '@/stores/sidebar-store'

export default function GlobalSidebar() {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { isOpen, close, open, wasOpen, setWasOpen } = useSidebarStore()

  // Handle initial state and responsive behavior
  useEffect(() => {
    if (isMobile) {
      close()
    } else {
      // On desktop, restore the previous state
      if (wasOpen) {
        open()
      }
    }
  }, [isMobile, close, open, wasOpen])

  // Persist wasOpen state for desktop
  useEffect(() => {
    if (!isMobile) {
      setWasOpen(isOpen)
    }
  }, [isOpen, isMobile, setWasOpen])

  // Handle click outside on mobile
  useClickOutside(
    sidebarRef,
    () => {
      if (isMobile && isOpen) {
        close()
      }
    },
    [overlayRef] // Exclude overlay from triggering close
  )

  return (
    <>
      {/* Overlay - only visible on mobile when sidebar is open */}
      <div
        ref={overlayRef}
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all duration-300",
          isMobile && isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none lg:opacity-0 lg:pointer-events-none"
        )}
        onClick={() => {
          if (isMobile) close()
        }}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-background border-r transition-all duration-300 ease-in-out',
          'w-[250px]',
          // Transform based on state
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ConversationSidebar />
      </aside>
    </>
  )
}