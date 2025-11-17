import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { getRoleBasedRoute } from './lib/auth/roleRedirect';

export async function middleware(request: NextRequest) {
  console.log('Main Middleware - Path:', request.nextUrl.pathname);

  // Allow bypass during Playwright E2E runs
  if (process.env.PLAYWRIGHT_E2E === 'true') {
    return NextResponse.next();
  }

  // Database-first mode - always run auth middleware

  // Allow auth pages without any checks
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup')) {
    console.log('Main Middleware - Auth page, allowing');
    return NextResponse.next();
  }

  // TODO Story NPD-1.7: Add feature flag check for NPD module
  // Check org_settings.enabled_modules includes 'npd' before allowing /npd routes
  // For MVP, NPD routes are accessible to all authenticated users
  if (request.nextUrl.pathname.startsWith('/npd')) {
    console.log('Main Middleware - NPD route accessed');
    // Feature flag check will be added in Story NPD-1.7 (RBAC Implementation)
  }

  // Update session and check authentication for protected routes
  console.log('Main Middleware - Calling updateSession');
  return await updateSession(request);
}

export const config = {
  runtime: 'nodejs', // Use Node.js runtime instead of Edge to support Supabase SSR
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
