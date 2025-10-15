import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that don't require authentication
  const publicApiRoutes = ['/api/auth/login', '/api/auth/register']
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // If accessing public routes or API routes, allow
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // Check if user is authenticated by looking for user data in cookies or headers
  // Since we can't access localStorage in middleware, we'll check for a session cookie
  const userCookie = request.cookies.get('user-auth')

  if (!userCookie?.value) {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url)
    // Add the current path as a redirect parameter
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
