import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { subscriptionId, planType } = body;

    if (!subscriptionId || !planType) {
      console.log('Missing required fields:', { subscriptionId, planType });
      return NextResponse.json({ 
        error: 'Subscription ID and plan type are required',
        received: { subscriptionId, planType }
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Session error', details: sessionError.message }, { status: 401 });
    }
    
    if (!session?.user) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Determine credits to add based on plan type
    let creditsToAdd = 0;
    switch (planType.toLowerCase()) {
      case 'starter':
        creditsToAdd = 60; // $9 plan
        break;
      case 'plus':
        creditsToAdd = 180; // $19 plan
        break;
      case 'pro':
        creditsToAdd = 450; // $39 plan
        break;
      default:
        return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    console.log('Starting credit allocation:', {
      userId: session.user.id,
      creditsToAdd,
      planType,
      subscriptionId
    });

    // Get current credits first
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', session.user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching current credits:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current credits',
        details: fetchError.message 
      }, { status: 500 });
    }

    const currentAmount = currentCredits?.credits || 0;
    const newAmount = currentAmount + creditsToAdd;

    // Insert or update user credits
    const { error: creditsError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: session.user.id,
        credits: newAmount,
        total_credits_earned: creditsToAdd,
        updated_at: new Date().toISOString()
      });

    if (creditsError) {
      console.error('Error updating credits:', creditsError);
      return NextResponse.json({ 
        error: 'Failed to update credits',
        details: creditsError.message 
      }, { status: 500 });
    }

    // Record in credit history
    const { error: historyError } = await supabase
      .from('credit_history')
      .insert({
        user_id: session.user.id,
        credits_added: creditsToAdd,
        credits_before: currentAmount,
        credits_after: newAmount,
        source: 'subscription_payment',
        subscription_id: subscriptionId,
        metadata: {
          plan_type: planType,
          subscription_id: subscriptionId,
          timestamp: new Date().toISOString()
        }
      });

    if (historyError) {
      console.error('Warning: Failed to record credit history:', historyError);
    }

    return NextResponse.json({
      success: true,
      credits: newAmount,
      creditsAdded: creditsToAdd
    });

  } catch (error) {
    console.error('Unexpected error in allocate-credits:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
