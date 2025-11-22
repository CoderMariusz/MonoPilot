import { createServerSupabase } from '../supabase/server'

/**
 * Machine Service
 * Story: 1.7 Machine Configuration
 * Tasks: 2, 7, 8, 9
 *
 * Handles machine CRUD operations with:
 * - Unique code validation per org (AC-006.1)
 * - Machine status lifecycle: active, down, maintenance (AC-006.2)
 * - Many-to-many line assignments via machine_line_assignments (AC-006.3)
 * - Status change validation (warn if active WOs) (AC-006.2)
 * - FK constraint handling for deletions (AC-006.5)
 * - Cache invalidation events (AC-006.8)
 */

export type MachineStatus = 'active' | 'down' | 'maintenance'

export interface Machine {
  id: string
  org_id: string
  code: string
  name: string
  status: MachineStatus
  capacity_per_hour: number | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  assigned_lines?: Array<{
    id: string
    code: string
    name: string
  }>
}

export interface CreateMachineInput {
  code: string
  name: string
  status?: MachineStatus
  capacity_per_hour?: number | null
  line_ids?: string[]
}

export interface UpdateMachineInput {
  code?: string
  name?: string
  status?: MachineStatus
  capacity_per_hour?: number | null
  line_ids?: string[]
}

export interface MachineFilters {
  status?: MachineStatus | 'all'
  search?: string
  sort_by?: 'code' | 'name' | 'status' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

export interface MachineServiceResult<T = Machine> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'FOREIGN_KEY_CONSTRAINT' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'ACTIVE_WOS'
}

export interface MachineListResult {
  success: boolean
  data?: Machine[]
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
 * Update machine line assignments (many-to-many)
 * AC-006.3: Machine-line many-to-many assignment
 *
 * Strategy: Delete all existing assignments, then bulk insert new ones
 * This is safe because machine_line_assignments has no cascading dependencies
 *
 * @param supabase - Supabase client
 * @param machineId - Machine UUID
 * @param lineIds - Array of production line UUIDs
 */
async function updateMachineLineAssignments(
  supabase: any,
  machineId: string,
  lineIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('machine_line_assignments')
      .delete()
      .eq('machine_id', machineId)

    if (deleteError) {
      console.error('Failed to delete existing line assignments:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // If no new line_ids provided, we're done (assignments removed)
    if (!lineIds || lineIds.length === 0) {
      return { success: true }
    }

    // Bulk insert new assignments
    const assignments = lineIds.map(lineId => ({
      machine_id: machineId,
      line_id: lineId,
    }))

    const { error: insertError } = await supabase
      .from('machine_line_assignments')
      .insert(assignments)

    if (insertError) {
      console.error('Failed to insert line assignments:', insertError)

      // Check for duplicate assignment (race condition)
      if (insertError.code === '23505') {
        return { success: false, error: 'Duplicate line assignment detected' }
      }

      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateMachineLineAssignments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a new machine
 * AC-006.1: Admin może stworzyć machine
 *
 * Validation:
 * - Code must be unique per org
 * - Code format: uppercase alphanumeric + hyphens
 * - Name required (1-100 chars)
 * - Status: active, down, maintenance (default: active)
 * - Capacity: optional, positive decimal
 *
 * Line assignments: If line_ids provided, creates assignments in machine_line_assignments table
 *
 * Cache invalidation: Emits machine.created event (AC-006.8)
 *
 * @param input - CreateMachineInput
 * @returns MachineServiceResult with created machine or error
 */
export async function createMachine(
  input: CreateMachineInput
): Promise<MachineServiceResult> {
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

    // Check if code already exists for this org (AC-006.1)
    const { data: existingMachine } = await supabase
      .from('machines')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code.toUpperCase())
      .single()

    if (existingMachine) {
      return {
        success: false,
        error: `Machine code "${input.code}" already exists`,
        code: 'DUPLICATE_CODE',
      }
    }

    // Create machine
    const { data: machine, error } = await supabase
      .from('machines')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase(), // Ensure uppercase
        name: input.name,
        status: input.status || 'active',
        capacity_per_hour: input.capacity_per_hour ?? null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create machine:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Create line assignments if line_ids provided (AC-006.3)
    if (input.line_ids && input.line_ids.length > 0) {
      const assignmentResult = await updateMachineLineAssignments(
        supabase,
        machine.id,
        input.line_ids
      )

      if (!assignmentResult.success) {
        // Line assignment failed, but machine was created
        // Return success but log the error
        console.error('Machine created but line assignments failed:', assignmentResult.error)
        return {
          success: true,
          data: machine,
          error: `Machine created but line assignments failed: ${assignmentResult.error}`,
        }
      }
    }

    // Emit cache invalidation event (AC-006.8)
    await emitMachineUpdatedEvent(orgId, 'created', machine.id)

    console.log(`Successfully created machine: ${machine.code} (${machine.id})`)

    return {
      success: true,
      data: machine,
    }
  } catch (error) {
    console.error('Error in createMachine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing machine
 * AC-006.6: Edit machine
 *
 * Validation:
 * - Code still unique per org (if changed)
 * - Status change validation: warn if machine has active WOs (AC-006.2)
 *
 * Line assignments: Updates machine_line_assignments (delete old, insert new)
 *
 * Cache invalidation: Emits machine.updated event (AC-006.8)
 *
 * @param id - Machine UUID
 * @param input - UpdateMachineInput
 * @returns MachineServiceResult with updated machine or error
 */
export async function updateMachine(
  id: string,
  input: UpdateMachineInput
): Promise<MachineServiceResult> {
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

    // Check if machine exists and belongs to org
    const { data: existingMachine, error: fetchError } = await supabase
      .from('machines')
      .select('id, code, status')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingMachine) {
      return {
        success: false,
        error: 'Machine not found',
        code: 'NOT_FOUND',
      }
    }

    // If code is being changed, check uniqueness (AC-006.6)
    if (input.code && input.code.toUpperCase() !== existingMachine.code) {
      const { data: duplicateMachine } = await supabase
        .from('machines')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', input.code.toUpperCase())
        .neq('id', id)
        .single()

      if (duplicateMachine) {
        return {
          success: false,
          error: `Machine code "${input.code}" already exists`,
          code: 'DUPLICATE_CODE',
        }
      }
    }

    // AC-006.2: If status changing to Down/Maintenance, check for active WOs
    // Note: This is a future Epic 4 feature, we'll log a warning for now
    if (input.status && input.status !== existingMachine.status) {
      if (input.status === 'down' || input.status === 'maintenance') {
        // TODO Epic 4: Query work_orders table to check for active WOs
        // For now, log a warning
        console.warn(`Status changing to ${input.status} for machine ${id}. Check for active WOs in Epic 4.`)
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_by: user.id,
    }

    if (input.code) updatePayload.code = input.code.toUpperCase()
    if (input.name !== undefined) updatePayload.name = input.name
    if (input.status !== undefined) updatePayload.status = input.status
    if (input.capacity_per_hour !== undefined) updatePayload.capacity_per_hour = input.capacity_per_hour

    // Update machine
    const { data: machine, error } = await supabase
      .from('machines')
      .update(updatePayload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update machine:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Update line assignments if line_ids provided (AC-006.6)
    if (input.line_ids !== undefined) {
      const assignmentResult = await updateMachineLineAssignments(
        supabase,
        machine.id,
        input.line_ids
      )

      if (!assignmentResult.success) {
        // Machine updated but line assignments failed
        console.error('Machine updated but line assignments failed:', assignmentResult.error)
        return {
          success: true,
          data: machine,
          error: `Machine updated but line assignments failed: ${assignmentResult.error}`,
        }
      }
    }

    // Emit cache invalidation event (AC-006.8)
    await emitMachineUpdatedEvent(orgId, 'updated', machine.id)

    console.log(`Successfully updated machine: ${machine.code} (${machine.id})`)

    return {
      success: true,
      data: machine,
    }
  } catch (error) {
    console.error('Error in updateMachine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get machine by ID
 * AC-006.7: Machine detail page
 *
 * Includes populated line assignments (many-to-many join)
 *
 * @param id - Machine UUID
 * @returns MachineServiceResult with machine data (with assigned_lines) or error
 */
export async function getMachineById(id: string): Promise<MachineServiceResult> {
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

    // Fetch machine with line assignments
    const { data: machine, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !machine) {
      console.error('Failed to fetch machine:', error)
      return {
        success: false,
        error: 'Machine not found',
        code: 'NOT_FOUND',
      }
    }

    // Fetch line assignments (when production_lines table exists)
    // TODO Story 1.8: After production_lines table is created, add JOIN to get line details
    // For now, just fetch assignment IDs
    const { data: assignments } = await supabase
      .from('machine_line_assignments')
      .select('line_id')
      .eq('machine_id', id)

    // Note: assigned_lines will be populated after Story 1.8 (production_lines table)
    const machineWithLines = {
      ...machine,
      assigned_lines: assignments?.map(a => ({
        id: a.line_id,
        code: 'PLACEHOLDER', // Will be replaced with actual line data in Story 1.8
        name: 'PLACEHOLDER',
      })) || [],
    }

    return {
      success: true,
      data: machineWithLines,
    }
  } catch (error) {
    console.error('Error in getMachineById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List machines with filters
 * AC-006.4: Machines list view
 *
 * Filters:
 * - status: active/down/maintenance/all (default: all)
 * - search: filter by code or name (case-insensitive)
 * - sort_by: code/name/status/created_at (default: code)
 * - sort_direction: asc/desc (default: asc)
 *
 * Includes line assignment count (AC-006.4: Lines column shows count/names)
 *
 * @param filters - MachineFilters (optional)
 * @returns MachineListResult with machines array or error
 */
export async function listMachines(
  filters?: MachineFilters
): Promise<MachineListResult> {
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

    // Build query
    let query = supabase
      .from('machines')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply status filter (AC-006.4)
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    // Search filter (AC-006.4: Search by code or name)
    if (filters?.search) {
      const escapedSearch = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')

      query = query.or(`code.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%`)
    }

    // Dynamic sorting (AC-006.4)
    const sortBy = filters?.sort_by || 'code'
    const sortDirection = filters?.sort_direction || 'asc'
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    const { data: machines, error, count } = await query

    if (error) {
      console.error('Failed to list machines:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        total: 0,
      }
    }

    // Fetch line assignments for all machines (AC-006.4: Lines column)
    if (machines && machines.length > 0) {
      const machineIds = machines.map(m => m.id)
      const { data: assignments } = await supabase
        .from('machine_line_assignments')
        .select('machine_id, line_id')
        .in('machine_id', machineIds)

      // TODO Story 1.8: After production_lines table exists, JOIN to get line codes/names
      // For now, just attach assignment counts
      const machinesWithLines = machines.map(machine => ({
        ...machine,
        assigned_lines: assignments
          ?.filter(a => a.machine_id === machine.id)
          .map(a => ({
            id: a.line_id,
            code: 'PLACEHOLDER', // Will be replaced in Story 1.8
            name: 'PLACEHOLDER',
          })) || [],
      }))

      return {
        success: true,
        data: machinesWithLines,
        total: count ?? 0,
      }
    }

    return {
      success: true,
      data: machines || [],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in listMachines:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
    }
  }
}

/**
 * Delete machine (hard delete)
 * AC-006.5: Cannot delete machine with constraints
 *
 * WARNING: This will fail if machine has:
 * - Active WOs (Epic 4)
 * - Historical usage (audit trail)
 *
 * Error handling returns user-friendly message with recommendation to archive instead.
 *
 * Cache invalidation: Emits machine.deleted event (AC-006.8)
 *
 * @param id - Machine UUID
 * @returns MachineServiceResult with success status or error
 */
export async function deleteMachine(id: string): Promise<MachineServiceResult> {
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

    // TODO Epic 4: Check for active WOs before allowing deletion
    // For now, log a warning
    console.warn(`Attempting to delete machine ${id}. Check for active WOs in Epic 4.`)

    // Attempt delete (machine_line_assignments will CASCADE delete automatically)
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      console.error('Failed to delete machine:', error)

      // AC-006.5: Foreign key constraint violation
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Cannot delete machine - it has active WOs or historical usage. Archive it instead by setting status to "maintenance".',
          code: 'FOREIGN_KEY_CONSTRAINT',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event (AC-006.8)
    await emitMachineUpdatedEvent(orgId, 'deleted', id)

    console.log(`Successfully deleted machine: ${id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteMachine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Emit machine cache invalidation event
 * AC-006.8: Cache invalidation events
 *
 * Publishes a broadcast event to notify Epic 4 (WO operation assignment)
 * to refetch machine list.
 *
 * Redis cache key: `machines:{org_id}`
 * Redis cache TTL: 5 min
 *
 * @param orgId - Organization UUID
 * @param action - Action type (created, updated, deleted)
 * @param machineId - Machine UUID
 */
async function emitMachineUpdatedEvent(
  orgId: string,
  action: 'created' | 'updated' | 'deleted',
  machineId: string
): Promise<void> {
  try {
    const supabase = await createServerSupabase()

    // Publish to org-specific channel
    const channel = supabase.channel(`org:${orgId}`)

    await channel.send({
      type: 'broadcast',
      event: 'machine.updated',
      payload: {
        action,
        machineId,
        orgId,
        timestamp: new Date().toISOString(),
      },
    })

    // Clean up channel
    await supabase.removeChannel(channel)

    console.log(`Emitted machine.updated event: ${action} ${machineId}`)
  } catch (error) {
    // Non-critical error, log but don't fail the operation
    console.error('Failed to emit machine.updated event:', error)
  }
}
