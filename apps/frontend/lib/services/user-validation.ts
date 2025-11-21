import { createServerSupabase } from '../supabase/server'

/**
 * User Validation Service
 * Story: 1.2 User Management - CRUD
 * Task 6: Last Admin Validation (AC-002.5)
 *
 * Validates user operations to prevent org lockout
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates if a user can be deactivated or have their role changed
 * Prevents deactivating or demoting the last admin in an organization
 *
 * AC-002.5: Cannot deactivate last admin
 *
 * @param userId - UUID of user to validate
 * @param orgId - UUID of organization
 * @param newRole - New role if changing role (optional)
 * @param newStatus - New status if changing status (optional)
 * @returns ValidationResult with valid flag and optional error message
 */
export async function canModifyUser(
  userId: string,
  orgId: string,
  newRole?: string,
  newStatus?: string
): Promise<ValidationResult> {
  const supabase = await createServerSupabase()

  // Get the current user's details
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', userId)
    .eq('org_id', orgId)
    .single()

  if (userError || !currentUser) {
    return {
      valid: false,
      error: 'User not found',
    }
  }

  // Check if user is currently an active admin
  const isCurrentlyActiveAdmin =
    currentUser.role === 'admin' && currentUser.status === 'active'

  if (!isCurrentlyActiveAdmin) {
    // Not an admin, can be modified freely
    return { valid: true }
  }

  // User is currently an active admin - check if this would remove the last admin

  // Determine if the modification would remove admin status
  const wouldRemoveAdmin =
    (newRole && newRole !== 'admin') || // Changing role from admin to non-admin
    (newStatus && newStatus !== 'active') // Deactivating admin

  if (!wouldRemoveAdmin) {
    // Not removing admin status, safe to proceed
    return { valid: true }
  }

  // Count active admins in the organization (excluding current user)
  const { count: otherAdminCount, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .neq('id', userId)

  if (countError) {
    return {
      valid: false,
      error: 'Failed to validate admin count',
    }
  }

  // If there are no other active admins, cannot modify this user
  if (otherAdminCount === 0) {
    return {
      valid: false,
      error: 'Cannot deactivate the last admin user',
    }
  }

  // There are other active admins, safe to proceed
  return { valid: true }
}

/**
 * Validates if a user can be deactivated
 * Convenience wrapper for canModifyUser
 *
 * @param userId - UUID of user to deactivate
 * @param orgId - UUID of organization
 * @returns ValidationResult
 */
export async function canDeactivateUser(
  userId: string,
  orgId: string
): Promise<ValidationResult> {
  return canModifyUser(userId, orgId, undefined, 'inactive')
}

/**
 * Validates if a user's role can be changed
 * Convenience wrapper for canModifyUser
 *
 * @param userId - UUID of user
 * @param orgId - UUID of organization
 * @param newRole - New role to assign
 * @returns ValidationResult
 */
export async function canChangeRole(
  userId: string,
  orgId: string,
  newRole: string
): Promise<ValidationResult> {
  return canModifyUser(userId, orgId, newRole, undefined)
}
