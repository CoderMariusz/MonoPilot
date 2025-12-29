/**
 * API Authentication & Authorization Middleware
 * Story: 02.7 - Routings CRUD (Refactored)
 *
 * Centralized authentication and role-based authorization helpers
 * for Next.js API routes. Reduces duplication across route handlers.
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'

/** User role types */
export type UserRole = 'admin' | 'technical' | 'production' | 'warehouse' | 'quality' | 'viewer'

/** Authenticated user context */
export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  org_id: string
}

/** Authentication result */
export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: NextResponse
  supabase?: SupabaseClient
}

/**
 * Check if user is authenticated
 * Returns user info and supabase client if authenticated
 *
 * @returns AuthResult with user data or error response
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    // Get current user details
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return {
        success: false,
        error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: currentUser.role as UserRole,
        org_id: currentUser.org_id,
      },
      supabase,
    }
  } catch {
    return {
      success: false,
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}

/**
 * Check if user has required role(s)
 * Must be called after requireAuth
 *
 * @param user - Authenticated user
 * @param allowedRoles - Array of allowed roles
 * @returns Error response if unauthorized, undefined if allowed
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): NextResponse | undefined {
  if (!allowedRoles.includes(user.role)) {
    const rolesStr = allowedRoles.join(' or ')
    return NextResponse.json(
      { error: `Forbidden: ${rolesStr} role required` },
      { status: 403 }
    )
  }
  return undefined
}

/**
 * Convenience: Check auth and roles in one call
 *
 * @param allowedRoles - Array of allowed roles
 * @returns AuthResult with user data or error response
 */
export async function requireAuthAndRole(
  allowedRoles: UserRole[]
): Promise<AuthResult> {
  const authResult = await requireAuth()

  if (!authResult.success || !authResult.user) {
    return authResult
  }

  const roleError = requireRole(authResult.user, allowedRoles)
  if (roleError) {
    return {
      success: false,
      error: roleError,
    }
  }

  return authResult
}

/** Roles allowed for technical data modifications */
export const TECHNICAL_ROLES: UserRole[] = ['admin', 'technical']

/** Roles allowed for production data modifications */
export const PRODUCTION_ROLES: UserRole[] = ['admin', 'technical', 'production']

/** Roles allowed for viewing data (all roles) */
export const VIEWER_ROLES: UserRole[] = ['admin', 'technical', 'production', 'warehouse', 'quality', 'viewer']
