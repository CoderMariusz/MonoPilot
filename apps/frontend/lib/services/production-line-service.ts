import { createServerSupabase } from '../supabase/server'

/**
 * Production Line Service
 * Story: 1.8 Production Line Configuration
 * Tasks: 2, 7, 8, 9, 11
 *
 * Handles production line CRUD operations with:
 * - Unique code validation per org (AC-007.1)
 * - Warehouse assignment (each line belongs to one warehouse)
 * - Default output location (optional, must be within line's warehouse) (AC-007.2)
 * - Many-to-many machine assignments via machine_line_assignments (AC-007.3)
 * - Output location validation: location.warehouse_id must match line.warehouse_id (AC-011)
 * - FK constraint handling for deletions: prevents deletion if has active WOs (AC-007.5)
 * - Cache invalidation events (AC-007.8)
 */

export interface ProductionLine {
  id: string
  org_id: string
  warehouse_id: string
  code: string
  name: string
  default_output_location_id: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // Populated data (JOIN results)
  warehouse?: {
    id: string
    code: string
    name: string
  }
  default_output_location?: {
    id: string
    code: string
    name: string
    type: string
  }
  assigned_machines?: Array<{
    id: string
    code: string
    name: string
    status: string
  }>
}

export interface CreateProductionLineInput {
  code: string
  name: string
  warehouse_id: string
  default_output_location_id?: string | null
  machine_ids?: string[]
}

export interface UpdateProductionLineInput {
  code?: string
  name?: string
  warehouse_id?: string
  default_output_location_id?: string | null
  machine_ids?: string[]
}

export interface ProductionLineFilters {
  warehouse_id?: string
  search?: string
  sort_by?: 'code' | 'name' | 'warehouse' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

export interface ProductionLineServiceResult<T = ProductionLine> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'FOREIGN_KEY_CONSTRAINT' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'ACTIVE_WOS' | 'LOCATION_WAREHOUSE_MISMATCH'
}

export interface ProductionLineListResult {
  success: boolean
  data?: ProductionLine[]
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
 * Validate that output location belongs to line's warehouse
 * AC-007.2, AC-011: Output location validation
 *
 * Business rule: default_output_location_id must belong to same warehouse as the line
 *
 * @param supabase - Supabase client
 * @param warehouseId - Warehouse UUID from line
 * @param locationId - Location UUID to validate
 * @returns { valid: boolean; error?: string }
 */
async function validateOutputLocation(
  supabase: any,
  warehouseId: string,
  locationId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Fetch location to check its warehouse_id
    const { data: location, error } = await supabase
      .from('locations')
      .select('id, warehouse_id, code, name')
      .eq('id', locationId)
      .single()

    if (error || !location) {
      return {
        valid: false,
        error: `Location not found: ${locationId}`,
      }
    }

    // Validate warehouse match
    if (location.warehouse_id !== warehouseId) {
      return {
        valid: false,
        error: `Output location "${location.code}" does not belong to the selected warehouse. Please choose a location within the same warehouse.`,
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error in validateOutputLocation:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Update production line machine assignments (many-to-many)
 * AC-007.3: Line-machine many-to-many assignment
 *
 * Strategy: Delete all existing assignments, then bulk insert new ones
 * This is safe because machine_line_assignments has no cascading dependencies
 *
 * Bidirectional: Can assign from line side (this story) or machine side (Story 1.7)
 *
 * @param supabase - Supabase client
 * @param lineId - Production line UUID
 * @param machineIds - Array of machine UUIDs
 */
async function updateLineMachineAssignments(
  supabase: any,
  lineId: string,
  machineIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('machine_line_assignments')
      .delete()
      .eq('line_id', lineId)

    if (deleteError) {
      console.error('Failed to delete existing machine assignments:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // If no new machine_ids provided, we're done (assignments removed)
    if (!machineIds || machineIds.length === 0) {
      return { success: true }
    }

    // Bulk insert new assignments
    const assignments = machineIds.map(machineId => ({
      machine_id: machineId,
      line_id: lineId,
    }))

    const { error: insertError } = await supabase
      .from('machine_line_assignments')
      .insert(assignments)

    if (insertError) {
      console.error('Failed to insert machine assignments:', insertError)

      // Check for duplicate assignment (race condition)
      if (insertError.code === '23505') {
        return { success: false, error: 'Duplicate machine assignment detected' }
      }

      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateLineMachineAssignments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a new production line
 * AC-007.1: Admin może stworzyć production line
 *
 * Validation:
 * - Code must be unique per org
 * - Code format: uppercase alphanumeric + hyphens
 * - Name required (1-100 chars)
 * - warehouse_id required (FK to warehouses)
 * - default_output_location_id optional (FK to locations, must be in same warehouse)
 *
 * Machine assignments: If machine_ids provided, creates assignments in machine_line_assignments table
 *
 * Cache invalidation: Emits line.created event (AC-007.8)
 *
 * @param input - CreateProductionLineInput
 * @returns ProductionLineServiceResult with created line or error
 */
export async function createProductionLine(
  input: CreateProductionLineInput
): Promise<ProductionLineServiceResult> {
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

    // Check if code already exists for this org (AC-007.1)
    const { data: existingLine } = await supabase
      .from('production_lines')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code.toUpperCase())
      .single()

    if (existingLine) {
      return {
        success: false,
        error: `Production line code "${input.code}" already exists`,
        code: 'DUPLICATE_CODE',
      }
    }

    // Validate output location if provided (AC-007.2, AC-011)
    if (input.default_output_location_id) {
      const validation = await validateOutputLocation(
        supabase,
        input.warehouse_id,
        input.default_output_location_id
      )

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Output location validation failed',
          code: 'LOCATION_WAREHOUSE_MISMATCH',
        }
      }
    }

    // Create production line
    const { data: line, error } = await supabase
      .from('production_lines')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase(), // Ensure uppercase
        name: input.name,
        warehouse_id: input.warehouse_id,
        default_output_location_id: input.default_output_location_id ?? null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create production line:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Create machine assignments if machine_ids provided (AC-007.3)
    if (input.machine_ids && input.machine_ids.length > 0) {
      const assignmentResult = await updateLineMachineAssignments(
        supabase,
        line.id,
        input.machine_ids
      )

      if (!assignmentResult.success) {
        // Line created but machine assignments failed
        // Return success but log the error
        console.error('Line created but machine assignments failed:', assignmentResult.error)
        return {
          success: true,
          data: line,
          error: `Line created but machine assignments failed: ${assignmentResult.error}`,
        }
      }
    }

    // Emit cache invalidation event (AC-007.8)
    await emitLineUpdatedEvent(orgId, 'created', line.id)

    console.log(`Successfully created production line: ${line.code} (${line.id})`)

    return {
      success: true,
      data: line,
    }
  } catch (error) {
    console.error('Error in createProductionLine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing production line
 * AC-007.6: Edit line
 *
 * Validation:
 * - Code still unique per org (if changed)
 * - Warehouse change: warn if has WOs (AC-007.6)
 * - Output location must belong to new warehouse if warehouse changed
 *
 * Machine assignments: Updates machine_line_assignments (delete old, insert new)
 *
 * Cache invalidation: Emits line.updated event (AC-007.8)
 *
 * @param id - Production line UUID
 * @param input - UpdateProductionLineInput
 * @returns ProductionLineServiceResult with updated line or error
 */
export async function updateProductionLine(
  id: string,
  input: UpdateProductionLineInput
): Promise<ProductionLineServiceResult> {
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

    // Check if line exists and belongs to org
    const { data: existingLine, error: fetchError } = await supabase
      .from('production_lines')
      .select('id, code, warehouse_id, default_output_location_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingLine) {
      return {
        success: false,
        error: 'Production line not found',
        code: 'NOT_FOUND',
      }
    }

    // If code is being changed, check uniqueness (AC-007.6)
    if (input.code && input.code.toUpperCase() !== existingLine.code) {
      const { data: duplicateLine } = await supabase
        .from('production_lines')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', input.code.toUpperCase())
        .neq('id', id)
        .single()

      if (duplicateLine) {
        return {
          success: false,
          error: `Production line code "${input.code}" already exists`,
          code: 'DUPLICATE_CODE',
        }
      }
    }

    // AC-007.6: If warehouse changing, check for active WOs
    if (input.warehouse_id && input.warehouse_id !== existingLine.warehouse_id) {
      // TODO Epic 3: Query work_orders table to check for active WOs
      // For now, log a warning
      console.warn(`Warehouse changing for line ${id}. Check for active WOs in Epic 3. Output location must be updated.`)
    }

    // Determine which warehouse_id to use for validation
    const targetWarehouseId = input.warehouse_id || existingLine.warehouse_id

    // Validate output location if provided (AC-007.2, AC-011)
    if (input.default_output_location_id !== undefined) {
      // If explicitly set to null, that's allowed (clearing default location)
      if (input.default_output_location_id !== null) {
        const validation = await validateOutputLocation(
          supabase,
          targetWarehouseId,
          input.default_output_location_id
        )

        if (!validation.valid) {
          return {
            success: false,
            error: validation.error || 'Output location validation failed',
            code: 'LOCATION_WAREHOUSE_MISMATCH',
          }
        }
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_by: user.id,
    }

    if (input.code) updatePayload.code = input.code.toUpperCase()
    if (input.name !== undefined) updatePayload.name = input.name
    if (input.warehouse_id !== undefined) updatePayload.warehouse_id = input.warehouse_id
    if (input.default_output_location_id !== undefined) {
      updatePayload.default_output_location_id = input.default_output_location_id
    }

    // Update production line
    const { data: line, error } = await supabase
      .from('production_lines')
      .update(updatePayload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update production line:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Update machine assignments if machine_ids provided (AC-007.6)
    if (input.machine_ids !== undefined) {
      const assignmentResult = await updateLineMachineAssignments(
        supabase,
        line.id,
        input.machine_ids
      )

      if (!assignmentResult.success) {
        // Line updated but machine assignments failed
        console.error('Line updated but machine assignments failed:', assignmentResult.error)
        return {
          success: true,
          data: line,
          error: `Line updated but machine assignments failed: ${assignmentResult.error}`,
        }
      }
    }

    // Emit cache invalidation event (AC-007.8)
    await emitLineUpdatedEvent(orgId, 'updated', line.id)

    console.log(`Successfully updated production line: ${line.code} (${line.id})`)

    return {
      success: true,
      data: line,
    }
  } catch (error) {
    console.error('Error in updateProductionLine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get production line by ID
 * AC-007.7: Line detail page
 *
 * Includes populated:
 * - Warehouse (JOIN warehouses)
 * - Default output location (JOIN locations)
 * - Assigned machines (JOIN machine_line_assignments + machines)
 *
 * @param id - Production line UUID
 * @returns ProductionLineServiceResult with line data (with relationships) or error
 */
export async function getProductionLineById(id: string): Promise<ProductionLineServiceResult> {
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

    // Fetch production line with warehouse and output location
    const { data: line, error } = await supabase
      .from('production_lines')
      .select(`
        *,
        warehouse:warehouses(id, code, name),
        default_output_location:locations(id, code, name, type)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !line) {
      console.error('Failed to fetch production line:', error)
      return {
        success: false,
        error: 'Production line not found',
        code: 'NOT_FOUND',
      }
    }

    // Fetch machine assignments with machine details
    const { data: assignments } = await supabase
      .from('machine_line_assignments')
      .select(`
        machine_id,
        machine:machines(id, code, name, status)
      `)
      .eq('line_id', id)

    // Attach assigned machines to line object
    const lineWithRelationships = {
      ...line,
      assigned_machines: assignments?.map(a => a.machine) || [],
    }

    return {
      success: true,
      data: lineWithRelationships,
    }
  } catch (error) {
    console.error('Error in getProductionLineById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List production lines with filters
 * AC-007.4: Lines list view
 *
 * Filters:
 * - warehouse_id: filter by warehouse (optional)
 * - search: filter by code or name (case-insensitive)
 * - sort_by: code/name/warehouse/created_at (default: code)
 * - sort_direction: asc/desc (default: asc)
 *
 * Includes:
 * - Warehouse name (JOIN warehouses)
 * - Output location code (JOIN locations)
 * - Machine count and names (JOIN machine_line_assignments + machines)
 *
 * @param filters - ProductionLineFilters (optional)
 * @returns ProductionLineListResult with lines array or error
 */
export async function listProductionLines(
  filters?: ProductionLineFilters
): Promise<ProductionLineListResult> {
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

    // Build query with JOINs
    let query = supabase
      .from('production_lines')
      .select(`
        *,
        warehouse:warehouses(id, code, name),
        default_output_location:locations(id, code, name, type)
      `, { count: 'exact' })
      .eq('org_id', orgId)

    // Apply warehouse filter (AC-007.4)
    if (filters?.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    // Search filter (AC-007.4: Search by code or name)
    if (filters?.search) {
      const escapedSearch = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')

      query = query.or(`code.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%`)
    }

    // Dynamic sorting (AC-007.4)
    const sortBy = filters?.sort_by || 'code'
    const sortDirection = filters?.sort_direction || 'asc'

    // Handle warehouse sorting (requires JOIN)
    if (sortBy === 'warehouse') {
      // TODO: Implement warehouse name sorting (requires custom query or client-side sort)
      query = query.order('warehouse_id', { ascending: sortDirection === 'asc' })
    } else {
      query = query.order(sortBy, { ascending: sortDirection === 'asc' })
    }

    const { data: lines, error, count } = await query

    if (error) {
      console.error('Failed to list production lines:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        total: 0,
      }
    }

    // Fetch machine assignments for all lines (AC-007.4: Machines column)
    if (lines && lines.length > 0) {
      const lineIds = lines.map(l => l.id)
      const { data: assignments } = await supabase
        .from('machine_line_assignments')
        .select(`
          line_id,
          machine:machines(id, code, name, status)
        `)
        .in('line_id', lineIds)

      // Attach assigned machines to each line
      const linesWithMachines = lines.map(line => ({
        ...line,
        assigned_machines: assignments
          ?.filter(a => a.line_id === line.id)
          .map(a => a.machine) || [],
      }))

      return {
        success: true,
        data: linesWithMachines,
        total: count ?? 0,
      }
    }

    return {
      success: true,
      data: lines || [],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in listProductionLines:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
    }
  }
}

/**
 * Delete production line (hard delete)
 * AC-007.5: Cannot delete line with constraints
 *
 * WARNING: This will fail if line has:
 * - Active WOs (Epic 3, 4)
 * - Historical usage (audit trail)
 *
 * FK constraint ON DELETE RESTRICT prevents deletion if referenced.
 * Error handling returns user-friendly message with recommendation to archive instead.
 *
 * Cache invalidation: Emits line.deleted event (AC-007.8)
 *
 * @param id - Production line UUID
 * @returns ProductionLineServiceResult with success status or error
 */
export async function deleteProductionLine(id: string): Promise<ProductionLineServiceResult> {
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

    // TODO Epic 3: Check for active WOs before allowing deletion
    // For now, log a warning
    console.warn(`Attempting to delete production line ${id}. Check for active WOs in Epic 3.`)

    // Attempt delete (machine_line_assignments will CASCADE delete automatically)
    const { error } = await supabase
      .from('production_lines')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      console.error('Failed to delete production line:', error)

      // AC-007.5: Foreign key constraint violation
      if (error.code === '23503') {
        // TODO Epic 3: Query work_orders to get count of active WOs
        return {
          success: false,
          error: 'Cannot delete production line - it has active WOs or historical usage. Archive it instead.',
          code: 'FOREIGN_KEY_CONSTRAINT',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event (AC-007.8)
    await emitLineUpdatedEvent(orgId, 'deleted', id)

    console.log(`Successfully deleted production line: ${id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteProductionLine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Emit production line cache invalidation event
 * AC-007.8: Cache invalidation events
 *
 * Publishes a broadcast event to notify Epic 3, 4 (WO creation, execution)
 * to refetch line list.
 *
 * Redis cache key: `lines:{org_id}`
 * Redis cache TTL: 5 min
 *
 * @param orgId - Organization UUID
 * @param action - Action type (created, updated, deleted)
 * @param lineId - Production line UUID
 */
async function emitLineUpdatedEvent(
  orgId: string,
  action: 'created' | 'updated' | 'deleted',
  lineId: string
): Promise<void> {
  try {
    const supabase = await createServerSupabase()

    // Publish to org-specific channel
    const channel = supabase.channel(`org:${orgId}`)

    await channel.send({
      type: 'broadcast',
      event: 'line.updated',
      payload: {
        action,
        lineId,
        orgId,
        timestamp: new Date().toISOString(),
      },
    })

    // Clean up channel
    await supabase.removeChannel(channel)

    console.log(`Emitted line.updated event: ${action} ${lineId}`)
  } catch (error) {
    // Non-critical error, log but don't fail the operation
    console.error('Failed to emit line.updated event:', error)
  }
}
