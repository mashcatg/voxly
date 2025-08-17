-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.subscription_plans;

-- Drop the table if it exists and recreate
DROP TABLE IF EXISTS public.subscription_plans;

-- Create the table
CREATE TABLE public.subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal not null,
  credits integer not null,
  dodo_product_id text not null,
  features jsonb not null default '[]'::jsonb,
  test_mode boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add default plans
INSERT INTO public.subscription_plans 
  (name, description, price, credits, dodo_product_id, features, test_mode) 
VALUES
  (
    'Starter', 
    '60 credits per month', 
    9, 
    60, 
    'pdt_O1Y4yxaRA67EF6M3zZ9Iq',
    '["60 credits per month", "Basic voice customization", "Standard support", "Up to 3 custom voices"]'::jsonb,
    true
  ),
  (
    'Plus', 
    '180 credits per month', 
    19, 
    180, 
    'pdt_PAyx6hZhvse1HYaj1PJMM',
    '["180 credits per month", "Advanced voice customization", "Priority support", "Up to 10 custom voices", "Voice cloning beta access"]'::jsonb,
    true
  ),
  (
    'Pro', 
    '450 credits per month', 
    39, 
    450, 
    'pdt_O7w6cp18h53FuV1UPLtss',
    '["450 credits per month", "Premium voice customization", "24/7 support", "Unlimited custom voices", "Voice cloning access", "API access", "Custom model training"]'::jsonb,
    true
  );

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);
