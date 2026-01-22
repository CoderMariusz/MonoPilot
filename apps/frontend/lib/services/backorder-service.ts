/**
 * Backorder Service
 * Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
 *
 * Handles backorder creation and tracking when allocation
 * has shortfall (allocated qty < required qty).
 *
 * Publishes backorder.created event for Planning module integration.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export interface BackorderInput {
  sales_order_line_id: string
  product_id: string
  shortfall_qty: number
  reason?: string
}

export interface Backorder {
  id: string
  org_id: string
  sales_order_line_id: string
  product_id: string
  quantity_backordered: number
  status: 'pending' | 'fulfilled' | 'cancelled'
  reason: string | null
  created_at: string
  fulfilled_at: string | null
}

export interface BackorderFilters {
  status?: 'pending' | 'fulfilled' | 'cancelled'
  product_id?: string
  from_date?: string
  to_date?: string
}

// =============================================================================
// Backorder Service
// =============================================================================

export class BackorderService {
  /**
   * Create a backorder signal for Planning module
   * AC-3: Publish backorder.created event with shortfall qty
   *
   * @param soLineId - Sales order line with shortfall
   * @param shortfallQty - Quantity that could not be allocated
   * @returns void (signal published)
   */
  static async createBackorderSignal(
    soLineId: string,
    shortfallQty: number
  ): Promise<void> {
    // TODO: Implement actual event publishing to Planning module
    // For now, just log the backorder signal
    console.log(`[BackorderService] Backorder signal created:`, {
      sales_order_line_id: soLineId,
      shortfall_qty: shortfallQty,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get backorders for an organization
   *
   * @param supabase - Supabase client
   * @param orgId - Organization ID
   * @param filters - Optional filters
   * @returns List of backorders
   */
  static async getBackorders(
    supabase: SupabaseClient,
    orgId: string,
    filters?: BackorderFilters
  ): Promise<Backorder[]> {
    let query = supabase
      .from('backorders')
      .select('*')
      .eq('org_id', orgId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id)
    }

    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date)
    }

    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch backorders: ${error.message}`)
    }

    return data || []
  }

  /**
   * Mark backorder as fulfilled
   *
   * @param supabase - Supabase client
   * @param backorderId - Backorder ID to fulfill
   * @returns void
   */
  static async fulfillBackorder(
    supabase: SupabaseClient,
    backorderId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('backorders')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', backorderId)

    if (error) {
      throw new Error(`Failed to fulfill backorder: ${error.message}`)
    }
  }

  /**
   * Create a backorder record in the database
   *
   * @param supabase - Supabase client
   * @param input - Backorder input data
   * @param orgId - Organization ID
   * @returns Created backorder
   */
  static async createBackorder(
    supabase: SupabaseClient,
    input: BackorderInput,
    orgId: string
  ): Promise<Backorder> {
    const { data, error } = await supabase
      .from('backorders')
      .insert({
        org_id: orgId,
        sales_order_line_id: input.sales_order_line_id,
        product_id: input.product_id,
        quantity_backordered: input.shortfall_qty,
        status: 'pending',
        reason: input.reason || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create backorder: ${error.message}`)
    }

    // Publish signal
    await this.createBackorderSignal(input.sales_order_line_id, input.shortfall_qty)

    return data
  }
}

export default BackorderService
