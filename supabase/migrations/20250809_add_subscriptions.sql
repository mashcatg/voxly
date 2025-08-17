-- Create extension for UUID support if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscription Plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  interval TEXT NOT NULL, -- 'monthly' or 'yearly'
  features JSONB,
  dodo_product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'canceled', 'expired'
  dodo_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'subscription', 'purchase', 'usage', 'refund'
  description TEXT,
  subscription_id UUID REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Credits
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to update user credits
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.user_id, NEW.amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_credits.balance + NEW.amount,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_transaction_trigger
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_credits();

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can view own credit balance" ON user_credits
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT NOT NULL DEFAULT 'communication',
  assistant_id UUID,
  vapi_call_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  summary TEXT,
  transcript TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for conversations
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, credits, interval, features, dodo_product_id) VALUES
('Starter', 'Perfect for getting started', 9, 60, 'monthly', '["60 monthly credits", "Basic support", "Standard quality"]', 'pdt_O1Y4yxaRA67EF6M3zZ9Iq'),
('Plus', 'Most popular choice', 19, 180, 'monthly', '["180 monthly credits", "Priority support", "HD quality", "Advanced analytics"]', 'pdt_PAyx6hZhvse1HYaj1PJMM'),
('Pro', 'For power users', 39, 450, 'monthly', '["450 monthly credits", "24/7 support", "4K quality", "Advanced analytics", "Custom integrations"]', 'pdt_O7w6cp18h53FuV1UPLtss');
