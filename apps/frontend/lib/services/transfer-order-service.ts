import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import {
  type TransferOrder,
  type ToLine,
  type ToLineLp,
  type CreateTransferOrderInput,
  type UpdateTransferOrderInput,
  type ChangeToStatusInput,
  type CreateToLineInput,
  type UpdateToLineInput,
  type ShipToInput,
  type SelectLpsInput,
  type TransferOrderFilters,
} from '@/lib/validation/transfer-order-schemas'

/**
 * Transfer Order Service
 * Epic 3 Batch 3B: Transfer Orders
 * Stories: 3.6, 3.7, 3.8, 3.9
 *
 * Handles Transfer Order CRUD operations with:
 * - Auto-generated TO numbers (TO-YYYY-NNN format)
 * - Warehouse validation (from ≠ to)
 * - Date validation (receive >= ship)
 * - Partial shipment tracking
 * - Optional LP selection
 * - Multi-org RLS isolation
 */

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?:
    | 'DUPLICATE_TO_NUMBER'
    | 'NOT_FOUND'
    | 'INVALID_INPUT'
    | 'INVALID_STATUS'
    | 'INVALID_QUANTITY'
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
 * Get current user's org_id and role from JWT
 * AC-3.6.7: Role-based authorization for Transfer Orders
 */
async function getCurrentUserData(): Promise<{ orgId: string; role: string; userId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    console.error('Failed to get user data:', user.id, error)
    return null
  }

  return {
    orgId: userData.org_id,
    role: userData.role,
    userId: user.id
  }
}

/**
 * Get current user's org_id from JWT (legacy function, kept for backward compatibility)
 */
async function getCurrentOrgId(): Promise<string | null> {
  const userData = await getCurrentUserData()
  return userData?.orgId || null
}

/**
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const userData = await getCurrentUserData()
  return userData?.userId || null
}

/**
 * Validate user role for Transfer Order operations
 * Allowed roles: warehouse, purchasing, technical, admin
 */
function validateRole(role: string): boolean {
  const allowedRoles = ['warehouse', 'purchasing', 'technical', 'admin']
  return allowedRoles.includes(role.toLowerCase())
}

/**
 * Generate next TO number in format: TO-YYYY-NNN
 * Resets sequence each year
 */
async function generateToNumber(orgId: string): Promise<string> {
  const supabaseAdmin = createServerSupabaseAdmin()
  const currentYear = new Date().getFullYear()
  const prefix = `TO-${currentYear}-`

  // Find highest number for current year
  const { data: existingTos, error } = await supabaseAdmin
    .from('transfer_orders')
    .select('to_number')
    .eq('org_id', orgId)
    .like('to_number', `${prefix}%`)
    .order('to_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error generating TO number:', error)
    throw new Error('Failed to generate TO number')
  }

  let nextNumber = 1
  if (existingTos && existingTos.length > 0) {
    const lastNumber = existingTos[0].to_number
    const numberPart = parseInt(lastNumber.split('-')[2], 10)
    nextNumber = numberPart + 1
  }

  // Pad to 3 digits (e.g., 001, 002, ...)
  const paddedNumber = nextNumber.toString().padStart(3, '0')
  return `${prefix}${paddedNumber}`
}

/**
 * Calculate Transfer Order status based on line quantities
 * Logic:
 * - draft: No lines or all lines have shipped_qty = 0
 * - planned: Status manually set, not yet shipped
 * - partially_shipped: Some lines shipped but not all fully shipped
 * - shipped: All lines fully shipped (shipped_qty >= quantity)
 * - partially_received: Some lines received but not all fully received
 * - received: All lines fully received (received_qty >= shipped_qty)
 * - cancelled: Manual status
 */
async function calculateToStatus(transferOrderId: string): Promise<string> {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data: lines, error } = await supabaseAdmin
    .from('to_lines')
    .select('quantity, shipped_qty, received_qty')
    .eq('transfer_order_id', transferOrderId)

  if (error || !lines || lines.length === 0) {
    return 'draft'
  }

  const allFullyShipped = lines.every((line) => line.shipped_qty >= line.quantity)
  const someShipped = lines.some((line) => line.shipped_qty > 0)
  const allFullyReceived = lines.every((line) => line.received_qty >= line.shipped_qty)
  const someReceived = lines.some((line) => line.received_qty > 0)

  if (allFullyReceived) return 'received'
  if (someReceived) return 'partially_received'
  if (allFullyShipped) return 'shipped'
  if (someShipped) return 'partially_shipped'

  return 'planned'
}

// ============================================================================
// Transfer Order CRUD Operations (Story 3.6)
// ============================================================================

/**
 * List Transfer Orders with filters and sorting
 */
export async function listTransferOrders(
  filters: TransferOrderFilters
): Promise<ListResult<TransferOrder>> {
  try {
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch transfer orders without warehouse join (FK hint not working)
    let query = supabaseAdmin
      .from('transfer_orders')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply filters
    if (filters.search) {
      query = query.or(`to_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.from_warehouse_id) {
      query = query.eq('from_warehouse_id', filters.from_warehouse_id)
    }

    if (filters.to_warehouse_id) {
      query = query.eq('to_warehouse_id', filters.to_warehouse_id)
    }

    if (filters.date_from) {
      query = query.gte('planned_ship_date', filters.date_from.toISOString().split('T')[0])
    }

    if (filters.date_to) {
      query = query.lte('planned_ship_date', filters.date_to.toISOString().split('T')[0])
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at'
    const sortDirection = filters.sort_direction || 'desc'
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    const { data, error, count } = await query

    if (error) {
      console.error('Error listing transfer orders:', error)
      return {
        success: false,
        error: 'Failed to fetch transfer orders',
      }
    }

    // Fetch warehouses separately and merge
    if (data && data.length > 0) {
      const warehouseIds = [
        ...new Set([
          ...data.map((to: any) => to.from_warehouse_id),
          ...data.map((to: any) => to.to_warehouse_id),
        ]),
      ].filter(Boolean)

      const { data: warehouses } = await supabaseAdmin
        .from('warehouses')
        .select('id, code, name')
        .in('id', warehouseIds)

      const warehouseMap = new Map(
        warehouses?.map((w: any) => [w.id, { code: w.code, name: w.name }]) || []
      )

      // Add warehouse info to transfer orders
      const enrichedData = data.map((to: any) => ({
        ...to,
        from_warehouse: warehouseMap.get(to.from_warehouse_id) || null,
        to_warehouse: warehouseMap.get(to.to_warehouse_id) || null,
      }))

      return {
        success: true,
        data: enrichedData,
        total: count || 0,
      }
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('Error in listTransferOrders:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

/**
 * Get single Transfer Order by ID with lines
 */
export async function getTransferOrder(id: string): Promise<ServiceResult<TransferOrder>> {
  try {
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch transfer order
    const { data, error } = await supabaseAdmin
      .from('transfer_orders')
      .select(
        `
        *,
        lines:to_lines(
          *,
          product:products(code, name)
        )
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    // Fetch warehouses separately
    const warehouseIds = [data.from_warehouse_id, data.to_warehouse_id].filter(Boolean)
    const { data: warehouses } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .in('id', warehouseIds)

    const warehouseMap = new Map(
      warehouses?.map((w: any) => [w.id, { code: w.code, name: w.name }]) || []
    )

    const enrichedData = {
      ...data,
      from_warehouse: warehouseMap.get(data.from_warehouse_id) || null,
      to_warehouse: warehouseMap.get(data.to_warehouse_id) || null,
    }

    return {
      success: true,
      data: enrichedData,
    }
  } catch (error) {
    console.error('Error in getTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Create new Transfer Order
 * Auto-generates TO number in format: TO-YYYY-NNN
 */
export async function createTransferOrder(
  input: CreateTransferOrderInput
): Promise<ServiceResult<TransferOrder>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()
    const userId = await getCurrentUserId()

    if (!orgId || !userId) {
      return {
        success: false,
        error: 'Organization ID or User ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Generate TO number
    const toNumber = await generateToNumber(orgId)

    // Create transfer order
    const { data, error } = await supabaseAdmin
      .from('transfer_orders')
      .insert({
        org_id: orgId,
        to_number: toNumber,
        from_warehouse_id: input.from_warehouse_id,
        to_warehouse_id: input.to_warehouse_id,
        planned_ship_date: input.planned_ship_date,
        planned_receive_date: input.planned_receive_date,
        notes: input.notes || null,
        status: 'draft',
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating transfer order:', error)

      // Check for duplicate TO number (should be rare due to transaction)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Transfer Order number already exists',
          code: 'DUPLICATE_TO_NUMBER',
        }
      }

      return {
        success: false,
        error: 'Failed to create transfer order',
        code: 'DATABASE_ERROR',
      }
    }

    // Fetch warehouses separately
    const warehouseIds = [data.from_warehouse_id, data.to_warehouse_id].filter(Boolean)
    const { data: warehouses } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .in('id', warehouseIds)

    const warehouseMap = new Map(
      warehouses?.map((w: any) => [w.id, { code: w.code, name: w.name }]) || []
    )

    const enrichedData = {
      ...data,
      from_warehouse: warehouseMap.get(data.from_warehouse_id) || null,
      to_warehouse: warehouseMap.get(data.to_warehouse_id) || null,
    }

    return {
      success: true,
      data: enrichedData,
    }
  } catch (error) {
    console.error('Error in createTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update Transfer Order
 * Only draft/planned TOs can be edited
 */
export async function updateTransferOrder(
  id: string,
  input: UpdateTransferOrderInput
): Promise<ServiceResult<TransferOrder>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()
    const userId = await getCurrentUserId()

    if (!userId) {
      return {
        success: false,
        error: 'User ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Check if TO exists and is editable
    const { data: existingTo, error: fetchError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    // Only draft/planned TOs can be edited
    if (!['draft', 'planned'].includes(existingTo.status)) {
      return {
        success: false,
        error: 'Only draft or planned Transfer Orders can be edited',
        code: 'INVALID_STATUS',
      }
    }

    // Update transfer order
    const { data, error } = await supabaseAdmin
      .from('transfer_orders')
      .update({
        ...input,
        updated_by: userId,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating transfer order:', error)
      return {
        success: false,
        error: 'Failed to update transfer order',
        code: 'DATABASE_ERROR',
      }
    }

    // Fetch warehouses separately
    const warehouseIds = [data.from_warehouse_id, data.to_warehouse_id].filter(Boolean)
    const { data: warehouses } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .in('id', warehouseIds)

    const warehouseMap = new Map(
      warehouses?.map((w: any) => [w.id, { code: w.code, name: w.name }]) || []
    )

    const enrichedData = {
      ...data,
      from_warehouse: warehouseMap.get(data.from_warehouse_id) || null,
      to_warehouse: warehouseMap.get(data.to_warehouse_id) || null,
    }

    return {
      success: true,
      data: enrichedData,
    }
  } catch (error) {
    console.error('Error in updateTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Delete Transfer Order
 * Only draft TOs can be deleted (cascade deletes lines and LP selections)
 */
export async function deleteTransferOrder(id: string): Promise<ServiceResult<void>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if TO exists and is deletable
    const { data: existingTo, error: fetchError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    // Only draft TOs can be deleted
    if (existingTo.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft Transfer Orders can be deleted',
        code: 'INVALID_STATUS',
      }
    }

    // Delete transfer order (cascade deletes lines and LP selections)
    const { error } = await supabaseAdmin
      .from('transfer_orders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting transfer order:', error)
      return {
        success: false,
        error: 'Failed to delete transfer order',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Change Transfer Order Status
 * AC-3.6.7: Change TO status to 'planned', 'shipped', 'received', or 'cancelled'
 *
 * Validation Rules:
 * - Only users with Warehouse role or higher can change status
 * - Cannot change status to 'planned' if TO has 0 lines
 * - Draft → Planned requires at least 1 line
 */
export async function changeToStatus(
  id: string,
  status: 'planned' | 'shipped' | 'received' | 'cancelled'
): Promise<ServiceResult<TransferOrder>> {
  try {
    const userData = await getCurrentUserData()

    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: 'INVALID_INPUT',
      }
    }

    // Check role authorization (AC-3.6.7 requirement)
    if (!validateRole(userData.role)) {
      return {
        success: false,
        error: 'Forbidden: Warehouse role or higher required',
        code: 'INVALID_STATUS',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get current TO with line count
    const { data: existingTo, error: fetchError } = await supabaseAdmin
      .from('transfer_orders')
      .select(`
        id,
        status,
        org_id,
        to_lines(id)
      `)
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    // Validate: Cannot plan TO without lines (AC-3.7.8)
    if (status === 'planned' && (!existingTo.to_lines || existingTo.to_lines.length === 0)) {
      return {
        success: false,
        error: 'Cannot plan Transfer Order without lines. Add at least one product.',
        code: 'INVALID_STATUS',
      }
    }

    // Update status
    const { data: updatedTo, error: updateError } = await supabaseAdmin
      .from('transfer_orders')
      .update({
        status,
        updated_by: userData.userId,
      })
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error changing TO status:', updateError)
      return {
        success: false,
        error: 'Failed to change Transfer Order status',
        code: 'DATABASE_ERROR',
      }
    }

    // Fetch warehouses separately
    const warehouseIds = [updatedTo.from_warehouse_id, updatedTo.to_warehouse_id].filter(Boolean)
    const { data: warehouses } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .in('id', warehouseIds)

    const warehouseMap = new Map(
      warehouses?.map((w: any) => [w.id, { code: w.code, name: w.name }]) || []
    )

    const enrichedData = {
      ...updatedTo,
      from_warehouse: warehouseMap.get(updatedTo.from_warehouse_id) || null,
      to_warehouse: warehouseMap.get(updatedTo.to_warehouse_id) || null,
    }

    return {
      success: true,
      data: enrichedData as TransferOrder,
    }
  } catch (error) {
    console.error('Error in changeToStatus:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// TO Line Operations (Story 3.7)
// ============================================================================

/**
 * Get all lines for a Transfer Order
 */
export async function getToLines(transferOrderId: string): Promise<ListResult<ToLine>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('to_lines')
      .select(
        `
        *,
        product:products(code, name)
      `
      )
      .eq('transfer_order_id', transferOrderId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error listing TO lines:', error)
      return {
        success: false,
        error: 'Failed to fetch TO lines',
      }
    }

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    }
  } catch (error) {
    console.error('Error in getToLines:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

/**
 * Create TO Line
 * UoM inherited from product
 */
export async function createToLine(
  transferOrderId: string,
  input: CreateToLineInput,
  userId: string
): Promise<ServiceResult<ToLine>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if TO exists and is editable
    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', transferOrderId)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!['draft', 'planned'].includes(existingTo.status)) {
      return {
        success: false,
        error: 'Cannot add lines to Transfer Order with status: ' + existingTo.status,
        code: 'INVALID_STATUS',
      }
    }

    // Get product UoM
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('uom')
      .eq('id', input.product_id)
      .single()

    if (productError || !product) {
      return {
        success: false,
        error: 'Product not found',
        code: 'NOT_FOUND',
      }
    }

    // Create TO line
    const { data, error } = await supabaseAdmin
      .from('to_lines')
      .insert({
        transfer_order_id: transferOrderId,
        product_id: input.product_id,
        quantity: input.quantity,
        uom: product.uom,
        shipped_qty: 0,
        received_qty: 0,
        notes: input.notes || null,
        created_by: userId,
        updated_by: userId,
      })
      .select(
        `
        *,
        product:products(code, name)
      `
      )
      .single()

    if (error) {
      console.error('Error creating TO line:', error)
      return {
        success: false,
        error: 'Failed to create TO line',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in createToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update TO Line
 * Only draft/planned TOs allow line updates
 */
export async function updateToLine(
  lineId: string,
  input: UpdateToLineInput,
  userId: string
): Promise<ServiceResult<ToLine>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if line exists and TO is editable
    const { data: existingLine, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('transfer_order_id')
      .eq('id', lineId)
      .single()

    if (lineError || !existingLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: 'NOT_FOUND',
      }
    }

    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', existingLine.transfer_order_id)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!['draft', 'planned'].includes(existingTo.status)) {
      return {
        success: false,
        error: 'Cannot update lines for Transfer Order with status: ' + existingTo.status,
        code: 'INVALID_STATUS',
      }
    }

    // Update TO line (add audit trail)
    const { data, error } = await supabaseAdmin
      .from('to_lines')
      .update({
        ...input,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lineId)
      .select(
        `
        *,
        product:products(code, name)
      `
      )
      .single()

    if (error) {
      console.error('Error updating TO line:', error)
      return {
        success: false,
        error: 'Failed to update TO line',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in updateToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Delete TO Line
 * Only draft/planned TOs allow line deletion
 */
export async function deleteToLine(lineId: string): Promise<ServiceResult<void>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if line exists and TO is editable
    const { data: existingLine, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('transfer_order_id')
      .eq('id', lineId)
      .single()

    if (lineError || !existingLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: 'NOT_FOUND',
      }
    }

    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', existingLine.transfer_order_id)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!['draft', 'planned'].includes(existingTo.status)) {
      return {
        success: false,
        error: 'Cannot delete lines from Transfer Order with status: ' + existingTo.status,
        code: 'INVALID_STATUS',
      }
    }

    // Delete TO line (cascade deletes LP selections)
    const { error } = await supabaseAdmin
      .from('to_lines')
      .delete()
      .eq('id', lineId)

    if (error) {
      console.error('Error deleting TO line:', error)
      return {
        success: false,
        error: 'Failed to delete TO line',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// Partial Shipment Operations (Story 3.8)
// ============================================================================

/**
 * Ship Transfer Order (partial or full)
 * Updates shipped_qty cumulatively
 * Sets actual_ship_date on FIRST shipment only (immutable)
 * Automatically updates TO status based on line quantities
 */
export async function shipTransferOrder(
  transferOrderId: string,
  input: ShipToInput,
  userId: string
): Promise<ServiceResult<TransferOrder>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if TO exists and is shippable
    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status, actual_ship_date')
      .eq('id', transferOrderId)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    if (['cancelled', 'received'].includes(existingTo.status)) {
      return {
        success: false,
        error: 'Cannot ship Transfer Order with status: ' + existingTo.status,
        code: 'INVALID_STATUS',
      }
    }

    // Get all TO lines to validate ship quantities
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('to_lines')
      .select('id, quantity, shipped_qty')
      .eq('transfer_order_id', transferOrderId)

    if (linesError || !lines) {
      return {
        success: false,
        error: 'Failed to fetch TO lines',
        code: 'DATABASE_ERROR',
      }
    }

    // Validate ship quantities
    for (const lineItem of input.line_items) {
      const line = lines.find((l) => l.id === lineItem.to_line_id)
      if (!line) {
        return {
          success: false,
          error: `TO line ${lineItem.to_line_id} not found`,
          code: 'NOT_FOUND',
        }
      }

      const newShippedQty = line.shipped_qty + lineItem.ship_qty
      if (newShippedQty > line.quantity) {
        return {
          success: false,
          error: `Ship quantity exceeds remaining quantity for line ${lineItem.to_line_id}`,
          code: 'INVALID_QUANTITY',
        }
      }
    }

    // Update shipped_qty for each line (cumulative)
    for (const lineItem of input.line_items) {
      const line = lines.find((l) => l.id === lineItem.to_line_id)!
      const newShippedQty = line.shipped_qty + lineItem.ship_qty

      const { error: updateError } = await supabaseAdmin
        .from('to_lines')
        .update({
          shipped_qty: newShippedQty,
        })
        .eq('id', lineItem.to_line_id)

      if (updateError) {
        console.error('Error updating TO line shipped_qty:', updateError)
        return {
          success: false,
          error: 'Failed to update TO line',
          code: 'DATABASE_ERROR',
        }
      }
    }

    // Set actual_ship_date on FIRST shipment only (immutable)
    const updateData: any = {}
    if (!existingTo.actual_ship_date) {
      updateData.actual_ship_date = input.actual_ship_date || new Date().toISOString().split('T')[0]
    }

    // Calculate and update status
    const newStatus = await calculateToStatus(transferOrderId)
    updateData.status = newStatus

    // Update transfer order
    const { data, error } = await supabaseAdmin
      .from('transfer_orders')
      .update(updateData)
      .eq('id', transferOrderId)
      .select(
        `
        *,
        lines:to_lines(
          *,
          product:products(code, name)
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating transfer order after shipment:', error)
      return {
        success: false,
        error: 'Failed to update transfer order',
        code: 'DATABASE_ERROR',
      }
    }

    // Fetch warehouses separately
    const warehouseIds = [data.from_warehouse_id, data.to_warehouse_id].filter(Boolean)
    const { data: warehouses } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .in('id', warehouseIds)

    const warehouseMap = new Map(
      warehouses?.map((w: any) => [w.id, { code: w.code, name: w.name }]) || []
    )

    const enrichedData = {
      ...data,
      from_warehouse: warehouseMap.get(data.from_warehouse_id) || null,
      to_warehouse: warehouseMap.get(data.to_warehouse_id) || null,
    }

    return {
      success: true,
      data: enrichedData,
    }
  } catch (error) {
    console.error('Error in shipTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// LP Selection Operations (Story 3.9)
// ============================================================================

/**
 * Get LP selections for a TO line
 */
export async function getToLineLps(toLineId: string): Promise<ListResult<ToLineLp>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('to_line_lps')
      .select(
        `
        *,
        license_plate:license_plates(lp_number)
      `
      )
      .eq('to_line_id', toLineId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error listing TO line LPs:', error)
      return {
        success: false,
        error: 'Failed to fetch LP selections',
      }
    }

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    }
  } catch (error) {
    console.error('Error in getToLineLps:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

/**
 * Select LPs for a TO line
 * Validates total reserved_qty <= line quantity
 */
export async function selectLpsForToLine(
  toLineId: string,
  input: SelectLpsInput
): Promise<ServiceResult<ToLineLp[]>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get TO line to validate
    const { data: line, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('quantity, transfer_order_id')
      .eq('id', toLineId)
      .single()

    if (lineError || !line) {
      return {
        success: false,
        error: 'TO line not found',
        code: 'NOT_FOUND',
      }
    }

    // Check TO status
    const { data: to, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', line.transfer_order_id)
      .single()

    if (toError || !to) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!['draft', 'planned'].includes(to.status)) {
      return {
        success: false,
        error: 'Cannot select LPs for Transfer Order with status: ' + to.status,
        code: 'INVALID_STATUS',
      }
    }

    // Validate total reserved_qty <= line quantity
    const totalReserved = input.selections.reduce((sum, s) => sum + s.reserved_qty, 0)
    if (totalReserved > line.quantity) {
      return {
        success: false,
        error: 'Total reserved quantity exceeds line quantity',
        code: 'INVALID_QUANTITY',
      }
    }

    // Insert LP selections
    const { data, error } = await supabaseAdmin
      .from('to_line_lps')
      .insert(
        input.selections.map((s) => ({
          to_line_id: toLineId,
          lp_id: s.lp_id,
          reserved_qty: s.reserved_qty,
        }))
      )
      .select(
        `
        *,
        license_plate:license_plates(lp_number)
      `
      )

    if (error) {
      console.error('Error creating LP selections:', error)

      // Check for duplicate LP
      if (error.code === '23505') {
        return {
          success: false,
          error: 'License Plate already selected for this line',
          code: 'INVALID_INPUT',
        }
      }

      return {
        success: false,
        error: 'Failed to create LP selections',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error in selectLpsForToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Delete LP selection
 */
export async function deleteToLineLp(lpSelectionId: string): Promise<ServiceResult<void>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if selection exists and TO is editable
    const { data: selection, error: selectionError } = await supabaseAdmin
      .from('to_line_lps')
      .select('to_line_id')
      .eq('id', lpSelectionId)
      .single()

    if (selectionError || !selection) {
      return {
        success: false,
        error: 'LP selection not found',
        code: 'NOT_FOUND',
      }
    }

    const { data: line, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('transfer_order_id')
      .eq('id', selection.to_line_id)
      .single()

    if (lineError || !line) {
      return {
        success: false,
        error: 'TO line not found',
        code: 'NOT_FOUND',
      }
    }

    const { data: to, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', line.transfer_order_id)
      .single()

    if (toError || !to) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!['draft', 'planned'].includes(to.status)) {
      return {
        success: false,
        error: 'Cannot delete LP selections for Transfer Order with status: ' + to.status,
        code: 'INVALID_STATUS',
      }
    }

    // Delete LP selection
    const { error } = await supabaseAdmin
      .from('to_line_lps')
      .delete()
      .eq('id', lpSelectionId)

    if (error) {
      console.error('Error deleting LP selection:', error)
      return {
        success: false,
        error: 'Failed to delete LP selection',
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteToLineLp:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}
