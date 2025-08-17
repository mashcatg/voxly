import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isOpen: boolean
  wasOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  setWasOpen: (wasOpen: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      wasOpen: true,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setWasOpen: (wasOpen: boolean) => set({ wasOpen }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ wasOpen: state.wasOpen }), // Only persist wasOpen
    }
  )
)