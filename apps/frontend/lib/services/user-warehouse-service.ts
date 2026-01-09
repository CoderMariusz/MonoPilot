/**
 * User Warehouse Access Service
 * Story: 01.5b - User Warehouse Access Restrictions (Phase 1B)
 *
 * Handles user warehouse access assignment and retrieval.
 * Business Logic:
 * - NULL warehouse_access_ids = all warehouses for ADMIN/SUPER_ADMIN roles
 * - NULL warehouse_access_ids = no warehouses for non-admin roles
 * - Array of UUIDs = specific warehouse access
 * - Empty array = explicitly no warehouse access
 */

import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Warehouse access response interface
 */
export interface WarehouseAccessResponse {
  user_id: string
  all_warehouses: boolean
  warehouse_ids: string[]
  warehouses: { id: string; code: string; name: string; type?: string }[]
  warning?: string
}

/**
 * Update warehouse access request interface
 */
export interface UpdateWarehouseAccessRequest {
  all_warehouses: boolean
  warehouse_ids?: string[]
}

/**
 * Audit log entry interface
 */
export interface WarehouseAccessAuditLog {
  id: string
  user_id: string
  action: string
  old_value: string[] | null
  new_value: string[] | null
  changed_by: string
  changed_at: string
}

/**
 * Admin roles that have all warehouse access by default when NULL
 * Uses lowercase to match role codes from database
 */
const ADMIN_ROLES = ['owner', 'admin'] as const

export class UserWarehouseService {
  /**
   * Get warehouse access for a user
   * Implements AC-5: GET /api/v1/settings/users/:id/warehouse-access
   *
   * Business Logic:
   * - If warehouse_access_ids is NULL and user is admin: all_warehouses = true
   * - If warehouse_access_ids is NULL and user is not admin: all_warehouses = false (warning)
   * - If warehouse_access_ids is array: return specific warehouses
   */
  static async getWarehouseAccess(
    userId: string,
    orgId: string
  ): Promise<WarehouseAccessResponse | null> {
    const supabase = await createServerSupabase()

    // Get user with role information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        warehouse_access_ids,
        role:roles(code)
      `)
      .eq('id', userId)
      .eq('org_id', orgId)
      .single()

    if (userError || !user) {
      return null
    }

    // Extract role code using type-safe pattern
    const roleData = user.role as { code?: string } | { code?: string }[] | null
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    const isAdminRole = roleCode !== undefined && ADMIN_ROLES.includes(roleCode as typeof ADMIN_ROLES[number])

    // Fetch all warehouses for the org (for admin response or to populate details)
    const { data: allWarehouses, error: whError } = await supabase
      .from('warehouses')
      .select('id, code, name, type')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (whError) {
      throw new Error(`Failed to fetch warehouses: ${whError.message}`)
    }

    const warehouseAccessIds = user.warehouse_access_ids as string[] | null

    // Case 1: NULL warehouse_access_ids
    if (warehouseAccessIds === null) {
      if (isAdminRole) {
        // Admin with NULL = all warehouses
        return {
          user_id: userId,
          all_warehouses: true,
          warehouse_ids: [],
          warehouses: allWarehouses || [],
        }
      } else {
        // Non-admin with NULL = no warehouses (edge case, show warning)
        return {
          user_id: userId,
          all_warehouses: false,
          warehouse_ids: [],
          warehouses: [],
          warning: 'User has no warehouse access configured',
        }
      }
    }

    // Case 2: Empty array = explicitly no access
    if (warehouseAccessIds.length === 0) {
      return {
        user_id: userId,
        all_warehouses: false,
        warehouse_ids: [],
        warehouses: [],
      }
    }

    // Case 3: Specific warehouse access
    const accessibleWarehouses = (allWarehouses || []).filter(wh =>
      warehouseAccessIds.includes(wh.id)
    )

    return {
      user_id: userId,
      all_warehouses: false,
      warehouse_ids: warehouseAccessIds,
      warehouses: accessibleWarehouses,
    }
  }

  /**
   * Update warehouse access for a user
   * Implements AC-5: PUT /api/v1/settings/users/:id/warehouse-access
   *
   * Business Logic:
   * - If all_warehouses = true: set warehouse_access_ids to NULL
   * - If all_warehouses = false: set warehouse_access_ids to provided array
   * - Validates warehouse IDs exist in org
   * - Creates audit log entry
   */
  static async updateWarehouseAccess(
    userId: string,
    orgId: string,
    data: UpdateWarehouseAccessRequest,
    changedBy: string
  ): Promise<{ success: boolean; audit_log?: WarehouseAccessAuditLog }> {
    const supabase = await createServerSupabase()

    // Get current access for audit log
    const currentAccess = await this.getWarehouseAccess(userId, orgId)
    if (!currentAccess) {
      throw new Error('User not found')
    }

    // Determine old value for audit
    const oldValue = currentAccess.all_warehouses
      ? null
      : currentAccess.warehouse_ids.length > 0
        ? currentAccess.warehouse_ids
        : []

    let newValue: string[] | null

    if (data.all_warehouses) {
      // Set to NULL for all warehouses
      newValue = null
    } else {
      // Validate warehouse IDs if provided
      const warehouseIds = data.warehouse_ids || []

      if (warehouseIds.length > 0) {
        // Verify all warehouse IDs exist in org
        const { data: validWarehouses, error: validateError } = await supabase
          .from('warehouses')
          .select('id')
          .eq('org_id', orgId)
          .in('id', warehouseIds)

        if (validateError) {
          throw new Error(`Failed to validate warehouses: ${validateError.message}`)
        }

        const validIds = (validWarehouses || []).map(w => w.id)
        const invalidIds = warehouseIds.filter(id => !validIds.includes(id))

        if (invalidIds.length > 0) {
          throw new Error('Invalid warehouse IDs')
        }
      }

      newValue = warehouseIds
    }

    // Update user's warehouse access
    const { error: updateError } = await supabase
      .from('users')
      .update({
        warehouse_access_ids: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('org_id', orgId)

    if (updateError) {
      throw new Error(`Failed to update warehouse access: ${updateError.message}`)
    }

    // Create audit log entry
    const auditLog = await this.logAccessChange(
      userId,
      orgId,
      oldValue,
      newValue,
      changedBy
    )

    return {
      success: true,
      audit_log: auditLog,
    }
  }

  /**
   * Log warehouse access change for audit trail
   * Implements AC-6: Audit Trail
   */
  private static async logAccessChange(
    userId: string,
    orgId: string,
    oldValue: string[] | null,
    newValue: string[] | null,
    changedBy: string
  ): Promise<WarehouseAccessAuditLog> {
    // Create audit log entry
    // Note: This could be stored in a dedicated audit table in a future enhancement
    // For now, we return a structured audit log object
    const auditLog: WarehouseAccessAuditLog = {
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'warehouse_access_updated',
      old_value: oldValue,
      new_value: newValue,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
    }

    // Log to console for now (could be stored in audit_logs table later)
    console.log('[Audit] Warehouse access change:', {
      ...auditLog,
      org_id: orgId,
    })

    return auditLog
  }
}
