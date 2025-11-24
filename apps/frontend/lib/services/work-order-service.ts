import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import {
  type WorkOrder,
  type CreateWorkOrderInput,
  type UpdateWorkOrderInput,
  type WorkOrderFilters,
} from '@/lib/validation/work-order-schemas'

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
 * Generate next WO number in format: WO-YYYY-NNN
 * Resets sequence each year
 */
async function generateWoNumber(orgId: string): Promise<string> {
  const supabaseAdmin = createServerSupabaseAdmin()
  const currentYear = new Date().getFullYear()
  const prefix = `WO-${currentYear}-`

  // Find highest number for current year
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
    // Extract sequence from WO-YYYY-NNN
    const latestWo = existingWos[0].wo_number
    const parts = latestWo.split('-')
    if (parts.length === 3) {
      const currentSequence = parseInt(parts[2], 10)
      if (!isNaN(currentSequence)) {
        nextSequence = currentSequence + 1
      }
    }
  }

  // Format: WO-YYYY-NNN (3 digits)
  const formattedSequence = nextSequence.toString().padStart(3, '0')
  return `WO-${currentYear}-${formattedSequence}`
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

    // Create work order
    const { data: workOrder, error: createError } = await supabaseAdmin
      .from('work_orders')
      .insert({
        org_id: orgId,
        wo_number: woNumber,
        product_id: input.product_id,
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
        machines:production_line_id (id, code, name)
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
        machines:production_line_id (id, code, name)
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
        machines:production_line_id (id, code, name)
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
        machines:production_line_id (id, code, name)
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
