'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { RealtimeChannel, Session } from '@supabase/supabase-js'
import { LogOut, Settings, User, Coins, PanelRight, Zap, Share2, CreditCard, Menu } from "lucide-react"
import { getUserCredits } from "@/lib/api"
import { toast } from "sonner"
import { useSidebarStore } from "@/stores/sidebar-store"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface TopBarProps {
  isCallActive?: boolean
}

export function TopBar({ isCallActive = false }: TopBarProps) {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const { isOpen, toggle } = useSidebarStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const handleShare = async () => {
    const conversationId = params?.id
    if (!conversationId) return

    try {
      // Update conversation to be public
      const { error } = await supabase
        .from('conversations')
        .update({ is_public: true })
        .eq('id', conversationId)

      if (error) throw error

      // Copy shareable link to clipboard
      const shareableLink = `${window.location.origin}/chat/${conversationId}`
      await navigator.clipboard.writeText(shareableLink)

      toast.success('Link copied to clipboard!', {
        description: 'Anyone with this link can now view this conversation'
      })
    } catch (error) {
      console.error('Error sharing conversation:', error)
      toast.error('Failed to share conversation')
    }
  }

  // Get and monitor session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Load initial credits and set up real-time updates
  useEffect(() => {
    let mounted = true
    let channel: RealtimeChannel | null = null

    async function loadCredits() {
      if (!session?.user) {
        if (mounted) setLoading(false)
        return
      }

      try {
        const userCredits = await getUserCredits()
        if (mounted) {
          setCredits(userCredits)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading credits:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initial load
    loadCredits()

    // Set up subscription for real-time updates
    if (session?.user) {
      channel = supabase
        .channel(`credits_${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${session.user.id}`
          },
          async () => {
            const newCredits = await getUserCredits()
            if (mounted) {
              setCredits(newCredits)
              // Redirect to pricing if credits are depleted during a call
              if (newCredits === 0 && isCallActive) {
                router.push('/pricing')
              }
            }
          }
        )
        .subscribe()
    }

    return () => {
      mounted = false
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [session, isCallActive, router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className={cn(
      "sticky top-0 z-30 w-full bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-300 ease-in-out",
      // Adjust positioning when sidebar is open on desktop
      isOpen && !isMobile ? "lg:ml-[250px] lg:w-[calc(100%-250px)]" : ""
    )}>
      <div className=" flex h-[4.5rem] items-center px-2 justify-between">
        {/* Left side - Toggle button and Logo */}
        <div className="flex items-center space-x-2">
          {/* Show toggle button only when sidebar is closed or on mobile */}
          <Button
            variant="ghost"
            className={cn(
              "px-2 hover:bg-accent transition-all duration-300",
              isOpen && !isMobile ? "hidden w-0 px-0 overflow-hidden" : "block"
            )}
            onClick={toggle}
          >
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Voxly</span>
          </Link>
        </div>

        {/* Right side - Navigation and User menu */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link href="/pricing" className="text-xs hover:text-primary">
            Pricing
          </Link>

          {session?.user && (
            <div className="bg-accent text-primary px-2 py-1 rounded-full flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-medium">
                {loading ? '...' : `${credits.toFixed(2)}`}
              </span>
            </div>
          )}

          {/* User menu */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {session.user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/subscription" className="flex items-center gap-2">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscriptions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}