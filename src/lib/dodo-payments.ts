import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DODO_API_CONFIG } from '@/config/dodo';

interface CheckoutSession {
  id: string;
  url: string;
  status: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

class DodoPayments {
  private supabase = createClientComponentClient();

  async createCheckoutSession(planId: string): Promise<CheckoutSession> {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      return {
        id: '',  // We don't use this
        url: data.url,
        status: 'created'
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async handleWebhook(event: WebhookEvent) {
    const { type, data } = event;

    try {
      switch (type) {
        case DODO_API_CONFIG.webhookEvents.CHECKOUT_SUCCESS:
          await this.handleCheckoutSuccess(data);
          break;
          
        case DODO_API_CONFIG.webhookEvents.SUBSCRIPTION_CREATED:
          await this.handleSubscriptionCreated(data);
          break;
          
        case DODO_API_CONFIG.webhookEvents.SUBSCRIPTION_UPDATED:
          await this.handleSubscriptionUpdated(data);
          break;
          
        case DODO_API_CONFIG.webhookEvents.SUBSCRIPTION_CANCELLED:
          await this.handleSubscriptionCancelled(data);
          break;
          
        case DODO_API_CONFIG.webhookEvents.PAYMENT_SUCCEEDED:
          await this.handlePaymentSucceeded(data);
          break;
          
        default:
          console.log(`Unhandled event type: ${type}`);
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error);
      throw error;
    }
  }

  private async handleCheckoutSuccess(data: any) {
    const { userId, checkout_id, credits } = data.metadata;
    
    // Update checkout record
    const { data: checkout, error: checkoutError } = await this.supabase
      .from('checkouts')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        subscription_id: data.subscription_id
      })
      .eq('id', checkout_id)
      .select()
      .single();

    if (checkoutError) {
      console.error('Error updating checkout:', checkoutError);
      throw checkoutError;
    }

    // Get current user credits
    const { data: existingCredits } = await this.supabase
      .from('user_credits')
      .select('credits, total_credits_earned')
      .eq('user_id', userId)
      .single();

    const currentCredits = existingCredits?.credits || 0;
    const currentTotalEarned = existingCredits?.total_credits_earned || 0;
    const newCredits = currentCredits + Number(credits);

    // Update or insert user credits
    await this.supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: newCredits,
        total_credits_earned: currentTotalEarned + Number(credits)
      });

    // Record credit history
    await this.supabase
      .from('credit_history')
      .insert({
        user_id: userId,
        credits_added: Number(credits),
        credits_before: currentCredits,
        credits_after: newCredits,
        source: 'subscription_purchase',
        metadata: {
          checkout_id,
          subscription_id: data.subscription_id
        }
      });
  }

  private async handleSubscriptionCreated(data: any) {
    const { id: subscription_id, status, metadata } = data;
    const { userId, planId, plan_type } = metadata;

    await this.supabase
      .from('subscriptions')
      .insert({
        subscription_id,
        user_id: userId,
        plan_type: plan_type || 'starter',
        status,
        amount: data.amount,
        billing_cycle: 'monthly',
        current_period_start: new Date(data.current_period_start * 1000),
        current_period_end: new Date(data.current_period_end * 1000),
        metadata: {
          dodo_subscription_id: subscription_id,
          plan_id: planId
        }
      });
  }

  private async handleSubscriptionUpdated(data: any) {
    const { id: dodoSubscriptionId, status, current_period_start, current_period_end } = data;

    await this.supabase
      .from('subscriptions')
      .update({
        status,
        current_period_start: new Date(current_period_start * 1000),
        current_period_end: new Date(current_period_end * 1000)
      })
      .eq('dodo_subscription_id', dodoSubscriptionId);
  }

  private async handlePaymentSucceeded(data: any) {
    const { userId, planId, credits } = data.metadata;

    // Add renewal credits for successful payment
    await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        type: 'renewal',
        description: 'Subscription renewal credits'
      });
  }

  private async handleSubscriptionCancelled(data: any) {
    const { id: dodoSubscriptionId } = data;

    await this.supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true
      })
      .eq('dodo_subscription_id', dodoSubscriptionId);
  }
}

export const dodoPayments = new DodoPayments();
