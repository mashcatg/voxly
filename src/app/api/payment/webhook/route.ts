import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { create } from 'domain';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const subscriptionId = searchParams.get('subscription_id');
  const status = searchParams.get('status');

  if (!subscriptionId || !status) {
    return NextResponse.redirect(new URL('/pricing', process.env.NEXT_PUBLIC_APP_URL!));
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore
  });

  try {
    // Find the most recent pending checkout
    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (checkoutError || !checkout) {
      console.error('Error finding checkout:', checkoutError);
      return NextResponse.redirect(new URL('/pricing', process.env.NEXT_PUBLIC_APP_URL!));
    }

    // Update checkout with subscription ID
    await supabase
      .from('checkouts')
      .update({
        subscription_id: subscriptionId,
        status: status === 'succeeded' ? 'completed' : status,
        completed_at: new Date().toISOString()
      })
      .eq('id', checkout.id);

    if (status === 'succeeded') {
      // Create subscription record
      const { data, error } =  await supabase
        .from('subscriptions')
        .insert({
          subscription_id: subscriptionId,
          user_id: checkout.user_id,
          plan_type: checkout.metadata.plan_type,
          status: 'active',
          amount: checkout.amount,
          currency: 'USD',      
          interval: 'month',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          credits_allocated: true,
          metadata: {
            checkout_id: checkout.id,
            credits: checkout.metadata.credits,
            user_id: checkout.user_id,
            plan_type: checkout.metadata.plan_type
          }
        });
console.log('Insert data:', data);
console.error('Insert error:', error);

      // Add credits
      const credits = checkout.metadata.credits || 0;
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('credits, total_credits_earned')
        .eq('user_id', checkout.user_id)
        .single();

      const currentCredits = existingCredits?.credits || 0;
      const currentTotalEarned = existingCredits?.total_credits_earned || 0;
      const newCredits = currentCredits + credits;

      // Update or insert credits
      await supabase
        .from('user_credits')
        .upsert({
          user_id: checkout.user_id,
          credits: newCredits,
          total_credits_earned: currentTotalEarned + credits
        });

      // Record credit history
      await supabase
        .from('credit_history')
        .insert({
          user_id: checkout.user_id,
          credits_added: credits,
          credits_before: currentCredits,
          credits_after: newCredits,
          source: 'subscription_purchase',
          metadata: {
            subscription_id: subscriptionId,
            checkout_id: checkout.id
          }
        });

      // Send analytics event for successful subscription purchase
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'subscription_purchase',
            metadata: {
              subscription_id: subscriptionId,
              user_id: checkout.user_id,
              plan_type: checkout.metadata.plan_type,
              amount: checkout.amount,
              credits: credits
            }
          })
        });
      } catch (analyticsError) {
        console.error('Failed to track analytics:', analyticsError);
        // Don't let analytics failure affect the main flow
      }

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?subscription_id=${subscriptionId}&status=success`, 
        process.env.NEXT_PUBLIC_APP_URL!)
      );
    } else if (status === 'cancelled') {
      return NextResponse.redirect(
        new URL('/pricing?status=cancelled', 
        process.env.NEXT_PUBLIC_APP_URL!)
      );
    } else {
      // For other statuses like 'pending', 'failed', etc.
      return NextResponse.redirect(
        new URL(`/pricing?status=${status}`, 
        process.env.NEXT_PUBLIC_APP_URL!)
      );
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.redirect(
      new URL('/pricing?status=error', 
      process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
