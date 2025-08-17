import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow access to auth callback and api routes
  if (req.nextUrl.pathname.startsWith('/auth/callback') || 
      req.nextUrl.pathname.startsWith('/api')) {
    return res
  }

  // If there's no session and trying to access a protected route
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/auth/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If there's a session and trying to access auth routes
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/', req.url)
    redirectUrl.hostname = '756f709d718a.ngrok-free.app'
    redirectUrl.protocol = 'https'
    return NextResponse.redirect(redirectUrl.toString())
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/auth/:path*'
  ],
}
