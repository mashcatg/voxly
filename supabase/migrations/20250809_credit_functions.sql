-- Function to safely handle credit transactions
create or replace function handle_credit_transaction(
    p_user_id uuid,
    p_credits_change integer,
    p_source text,
    p_subscription_id text default null,
    p_metadata jsonb default '{}'::jsonb
) returns jsonb as $$
declare
    v_current_credits integer;
    v_new_credits integer;
    v_subscription record;
begin
    -- Get current credits
    select coalesce(credits, 0) into v_current_credits
    from user_credits
    where user_id = p_user_id;

    if v_current_credits is null then
        v_current_credits := 0;
    end if;

    -- Calculate new credits
    v_new_credits := v_current_credits + p_credits_change;

    -- Check for negative balance if it's a debit
    if p_credits_change < 0 and v_new_credits < 0 then
        return jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_credits', v_current_credits,
            'requested_debit', abs(p_credits_change)
        );
    end if;

    -- If this is a subscription credit allocation, verify subscription
    if p_subscription_id is not null and p_credits_change > 0 then
        select * into v_subscription
        from subscriptions
        where subscription_id = p_subscription_id
        and user_id = p_user_id;

        if v_subscription.credits_allocated then
            return jsonb_build_object(
                'success', false,
                'error', 'Credits already allocated for this subscription'
            );
        end if;

        -- Mark subscription as credited
        update subscriptions
        set 
            credits_allocated = true,
            updated_at = now()
        where subscription_id = p_subscription_id
        and user_id = p_user_id;
    end if;

    -- Update user credits
    insert into user_credits (user_id, credits, total_credits_earned)
    values (p_user_id, v_new_credits, 
        case when p_credits_change > 0 then p_credits_change else 0 end)
    on conflict (user_id) do update
    set 
        credits = v_new_credits,
        total_credits_earned = case 
            when p_credits_change > 0 
            then user_credits.total_credits_earned + p_credits_change
            else user_credits.total_credits_earned
            end,
        updated_at = now();

    -- Record transaction in history
    insert into credit_history (
        user_id,
        credits_added,
        credits_before,
        credits_after,
        source,
        subscription_id,
        transaction_type,
        metadata
    ) values (
        p_user_id,
        abs(p_credits_change),
        v_current_credits,
        v_new_credits,
        p_source,
        p_subscription_id,
        case when p_credits_change >= 0 then 'credit' else 'debit' end,
        p_metadata
    );

    return jsonb_build_object(
        'success', true,
        'credits_change', p_credits_change,
        'previous_credits', v_current_credits,
        'new_credits', v_new_credits
    );
end;
$$ language plpgsql security definer;

-- Function specifically for subscription credit allocation
create or replace function allocate_subscription_credits_safe(
    p_user_id uuid,
    p_subscription_id text,
    p_plan_type text,
    p_amount integer
) returns jsonb as $$
declare
    v_credits_to_add integer;
begin
    -- Determine credits based on plan type and amount
    case lower(p_plan_type)
        when 'starter' then v_credits_to_add := 900;  -- $9 = 900 credits
        when 'plus' then v_credits_to_add := 1900;    -- $19 = 1900 credits
        when 'pro' then v_credits_to_add := 3900;     -- $39 = 3900 credits
        else
            return jsonb_build_object(
                'success', false,
                'error', 'Invalid plan type: ' || p_plan_type
            );
    end case;

    -- Use the generic credit transaction handler
    return handle_credit_transaction(
        p_user_id := p_user_id,
        p_credits_change := v_credits_to_add,
        p_source := 'subscription_payment',
        p_subscription_id := p_subscription_id,
        p_metadata := jsonb_build_object(
            'plan_type', p_plan_type,
            'amount', p_amount,
            'subscription_id', p_subscription_id,
            'timestamp', now()
        )
    );
end;
$$ language plpgsql security definer;

-- Function to spend credits
create or replace function spend_credits(
    p_user_id uuid,
    p_credits_to_spend integer,
    p_source text,
    p_metadata jsonb default '{}'::jsonb
) returns jsonb as $$
begin
    return handle_credit_transaction(
        p_user_id := p_user_id,
        p_credits_change := -1 * abs(p_credits_to_spend),
        p_source := p_source,
        p_metadata := p_metadata
    );
end;
$$ language plpgsql security definer;
