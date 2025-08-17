-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  credits INTEGER NOT NULL,
  dodo_product_id TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on dodo_product_id
ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_dodo_product_id_unique 
UNIQUE (dodo_product_id);

-- Checkouts Table
CREATE TABLE IF NOT EXISTS checkouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  subscription_id TEXT,
  amount DECIMAL NOT NULL,
  metadata JSONB,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  interval TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);

-- User Credits Table
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  total_credits_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit History Table
CREATE TABLE IF NOT EXISTS credit_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  credits_added INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can read subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- RLS Policies for checkouts
CREATE POLICY "Users can create their own checkouts"
  ON checkouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own checkouts"
  ON checkouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_credits
CREATE POLICY "Users can read their own credits"
  ON user_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for credit_history
CREATE POLICY "Users can read their own credit history"
  ON credit_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- First insert Starter plan
INSERT INTO subscription_plans (name, description, price, credits, dodo_product_id, features, test_mode)
VALUES 
  ('Starter', 'Perfect for getting started', 9, 60, 'pdt_starter_v1', 
   '["Basic transcription", "Standard quality", "Email support"]'::jsonb, true)
ON CONFLICT (dodo_product_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features;

-- Then insert Plus plan
INSERT INTO subscription_plans (name, description, price, credits, dodo_product_id, features, test_mode)
VALUES 
  ('Plus', 'Great for regular users', 19, 180, 'pdt_plus_v1', 
   '["Advanced transcription", "High quality", "Priority email support"]'::jsonb, true)
ON CONFLICT (dodo_product_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features;

-- Finally insert Pro plan
INSERT INTO subscription_plans (name, description, price, credits, dodo_product_id, features, test_mode)
VALUES 
  ('Pro', 'For professionals and teams', 39, 450, 'pdt_PAyx6hZhvse1HYaj1PJMM', 
   '["Premium transcription", "Ultra-high quality", "Priority support", "Team sharing", "API access"]'::jsonb, true)
ON CONFLICT (dodo_product_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features;
