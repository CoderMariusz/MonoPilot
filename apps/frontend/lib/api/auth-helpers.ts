/**
 * API Auth Helpers
 * Shared authentication and authorization utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthContext {
  userId: string
  orgId: string
  userRole: string
}

/**
 * Get authenticated user context (userId, orgId, role)
 * Returns 401 error response if authentication fails
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
