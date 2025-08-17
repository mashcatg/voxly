import { NextResponse } from "next/server"
import { headers, cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: Request) {
  const requestHeaders = new Headers(request.headers)
  const supabase = createRouteHandlerClient({ cookies })

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      location: "/auth/login",
    },
  })
}
