'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "../ui/button"
import { FcGoogle } from "react-icons/fc";
export function GoogleLoginButton() {
  const supabase = createClientComponentClient()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      console.error('Error:', error.message)
    }
  }

  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleLogin}
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  )
}
