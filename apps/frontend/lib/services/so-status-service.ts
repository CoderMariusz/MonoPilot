/**
 * SO Status Service
 * Story: 07.3 - SO Status Workflow (Hold/Cancel/Confirm)
 *
 * Provides business logic for sales order status operations:
 * - holdOrder() - Put sales order on hold
 * - cancelOrder() - Cancel sales order
 * - confirmOrder() - Confirm sales order (release from hold)
 * - validateTransition() - Validate status transitions
 * - appendStatusNote() - Append status change note with timestamp
 */

import { createClient } from '@/lib/supabase/client'
import {
  SalesOrderStatus,
  STATUS_TRANSITIONS,
  STATUS_CONFIG,
} from '@/lib/validation/so-status-schemas'

// ============================================================================
// Types
// ============================================================================

export interface SalesOrder {
  id: string
  org_id: string
  order_number: string
  so_number?: string
  status: SalesOrderStatus
  customer_id: string
  notes: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

export interface StatusChangeResult {
  success: boolean
  data?: SalesOrder
  error?: string
  code?: 'NOT_FOUND' | 'INVALID_STATUS' | 'VALIDATION_ERROR' | 'DATABASE_ERROR'
}

// ============================================================================
// SO Status Service
// ============================================================================

export class SOStatusService {
  /**
   * Validate if a status transition is allowed
   * Uses the STATUS_TRANSITIONS map from the schema
   *
   * @param from - Current status
   * @param to - Target status
   * @returns true if transition is valid, false otherwise
   */
  static validateTransition(from: SalesOrderStatus, to: SalesOrderStatus): boolean {
    const allowedTransitions = STATUS_TRANSITIONS[from]
    return allowedTransitions?.includes(to) ?? false
  }

  /**
   * Get the error message for an invalid hold transition
   *
   * @param currentStatus - Current status of the order
   * @returns Error message
   */
  static getHoldErrorMessage(currentStatus: SalesOrderStatus): string {
    if (currentStatus === 'cancelled') {
      return 'Cannot hold a cancelled order'
    }
    if (currentStatus === 'on_hold') {
      return 'Order is already on hold'
    }
    return 'Cannot hold order after allocation has started'
  }

  /**
   * Get the error message for an invalid cancel transition
   *
   * @param currentStatus - Current status of the order
   * @returns Error message
   */
  static getCancelErrorMessage(currentStatus: SalesOrderStatus): string {
    if (currentStatus === 'cancelled') {
      return 'Order is already cancelled'
    }
    return 'Cannot cancel order after picking has started. Please contact warehouse manager.'
  }

  /**
   * Get the error message for an invalid confirm transition
   *
   * @param currentStatus - Current status of the order
   * @returns Error message
   */
  static getConfirmErrorMessage(currentStatus: SalesOrderStatus): string {
    if (currentStatus === 'cancelled') {
      return 'Cannot confirm a cancelled order'
    }
    if (currentStatus === 'confirmed') {
      return 'Order is already confirmed'
    }
    return 'Order has already progressed beyond confirmed status'
  }

  /**
   * Append a status note with timestamp to existing notes
   *
   * @param existingNotes - Current notes (can be null or empty)
   * @param action - Action type (HOLD, CANCELLED, CONFIRMED)
   * @param reason - Reason for the action
   * @returns New notes string with appended status note
   */
  static appendStatusNote(
    existingNotes: string | null,
    action: 'HOLD' | 'CANCELLED' | 'CONFIRMED',
    reason?: string
  ): string {
    const timestamp = new Date().toISOString()
    const statusNote = reason
      ? `[${action} - ${timestamp}] ${reason}`
      : `[${action} - ${timestamp}]`

    if (!existingNotes || existingNotes.trim() === '') {
      return statusNote
    }

    return `${existingNotes}\n${statusNote}`
  }

  /**
   * Put a sales order on hold
   * Valid from: draft, confirmed
   * Invalid from: allocated, picking, packing, shipped, delivered, cancelled, on_hold
   *
   * @param orderId - Sales order ID
   * @param reason - Optional reason for hold
   * @param orgId - Organization ID for RLS verification
   * @returns StatusChangeResult
   */
  static async holdOrder(
    orderId: string,
    reason?: string,
    orgId?: string
  ): Promise<StatusChangeResult> {
    const supabase = createClient()

    // Fetch the current order
    let query = supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    const { data: order, error: fetchError } = await query.single()

    if (fetchError || !order) {
      return {
        success: false,
        error: 'Sales order not found',
        code: 'NOT_FOUND',
      }
    }

    const currentStatus = order.status as SalesOrderStatus

    // Validate the transition
    if (!this.validateTransition(currentStatus, 'on_hold')) {
      return {
        success: false,
        error: this.getHoldErrorMessage(currentStatus),
        code: 'INVALID_STATUS',
      }
    }

    // Prepare update data
    const updateData: {
      status: string
      updated_at: string
      notes?: string
    } = {
      status: 'on_hold',
      updated_at: new Date().toISOString(),
    }

    // Only append notes if reason is provided
    if (reason && reason.trim() !== '') {
      updateData.notes = this.appendStatusNote(order.notes, 'HOLD', reason)
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: updatedOrder as SalesOrder,
    }
  }

  /**
   * Cancel a sales order
   * Valid from: draft, confirmed, on_hold, allocated
   * Invalid from: picking, packing, shipped, delivered, cancelled
   *
   * @param orderId - Sales order ID
   * @param reason - Required reason for cancellation
   * @param orgId - Organization ID for RLS verification
   * @returns StatusChangeResult
   */
  static async cancelOrder(
    orderId: string,
    reason: string,
    orgId?: string
  ): Promise<StatusChangeResult> {
    // Validate reason
    if (!reason || reason.trim() === '') {
      return {
        success: false,
        error: 'Cancel reason is required',
        code: 'VALIDATION_ERROR',
      }
    }

    const trimmedReason = reason.trim()
    if (trimmedReason.length < 10) {
      return {
        success: false,
        error: 'Reason must be at least 10 characters',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = createClient()

    // Fetch the current order
    let query = supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    const { data: order, error: fetchError } = await query.single()

    if (fetchError || !order) {
      return {
        success: false,
        error: 'Sales order not found',
        code: 'NOT_FOUND',
      }
    }

    const currentStatus = order.status as SalesOrderStatus

    // Validate the transition
    if (!this.validateTransition(currentStatus, 'cancelled')) {
      return {
        success: false,
        error: this.getCancelErrorMessage(currentStatus),
        code: 'INVALID_STATUS',
      }
    }

    // Prepare update data
    const updateData = {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      notes: this.appendStatusNote(order.notes, 'CANCELLED', trimmedReason),
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: updatedOrder as SalesOrder,
    }
  }

  /**
   * Confirm a sales order (or release from hold)
   * Valid from: draft, on_hold
   * Invalid from: confirmed, allocated, picking, packing, shipped, delivered, cancelled
   *
   * @param orderId - Sales order ID
   * @param orgId - Organization ID for RLS verification
   * @returns StatusChangeResult
   */
  static async confirmOrder(
    orderId: string,
    orgId?: string
  ): Promise<StatusChangeResult> {
    const supabase = createClient()

    // Fetch the current order
    let query = supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    const { data: order, error: fetchError } = await query.single()

    if (fetchError || !order) {
      return {
        success: false,
        error: 'Sales order not found',
        code: 'NOT_FOUND',
      }
    }

    const currentStatus = order.status as SalesOrderStatus

    // Validate the transition
    if (!this.validateTransition(currentStatus, 'confirmed')) {
      return {
        success: false,
        error: this.getConfirmErrorMessage(currentStatus),
        code: 'INVALID_STATUS',
      }
    }

    const now = new Date().toISOString()

    // Prepare update data
    const updateData: {
      status: string
      updated_at: string
      confirmed_at: string
    } = {
      status: 'confirmed',
      updated_at: now,
      confirmed_at: now,
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: updatedOrder as SalesOrder,
    }
  }

  /**
   * Check if an order can be held
   *
   * @param status - Current status
   * @returns true if order can be held
   */
  static canHold(status: SalesOrderStatus): boolean {
    return STATUS_CONFIG[status]?.allowsHold ?? false
  }

  /**
   * Check if an order can be cancelled
   *
   * @param status - Current status
   * @returns true if order can be cancelled
   */
  static canCancel(status: SalesOrderStatus): boolean {
    return STATUS_CONFIG[status]?.allowsCancel ?? false
  }

  /**
   * Check if an order can be confirmed
   *
   * @param status - Current status
   * @returns true if order can be confirmed
   */
  static canConfirm(status: SalesOrderStatus): boolean {
    return status === 'draft' || status === 'on_hold'
  }
}

export default SOStatusService
