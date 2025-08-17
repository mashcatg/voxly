'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GoogleLoginButton } from './google-login-button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface AuthDialogProps {
  isOpen?: boolean;
  standalone?: boolean;
}

export function AuthDialog({ isOpen = false, standalone = false }: AuthDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  React.useEffect(() => {
    // Only check session if not in standalone mode
    if (!standalone) {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setInternalOpen(false)
          router.push('/chat')
        } else {
          setInternalOpen(true)
        }
      }
      checkSession()
    }
  }, [supabase.auth, router, standalone])

  // Use isOpen prop in standalone mode, otherwise use internal state
  const open = standalone ? isOpen : internalOpen

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen: boolean) => {
        if (standalone) {
          router.back()
        } else {
          setInternalOpen(newOpen)
        }
      }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Voxly</DialogTitle>
          <DialogDescription>
            Sign in to start your AI conversation coach experience
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <GoogleLoginButton />
        </div>
      </DialogContent>
    </Dialog>
  )
}
