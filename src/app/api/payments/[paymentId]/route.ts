import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const paymentId = params.paymentId
  const supabase = createClientComponentClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(
      `https://test.dodopayments.com/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch payment details')
    }

    const payment = await response.json()
    return NextResponse.json(payment)

  } catch (error) {
    console.error('Payment details fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment details' }, 
      { status: 500 }
    )
  }
}