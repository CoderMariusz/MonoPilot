import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

/**
 * Routing Service
 * Stories: 2.15, 2.16, 2.17
 *
 * Handles routing CRUD operations with:
 * - Unique code validation per org (AC-015.4)
 * - Reusability management (AC-015.1)
 * - Operation sequencing (AC-016.2)
 * - Product-routing assignments (AC-017)
 * - Cache invalidation events
 */

export type RoutingStatus = 'active' | 'inactive'

export interface Routing {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  status: RoutingStatus
  is_reusable: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  operations?: RoutingOperation[]
  assigned_products?: Array<{
    id: string
    code: string
    name: string
  }>
  products_count?: number
}

export interface RoutingOperation {
  id: string
  routing_id: string
  sequence: number
  operation_name: string
  machine_id: string | null
  line_id: string | null
  expected_duration_minutes: number
  expected_yield_percent: number
  setup_time_minutes: number
  labor_cost: number | null
  created_at: string
  updated_at: string
  machine?: { id: string; code: string; name: string }
  line?: { id: string; code: string; name: string }
}

export interface ProductRouting {
  id: string
  product_id: string
  routing_id: string
  is_default: boolean
  created_at: string
}

export interface CreateRoutingInput {
  code: string
  name: string
  description?: string
  status?: RoutingStatus
  is_reusable?: boolean
}

export interface UpdateRoutingInput {
  name?: string
  description?: string | null
  status?: RoutingStatus
  is_reusable?: boolean
}

export interface CreateOperationInput {
  sequence: number
  operation_name: string
  machine_id?: string | null
  line_id?: string | null
  expected_duration_minutes: number
  expected_yield_percent?: number
  setup_time_minutes?: number
  labor_cost?: number | null
}

export interface UpdateOperationInput {
  sequence?: number
  operation_name?: string
  machine_id?: string | null
  line_id?: string | null
  expected_duration_minutes?: number
  expected_yield_percent?: number
  setup_time_minutes?: number
  labor_cost?: number | null
}

export interface RoutingFilters {
  status?: RoutingStatus | 'all'
  search?: string
  sort_by?: 'code' | 'name' | 'status' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

export interface RoutingServiceResult<T = Routing> {
  success: boolean
  data?: T
  error?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'FOREIGN_KEY_CONSTRAINT' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'NOT_REUSABLE'
}

export interface RoutingListResult {
  success: boolean
  data?: Routing[]
  total?: number
  error?: string
}

export interface OperationServiceResult {
  success: boolean
  data?: RoutingOperation
  error?: string
  code?: 'DUPLICATE_SEQUENCE' | 'NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR'
}

export interface OperationListResult {
  success: boolean
  data?: RoutingOperation[]
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

// ============================================================================
// ROUTING CRUD (Story 2.15)
// ============================================================================

/**
 * Create a new routing
 * AC-015.1: Technical user can create routing
 *
 * Validation:
 * - Code must be unique per org
 * - Code format: uppercase alphanumeric + hyphens
 * - Name required (1-100 chars)
 * - Status: active, inactive (default: active)
 * - is_reusable: boolean (default: true)
 *
 * @param input - CreateRoutingInput
 * @returns RoutingServiceResult with created routing or error
 */
export async function createRouting(
  input: CreateRoutingInput
): Promise<RoutingServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
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

    // Check if code already exists for this org (AC-015.4)
    const { data: existingRouting } = await supabaseAdmin
      .from('routings')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code.toUpperCase())
      .single()

    if (existingRouting) {
      return {
        success: false,
        error: `Routing code "${input.code}" already exists`,
        code: 'DUPLICATE_CODE',
      }
    }

    // Create routing
    const { data: routing, error } = await supabaseAdmin
      .from('routings')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description ?? null,
        status: input.status || 'active',
        is_reusable: input.is_reusable !== undefined ? input.is_reusable : true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create routing:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Successfully created routing: ${routing.code} (${routing.id})`)

    return {
      success: true,
      data: routing,
    }
  } catch (error) {
    console.error('Error in createRouting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing routing
 * AC-015.5: Edit routing
 *
 * Note: Code cannot be updated (immutable)
 *
 * @param id - Routing UUID
 * @param input - UpdateRoutingInput
 * @returns RoutingServiceResult with updated routing or error
 */
export async function updateRouting(
  id: string,
  input: UpdateRoutingInput
): Promise<RoutingServiceResult> {
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

    // Check if routing exists and belongs to org
    const { data: existingRouting, error: fetchError } = await supabase
      .from('routings')
      .select('id, code')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingRouting) {
      return {
        success: false,
        error: 'Routing not found',
        code: 'NOT_FOUND',
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_by: user.id,
    }

    if (input.name !== undefined) updatePayload.name = input.name
    if (input.description !== undefined) updatePayload.description = input.description
    if (input.status !== undefined) updatePayload.status = input.status
    if (input.is_reusable !== undefined) updatePayload.is_reusable = input.is_reusable

    // Update routing
    const { data: routing, error } = await supabase
      .from('routings')
      .update(updatePayload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update routing:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Successfully updated routing: ${routing.code} (${routing.id})`)

    return {
      success: true,
      data: routing,
    }
  } catch (error) {
    console.error('Error in updateRouting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get routing by ID with operations and assigned products
 * AC-015.2: Routing detail view
 *
 * @param id - Routing UUID
 * @returns RoutingServiceResult with routing data (with operations and products) or error
 */
export async function getRoutingById(id: string): Promise<RoutingServiceResult> {
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

    // Fetch routing
    const { data: routing, error } = await supabase
      .from('routings')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !routing) {
      console.error('Failed to fetch routing:', error)
      return {
        success: false,
        error: 'Routing not found',
        code: 'NOT_FOUND',
      }
    }

    // Fetch operations (AC-016.2: ordered by sequence)
    const { data: operations } = await supabase
      .from('routing_operations')
      .select(`
        *,
        machine:machines(id, code, name),
        line:production_lines(id, code, name)
      `)
      .eq('routing_id', id)
      .order('sequence', { ascending: true })

    // Fetch assigned products count (AC-015.2)
    // NOTE: This will be implemented once products table exists
    // For now, we'll fetch from product_routings table
    const { data: productAssignments, count: productsCount } = await supabase
      .from('product_routings')
      .select('product_id', { count: 'exact' })
      .eq('routing_id', id)

    const routingWithDetails = {
      ...routing,
      operations: operations || [],
      products_count: productsCount || 0,
    }

    return {
      success: true,
      data: routingWithDetails,
    }
  } catch (error) {
    console.error('Error in getRoutingById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List routings with filters
 * AC-015.2: Routings list view
 *
 * Filters:
 * - status: active/inactive/all (default: all)
 * - search: filter by code or name (case-insensitive)
 * - sort_by: code/name/status/created_at (default: code)
 * - sort_direction: asc/desc (default: asc)
 *
 * @param filters - RoutingFilters (optional)
 * @returns RoutingListResult with routings array or error
 */
export async function listRoutings(
  filters?: RoutingFilters
): Promise<RoutingListResult> {
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
      .from('routings')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply status filter (AC-015.3)
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    // Search filter (AC-015.3: Search by code or name)
    if (filters?.search) {
      const escapedSearch = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')

      query = query.or(`code.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%`)
    }

    // Dynamic sorting
    const sortBy = filters?.sort_by || 'code'
    const sortDirection = filters?.sort_direction || 'asc'
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    const { data: routings, error, count } = await query

    if (error) {
      console.error('Failed to list routings:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        total: 0,
      }
    }

    // Fetch products count for each routing (AC-015.2)
    if (routings && routings.length > 0) {
      const routingIds = routings.map(r => r.id)
      const { data: productCounts } = await supabase
        .from('product_routings')
        .select('routing_id')
        .in('routing_id', routingIds)

      const routingsWithCounts = routings.map(routing => ({
        ...routing,
        products_count: productCounts?.filter(pc => pc.routing_id === routing.id).length || 0,
      }))

      return {
        success: true,
        data: routingsWithCounts,
        total: count ?? 0,
      }
    }

    return {
      success: true,
      data: routings || [],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in listRoutings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
    }
  }
}

/**
 * Delete routing (hard delete)
 * AC-015.5: Delete routing
 *
 * Cascade delete: operations and product_routing assignments will be deleted
 *
 * @param id - Routing UUID
 * @returns RoutingServiceResult with success status or error
 */
export async function deleteRouting(id: string): Promise<RoutingServiceResult> {
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

    // Attempt delete (operations and product_routings will CASCADE delete automatically)
    const { error } = await supabase
      .from('routings')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      console.error('Failed to delete routing:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Successfully deleted routing: ${id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteRouting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// ROUTING OPERATIONS (Story 2.16)
// ============================================================================

/**
 * Create a new operation for a routing
 * AC-016.1: Add operation
 *
 * Validation:
 * - sequence must be unique within routing
 * - operation_name required (1-100 chars)
 * - expected_duration_minutes > 0
 * - expected_yield_percent: 0.01-100.00 (default 100.00)
 *
 * @param routingId - Routing UUID
 * @param input - CreateOperationInput
 * @returns OperationServiceResult with created operation or error
 */
export async function createOperation(
  routingId: string,
  input: CreateOperationInput
): Promise<OperationServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Create operation
    const { data: operation, error } = await supabaseAdmin
      .from('routing_operations')
      .insert({
        routing_id: routingId,
        sequence: input.sequence,
        operation_name: input.operation_name,
        machine_id: input.machine_id ?? null,
        line_id: input.line_id ?? null,
        expected_duration_minutes: input.expected_duration_minutes,
        expected_yield_percent: input.expected_yield_percent ?? 100.00,
        setup_time_minutes: input.setup_time_minutes ?? 0,
        labor_cost: input.labor_cost ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create operation:', error)

      // Check for duplicate sequence
      if (error.code === '23505') {
        return {
          success: false,
          error: `Sequence ${input.sequence} already exists for this routing`,
          code: 'DUPLICATE_SEQUENCE',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Successfully created operation: ${operation.operation_name} (${operation.id})`)

    return {
      success: true,
      data: operation,
    }
  } catch (error) {
    console.error('Error in createOperation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing operation
 * AC-016.4: Edit operation
 *
 * @param operationId - Operation UUID
 * @param input - UpdateOperationInput
 * @returns OperationServiceResult with updated operation or error
 */
export async function updateOperation(
  operationId: string,
  input: UpdateOperationInput
): Promise<OperationServiceResult> {
  try {
    const supabase = await createServerSupabase()

    // Build update payload
    const updatePayload: any = {}

    if (input.sequence !== undefined) updatePayload.sequence = input.sequence
    if (input.operation_name !== undefined) updatePayload.operation_name = input.operation_name
    if (input.machine_id !== undefined) updatePayload.machine_id = input.machine_id
    if (input.line_id !== undefined) updatePayload.line_id = input.line_id
    if (input.expected_duration_minutes !== undefined) updatePayload.expected_duration_minutes = input.expected_duration_minutes
    if (input.expected_yield_percent !== undefined) updatePayload.expected_yield_percent = input.expected_yield_percent
    if (input.setup_time_minutes !== undefined) updatePayload.setup_time_minutes = input.setup_time_minutes
    if (input.labor_cost !== undefined) updatePayload.labor_cost = input.labor_cost

    // Update operation
    const { data: operation, error } = await supabase
      .from('routing_operations')
      .update(updatePayload)
      .eq('id', operationId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update operation:', error)

      // Check for duplicate sequence
      if (error.code === '23505') {
        return {
          success: false,
          error: `Sequence ${input.sequence} already exists for this routing`,
          code: 'DUPLICATE_SEQUENCE',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Successfully updated operation: ${operation.operation_name} (${operation.id})`)

    return {
      success: true,
      data: operation,
    }
  } catch (error) {
    console.error('Error in updateOperation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List operations for a routing
 * AC-016.2: Operations displayed in sequence order
 *
 * @param routingId - Routing UUID
 * @returns OperationListResult with operations array or error
 */
export async function listOperations(
  routingId: string
): Promise<OperationListResult> {
  try {
    const supabase = await createServerSupabase()

    // Fetch operations with machine/line details, ordered by sequence
    const { data: operations, error, count } = await supabase
      .from('routing_operations')
      .select(`
        *,
        machine:machines(id, code, name),
        line:production_lines(id, code, name)
      `, { count: 'exact' })
      .eq('routing_id', routingId)
      .order('sequence', { ascending: true })

    if (error) {
      console.error('Failed to list operations:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        total: 0,
      }
    }

    return {
      success: true,
      data: operations || [],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in listOperations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
    }
  }
}

/**
 * Delete operation
 * AC-016.4: Delete operation
 *
 * @param operationId - Operation UUID
 * @returns OperationServiceResult with success status or error
 */
export async function deleteOperation(operationId: string): Promise<OperationServiceResult> {
  try {
    const supabase = await createServerSupabase()

    const { error } = await supabase
      .from('routing_operations')
      .delete()
      .eq('id', operationId)

    if (error) {
      console.error('Failed to delete operation:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Successfully deleted operation: ${operationId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteOperation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Reorder operations (AC-016.3: Drag-drop reordering)
 *
 * @param operations - Array of {id, sequence} pairs
 * @returns OperationServiceResult with success status or error
 */
export async function reorderOperations(
  operations: Array<{ id: string; sequence: number }>
): Promise<OperationServiceResult> {
  try {
    const supabase = await createServerSupabase()

    // Update sequences in a transaction-like manner
    for (const op of operations) {
      const { error } = await supabase
        .from('routing_operations')
        .update({ sequence: op.sequence })
        .eq('id', op.id)

      if (error) {
        console.error('Failed to reorder operations:', error)
        return {
          success: false,
          error: `Database error: ${error.message}`,
          code: 'DATABASE_ERROR',
        }
      }
    }

    console.log(`Successfully reordered ${operations.length} operations`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in reorderOperations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// PRODUCT-ROUTING ASSIGNMENTS (Story 2.17)
// ============================================================================

/**
 * Assign products to a routing
 * AC-017.1: Reusable routing can be assigned to multiple products
 * AC-017.2: Non-reusable routing can only be assigned to one product
 * AC-017.3: Can set one routing as default per product
 *
 * @param routingId - Routing UUID
 * @param productIds - Array of product UUIDs
 * @param defaultProductId - Optional: Product UUID to set as default
 * @returns RoutingServiceResult with success status or error
 */
export async function assignProductsToRouting(
  routingId: string,
  productIds: string[],
  defaultProductId?: string
): Promise<RoutingServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get routing to check is_reusable
    const { data: routing } = await supabase
      .from('routings')
      .select('is_reusable')
      .eq('id', routingId)
      .single()

    if (!routing) {
      return {
        success: false,
        error: 'Routing not found',
        code: 'NOT_FOUND',
      }
    }

    // AC-017.2: Non-reusable routing can only be assigned to one product
    if (!routing.is_reusable && productIds.length > 1) {
      return {
        success: false,
        error: 'This routing is not reusable and can only be assigned to one product',
        code: 'NOT_REUSABLE',
      }
    }

    // Get current user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser()

    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('product_routings')
      .delete()
      .eq('routing_id', routingId)

    if (deleteError) {
      console.error('Failed to delete existing product assignments:', deleteError)
      return {
        success: false,
        error: deleteError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // If no new product_ids provided, we're done (assignments removed)
    if (!productIds || productIds.length === 0) {
      return { success: true }
    }

    // Bulk insert new assignments
    const assignments = productIds.map(productId => ({
      routing_id: routingId,
      product_id: productId,
      is_default: productId === defaultProductId,
      created_by: user?.id,
    }))

    const { error: insertError } = await supabaseAdmin
      .from('product_routings')
      .insert(assignments)

    if (insertError) {
      console.error('Failed to insert product assignments:', insertError)
      return {
        success: false,
        error: insertError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in assignProductsToRouting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}
