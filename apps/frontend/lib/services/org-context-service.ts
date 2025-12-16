/**
 * Org Context Service
 * Story: 01.1 - Org Context + Base RLS
 *
 * Provides org context resolution for authenticated users
 * Single source of truth for user's org_id, role, and permissions
 */

import { createClient } from '@/lib/supabase/client'
import type { OrgContext } from '@/lib/types/organization'
import { UnauthorizedError } from '@/lib/errors/unauthorized-error'
import { NotFoundError } from '@/lib/errors/not-found-error'
import { ForbiddenError } from '@/lib/errors/forbidden-error'
import { isValidUUID } from '@/lib/utils/validation'

/**
 * Get org context for authenticated user
 * Returns complete context including org_id, user_id, role, permissions
 *
 * @param userId - User ID from Supabase auth session
 * @returns OrgContext with user and organization details
 * @throws UnauthorizedError if userId is undefined
 * @throws NotFoundError if user not found (404, not 403 for security)
 * @throws ForbiddenError if user or org is inactive
 */
export async function getOrgContext(userId: string): Promise<OrgContext> {
  // Validate input
  if (!userId) {
    throw new UnauthorizedError('Unauthorized')
  }

  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new NotFoundError('Invalid user ID format')
  }

  const supabase = createClient()

  // Single query with JOINs (no N+1)
  // Fetches: user + organization + role in one query
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      org_id,
      email,
      first_name,
      last_name,
      is_active,
      role_id,
      organizations!inner (
        id,
        name,
        slug,
        timezone,
        locale,
        currency,
        onboarding_step,
        onboarding_completed_at,
        is_active
      ),
      roles!inner (
        code,
        name,
        permissions
      )
    `)
    .eq('id', userId)
    .single()

  // Handle errors
  if (error || !data) {
    // Return 404 (not 403) to prevent user enumeration
    throw new NotFoundError('User not found')
  }

  // Check user is active
  if (!data.is_active) {
    throw new ForbiddenError('User account is inactive')
  }

  // Check organization is active
  if (!data.organizations.is_active) {
    throw new ForbiddenError('Organization is inactive')
  }

  // Build OrgContext
  const context: OrgContext = {
    org_id: data.org_id,
    user_id: data.id,
    role_code: data.roles.code,
    role_name: data.roles.name,
    permissions: data.roles.permissions as Record<string, string>,
    organization: {
      id: data.organizations.id,
      name: data.organizations.name,
      slug: data.organizations.slug,
      timezone: data.organizations.timezone,
      locale: data.organizations.locale,
      currency: data.organizations.currency,
      onboarding_step: data.organizations.onboarding_step,
      onboarding_completed_at: data.organizations.onboarding_completed_at,
      is_active: data.organizations.is_active,
    },
  }

  return context
}

/**
 * Validate org context structure
 * Ensures all required fields are present
 *
 * @param context - OrgContext to validate
 * @returns true if valid, false otherwise
 */
export function validateOrgContext(context: OrgContext): boolean {
  if (!context) return false
  if (!context.org_id) return false
  if (!context.user_id) return false
  if (!context.role_code) return false
  if (!context.permissions) return false

  // Permissions must have at least one entry
  if (Object.keys(context.permissions).length === 0) return false

  return true
}

/**
 * Derive user ID from Supabase auth session
 * Used by API routes to get current user
 *
 * @returns User ID from session
 * @throws UnauthorizedError if no active session
 */
export async function deriveUserIdFromSession(): Promise<string> {
  const supabase = createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new UnauthorizedError('Unauthorized - No active session')
  }

  // Check if session is expired
  if (session.expires_at) {
    const expiresAt = new Date(session.expires_at * 1000)
    if (expiresAt < new Date()) {
      throw new UnauthorizedError('Unauthorized - Session expired')
    }
  }

  return session.user.id
}
