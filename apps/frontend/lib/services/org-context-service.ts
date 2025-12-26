/**
 * Org Context Service
 * Story: 01.1 - Org Context + Base RLS
 *
 * Provides org context resolution for authenticated users.
 * Single source of truth for user's org_id, role, and permissions.
 *
 * **Security:** This service is the foundation for multi-tenant isolation.
 * All Settings API endpoints MUST use this service for tenant isolation (ADR-013).
 *
 * @see {@link docs/1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md}
 */

import { createServerSupabase } from '@/lib/supabase/server'
import type { OrgContext } from '@/lib/types/organization'
import { UnauthorizedError } from '@/lib/errors/unauthorized-error'
import { NotFoundError } from '@/lib/errors/not-found-error'
import { ForbiddenError } from '@/lib/errors/forbidden-error'
import { isValidUUID } from '@/lib/utils/validation'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Retrieves the organization context for the authenticated user.
 *
 * This function performs a single JOIN query to fetch user, organization,
 * and role data. It follows the ADR-013 RLS pattern for tenant isolation.
 *
 * **Security:** This function is the single source of truth for org_id
 * resolution. All Settings API endpoints must use this for tenant isolation.
 *
 * **Performance:** Single query with JOINs - no N+1 problem. Expected
 * response time: <50ms.
 *
 * @param userId - The authenticated user's UUID from Supabase auth session
 * @returns {Promise<OrgContext>} Organization context with permissions
 * @throws {UnauthorizedError} If userId is undefined or session invalid
 * @throws {NotFoundError} If user not found (returns 404, not 403 for security)
 * @throws {ForbiddenError} If user or organization is inactive
 *
 * @example
 * ```typescript
 * const userId = await deriveUserIdFromSession();
 * const context = await getOrgContext(userId);
 *
 * console.log(context.org_id); // "123e4567-e89b-12d3-a456-426614174000"
 * console.log(context.role_code); // "admin"
 * console.log(context.permissions.settings); // "CRUD"
 * ```
 *
 * @see {@link docs/3-ARCHITECTURE/api/settings/context.md} API documentation
 * @see {@link docs/3-ARCHITECTURE/guides/using-org-context.md} Developer guide
 */
export async function getOrgContext(userId: string, supabaseClient?: SupabaseClient): Promise<OrgContext> {
  // Validate input
  if (!userId) {
    throw new UnauthorizedError('Unauthorized')
  }

  // Validate UUID format (prevents SQL injection)
  if (!isValidUUID(userId)) {
    throw new NotFoundError('Invalid user ID format')
  }

  // Use provided client or create server client
  const supabase = supabaseClient || await createServerSupabase()

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
        onboarding_skipped,
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
    // This is a security best practice to prevent existence disclosure
    throw new NotFoundError('User not found')
  }

  // Check user is active
  if (!data.is_active) {
    throw new ForbiddenError('User account is inactive')
  }

  const organizationRow = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations

  if (!organizationRow) {
    throw new NotFoundError('Organization not found')
  }

  const roleRow = Array.isArray(data.roles) ? data.roles[0] : data.roles

  if (!roleRow) {
    throw new NotFoundError('Role not found')
  }

  // Check organization is active
  if (!organizationRow.is_active) {
    throw new ForbiddenError('Organization is inactive')
  }

  // Build OrgContext
  const context: OrgContext = {
    org_id: data.org_id,
    user_id: data.id,
    role_code: roleRow.code,
    role_name: roleRow.name,
    permissions: roleRow.permissions as Record<string, string>,
    organization: {
      id: organizationRow.id,
      name: organizationRow.name,
      slug: organizationRow.slug,
      timezone: organizationRow.timezone,
      locale: organizationRow.locale,
      currency: organizationRow.currency,
      onboarding_step: organizationRow.onboarding_step,
      onboarding_skipped: organizationRow.onboarding_skipped,
      onboarding_completed_at: organizationRow.onboarding_completed_at,
      is_active: organizationRow.is_active,
    },
  }

  return context
}

/**
 * Validates organization context structure.
 *
 * Ensures all required fields are present and properly formatted.
 * Use this function to validate context before passing to other services.
 *
 * @param context - OrgContext to validate
 * @returns {boolean} true if valid, false otherwise
 *
 * @example
 * ```typescript
 * const context = await getOrgContext(userId);
 * if (!validateOrgContext(context)) {
 *   throw new Error('Invalid org context structure');
 * }
 * ```
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
 * Derives user ID from Supabase auth session.
 *
 * Used by API routes to get the current authenticated user.
 * Validates session existence and expiration.
 *
 * **Security:** Always call this function at the start of API routes
 * to ensure user is authenticated before proceeding.
 *
 * @returns {Promise<string>} User ID from session
 * @throws {UnauthorizedError} If no active session or session expired
 *
 * @example
 * ```typescript
 * // In API route
 * export async function GET(request: Request) {
 *   try {
 *     const userId = await deriveUserIdFromSession();
 *     const context = await getOrgContext(userId);
 *     // Use context for org-scoped queries
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export async function deriveUserIdFromSession(supabaseClient?: SupabaseClient): Promise<string> {
  // Use provided client or create server client
  const supabase = supabaseClient || await createServerSupabase()

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
