-- Create subscriptions table
create table if not exists public.subscriptions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    subscription_id text not null unique,
    status text not null,
    plan_type text not null,
    amount integer not null,
    currency text not null default 'USD',
    interval text not null default 'month',
    credits_allocated boolean default false,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Create policies
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to authenticated;
grant all on public.subscriptions to authenticated;

-- Create function to safely allocate credits only once
create or replace function allocate_subscription_credits_safe(
    p_user_id uuid,
    p_subscription_id text,
    p_plan_type text,
    p_amount integer
) returns jsonb as $$
declare
    v_subscription_exists boolean;
    v_credits_allocated boolean;
    v_credits_to_add integer;
    v_current_credits integer;
    v_new_credits integer;
begin
    -- Check if subscription exists and credits haven't been allocated
    select exists (
        select 1 
        from subscriptions 
        where subscription_id = p_subscription_id 
        and credits_allocated = true
    ) into v_credits_allocated;

    if v_credits_allocated then
        return jsonb_build_object(
            'success', false,
            'error', 'Credits already allocated for this subscription'
        );
    end if;

    -- Determine credits based on plan type
    case p_plan_type
        when 'starter' then v_credits_to_add := 60;
        when 'plus' then v_credits_to_add := 180;
        when 'pro' then v_credits_to_add := 450;
        else
            return jsonb_build_object(
                'success', false,
                'error', 'Invalid plan type'
            );
    end case;

    -- Get current credits
    select coalesce(credits, 0) into v_current_credits
    from user_credits
    where user_id = p_user_id;

    v_new_credits := v_current_credits + v_credits_to_add;

    -- Begin transaction
    begin
        -- Update subscription status
        update subscriptions
        set 
            credits_allocated = true,
            updated_at = now()
        where subscription_id = p_subscription_id
        and user_id = p_user_id;

        -- Update user credits
        insert into user_credits (user_id, credits, total_credits_earned)
        values (p_user_id, v_new_credits, v_credits_to_add)
        on conflict (user_id) do update
        set 
            credits = user_credits.credits + v_credits_to_add,
            total_credits_earned = user_credits.total_credits_earned + v_credits_to_add,
            updated_at = now();

        -- Record credit history
        insert into credit_history (
            user_id,
            credits_added,
            credits_before,
            credits_after,
            source,
            subscription_id,
            metadata
        ) values (
            p_user_id,
            v_credits_to_add,
            v_current_credits,
            v_new_credits,
            'subscription_payment',
            p_subscription_id,
            jsonb_build_object(
                'plan_type', p_plan_type,
                'subscription_id', p_subscription_id,
                'amount', p_amount,
                'timestamp', now()
            )
        );

        return jsonb_build_object(
            'success', true,
            'credits_added', v_credits_to_add,
            'new_total', v_new_credits
        );
    end;
end;
$$ language plpgsql security definer;
