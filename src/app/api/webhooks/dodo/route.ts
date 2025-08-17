import { NextRequest, NextResponse } from 'next/server';
import { dodoPayments } from '@/lib/dodo-payments';
import { verifyDodoWebhookSignature } from '@/lib/dodo-webhook';
import { DODO_API_CONFIG } from '@/config/dodo';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('Received Dodo webhook request');
  
  try {
    const body = await request.text();
    const signature = request.headers.get('dodo-signature');

    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    if (!signature) {
      console.error('Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    try {
      // Verify webhook signature
      const isValid = verifyDodoWebhookSignature(body, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
      console.log('Webhook signature verified successfully');
    } catch (err) {
      console.error('Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Log webhook for debugging
    console.log('Received Dodo webhook:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString()
    });

    // Handle the webhook event
    try {
      console.log('Processing webhook event:', {
        type: event.type,
        data: JSON.stringify(event.data, null, 2)
      });

      if (event.type === 'payment.succeeded') {
        const paymentData = event.data;
        console.log('Payment succeeded:', {
          payment_id: paymentData.payment_id,
          customer: paymentData.customer,
          status: paymentData.status,
          subscription_id: paymentData.subscription_id,
          product_cart: paymentData.product_cart
        });

        // Create a client to interact with Supabase
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        );

        // 1. Update the checkout record with payment details
        if (paymentData.payment_id) {
          const { data: checkout, error: checkoutError } = await supabase
            .from('checkouts')
            .update({
              status: 'completed',
              payment_id: paymentData.payment_id,
              metadata: {
                ...paymentData,
                payment_status: 'succeeded',
                completed_at: new Date().toISOString()
              }
            })
            .eq('status', 'pending')
            .is('payment_id', null)
            .select()
            .single();

          if (checkoutError) {
            console.error('Error updating checkout record:', checkoutError);
          }

          // 2. Create or update subscription record
          if (paymentData.subscription_id && checkout) {
            const planType = checkout.metadata?.plan_type || 'starter';
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .upsert({
                subscription_id: paymentData.subscription_id,
                user_id: checkout.user_id,
                status: 'active',
                plan_type: planType,
                amount: checkout.amount,
                currency: checkout.currency || 'USD',
                interval: 'month',
                metadata: {
                  payment_id: paymentData.payment_id,
                  customer: paymentData.customer,
                  product_cart: paymentData.product_cart,
                  created_at: new Date().toISOString(),
                  checkout_id: checkout.id
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                credits_allocated: false
              });

            if (subscriptionError) {
              console.error('Error saving subscription:', subscriptionError);
            } else {
              console.log('Successfully saved subscription');

              // 3. Allocate credits based on plan type
              let creditsToAdd = 0;
              switch (planType.toLowerCase()) {
                case 'starter': creditsToAdd = 900; break;  // $9
                case 'plus': creditsToAdd = 1900; break;    // $19
                case 'pro': creditsToAdd = 3900; break;     // $39
                default: creditsToAdd = 900;  // Default to starter
              }

              // 4. Use the safe credit allocation function
              const { data: creditResult, error: creditError } = await supabase.rpc(
                'allocate_subscription_credits_safe',
                {
                  p_user_id: checkout.user_id,
                  p_subscription_id: paymentData.subscription_id,
                  p_plan_type: planType,
                  p_amount: creditsToAdd
                }
              );

              if (creditError) {
                console.error('Error allocating credits:', creditError);
              } else {
                console.log('Successfully allocated credits:', creditResult);
              }
            }
          }
        }

        // Process the payment success through Dodo client
        await dodoPayments.handleWebhook(event);
        
        // Return success response
        return NextResponse.json({ 
          received: true,
          type: event.type,
          id: event.id,
          status: 'success',
          payment_id: paymentData.payment_id,
          subscription_id: paymentData.subscription_id
        });
      }
      
      // Handle other webhook events
      await dodoPayments.handleWebhook(event);
      
      console.log('Successfully processed webhook event');
      return NextResponse.json({ 
        received: true,
        type: event.type,
        id: event.id 
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
