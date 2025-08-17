-- Function to allocate subscription credits
create or replace function allocate_subscription_credits(
  p_user_id uuid,
  p_credits_to_add int,
  p_subscription_id text,
  p_plan_type text
) returns json as $$
declare
  v_current_credits int;
  v_new_credits int;
begin
  -- Get current credits or initialize to 0
  select credits into v_current_credits
  from user_credits
  where user_id = p_user_id;

  if v_current_credits is null then
    v_current_credits := 0;
  end if;

  v_new_credits := v_current_credits + p_credits_to_add;

  -- Update or insert user credits
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

  return json_build_object(
    'success', true,
    'credits', v_new_credits,
    'credits_added', p_credits_to_add
  );
end;
$$ language plpgsql security definer;
