'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, FileText, MapPin, User, Receipt,
  Calendar, AlertCircle, Check, Clock, Download 
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentDetails {
  payment_id: string
  status: string
  total_amount: number
  currency: string
  payment_method: string
  payment_method_type: string | null
  customer: {
    customer_id: string
    name: string
    email: string
  }
  created_at: string
  updated_at: string
  card_last_four: string
  card_network: string
  card_type: string
  billing: {
    country: string
    state: string
    city: string
    street: string
    zipcode: string
  }
  settlement_amount: number
  settlement_currency: string
}

interface SubscriptionCardProps {
  subscription: {
    subscription_id: string
    status: string
    plan_type: string
    amount: number
    current_period_start: string
    current_period_end: string
    metadata: {
      addons: any[]
      billing: {
        city: string
        state: string
        street: string
        country: string
        zipcode: string
      }
      customer: {
        name: string
        email: string
        customer_id: string
      }
      next_billing_date: string
    }
  }
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [payments, setPayments] = useState<PaymentDetails[]>([])
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [subscription.subscription_id])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments?subscription_id=${subscription.subscription_id}`)
      if (!response.ok) throw new Error('Failed to fetch payments')
      const data = await response.json()
      setPayments(data.items || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-4 h-4 mr-1" />Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" />Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-4 h-4 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>
    }
  }

  const viewInvoice = (paymentId: string) => {
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'https://test.dodopayments.com' 
      : 'https://live.dodopayments.com'
    window.open(`${baseUrl}/invoices/${paymentId}`, '_blank')
  }

  const fetchPaymentDetails = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)
      if (!response.ok) throw new Error('Failed to fetch payment details')
      const data = await response.json()
      setSelectedPayment(data)
    } catch (error) {
      console.error('Error fetching payment details:', error)
      toast.error('Failed to load payment details')
    }
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription Details</span>
          {getStatusBadge(subscription.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Billing Information</h3>
              <p className="text-sm text-muted-foreground">
                Next billing: {formatDate(subscription.metadata.next_billing_date)}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {subscription.metadata.billing && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Billing Address
                </h4>
                <div className="text-sm text-muted-foreground">
                  <p>{subscription.metadata.billing.street}</p>
                  <p>{subscription.metadata.billing.city}, {subscription.metadata.billing.state}</p>
                  <p>{subscription.metadata.billing.country} {subscription.metadata.billing.zipcode}</p>
                </div>
              </div>
            )}

            {subscription.metadata.customer && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer Information
                </h4>
                <div className="text-sm text-muted-foreground">
                  <p>{subscription.metadata.customer.name}</p>
                  <p>{subscription.metadata.customer.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Payment History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Payment History
          </h3>
          
          {payments.map((payment) => (
            <div key={payment.payment_id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatCurrency(payment.total_amount, payment.currency)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(payment.created_at)}</p>
                  {payment.card_last_four && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <CreditCard className="w-3 h-3" />
                      {payment.card_network} •••• {payment.card_last_four}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(payment.status)}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadInvoice(payment.payment_id)}
                    disabled={downloadingInvoice === payment.payment_id}
                  >
                    {downloadingInvoice === payment.payment_id ? (
                      <div className="animate-spin">⌛</div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Payment Details */}
              {selectedPayment?.payment_id === payment.payment_id && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">Payment Details</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Method: {payment.card_type} Card</p>
                      <p>Network: {payment.card_network}</p>
                      <p>Settlement: {formatCurrency(payment.settlement_amount, payment.settlement_currency)}</p>
                    </div>
                  </div>
                  {payment.billing && (
                    <div>
                      <p className="font-medium mb-2">Billing Address</p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>{payment.billing.street}</p>
                        <p>{payment.billing.city}, {payment.billing.state}</p>
                        <p>{payment.billing.country} {payment.billing.zipcode}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
