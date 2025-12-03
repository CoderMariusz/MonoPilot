import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import {
  type WorkOrder,
  type CreateWorkOrderInput,
  type UpdateWorkOrderInput,
  type WorkOrderFilters,
} from '@/lib/validation/work-order-schemas'
import { getActiveBOMForProduct } from './bom-service'

/**
 * Work Order Service
 * Epic 3 Batch 3B: Planning Operations MVP
 * Story 3.10: Work Order CRUD
 *
 * Handles Work Order CRUD operations with:
 * - Auto-generated WO numbers (WO-YYYY-NNN format)
 * - Product validation and UoM inheritance
 * - Status management (draft, released, in_progress, completed, closed, cancelled)
 * - Production line assignment
 * - Date validation
 * - Multi-org RLS isolation
 */

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?:
    | 'DUPLICATE_WO_NUMBER'
    | 'NOT_FOUND'
    | 'INVALID_INPUT'
    | 'INVALID_STATUS'
    | 'FOREIGN_KEY_CONSTRAINT'
    | 'DATABASE_ERROR'
}

export interface ListResult<T> {
  success: boolean
  data?: T[]
  total?: number
  error?: string
}

/**
 * Get current user's org_id from JWT
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * Generate next WO number in format: WO-YYYYMMDD-NNNN
 * AC-3.10.2: Resets sequence daily, unique per org
 */
async function generateWoNumber(orgId: string): Promise<string> {
  const supabaseAdmin = createServerSupabaseAdmin()
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const datePrefix = `${year}${month}${day}`
  const prefix = `WO-${datePrefix}-`

  // Find highest number for current day
  const { data: existingWos, error } = await supabaseAdmin
    .from('work_orders')
    .select('wo_number')
    .eq('org_id', orgId)
    .like('wo_number', `${prefix}%`)
    .order('wo_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching latest WO number:', error)
    throw new Error('Failed to generate WO number')
  }

  let nextSequence = 1

  if (existingWos && existingWos.length > 0) {
    // Extract sequence from WO-YYYYMMDD-NNNN
    const latestWo = existingWos[0].wo_number
    const parts = latestWo.split('-')
    if (parts.length === 3) {
      const currentSequence = parseInt(parts[2], 10)
      if (!isNaN(currentSequence)) {
        nextSequence = currentSequence + 1
      }
    }
  }

  // Format: WO-YYYYMMDD-NNNN (4 digits)
  const formattedSequence = nextSequence.toString().padStart(4, '0')
  return `WO-${datePrefix}-${formattedSequence}`
}

/**
 * Create a new Work Order
 * AC-3.10.1: Auto-generate WO number, validate product, inherit UoM
 */
export async function createWorkOrder(
  input: CreateWorkOrderInput
): Promise<ServiceResult<WorkOrder>> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    const orgId = await getCurrentOrgId()
    const userId = await getCurrentUserId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found',
        code: 'INVALID_INPUT',
      }
    }

    // Validate product exists and get UoM
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, uom, code, name')
      .eq('id', input.product_id)
      .eq('org_id', orgId)
      .single()

    if (productError || !product) {
      return {
        success: false,
        error: 'Product not found',
        code: 'INVALID_INPUT',
      }
    }

    // Validate production line if provided
    if (input.production_line_id) {
      const { data: machine, error: machineError } = await supabase
        .from('machines')
        .select('id')
        .eq('id', input.production_line_id)
        .eq('org_id', orgId)
        .single()

      if (machineError || !machine) {
        return {
          success: false,
          error: 'Production line not found',
          code: 'INVALID_INPUT',
        }
      }
    }

    // Generate WO number
    const woNumber = await generateWoNumber(orgId)

    // AC-3.10.3: Auto-select BOM based on scheduled date
    let bomId: string | null = null
    const scheduledDate = input.planned_start_date || new Date()
    try {
      const activeBom = await getActiveBOMForProduct(input.product_id, scheduledDate)
      if (activeBom) {
        bomId = activeBom.id
      }
    } catch (bomError) {
      // BOM selection is optional - log but don't fail WO creation
      console.warn('Could not auto-select BOM:', bomError)
    }

    // Create work order
    const { data: workOrder, error: createError } = await supabaseAdmin
      .from('work_orders')
      .insert({
        org_id: orgId,
        wo_number: woNumber,
        product_id: input.product_id,
        bom_id: bomId,
        planned_quantity: input.planned_quantity,
        produced_quantity: 0,
        uom: product.uom,
        status: 'draft',
        planned_start_date: input.planned_start_date || null,
        planned_end_date: input.planned_end_date || null,
        production_line_id: input.production_line_id || null,
        created_by: userId,
      })
      .select(`
        *,
        products:product_id (id, code, name, uom),
        machines:production_line_id (id, code, name),
        boms:bom_id (id, version, status)
      `)
      .single()

    if (createError) {
      console.error('Error creating work order:', createError)

      if (createError.code === '23505') {
        return {
          success: false,
          error: 'Work Order number already exists',
          code: 'DUPLICATE_WO_NUMBER',
        }
      }

      if (createError.code === '23503') {
        return {
          success: false,
          error: 'Referenced entity not found',
          code: 'FOREIGN_KEY_CONSTRAINT',
        }
      }

      return {
        success: false,
        error: createError.message || 'Failed to create work order',
        code: 'DATABASE_ERROR',
      }
    }

    // Story 3.12: Copy BOM materials to WO (if product has BOM)
    if (workOrder && bomId) {
      const bomCopyResult = await copyBOMToWOMaterials(
        workOrder.id,
        bomId,
        input.planned_quantity,
        orgId
      )
      if (!bomCopyResult.success) {
        console.warn('Failed to copy BOM materials:', bomCopyResult.error)
      }
    }

    // Story 3.14: Copy routing operations to WO (if BOM has routing)
    if (workOrder && bomId) {
      // Get routing_id from BOM
      const { data: bomData, error: bomFetchError } = await supabaseAdmin
        .from('boms')
        .select('routing_id')
        .eq('id', bomId)
        .single()

      if (!bomFetchError && bomData?.routing_id) {
        const copyResult = await copyRoutingToWO(
          workOrder.id,
          bomData.routing_id,
          orgId
        )
        if (!copyResult.success) {
          console.warn('Failed to copy routing operations:', copyResult.error)
        }
      }
    }

    return {
      success: true,
      data: workOrder as WorkOrder,
    }
  } catch (error) {
    console.error('Unexpected error in createWorkOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing Work Order
 * AC-3.10.2: Update WO details (dates, quantity, status, production line)
 */
export async function updateWorkOrder(
  woId: string,
  input: UpdateWorkOrderInput
): Promise<ServiceResult<WorkOrder>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found',
        code: 'INVALID_INPUT',
      }
    }

    // Check work order exists and belongs to org
    const { data: existingWo, error: fetchError } = await supabase
      .from('work_orders')
      .select('id, status')
      .eq('id', woId)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWo) {
      return {
        success: false,
        error: 'Work Order not found',
        code: 'NOT_FOUND',
      }
    }

    // Validate production line if provided
    if (input.production_line_id) {
      const { data: machine, error: machineError } = await supabase
        .from('machines')
        .select('id')
        .eq('id', input.production_line_id)
        .eq('org_id', orgId)
        .single()

      if (machineError || !machine) {
        return {
          success: false,
          error: 'Production line not found',
          code: 'INVALID_INPUT',
        }
      }
    }

    // Update work order
    const { data: workOrder, error: updateError } = await supabase
      .from('work_orders')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', woId)
      .eq('org_id', orgId)
      .select(`
        *,
        products:product_id (id, code, name, uom),
        machines:production_line_id (id, code, name),
        boms:bom_id (id, version, status)
      `)
      .single()

    if (updateError) {
      console.error('Error updating work order:', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to update work order',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: workOrder as WorkOrder,
    }
  } catch (error) {
    console.error('Unexpected error in updateWorkOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get a single Work Order by ID
 * AC-3.10.3: View WO details with product and production line info
 */
export async function getWorkOrder(woId: string): Promise<ServiceResult<WorkOrder>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found',
        code: 'INVALID_INPUT',
      }
    }

    const { data: workOrder, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        products:product_id (id, code, name, uom),
        machines:production_line_id (id, code, name),
        boms:bom_id (id, version, status)
      `)
      .eq('id', woId)
      .eq('org_id', orgId)
      .single()

    if (error || !workOrder) {
      return {
        success: false,
        error: 'Work Order not found',
        code: 'NOT_FOUND',
      }
    }

    return {
      success: true,
      data: workOrder as WorkOrder,
    }
  } catch (error) {
    console.error('Unexpected error in getWorkOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List Work Orders with filters
 * AC-3.10.1: Display WOs with search, status filter, sorting
 */
export async function listWorkOrders(
  filters: WorkOrderFilters = {}
): Promise<ListResult<WorkOrder>> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found',
      }
    }

    let query = supabase
      .from('work_orders')
      .select(
        `
        *,
        products:product_id (id, code, name, uom),
        machines:production_line_id (id, code, name),
        boms:bom_id (id, version, status)
      `,
        { count: 'exact' }
      )
      .eq('org_id', orgId)

    // Apply filters
    if (filters.search) {
      query = query.or(
        `wo_number.ilike.%${filters.search}%,products.name.ilike.%${filters.search}%`
      )
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id)
    }

    if (filters.production_line_id) {
      query = query.eq('production_line_id', filters.production_line_id)
    }

    if (filters.date_from) {
      query = query.gte('planned_start_date', filters.date_from.toISOString().split('T')[0])
    }

    if (filters.date_to) {
      query = query.lte('planned_start_date', filters.date_to.toISOString().split('T')[0])
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at'
    const sortDirection = filters.sort_direction || 'desc'
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    const { data: workOrders, error, count } = await query

    if (error) {
      console.error('Error listing work orders:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch work orders',
      }
    }

    return {
      success: true,
      data: (workOrders as WorkOrder[]) || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('Unexpected error in listWorkOrders:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Delete a Work Order
 * AC-3.10.4: Delete WO (admin only, handled by RLS)
 */
export async function deleteWorkOrder(woId: string): Promise<ServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found',
        code: 'INVALID_INPUT',
      }
    }

    // Check work order exists
    const { data: existingWo, error: fetchError } = await supabase
      .from('work_orders')
      .select('id')
      .eq('id', woId)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWo) {
      return {
        success: false,
        error: 'Work Order not found',
        code: 'NOT_FOUND',
      }
    }

    // Delete work order
    const { error: deleteError } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', woId)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Error deleting work order:', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to delete work order',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error in deleteWorkOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      code: 'DATABASE_ERROR',
    }
  }
}

// =============================================================================
// Story 3.14: Routing Copy to WO
// =============================================================================

/**
 * Copy BOM items to WO materials
 * Story 3.12: Snapshot BOM items at WO creation time with quantity scaling
 *
 * AC-3.12.1: Copy BOM items and scale quantities
 * AC-3.12.2: Calculate scaled qty = bom_item.qty × (wo.qty / bom.output_qty)
 * AC-3.12.3: Store BOM item reference and version for immutability tracking
 */
export async function copyBOMToWOMaterials(
  woId: string,
  bomId: string,
  woQty: number,
  orgId: string
): Promise<ServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get BOM with items and product names
    const { data: bom, error: bomError } = await supabaseAdmin
      .from('boms')
      .select(`
        id,
        version,
        output_qty,
        bom_items (
          id,
          product_id,
          quantity,
          uom,
          scrap_percent,
          sequence,
          consume_whole_lp,
          is_by_product,
          yield_percent,
          condition_flags,
          notes,
          product:products!product_id (name)
        )
      `)
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      console.error('Error fetching BOM:', bomError)
      return {
        success: false,
        error: 'Failed to fetch BOM',
        code: 'DATABASE_ERROR',
      }
    }

    const bomItems = bom.bom_items || []

    if (bomItems.length === 0) {
      // No items to copy - this is not an error
      return { success: true, data: [] }
    }

    // Prepare wo_materials records with quantity scaling
    // Formula: scaled_qty = bom_item.qty × (wo.qty / bom.output_qty)
    // DB uses: material_name, required_qty
    const woMaterials = bomItems.map((item: any) => ({
      wo_id: woId,
      organization_id: orgId,
      product_id: item.product_id,
      material_name: item.product?.name || 'Unknown Material',
      required_qty: (item.quantity || 0) * (woQty / (bom.output_qty || 1)),
      consumed_qty: 0,
      uom: item.uom,
      sequence: item.sequence || 0,
      consume_whole_lp: item.consume_whole_lp || false,
      is_by_product: item.is_by_product || false,
      yield_percent: item.yield_percent || null,
      scrap_percent: item.scrap_percent || 0,
      condition_flags: item.condition_flags || null,
      bom_item_id: item.id,
      bom_version: bom.version,
      notes: item.notes || null,
    }))

    // Insert wo_materials records
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('wo_materials')
      .insert(woMaterials)
      .select()

    if (insertError) {
      console.error('Error inserting WO materials:', insertError)
      return {
        success: false,
        error: 'Failed to copy BOM items to work order',
        code: 'DATABASE_ERROR',
      }
    }

    return { success: true, data: inserted }
  } catch (error) {
    console.error('Unexpected error in copyBOMToWOMaterials:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Copy routing operations to WO
 * Story 3.14: Creates wo_operations from routing_operations
 */
export async function copyRoutingToWO(
  woId: string,
  routingId: string,
  orgId: string
): Promise<ServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get routing operations
    const { data: routingOps, error: routingError } = await supabaseAdmin
      .from('routing_operations')
      .select('*')
      .eq('routing_id', routingId)
      .order('sequence', { ascending: true })

    if (routingError) {
      console.error('Error fetching routing operations:', routingError)
      return {
        success: false,
        error: 'Failed to fetch routing operations',
        code: 'DATABASE_ERROR',
      }
    }

    if (!routingOps || routingOps.length === 0) {
      // No operations to copy - this is not an error
      return { success: true, data: [] }
    }

    // Prepare wo_operations records (mapping routing_operations → wo_operations)
    // Actual DB schema uses: wo_id, organization_id, sequence, expected_duration_minutes
    const woOperations = routingOps.map((op) => ({
      organization_id: orgId,
      wo_id: woId,
      sequence: op.sequence,
      operation_name: op.name,
      machine_id: op.machine_id || null,
      expected_duration_minutes: op.duration || 0,
      expected_yield_percent: null,
      status: 'pending',
    }))

    // Insert all operations
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('wo_operations')
      .insert(woOperations)
      .select()

    if (insertError) {
      console.error('Error inserting WO operations:', insertError)
      return {
        success: false,
        error: 'Failed to copy routing operations',
        code: 'DATABASE_ERROR',
      }
    }

    return { success: true, data: inserted }
  } catch (error) {
    console.error('Unexpected error in copyRoutingToWO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get WO operations
 * Story 3.14: Fetches operations for a Work Order
 */
export async function getWOOperations(woId: string): Promise<ListResult<any>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // DB schema uses: wo_id, sequence, expected_duration_minutes, expected_yield_percent
    const { data, error } = await supabaseAdmin
      .from('wo_operations')
      .select(`
        id,
        wo_id,
        sequence,
        operation_name,
        machine_id,
        line_id,
        expected_duration_minutes,
        expected_yield_percent,
        actual_duration_minutes,
        status,
        started_at,
        completed_at,
        machines:machine_id (
          id,
          code,
          name
        )
      `)
      .eq('wo_id', woId)
      .order('sequence', { ascending: true })

    if (error) {
      console.error('Error fetching WO operations:', error)
      return { success: false, error: 'Failed to fetch operations' }
    }

    return { success: true, data: data || [], total: data?.length || 0 }
  } catch (error) {
    console.error('Unexpected error in getWOOperations:', error)
    return { success: false, error: 'Unexpected error' }
  }
}

/**
 * Get product's default routing
 * Story 3.14: Gets the routing assigned to a product
 */
export async function getProductRouting(productId: string): Promise<ServiceResult<string | null>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check product_routings for assigned routing
    const { data, error } = await supabaseAdmin
      .from('product_routings')
      .select('routing_id')
      .eq('product_id', productId)
      .eq('is_default', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching product routing:', error)
      return { success: false, error: 'Failed to fetch product routing' }
    }

    return { success: true, data: data?.routing_id || null }
  } catch (error) {
    console.error('Unexpected error in getProductRouting:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
