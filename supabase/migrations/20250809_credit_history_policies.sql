-- Enable RLS on credit_history
alter table public.credit_history enable row level security;

-- Create policies for credit_history
create policy "Users can view their own credit history"
  on public.credit_history
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own credit history"
  on public.credit_history
  for insert
  with check (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to authenticated;
grant all on public.credit_history to authenticated;

-- Add subscription_id to credit_history if not exists
alter table public.credit_history
add column if not exists subscription_id text,
add column if not exists transaction_type text default 'credit';

-- Add constraint to reference subscriptions
alter table public.credit_history
add constraint fk_subscription
foreign key (subscription_id)
references public.subscriptions(subscription_id)
on delete set null;
