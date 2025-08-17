'use client'

import { SupabaseProvider } from './providers/supabase-provider'
import { ConversationsProvider } from './providers/conversations-provider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <ConversationsProvider>
        {children}
        <Toaster />
      </ConversationsProvider>
    </SupabaseProvider>
  )
}
