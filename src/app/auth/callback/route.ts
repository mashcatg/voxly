import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (session) {
      // If we have a session, redirect to home
      return NextResponse.redirect('https://756f709d718a.ngrok-free.app/')
    }
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect('https://756f709d718a.ngrok-free.app/auth/login')
}
