export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired';
  dodoSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'subscription' | 'purchase' | 'usage' | 'refund';
  description?: string;
  subscriptionId?: string;
  createdAt: Date;
}

export interface UserCredits {
  userId: string;
  balance: number;
  updatedAt: Date;
}
