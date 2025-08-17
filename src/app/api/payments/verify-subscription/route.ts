import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DodoPayments from 'dodopayments';

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY!;
const dodoClient = new DodoPayments({
  bearerToken: DODO_API_KEY,
  environment: process.env.NODE_ENV === 'development' ? 'test_mode' : 'live_mode',
});

export async function POST(req: NextRequest) {
  try {
    // Get the subscription ID from request body
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify subscription with Dodo Payments
    try {
      console.log('Retrieving subscription:', subscriptionId);
      const subscription = await dodoClient.subscriptions.retrieve(subscriptionId);
      console.log('Subscription data:', subscription);

      // Check if the subscription is active
      if (subscription.status !== 'active') {
        console.log('Subscription status is not active:', subscription.status);
        return NextResponse.json({ 
          success: false,
          status: subscription.status,
          error: `Subscription status is ${subscription.status}`
        });
      }
      
      // Update subscription status in database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .upsert({
          subscription_id: subscriptionId,
          user_id: session.user.id,
          status: 'active',
          plan_type: subscription.metadata?.plan_type || 'starter',
          amount: subscription.recurring_pre_tax_amount || 0,
          interval: subscription.payment_frequency_interval?.toLowerCase() || 'monthly',
          created_at: new Date(subscription.created_at).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...subscription,
            subscription_id: subscriptionId,
            user_id: session.user.id,
            updated_at: new Date().toISOString()
          }
        });

      if (updateError) {
        console.error('Error updating subscription:', updateError);
      }

      return NextResponse.json({
        success: true,
        subscription: subscription,
        status: subscription.status
      });
    } catch (error: any) {
      console.error('Error retrieving subscription:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to verify subscription',
        status: 'failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in verify-subscription:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
