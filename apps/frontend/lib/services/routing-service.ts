import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

/**
 * Routing Service - Story 2.24
 *
 * Restructured routing system:
 * - Routings are independent templates (no product_id)
 * - Operations have labor_cost_per_hour
 * - Routings assigned via boms.routing_id (Story 2.25)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Routing {
  id: string
  org_id: string
  code?: string
  name: string
  description: string | null
  version?: number
  is_active: boolean
  is_reusable?: boolean
  // Cost configuration (ADR-009)
  setup_cost?: number
  working_cost_per_unit?: number
  overhead_percent?: number
  currency?: string
  created_at: string
  updated_at: string
  created_by?: string
  operations?: RoutingOperation[]
  operations_count?: number
  boms_count?: number
}

export interface RoutingOperation {
  id: string
  routing_id: string
  sequence: number
  name: string
  description: string | null
  machine_id: string | null
  machine?: { id: string; name: string } | null
  estimated_duration_minutes: number | null
  labor_cost_per_hour: number | null
  created_at: string
}

export interface CreateRoutingInput {
  name: string
  description?: string
  is_active?: boolean
}

export interface UpdateRoutingInput {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface CreateOperationInput {
  sequence: number
  name: string
  description?: string
  machine_id?: string
  estimated_duration_minutes?: number
  labor_cost_per_hour?: number
}

export interface UpdateOperationInput {
  sequence?: number
  name?: string
  description?: string | null
  machine_id?: string | null
  estimated_duration_minutes?: number | null
  labor_cost_per_hour?: number | null
}

export interface RoutingFilters {
  is_active?: boolean
}

export interface ServiceResult<T = Routing> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_NAME' | 'NOT_FOUND' | 'IN_USE' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'DUPLICATE_SEQUENCE' | 'INVALID_MACHINE'
}

export interface ListResult<T> {
  success: boolean
  data?: T[]
  total?: number
  error?: string
}

// ============================================================================
// HELPERS
// ============================================================================

async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id ?? null
}

// ============================================================================
// ROUTING CRUD
// ============================================================================

/**
 * List routings for organization
 * AC-2.24.5: GET /api/technical/routings
 */
export async function listRoutings(filters?: RoutingFilters): Promise<ListResult<Routing>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', total: 0 }
    }

    let query = supabase
      .from('routings')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error, count } = await query

    if (error) {
      return { success: false, error: error.message, total: 0 }
    }

    // Get operations count for each routing
    if (data && data.length > 0) {
      const routingIds = data.map(r => r.id)
      const { data: opCounts } = await supabase
        .from('routing_operations')
        .select('routing_id')
        .in('routing_id', routingIds)

      const routingsWithCounts = data.map(routing => ({
        ...routing,
        operations_count: opCounts?.filter(op => op.routing_id === routing.id).length || 0
      }))

      return { success: true, data: routingsWithCounts, total: count ?? 0 }
    }

    return { success: true, data: data || [], total: count ?? 0 }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', total: 0 }
  }
}

/**
 * Get routing by ID with operations
 * AC-2.24.5: GET /api/technical/routings/:id
 */
export async function getRoutingById(id: string): Promise<ServiceResult<Routing>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    const { data: routing, error } = await supabase
      .from('routings')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !routing) {
      return { success: false, error: 'Routing not found', code: 'NOT_FOUND' }
    }

    // Fetch operations with machine details
    const { data: operations } = await supabase
      .from('routing_operations')
      .select(`
        *,
        machine:machines(id, name)
      `)
      .eq('routing_id', id)
      .order('sequence', { ascending: true })

    return {
      success: true,
      data: { ...routing, operations: operations || [] }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Create new routing
 * AC-2.24.5: POST /api/technical/routings
 */
export async function createRouting(input: CreateRoutingInput): Promise<ServiceResult<Routing>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    // Check duplicate name
    const { data: existing } = await supabaseAdmin
      .from('routings')
      .select('id')
      .eq('org_id', orgId)
      .eq('name', input.name)
      .single()

    if (existing) {
      return { success: false, error: 'Routing with this name already exists', code: 'DUPLICATE_NAME' }
    }

    const { data, error } = await supabaseAdmin
      .from('routings')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description ?? null,
        is_active: input.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Routing with this name already exists', code: 'DUPLICATE_NAME' }
      }
      return { success: false, error: error.message, code: 'DATABASE_ERROR' }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Update routing
 * AC-2.24.5: PUT /api/technical/routings/:id
 */
export async function updateRouting(id: string, input: UpdateRoutingInput): Promise<ServiceResult<Routing>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    // Check if routing exists
    const { data: existing } = await supabase
      .from('routings')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (!existing) {
      return { success: false, error: 'Routing not found', code: 'NOT_FOUND' }
    }

    // Check duplicate name if changing name
    if (input.name) {
      const { data: duplicate } = await supabase
        .from('routings')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', input.name)
        .neq('id', id)
        .single()

      if (duplicate) {
        return { success: false, error: 'Routing with this name already exists', code: 'DUPLICATE_NAME' }
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data, error } = await supabase
      .from('routings')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Routing with this name already exists', code: 'DUPLICATE_NAME' }
      }
      return { success: false, error: error.message, code: 'DATABASE_ERROR' }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Clone routing with all operations
 * FR-2.47: Routing templates (simple version)
 *
 * Creates a new routing by copying an existing one:
 * 1. Copies routing metadata (description, is_active)
 * 2. User must provide new unique name
 * 3. Copies all operations with same sequence and properties
 * 4. New routing starts at version 1
 *
 * @param sourceRoutingId - ID of routing to clone
 * @param newData - New routing data (name is required, description optional)
 * @returns New routing ID and count of copied operations
 */
export async function cloneRouting(
  sourceRoutingId: string,
  newData: {
    name: string
    description?: string
  }
): Promise<ServiceResult<{ routingId: string; operationsCount: number }>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    // 1. Get source routing
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('routings')
      .select('*')
      .eq('id', sourceRoutingId)
      .eq('org_id', orgId)
      .single()

    if (sourceError || !source) {
      return { success: false, error: 'Source routing not found', code: 'NOT_FOUND' }
    }

    // 2. Check duplicate name
    const { data: existing } = await supabaseAdmin
      .from('routings')
      .select('id')
      .eq('org_id', orgId)
      .eq('name', newData.name)
      .single()

    if (existing) {
      return { success: false, error: 'Routing with this name already exists', code: 'DUPLICATE_NAME' }
    }

    // 3. Create new routing with copied fields
    const { data: newRouting, error: createError } = await supabaseAdmin
      .from('routings')
      .insert({
        org_id: orgId,
        name: newData.name,
        description: newData.description ?? source.description,
        is_active: source.is_active
      })
      .select()
      .single()

    if (createError || !newRouting) {
      if (createError?.code === '23505') {
        return { success: false, error: 'Routing with this name already exists', code: 'DUPLICATE_NAME' }
      }
      return { success: false, error: createError?.message || 'Failed to create routing', code: 'DATABASE_ERROR' }
    }

    // 4. Clone operations
    const { data: sourceOps, error: opsError } = await supabaseAdmin
      .from('routing_operations')
      .select('*')
      .eq('routing_id', sourceRoutingId)
      .order('sequence', { ascending: true })

    if (opsError) {
      // Rollback: delete the newly created routing
      await supabaseAdmin.from('routings').delete().eq('id', newRouting.id)
      return { success: false, error: 'Failed to fetch source operations', code: 'DATABASE_ERROR' }
    }

    let operationsCount = 0

    if (sourceOps && sourceOps.length > 0) {
      const clonedOps = sourceOps.map(op => ({
        routing_id: newRouting.id,
        sequence: op.sequence,
        name: op.name,
        description: op.description,
        machine_id: op.machine_id,
        estimated_duration_minutes: op.estimated_duration_minutes,
        labor_cost_per_hour: op.labor_cost_per_hour
      }))

      const { error: insertError } = await supabaseAdmin
        .from('routing_operations')
        .insert(clonedOps)

      if (insertError) {
        // Rollback: delete the newly created routing
        await supabaseAdmin.from('routings').delete().eq('id', newRouting.id)
        return { success: false, error: 'Failed to clone operations', code: 'DATABASE_ERROR' }
      }

      operationsCount = clonedOps.length
    }

    return {
      success: true,
      data: {
        routingId: newRouting.id,
        operationsCount
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR'
    }
  }
}

/**
 * Delete routing
 * AC-2.24.5: DELETE /api/technical/routings/:id
 */
export async function deleteRouting(id: string): Promise<ServiceResult<void>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization not found', code: 'INVALID_INPUT' }
    }

    // Check if routing exists
    const { data: existing } = await supabase
      .from('routings')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (!existing) {
      return { success: false, error: 'Routing not found', code: 'NOT_FOUND' }
    }

    // Check if routing is used by BOMs (will be implemented in Story 2.25)
    const { inUse, bomCount } = await checkRoutingInUse(id)
    if (inUse) {
      return { success: false, error: `Routing is used by ${bomCount} BOMs`, code: 'IN_USE' }
    }

    const { error } = await supabase
      .from('routings')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      return { success: false, error: error.message, code: 'DATABASE_ERROR' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Check if routing is used by BOMs
 * AC-2.24.8: checkRoutingInUse helper
 */
export async function checkRoutingInUse(routingId: string): Promise<{ inUse: boolean; bomCount: number }> {
  try {
    const supabase = await createServerSupabase()

    // Will check boms.routing_id after Story 2.25
    // For now, routing_id column doesn't exist in boms table yet
    
    const { count } = await (supabase as any)
      .from('boms')
      .select('id', { count: 'exact', head: true })
      .eq('routing_id', routingId)

    return { inUse: (count ?? 0) > 0, bomCount: count ?? 0 }
  } catch {
    // If routing_id column doesn't exist yet, return not in use
    return { inUse: false, bomCount: 0 }
  }
}

// ============================================================================
// ROUTING OPERATIONS CRUD
// ============================================================================

/**
 * List operations for routing
 * AC-2.24.6: GET /api/technical/routings/:id/operations
 */
export async function listOperations(routingId: string): Promise<ListResult<RoutingOperation>> {
  try {
    const supabase = await createServerSupabase()

    const { data, error, count } = await supabase
      .from('routing_operations')
      .select(`
        *,
        machine:machines(id, name)
      `, { count: 'exact' })
      .eq('routing_id', routingId)
      .order('sequence', { ascending: true })

    if (error) {
      return { success: false, error: error.message, total: 0 }
    }

    return { success: true, data: data || [], total: count ?? 0 }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', total: 0 }
  }
}

/**
 * Add operation to routing
 * AC-2.24.6: POST /api/technical/routings/:id/operations
 */
export async function addOperation(routingId: string, input: CreateOperationInput): Promise<ServiceResult<RoutingOperation>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Validate machine_id if provided
    if (input.machine_id) {
      const { data: machine } = await supabaseAdmin
        .from('machines')
        .select('id')
        .eq('id', input.machine_id)
        .single()

      if (!machine) {
        return { success: false, error: 'Invalid machine ID', code: 'INVALID_MACHINE' }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('routing_operations')
      .insert({
        routing_id: routingId,
        sequence: input.sequence,
        name: input.name,
        description: input.description ?? null,
        machine_id: input.machine_id ?? null,
        estimated_duration_minutes: input.estimated_duration_minutes ?? null,
        labor_cost_per_hour: input.labor_cost_per_hour ?? null
      })
      .select(`
        *,
        machine:machines(id, name)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Sequence ${input.sequence} already exists for this routing`, code: 'DUPLICATE_SEQUENCE' }
      }
      return { success: false, error: error.message, code: 'DATABASE_ERROR' }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Update operation
 * AC-2.24.6: PUT /api/technical/routings/:id/operations/:opId
 */
export async function updateOperation(routingId: string, opId: string, input: UpdateOperationInput): Promise<ServiceResult<RoutingOperation>> {
  try {
    const supabase = await createServerSupabase()

    // Check if operation exists
    const { data: existing } = await supabase
      .from('routing_operations')
      .select('id')
      .eq('id', opId)
      .eq('routing_id', routingId)
      .single()

    if (!existing) {
      return { success: false, error: 'Operation not found', code: 'NOT_FOUND' }
    }

    // Validate machine_id if provided
    if (input.machine_id) {
      const { data: machine } = await supabase
        .from('machines')
        .select('id')
        .eq('id', input.machine_id)
        .single()

      if (!machine) {
        return { success: false, error: 'Invalid machine ID', code: 'INVALID_MACHINE' }
      }
    }

    const updateData: Record<string, unknown> = {}
    if (input.sequence !== undefined) updateData.sequence = input.sequence
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.machine_id !== undefined) updateData.machine_id = input.machine_id
    if (input.estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = input.estimated_duration_minutes
    if (input.labor_cost_per_hour !== undefined) updateData.labor_cost_per_hour = input.labor_cost_per_hour

    const { data, error } = await supabase
      .from('routing_operations')
      .update(updateData)
      .eq('id', opId)
      .eq('routing_id', routingId)
      .select(`
        *,
        machine:machines(id, name)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Sequence ${input.sequence} already exists for this routing`, code: 'DUPLICATE_SEQUENCE' }
      }
      return { success: false, error: error.message, code: 'DATABASE_ERROR' }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Delete operation
 * AC-2.24.6: DELETE /api/technical/routings/:id/operations/:opId
 */
export async function deleteOperation(routingId: string, opId: string): Promise<ServiceResult<void>> {
  try {
    const supabase = await createServerSupabase()

    const { error } = await supabase
      .from('routing_operations')
      .delete()
      .eq('id', opId)
      .eq('routing_id', routingId)

    if (error) {
      return { success: false, error: error.message, code: 'DATABASE_ERROR' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', code: 'DATABASE_ERROR' }
  }
}

/**
 * Calculate total labor cost for routing
 * AC-2.24.8: calculateTotalLaborCost helper
 */
export async function calculateTotalLaborCost(routingId: string, batchSize: number = 1): Promise<number> {
  try {
    const supabase = await createServerSupabase()

    const { data: operations } = await supabase
      .from('routing_operations')
      .select('labor_cost_per_hour, estimated_duration_minutes')
      .eq('routing_id', routingId)

    if (!operations || operations.length === 0) return 0

    let totalCost = 0
    for (const op of operations) {
      if (op.labor_cost_per_hour && op.estimated_duration_minutes) {
        const hours = op.estimated_duration_minutes / 60
        totalCost += op.labor_cost_per_hour * hours * batchSize
      }
    }

    return Math.round(totalCost * 100) / 100
  } catch {
    return 0
  }
}
