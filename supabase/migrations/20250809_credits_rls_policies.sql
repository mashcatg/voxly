-- Enable RLS on the tables
alter table public.user_credits enable row level security;
alter table public.credit_history enable row level security;

-- Create policy for user_credits table
create policy "Users can view their own credits"
  on public.user_credits
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own credits"
  on public.user_credits
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own credits"
  on public.user_credits
  for update
  using (auth.uid() = user_id);

-- Create policy for credit_history table
create policy "Users can view their own credit history"
  on public.credit_history
  for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own credit history"
  on public.credit_history
  for insert
  with check (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant all on public.user_credits to authenticated;
grant all on public.credit_history to authenticated;

-- Ensure tables are publicly accessible but protected by RLS
alter table public.user_credits owner to authenticated;
alter table public.credit_history owner to authenticated;
