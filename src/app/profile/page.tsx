'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, Mail, Zap, Calendar, MessageSquare, 
  CreditCard, Crown, Check, Settings,
  History, HelpCircle, ExternalLink,
  RefreshCw, FileText, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useSidebarStore } from '@/stores/sidebar-store'
import Link from 'next/link'
import { useMediaQuery } from '@/hooks/use-click-outside'

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar_url: string
  credits: number
  total_conversations: number
  subscription: {
    plan_type: string
    status: string
    current_period_end: string
    amount: number
  } | null
}

export default function ProfilePage() {
  const { close } = useSidebarStore()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const pathname = usePathname()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClientComponentClient()

  // Auto close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      close()
    }
  }, [isMobile, close])

  const loadProfile = async () => {
    try {
      setRefreshing(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get credits
      const { data: credits } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single()

      // Get conversation count
      const { count: conversationCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setProfile({
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        credits: credits?.credits || 0,
        total_conversations: conversationCount || 0,
        subscription: subscription ? {
          plan_type: subscription.plan_type,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          amount: subscription.amount
        } : null
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [supabase])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  return (
  <div className="flex-1 space-y-8 container mx-auto px-10 py-10 pt-4">


        {loading ? (
          <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="space-y-2 text-center md:text-left flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
        ) : !profile ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center space-y-2">
                <User className="w-12 h-12 mx-auto text-muted-foreground" />
                <CardTitle>Access Required</CardTitle>
                <CardDescription>Please sign in to view your profile</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Profile Overview */}
            <Card className="border-none shadow-none flex justify-center items-center">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{profile.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-4 flex-1">
                    <div>
                      <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{profile.email}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.subscription && (
                        <Badge variant="secondary" className="gap-1">
                          <Crown className="w-4 h-4" />
                          {profile.subscription.plan_type.toUpperCase()} Plan
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {profile.total_conversations} Conversations
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className='px-0'>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-md bg-[#573dff24] text-primary">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Credits</p>
                      <p className="text-2xl font-bold">{profile.credits}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='px-0'>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-md bg-[#573dff24] text-primary">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Conversations</p>
                      <p className="text-2xl font-bold">{profile.total_conversations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {profile.subscription && (
                <Card>
                  <CardContent className='px-0'>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-md bg-[#573dff24] text-primary">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next Billing</p>
                        <p className="text-sm font-medium">
                          {formatDate(profile.subscription.current_period_end)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(profile.subscription.amount)}/month
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                <CardDescription>Frequently used features and settings</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Settings',
                    icon: Settings,
                    href: '/settings',
                    description: 'Update your profile and preferences'
                  },
                  {
                    title: 'History',
                    icon: History,
                    href: '/history',
                    description: 'View past conversations'
                  },
                  {
                    title: 'Help & Support',
                    icon: HelpCircle,
                    href: '/help',
                    description: 'Get assistance and FAQs'
                  },
                  {
                    title: 'API Keys',
                    icon: ExternalLink,
                    href: '/api-keys',
                    description: 'Manage your API keys'
                  },
                  {
                    title: 'Start Chat',
                    icon: MessageSquare,
                    href: '/chat',
                    description: 'Begin a new conversation'
                  },
                  {
                    title: 'Subscription',
                    icon: CreditCard,
                    href: '/subscription',
                    description: 'Manage your plan'
                  },
                  {
                    title: 'Billing',
                    icon: FileText,
                    href: '/billing',
                    description: 'View payment history'
                  }
                ].map((action) => (
                  <Link 
                    key={action.title} 
                    href={action.href}
                    className="group relative overflow-hidden rounded-lg border p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <action.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card> */}
          </div>
        )}
      </div>
  )
}
