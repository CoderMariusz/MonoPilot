/**
 * Transfer Order Core Service
 * Story 03.8 - Refactor
 *
 * Core CRUD operations for Transfer Orders (Story 3.6)
 * Extracted from transfer-order-service.ts to improve maintainability
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import type {
  TransferOrder,
  CreateTransferOrderInput,
  UpdateTransferOrderInput,
  TransferOrderFilters,
  ChangeToStatusInput,
} from '@/lib/validation/transfer-order-schemas'
import type { ServiceResult, ListResult, UserData } from './types'
import {
  getCurrentOrgId,
  getCurrentUserId,
  getCurrentUserData,
  validateRole,
  generateToNumber,
  enrichWithWarehouses,
} from './helpers'
import { ErrorCode, EDITABLE_STATUSES, DRAFT_ONLY_STATUSES } from './constants'
import { validateTransition, type TOStatus } from './state-machine'

// ============================================================================
// LIST TRANSFER ORDERS
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

    // Build query
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

    // Enrich with warehouse info
    const enriched = data && data.length > 0
      ? await enrichWithWarehouses(data)
      : data || []

    return {
      success: true,
      data: Array.isArray(enriched) ? enriched : [enriched],
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

// ============================================================================
// GET TRANSFER ORDER BY ID
// ============================================================================

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
        code: ErrorCode.INVALID_INPUT,
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch transfer order with lines
    const { data, error } = await supabaseAdmin
      .from('transfer_orders')
      .select(
        `
        *,
        lines:transfer_order_lines(
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
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(data)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in getTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// CREATE TRANSFER ORDER
// ============================================================================

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
        code: ErrorCode.INVALID_INPUT,
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
          code: ErrorCode.DUPLICATE_TO_NUMBER,
        }
      }

      return {
        success: false,
        error: 'Failed to create transfer order',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(data)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in createTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// UPDATE TRANSFER ORDER
// ============================================================================

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
        code: ErrorCode.INVALID_INPUT,
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
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Only draft/planned TOs can be edited
    if (!EDITABLE_STATUSES.includes(existingTo.status as any)) {
      return {
        success: false,
        error: 'Only draft or planned Transfer Orders can be edited',
        code: ErrorCode.INVALID_STATUS,
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
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(data)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in updateTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// DELETE TRANSFER ORDER
// ============================================================================

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
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Only draft TOs can be deleted
    if (!DRAFT_ONLY_STATUSES.includes(existingTo.status as any)) {
      return {
        success: false,
        error: 'Only draft Transfer Orders can be deleted',
        code: ErrorCode.INVALID_STATUS,
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
        code: ErrorCode.DATABASE_ERROR,
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
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// CHANGE TRANSFER ORDER STATUS
// ============================================================================

/**
 * Change Transfer Order Status
 * AC-3.6.7: Change TO status to 'planned', 'shipped', 'received', or 'cancelled'
 *
 * Validation Rules:
 * - Only users with Warehouse role or higher can change status
 * - Cannot change status to 'planned' if TO has 0 lines
 * - Draft -> Planned requires at least 1 line
 * - Status transitions must follow valid workflow (enforced by state-machine.ts)
 *
 * Refactored: Uses state-machine module for transition validation
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
        code: ErrorCode.INVALID_INPUT,
      }
    }

    // Check role authorization (AC-3.6.7 requirement)
    if (!validateRole(userData.role)) {
      return {
        success: false,
        error: 'Forbidden: Warehouse role or higher required',
        code: ErrorCode.INVALID_STATUS,
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
        transfer_order_lines(id)
      `)
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Validate status transition using state machine
    const transitionResult = validateTransition(existingTo.status as TOStatus, status as TOStatus)
    if (!transitionResult.valid) {
      return {
        success: false,
        error: transitionResult.error!,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Validate: Cannot plan TO without lines (AC-3.7.8)
    if (status === 'planned' && (!existingTo.transfer_order_lines || existingTo.transfer_order_lines.length === 0)) {
      return {
        success: false,
        error: 'Cannot plan Transfer Order without lines. Add at least one product.',
        code: ErrorCode.INVALID_STATUS,
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
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(updatedTo)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in changeToStatus:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// APPROVAL WORKFLOW FUNCTIONS (Story 03.8 Extended)
// ============================================================================

/**
 * Request approval for a Transfer Order
 * Transitions: draft -> pending_approval
 */
export async function requestToApproval(
  id: string
): Promise<ServiceResult<TransferOrder>> {
  try {
    const userData = await getCurrentUserData()

    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: ErrorCode.INVALID_INPUT,
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get current TO
    const { data: existingTo, error: fetchError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status, transfer_order_lines(id)')
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Validate transition
    const { canTransition } = await import('./state-machine')
    if (!canTransition(existingTo.status as any, 'pending_approval')) {
      return {
        success: false,
        error: `Cannot request approval for TO with status: ${existingTo.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Validate: TO must have lines
    if (!existingTo.transfer_order_lines || existingTo.transfer_order_lines.length === 0) {
      return {
        success: false,
        error: 'Cannot request approval for TO without lines. Add at least one product.',
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Update status to pending_approval
    const { data: updatedTo, error: updateError } = await supabaseAdmin
      .from('transfer_orders')
      .update({
        status: 'pending_approval',
        updated_by: userData.userId,
      })
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error requesting TO approval:', updateError)
      return {
        success: false,
        error: 'Failed to request approval',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(updatedTo)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in requestToApproval:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

/**
 * Approve a Transfer Order
 * Transitions: pending_approval -> approved
 */
export async function approveTransferOrder(
  id: string,
  notes?: string
): Promise<ServiceResult<TransferOrder>> {
  try {
    const userData = await getCurrentUserData()

    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: ErrorCode.INVALID_INPUT,
      }
    }

    // Check role authorization - only ADMIN or WH_MANAGER can approve
    if (!['admin', 'warehouse_manager', 'purchasing_manager'].includes(userData.role.toLowerCase())) {
      return {
        success: false,
        error: 'Forbidden: Manager role or higher required to approve',
        code: ErrorCode.INVALID_STATUS,
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get current TO
    const { data: existingTo, error: fetchError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Validate transition
    const { canTransition } = await import('./state-machine')
    if (!canTransition(existingTo.status as any, 'approved')) {
      return {
        success: false,
        error: `Cannot approve TO with status: ${existingTo.status}. Must be pending_approval.`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Update status to approved
    const { data: updatedTo, error: updateError } = await supabaseAdmin
      .from('transfer_orders')
      .update({
        status: 'approved',
        approved_by: userData.userId,
        approval_date: new Date().toISOString(),
        approval_notes: notes,
        updated_by: userData.userId,
      })
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error approving TO:', updateError)
      return {
        success: false,
        error: 'Failed to approve Transfer Order',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(updatedTo)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in approveTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

/**
 * Reject a Transfer Order
 * Transitions: pending_approval -> rejected
 */
export async function rejectTransferOrder(
  id: string,
  rejectionReason: string
): Promise<ServiceResult<TransferOrder>> {
  try {
    const userData = await getCurrentUserData()

    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: ErrorCode.INVALID_INPUT,
      }
    }

    // Check role authorization
    if (!['admin', 'warehouse_manager', 'purchasing_manager'].includes(userData.role.toLowerCase())) {
      return {
        success: false,
        error: 'Forbidden: Manager role or higher required to reject',
        code: ErrorCode.INVALID_STATUS,
      }
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return {
        success: false,
        error: 'Rejection reason is required',
        code: ErrorCode.INVALID_INPUT,
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get current TO
    const { data: existingTo, error: fetchError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .single()

    if (fetchError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Validate transition
    const { canTransition } = await import('./state-machine')
    if (!canTransition(existingTo.status as any, 'rejected')) {
      return {
        success: false,
        error: `Cannot reject TO with status: ${existingTo.status}. Must be pending_approval.`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Update status to rejected
    const { data: updatedTo, error: updateError } = await supabaseAdmin
      .from('transfer_orders')
      .update({
        status: 'rejected',
        rejected_by: userData.userId,
        rejection_date: new Date().toISOString(),
        rejection_reason: rejectionReason,
        updated_by: userData.userId,
      })
      .eq('id', id)
      .eq('org_id', userData.orgId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error rejecting TO:', updateError)
      return {
        success: false,
        error: 'Failed to reject Transfer Order',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(updatedTo)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in rejectTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}
