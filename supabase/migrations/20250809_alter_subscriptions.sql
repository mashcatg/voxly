-- First, drop existing data
TRUNCATE TABLE subscription_plans CASCADE;
TRUNCATE TABLE conversations CASCADE;

-- Add new columns to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS dodo_product_id TEXT,
ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT TRUE;

-- Add new columns to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'communication',
ADD COLUMN IF NOT EXISTS assistant_id UUID,
ADD COLUMN IF NOT EXISTS vapi_call_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

-- Insert subscription plans for test mode
INSERT INTO subscription_plans (name, description, price, credits, interval, features, dodo_product_id, test_mode) VALUES
('Starter', 'Perfect for getting started', 9, 60, 'monthly', '["60 monthly credits", "Basic support", "Standard quality"]', 'pdt_O1Y4yxaRA67EF6M3zZ9Iq', true),
('Plus', 'Most popular choice', 19, 180, 'monthly', '["180 monthly credits", "Priority support", "HD quality", "Advanced analytics"]', 'pdt_PAyx6hZhvse1HYaj1PJMM', true),
('Pro', 'For power users', 39, 450, 'monthly', '["450 monthly credits", "24/7 support", "4K quality", "Advanced analytics", "Custom integrations"]', 'pdt_O7w6cp18h53FuV1UPLtss', true);
