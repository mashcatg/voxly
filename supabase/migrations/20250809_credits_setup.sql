-- Create user_credits table
create table if not exists user_credits (
    user_id uuid primary key references auth.users(id),
    credits integer not null default 0,
    total_credits_earned integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create credit_history table
create table if not exists credit_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    credits_added integer not null,
    credits_before integer not null,
    credits_after integer not null,
    source text not null,
    subscription_id text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create function for direct credit allocation
create or replace function public.direct_allocate_credits(
    p_user_id uuid,
    p_credits_to_add integer,
    p_subscription_id text,
    p_plan_type text
) returns jsonb as $$
declare
    v_current_credits integer;
    v_new_credits integer;
begin
    -- Get or initialize current credits
    select coalesce(credits, 0) into v_current_credits
    from user_credits
    where user_id = p_user_id;

    v_new_credits := v_current_credits + p_credits_to_add;

    -- Insert or update user credits
    insert into user_credits (user_id, credits, total_credits_earned)
    values (p_user_id, v_new_credits, p_credits_to_add)
    on conflict (user_id) do update
    set 
        credits = user_credits.credits + p_credits_to_add,
        total_credits_earned = user_credits.total_credits_earned + p_credits_to_add,
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
        p_credits_to_add,
        v_current_credits,
        v_new_credits,
        'subscription_payment',
        p_subscription_id,
        jsonb_build_object(
            'plan_type', p_plan_type,
            'subscription_id', p_subscription_id,
            'timestamp', now()
        )
    );

    return jsonb_build_object(
        'success', true,
        'credits', v_new_credits,
        'credits_added', p_credits_to_add
    );
end;
$$ language plpgsql security definer;
