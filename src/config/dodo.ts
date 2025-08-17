/**
 * Dodo API configuration
 * Documentation: https://docs.dodopayments.com/llms-full.txt
 */

export const DODO_API_CONFIG = {
  // Base URL for Dodo API
  baseUrl: `https://${process.env.NODE_ENV === 'development' ? 'test' : 'live'}.dodopayments.com`,
  
  // Webhook endpoint that will receive Dodo events
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dodo`,
  
  // Endpoints
  endpoints: {
    createCheckoutSession: '/checkout-sessions',
    createSubscription: '/subscriptions',
    cancelSubscription: '/subscriptions/{subscriptionId}',
    retrieveSubscription: '/subscriptions/{subscriptionId}',
  },

  // Headers
  headers: {
    'Content-Type': 'application/json',
    // Secret key will be added in the dodo-payments.ts file
  },

  // Webhook events we handle
  webhookEvents: {
    CHECKOUT_SUCCESS: 'checkout.success',
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    PAYMENT_SUCCEEDED: 'payment.succeeded',
    PAYMENT_FAILED: 'payment.failed',
  },
}
