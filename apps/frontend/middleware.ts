import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { getRoleBasedRoute } from './lib/auth/roleRedirect';

export async function middleware(request: NextRequest) {
  console.log('Main Middleware - Path:', request.nextUrl.pathname);

  // Database-first mode - always run auth middleware

  // Allow auth pages without any checks
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/signup')) {
    console.log('Main Middleware - Auth page, allowing');
    return NextResponse.next();
  }

  // Update session and check authentication for protected routes
  console.log('Main Middleware - Calling updateSession');
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
