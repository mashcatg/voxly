'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AuthContextType {
  user: User | null
  signOut?: () => void
}

const AuthContext = createContext<AuthContextType>({ user: null })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const { supabase } = useSupabase()

  // Get the user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || null,
          email: session.user.email,
          image: session.user.user_metadata.avatar_url || null,
        })
      }
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || null,
          email: session.user.email,
          image: session.user.user_metadata.avatar_url || null,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    }
    setUser(null)
    window.location.href = '/auth/login'
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
