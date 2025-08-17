import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get cookies for auth
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscription_id from query params
    const searchParams = request.nextUrl.searchParams
    const subscriptionId = searchParams.get('subscription_id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    // Verify subscription ownership
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Fetch payments from Dodo API
    const dodoResponse = await fetch(
      `https://test.dodopayments.com/payments?subscription_id=${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!dodoResponse.ok) {
      throw new Error(`Dodo API error: ${await dodoResponse.text()}`)
    }

    const data = await dodoResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Payment fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}