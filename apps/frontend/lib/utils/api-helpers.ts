/**
 * API Helper Utilities
 * Common patterns for API route handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * UUID regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * Get authenticated user's organization ID
 */
export async function getAuthenticatedOrgId(): Promise<{ orgId: string; userId: string } | null> {
  const supabase = await createServerSupabase()

  // Check authentication
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session) {
    return null
  }

  // Get user's org_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session.user.id)
    .single()

  if (userError || !userData) {
    return null
  }

  return { orgId: userData.org_id, userId: session.user.id }
}

/**
 * Get authenticated user with role info
 */
export async function getAuthenticatedUser(): Promise<{ orgId: string; userId: string; roleCode: string } | null> {
  const supabase = await createServerSupabase()

  // Check authentication
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session) {
    return null
  }

  // Get user's org_id and role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id, role_id, roles(code)')
    .eq('id', session.user.id)
    .single()

  if (userError || !userData) {
    return null
  }

  const roleCode = (userData.roles as any)?.code?.toLowerCase() || ''

  return { orgId: userData.org_id, userId: session.user.id, roleCode }
}

/**
 * Standard error response handler
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error)

  const message = error instanceof Error ? error.message : 'Internal server error'

  if (message.includes('not found')) {
    return NextResponse.json({ error: message }, { status: 404 })
  }
  if (message.includes('Duplicate') || message.includes('already')) {
    return NextResponse.json({ error: message }, { status: 400 })
  }
  if (message.includes('Insufficient permissions') || message.includes('Forbidden')) {
    return NextResponse.json({ error: message }, { status: 403 })
  }

  return NextResponse.json({ error: message }, { status: 500 })
}
