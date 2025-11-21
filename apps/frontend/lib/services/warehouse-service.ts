import { createServerSupabase } from '../supabase/server'
import { type Warehouse, type CreateWarehouseInput, type UpdateWarehouseInput, type WarehouseFilters } from '@/lib/validation/warehouse-schemas'

/**
 * Warehouse Service
 * Story: 1.5 Warehouse Configuration
 * Tasks: 2, 7, 8, 9
 *
 * Handles warehouse CRUD operations with:
 * - Unique code validation per org (AC-004.1)
 * - Circular dependency resolution (AC-004.2)
 * - Archive/activate functionality (AC-004.4)
 * - Cache invalidation events (AC-004.8)
 */

export interface WarehouseServiceResult<T = Warehouse> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'FOREIGN_KEY_CONSTRAINT' | 'INVALID_INPUT' | 'DATABASE_ERROR'
}

export interface WarehouseListResult {
  success: boolean
  data?: Warehouse[]
  total?: number
  error?: string
}

/**
 * Get current user's org_id from JWT
 * Used for RLS enforcement and multi-tenancy
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Extract org_id from JWT claims
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    console.error('Failed to get org_id for user:', user.id, error)
    return null
  }

  return userData.org_id
}

/**
 * Create a new warehouse
 * AC-004.1: Admin może stworzyć warehouse
 *
 * Validation:
 * - Code must be unique per org
 * - Code format: uppercase alphanumeric + hyphens
 * - Name required (1-100 chars)
 * - default_*_location_id initially NULL (circular dependency, AC-004.2)
 *
 * @param input - CreateWarehouseInput (validated by Zod schema)
 * @returns WarehouseServiceResult with created warehouse or error
 */
export async function createWarehouse(
  input: CreateWarehouseInput
): Promise<WarehouseServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found. Please log in again.',
        code: 'INVALID_INPUT',
      }
    }

    // Get current user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        code: 'INVALID_INPUT',
      }
    }

    // Check if code already exists for this org (AC-004.1)
    const { data: existingWarehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code)
      .single()

    if (existingWarehouse) {
      return {
        success: false,
        error: `Warehouse code "${input.code}" already exists`,
        code: 'DUPLICATE_CODE',
      }
    }

    // Create warehouse with default_*_location_id = NULL initially (AC-004.2)
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase(), // Ensure uppercase
        name: input.name,
        address: input.address ?? null,
        is_active: input.is_active ?? true,
        default_receiving_location_id: null,
        default_shipping_location_id: null,
        transit_location_id: null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create warehouse:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event (AC-004.8)
    await emitWarehouseUpdatedEvent(orgId, 'created', warehouse.id)

    console.log(`Successfully created warehouse: ${warehouse.code} (${warehouse.id})`)

    return {
      success: true,
      data: warehouse,
    }
  } catch (error) {
    console.error('Error in createWarehouse:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing warehouse
 * AC-004.5: Edit warehouse
 *
 * Validation:
 * - Code still unique per org (if changed)
 * - Default locations must belong to this warehouse (checked via FK)
 * - Can update default locations after locations created (AC-004.2)
 *
 * @param id - Warehouse UUID
 * @param input - UpdateWarehouseInput (validated by Zod schema)
 * @returns WarehouseServiceResult with updated warehouse or error
 */
export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput
): Promise<WarehouseServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Get current user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        code: 'INVALID_INPUT',
      }
    }

    // Check if warehouse exists and belongs to org
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, code')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return {
        success: false,
        error: 'Warehouse not found',
        code: 'NOT_FOUND',
      }
    }

    // If code is being changed, check uniqueness (AC-004.5)
    if (input.code && input.code !== existingWarehouse.code) {
      const { data: duplicateWarehouse } = await supabase
        .from('warehouses')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', input.code.toUpperCase())
        .neq('id', id)
        .single()

      if (duplicateWarehouse) {
        return {
          success: false,
          error: `Warehouse code "${input.code}" already exists`,
          code: 'DUPLICATE_CODE',
        }
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_by: user.id,
    }

    if (input.code) updatePayload.code = input.code.toUpperCase()
    if (input.name !== undefined) updatePayload.name = input.name
    if (input.address !== undefined) updatePayload.address = input.address
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active

    // AC-004.5: Update default locations (circular dependency resolved by now)
    if (input.default_receiving_location_id !== undefined) {
      updatePayload.default_receiving_location_id = input.default_receiving_location_id
    }
    if (input.default_shipping_location_id !== undefined) {
      updatePayload.default_shipping_location_id = input.default_shipping_location_id
    }
    if (input.transit_location_id !== undefined) {
      updatePayload.transit_location_id = input.transit_location_id
    }

    // Update warehouse
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .update(updatePayload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update warehouse:', error)

      // Check for foreign key constraint violation
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Invalid location reference. Location must belong to this warehouse.',
          code: 'FOREIGN_KEY_CONSTRAINT',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event (AC-004.8)
    await emitWarehouseUpdatedEvent(orgId, 'updated', warehouse.id)

    console.log(`Successfully updated warehouse: ${warehouse.code} (${warehouse.id})`)

    return {
      success: true,
      data: warehouse,
    }
  } catch (error) {
    console.error('Error in updateWarehouse:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get warehouse by ID
 * Includes populated default location relationships
 *
 * @param id - Warehouse UUID
 * @returns WarehouseServiceResult with warehouse data or error
 */
export async function getWarehouseById(id: string): Promise<WarehouseServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        default_receiving_location:locations!warehouses_default_receiving_location_id_fkey(id, code, name),
        default_shipping_location:locations!warehouses_default_shipping_location_id_fkey(id, code, name),
        transit_location:locations!warehouses_transit_location_id_fkey(id, code, name)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !warehouse) {
      console.error('Failed to fetch warehouse:', error)
      return {
        success: false,
        error: 'Warehouse not found',
        code: 'NOT_FOUND',
      }
    }

    return {
      success: true,
      data: warehouse,
    }
  } catch (error) {
    console.error('Error in getWarehouseById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List warehouses with filters
 * AC-004.3: Warehouses list view
 *
 * Filters:
 * - is_active: true/false/undefined (all)
 * - search: filter by code or name (case-insensitive)
 *
 * Sorting: by code, name, created_at (default: code ASC)
 *
 * @param filters - WarehouseFilters (optional)
 * @returns WarehouseListResult with warehouses array or error
 */
export async function listWarehouses(
  filters?: WarehouseFilters
): Promise<WarehouseListResult> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        total: 0,
      }
    }

    let query = supabase
      .from('warehouses')
      .select(`
        *,
        default_receiving_location:locations!warehouses_default_receiving_location_id_fkey(id, code, name),
        default_shipping_location:locations!warehouses_default_shipping_location_id_fkey(id, code, name),
        transit_location:locations!warehouses_transit_location_id_fkey(id, code, name)
      `, { count: 'exact' })
      .eq('org_id', orgId)

    // Apply filters (AC-004.3)
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    // Search filter (AC-004.3: Search by code or name)
    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
    }

    // Sort by code (default)
    query = query.order('code', { ascending: true })

    const { data: warehouses, error, count } = await query

    if (error) {
      console.error('Failed to list warehouses:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        total: 0,
      }
    }

    return {
      success: true,
      data: warehouses || [],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in listWarehouses:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
    }
  }
}

/**
 * Archive warehouse (soft delete)
 * AC-004.4: Cannot delete warehouse with constraints
 *
 * Sets is_active = false instead of hard delete.
 * This is the recommended approach to prevent FK constraint violations.
 *
 * @param id - Warehouse UUID
 * @returns WarehouseServiceResult with success status or error
 */
export async function archiveWarehouse(id: string): Promise<WarehouseServiceResult> {
  return await updateWarehouse(id, { is_active: false })
}

/**
 * Activate warehouse (unarchive)
 * AC-004.7: Warehouse card/list view toggle (Archive/Activate action)
 *
 * Sets is_active = true to restore archived warehouse.
 *
 * @param id - Warehouse UUID
 * @returns WarehouseServiceResult with success status or error
 */
export async function activateWarehouse(id: string): Promise<WarehouseServiceResult> {
  return await updateWarehouse(id, { is_active: true })
}

/**
 * Delete warehouse (hard delete)
 * AC-004.4: Cannot delete warehouse with constraints
 *
 * WARNING: This will fail if warehouse has:
 * - Active POs (Epic 3)
 * - Active LPs (Epic 5)
 * - Active locations (Story 1.6)
 *
 * Error handling returns user-friendly message with constraint details.
 *
 * @param id - Warehouse UUID
 * @returns WarehouseServiceResult with success status or error
 */
export async function deleteWarehouse(id: string): Promise<WarehouseServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Attempt delete
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      console.error('Failed to delete warehouse:', error)

      // AC-004.4: Foreign key constraint violation
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Cannot delete warehouse - it has active entities (POs, LPs, or locations). Archive it instead.',
          code: 'FOREIGN_KEY_CONSTRAINT',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event (AC-004.8)
    await emitWarehouseUpdatedEvent(orgId, 'deleted', id)

    console.log(`Successfully deleted warehouse: ${id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteWarehouse:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Emit warehouse cache invalidation event
 * AC-004.8: Cache invalidation events
 *
 * Publishes a broadcast event to notify other modules (Epic 3, 5, 7)
 * to invalidate their warehouse cache.
 *
 * Redis cache key: `warehouses:{org_id}`
 * Redis cache TTL: 5 min
 *
 * @param orgId - Organization UUID
 * @param action - Action type (created, updated, deleted)
 * @param warehouseId - Warehouse UUID
 */
async function emitWarehouseUpdatedEvent(
  orgId: string,
  action: 'created' | 'updated' | 'deleted',
  warehouseId: string
): Promise<void> {
  try {
    const supabase = await createServerSupabase()

    // Publish to org-specific channel
    const channel = supabase.channel(`org:${orgId}`)

    await channel.send({
      type: 'broadcast',
      event: 'warehouse.updated',
      payload: {
        action,
        warehouseId,
        orgId,
        timestamp: new Date().toISOString(),
      },
    })

    // Clean up channel
    await supabase.removeChannel(channel)

    console.log(`Emitted warehouse.updated event: ${action} ${warehouseId}`)
  } catch (error) {
    // Non-critical error, log but don't fail the operation
    console.error('Failed to emit warehouse.updated event:', error)
  }
}
