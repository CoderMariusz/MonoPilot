/**
 * Purchase Order Permissions
 * Story 03.3: PO CRUD + Lines
 *
 * Centralized permission definitions for PO operations.
 * MAJOR-02 Fix: Consistent role checks across all API routes.
 */

/**
 * Permission actions for Purchase Orders
 */
export type POAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'submit'
  | 'cancel'
  | 'addLines'
  | 'editLines'
  | 'deleteLines'

/**
 * Centralized PO permission definitions.
 * Each action maps to an array of allowed role codes.
 */
export const PO_PERMISSIONS: Record<POAction, readonly string[]> = {
  // View - all authenticated users can view POs in their org
  view: ['viewer', 'purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],

  // Create - planners and above
  create: ['purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],

  // Edit - same as create
  edit: ['purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],

  // Delete - managers and above only (more restrictive)
  delete: ['manager', 'admin', 'owner'],

  // Submit - planners and above
  submit: ['purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],

  // Cancel - planners and above
  cancel: ['planner', 'production_manager', 'manager', 'admin', 'owner'],

  // Line operations - same as edit
  addLines: ['purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],
  editLines: ['purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],
  deleteLines: ['purchasing', 'planner', 'production_manager', 'manager', 'admin', 'owner'],
} as const

/**
 * Check if a role has permission for a specific PO action.
 *
 * @param role User role code (from roles table)
 * @param action PO action to check
 * @returns true if allowed, false otherwise
 *
 * @example
 * ```typescript
 * const role = currentUser.role?.code?.toLowerCase() || ''
 * if (!hasPOPermission(role, 'create')) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 * }
 * ```
 */
export function hasPOPermission(role: string | undefined | null, action: POAction): boolean {
  if (!role) return false
  const normalizedRole = role.toLowerCase().trim()
  return PO_PERMISSIONS[action].includes(normalizedRole)
}

/**
 * Get the role from a user object (handles nested role structure).
 *
 * @param user User object from Supabase query with role relation
 * @returns Normalized role code string, or empty string if not found
 *
 * @example
 * ```typescript
 * const { data: currentUser } = await supabase
 *   .from('users')
 *   .select('org_id, role:roles(code)')
 *   .eq('id', session.user.id)
 *   .single()
 *
 * const role = extractRole(currentUser)
 * if (!hasPOPermission(role, 'create')) { ... }
 * ```
 */
export function extractRole(user: { role?: unknown } | null | undefined): string {
  if (!user?.role) return ''

  // Handle both { code: string } and string formats
  if (typeof user.role === 'string') {
    return user.role.toLowerCase().trim()
  }

  if (typeof user.role === 'object' && user.role !== null) {
    const roleObj = user.role as Record<string, unknown>
    if (typeof roleObj.code === 'string') {
      return roleObj.code.toLowerCase().trim()
    }
  }

  return ''
}

/**
 * Permission check helper that combines role extraction and permission check.
 *
 * @param user User object with role relation
 * @param action PO action to check
 * @returns true if allowed, false otherwise
 *
 * @example
 * ```typescript
 * if (!checkPOPermission(currentUser, 'delete')) {
 *   return NextResponse.json({ error: 'Forbidden: Manager role or higher required' }, { status: 403 })
 * }
 * ```
 */
export function checkPOPermission(
  user: { role?: unknown } | null | undefined,
  action: POAction
): boolean {
  const role = extractRole(user)
  return hasPOPermission(role, action)
}

/**
 * Get human-readable permission requirement for error messages.
 *
 * @param action PO action
 * @returns Human-readable role requirement string
 */
export function getPermissionRequirement(action: POAction): string {
  const permissionMessages: Record<POAction, string> = {
    view: 'Viewer role or higher',
    create: 'Purchasing role or higher',
    edit: 'Purchasing role or higher',
    delete: 'Manager role or higher',
    submit: 'Purchasing role or higher',
    cancel: 'Planner role or higher',
    addLines: 'Purchasing role or higher',
    editLines: 'Purchasing role or higher',
    deleteLines: 'Purchasing role or higher',
  }
  return permissionMessages[action]
}
