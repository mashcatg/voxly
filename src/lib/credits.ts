import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function checkCredits(userId: string) {
  const supabase = createClientComponentClient();
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  return credits?.balance || 0;
}

export async function useCredits(userId: string, amount: number = 1) {
  const supabase = createClientComponentClient();
  
  // Start a transaction to update credits
  const { data: transaction, error: creditError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      type: 'usage',
      description: 'Voice chat usage'
    })
    .select()
    .single();

  if (creditError) {
    throw new Error('Failed to update credits');
  }

  return transaction;
}
