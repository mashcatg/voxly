'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CreditCard,
  Calendar,
  RefreshCw,
  AlertCircle,
  Check,
  TrendingUp,
  Clock,
  Download,
  Plus,
  Minus
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { useSidebarStore } from '@/stores/sidebar-store'

// Utility functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch {
    return 'N/A'
  }
}

const formatCurrency = (amount: number | string, currency: string = 'USD') => {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(numAmount / 100)
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return (
        <Badge className="bg-emerald-100 text-emerald-800">
          <Check className="w-4 h-4 mr-1" />Active
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="w-4 h-4 mr-1" />Pending
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">{status}</Badge>
      )
  }
}

type Subscription = {
  id: string
  subscription_id: string
  user_id: string
  plan_type: string
  status: string
  amount: string
  currency: string
  interval: string
  created_at: string
  updated_at: string
  metadata: {
    status: string
    currency: string
    customer: {
      name: string
      email: string
      customer_id: string
    }
    billing: {
      city: string
      state: string
      street: string
      country: string
      zipcode: string
    }
    next_billing_date: string
    previous_billing_date: string
    subscription_id: string
  }
}

type CreditHistory = {
  id: string
  user_id: string
  credits_added: number
  credits_before: number
  credits_after: number
  source: string
  subscription_id?: string
  created_at: string
  metadata: Record<string, any>
}

type Payment = {
  payment_id: string
  user_id: string
  total_amount: number
  currency: string
  status: string
  payment_method: string
  card_last_four: string
  card_network: string
  created_at: string
  invoice_url?: string
  metadata: Record<string, any>
  billing: {
    country: string
    state: string
    city: string
    street: string
    zipcode: string
  }
}

export default function SubscriptionPage() {
  const supabase = createClientComponentClient()
  const { close } = useSidebarStore()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  
  // Effect to close sidebar on mobile
  useEffect(() => {
    close()
  }, [])

  // Utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    } catch {
      return 'N/A'
    }
  }

  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    const numAmount = typeof amount === 'string' ? parseInt(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numAmount / 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <Check className="w-4 h-4 mr-1" />Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">{status}</Badge>
        )
    }
  }

  // Data fetching function
  const loadSubscriptionDetails = async () => {
    try {
      setRefreshing(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view subscription details')
        return
      }

      // Get current subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        throw subError
      }

      setSubscription(subscriptionData || null)

      // Only fetch additional data if we have a subscription
      if (subscriptionData) {
        // Fetch credit history
        const { data: creditData, error: creditError } = await supabase
          .from('credit_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (creditError) throw creditError
        setCreditHistory(creditData || [])

        // Fetch payments
        try {
          const response = await fetch(`/api/payments?subscription_id=${subscriptionData.subscription_id}`)
          if (!response.ok) throw new Error('Failed to fetch payments')
          const { data: paymentData } = await response.json()
          setPayments(paymentData || [])
        } catch (error) {
          console.error('Failed to fetch payments:', error)
          toast.error('Failed to load payment history')
        }
      }
    } catch (error) {
      console.error('Error loading subscription details:', error)
      toast.error('Failed to load subscription details')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }
      
      setSubscription(subscriptions)

      // Only try to load payments if we have a subscription
      if (subscriptions?.subscription_id) {
        try {
          const response = await fetch(`/api/payments?subscription_id=${subscriptions.subscription_id}`, {
            credentials: 'include' // Important for sending cookies
          })

          if (!response.ok) {
            if (response.status !== 404) {
              toast.error('Failed to load payment history')
            }
            return
          }

          const data = await response.json()
          setPayments(data.items || [])
        } catch (error) {
          // Silently handle payment loading errors
          console.error('Payment loading error:', error)
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      toast.error('Failed to load subscription details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Invoice download handler
  const downloadInvoice = async (paymentId: string) => {
    try {
      setDownloadingInvoice(paymentId)
      
      const response = await fetch(`/api/payments/${paymentId}/invoice`)
      if (!response.ok) throw new Error('Failed to download invoice')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${paymentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Invoice downloaded successfully')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    } finally {
      setDownloadingInvoice(null)
    }
  }

  // Initial data load
  useEffect(() => {
    loadSubscriptionDetails()
  }, [])

  useEffect(() => {
    loadSubscriptionDetails()
  }, [])

  useEffect(() => {
    if (isMobile) {
      close()
    }
  }, [isMobile, close])

  if (loading) {
    return (
      <div>
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </Card>


      {/* Payment History Skeleton */}
      <Card className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground mb-6">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <Button asChild>
            <a href="/pricing">View Plans</a>
          </Button>
        </div>
      </div>
    )
  }

  const NoSubscriptionView = () => (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Active Subscription</h2>
        <p className="text-muted-foreground mb-6">
          You don't have an active subscription. Choose a plan to get started.
        </p>
        <Button asChild>
          <a href="/pricing">View Plans</a>
        </Button>
      </div>
    </div>
  )

  const LoadingView = () => (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) return <LoadingView />
  if (!subscription) return <NoSubscriptionView />

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadSubscriptionDetails}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription plan details</CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Details */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)} Plan
                </h3>
                <p className="text-muted-foreground">
                  {formatCurrency(subscription.amount)}/{subscription.interval}
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                Auto-renews {formatDate(subscription.metadata.next_billing_date)}
              </Badge>
            </div>

            <Separator />

            {/* Subscription Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subscription ID</p>
                <p className="font-mono text-sm break-all bg-muted p-2 rounded">
                  {subscription.subscription_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Billing Period</p>
                <p className="text-sm">
                  {formatDate(subscription.metadata.previous_billing_date)} - {formatDate(subscription.metadata.next_billing_date)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Billing Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-sm">{subscription.metadata.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{subscription.metadata.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Address</p>
                  <p className="text-sm">{subscription.metadata.billing.street}</p>
                  <p className="text-sm">{subscription.metadata.billing.city}, {subscription.metadata.billing.state}</p>
                  <p className="text-sm">{subscription.metadata.billing.country} {subscription.metadata.billing.zipcode}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recent payments and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No payment history available</p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.payment_id}
                    className="flex flex-col space-y-4 p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.total_amount, payment.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.created_at)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {payment.card_network} •••• {payment.card_last_four}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                        {payment.invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(payment.payment_id)}
                            disabled={downloadingInvoice === payment.payment_id}
                          >
                            {downloadingInvoice === payment.payment_id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credit History */}
        <Card>
          <CardHeader>
            <CardTitle>Credit History</CardTitle>
            <CardDescription>Recent credit transactions and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No credit history available</p>
              ) : (
                creditHistory.map((history) => (
                  <div
                    key={history.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {history.credits_added >= 0 ? (
                        <Plus className="w-5 h-5 text-green-500" />
                      ) : (
                        <Minus className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {history.credits_added >= 0 ? 'Credits Added' : 'Credits Used'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(history.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {history.credits_added >= 0 ? '+' : ''}{history.credits_added}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {history.credits_after}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
