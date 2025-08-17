import { supabase } from "./supabase"

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Add to user's credits
export async function addCredits(userId: string, amount: number) {
  const { data, error } = await supabase
    .from("user_credits")
    .upsert({ 
      user_id: userId,
      credits: amount
    })

  if (error) {
    throw error
  }

  return data
}

// Get user's remaining credits
export async function getRemainingCredits(userId: string) {
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single()

  if (error) {
    throw error
  }

  return data?.credits || 0
}
