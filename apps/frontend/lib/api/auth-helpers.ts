/**
 * API Auth Helpers
 * Shared authentication and authorization utilities for API routes
 *
 * Updated in Story 03.10 refactoring to support both throwing and response-returning patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthContext {
  userId: string
  orgId: string
  userRole: string
}

/**
 * Custom error class for auth failures (thrown by getAuthContextOrThrow)
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Get authenticated user context (userId, orgId, role)
 * Returns 401 error response if authentication fails
 *
 * @deprecated Use getAuthContextOrThrow for better error handling in try-catch blocks
 */
export async function getAuthContext(
  supabase: SupabaseClient
): Promise<AuthContext | NextResponse> {
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org_id and role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id, role:roles(code)')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Extract role code (handle both array and object response)
  const roleData = userData.role as any
  const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

  return {
    userId: user.id,
    orgId: userData.org_id,
    userRole: userRole || '',
  }
}

/**
 * Get authenticated user context (userId, orgId, role)
 * Throws AuthError if authentication fails - use with try-catch
 *
 * @throws AuthError with code 'UNAUTHORIZED' or 'USER_NOT_FOUND'
 */
export async function getAuthContextOrThrow(supabase: SupabaseClient): Promise<AuthContext> {
  // Get authenticated session (use getSession for server-side)
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session) {
    throw new AuthError('Unauthorized', 'UNAUTHORIZED', 401)
  }

  // Get user's org_id and role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id, role:roles(code)')
    .eq('id', session.user.id)
    .single()

  if (userError || !userData) {
    throw new AuthError('User not found', 'USER_NOT_FOUND', 404)
  }

  // Extract role code (handle both array and object response)
  const roleData = userData.role as any
  const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

  if (!userRole) {
    throw new AuthError('User role not found', 'ROLE_NOT_FOUND', 404)
  }

  return {
    userId: session.user.id,
    orgId: userData.org_id,
    userRole,
  }
}

/**
 * Check if user has required role
 * Returns 403 error response if permission check fails
 */
export function checkPermission(
  authContext: AuthContext,
  allowedRoles: string[]
): NextResponse | null {
  if (!allowedRoles.includes(authContext.userRole)) {
    return NextResponse.json(
      { error: 'Insufficient permissions', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  return null
}

/**
 * Verify user has one of the required roles
 * Throws AuthError if role not allowed - use with try-catch
 *
 * @throws AuthError with code 'FORBIDDEN' if role not in allowedRoles
 */
export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new AuthError('Insufficient permissions', 'FORBIDDEN', 403)
  }
}

/**
 * Standard role sets for common permissions
 */
export const RoleSets = {
  // Can create/update work orders
  WORK_ORDER_WRITE: ['owner', 'admin', 'planner', 'production_manager'] as string[],

  // Can delete work orders (more restricted)
  WORK_ORDER_DELETE: ['owner', 'admin', 'planner'] as string[],

  // Can view work orders (read-only)
  WORK_ORDER_READ: ['owner', 'admin', 'planner', 'production_manager', 'operator', 'viewer'] as string[],

  // Can perform status transitions
  WORK_ORDER_TRANSITION: ['owner', 'admin', 'planner', 'production_manager'] as string[],

  // Admin-only operations
  ADMIN_ONLY: ['owner', 'admin'] as string[],
}

/**
 * Combined helper: get auth context and verify role in one call
 * Throws AuthError if not authenticated or insufficient permissions
 *
 * @throws AuthError for auth failures or permission denied
 */
export async function getAuthContextWithRole(
  supabase: SupabaseClient,
  allowedRoles: string[]
): Promise<AuthContext> {
  const context = await getAuthContextOrThrow(supabase)
  requireRole(context.userRole, allowedRoles)
  return context
}

/**
 * Validate request origin for CSRF protection
 * Checks that the Origin header matches the Host header for state-changing requests
 * Returns 403 error response if origin validation fails
 *
 * Note: This provides defense-in-depth alongside SameSite cookie protection
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // If no origin header, request is likely same-origin (not from browser form/JS)
  // This is acceptable for API calls from server components or curl
  if (!origin) {
    return null
  }

  // Validate that origin includes the host
  // This prevents CSRF from malicious sites
  if (host && !origin.includes(host)) {
    return NextResponse.json(
      { error: 'Invalid request origin', code: 'CSRF_VALIDATION_FAILED' },
      { status: 403 }
    )
  }

  return null
}
