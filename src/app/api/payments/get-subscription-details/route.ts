import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Get the user's session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call Dodo Payments API to get subscription details
    const dodoApiUrl = 'https://test.dodopayments.com/subscriptions/' + subscriptionId;
    const response = await fetch(dodoApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Dodo API error:', error);
      return NextResponse.json({ 
        error: 'Failed to get subscription details from Dodo',
        details: error 
      }, { status: response.status });
    }

    const subscription = await response.json();

    return NextResponse.json({
      success: true,
      subscription: subscription
    });

  } catch (error) {
    console.error('Error getting subscription details:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
