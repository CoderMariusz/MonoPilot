/**
 * Stock Adjustment Service
 * Story: WH-INV-001 - Stock Adjustment History & Approval Workflow
 * Phase: GREEN - Minimal code to pass tests
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - XSS: SAFE - React auto-escapes all rendered values.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ReasonCode,
  AdjustmentStatus,
  CreateAdjustmentInput,
  RejectAdjustmentInput,
  AdjustmentListFilters,
} from '@/lib/validation/stock-adjustment-schema'
import { StockMoveService } from './stock-move-service'

// Re-export types
export type { ReasonCode, AdjustmentStatus }

// =============================================================================
// Types
// =============================================================================

export interface StockAdjustment {
  id: string
  org_id: string
  lp_id: string
  original_qty: number
  new_qty: number
  variance: number
  variance_pct: number
  reason_code: ReasonCode
  reason_notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  adjusted_by: string
  adjustment_date: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  stock_move_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  license_plate?: {
    lp_number: string
    product?: {
      name: string
      sku: string
    }
    location?: {
      location_code: string
      name: string
    }
  }
  adjusted_by_user?: {
    name: string
    email: string
  }
  approved_by_user?: {
    name: string
    email: string
  }
}

export interface AdjustmentSummary {
  total: number
  qty_increased: number
  qty_decreased: number
  pending_approval: number
}

export interface AdjustmentListResponse {
  summary: AdjustmentSummary
  data: StockAdjustment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// =============================================================================
// Stock Adjustment Service Class
// =============================================================================

export class StockAdjustmentService {
  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  /**
   * List stock adjustments with filtering and pagination
   */
  static async list(
    supabase: SupabaseClient,
    params: Partial<AdjustmentListFilters>
  ): Promise<AdjustmentListResponse> {
    const {
      date_from,
      date_to,
      reason,
      adjusted_by,
      status = 'all',
      page = 1,
      limit = 50,
    } = params

    // Build count query
    let countQuery = supabase
      .from('stock_adjustments')
      .select('*', { count: 'exact', head: true })

    // Build data query
    let query = supabase
      .from('stock_adjustments')
      .select(`
        *,
        license_plate:license_plates(
          lp_number,
          product:products(name, sku),
          location:locations(location_code, name)
        ),
        adjusted_by_user:users!stock_adjustments_adjusted_by_fkey(name, email),
        approved_by_user:users!stock_adjustments_approved_by_fkey(name, email)
      `)

    // Apply filters to both queries
    if (date_from) {
      query = query.gte('adjustment_date', date_from)
      countQuery = countQuery.gte('adjustment_date', date_from)
    }

    if (date_to) {
      query = query.lte('adjustment_date', date_to)
      countQuery = countQuery.lte('adjustment_date', date_to)
    }

    if (reason) {
      query = query.eq('reason_code', reason)
      countQuery = countQuery.eq('reason_code', reason)
    }

    if (adjusted_by) {
      query = query.eq('adjusted_by', adjusted_by)
      countQuery = countQuery.eq('adjusted_by', adjusted_by)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
      countQuery = countQuery.eq('status', status)
    }

    // Apply sorting (default: adjustment_date DESC)
    query = query.order('adjustment_date', { ascending: false })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute queries
    const [{ data, error }, { count }] = await Promise.all([query, countQuery])

    if (error) {
      throw new Error(`Failed to fetch stock adjustments: ${error.message}`)
    }

    const total = count || 0

    // Calculate summary
    const summary = await this.calculateSummary(supabase, {
      date_from,
      date_to,
      reason,
      adjusted_by,
      status,
    })

    return {
      summary,
      data: (data || []) as StockAdjustment[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get single stock adjustment by ID
   */
  static async getById(
    supabase: SupabaseClient,
    id: string
  ): Promise<StockAdjustment | null> {
    const { data, error } = await supabase
      .from('stock_adjustments')
      .select(`
        *,
        license_plate:license_plates(
          lp_number,
          product:products(name, sku),
          location:locations(location_code, name)
        ),
        adjusted_by_user:users!stock_adjustments_adjusted_by_fkey(name, email),
        approved_by_user:users!stock_adjustments_approved_by_fkey(name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch stock adjustment: ${error.message}`)
    }

    return data as StockAdjustment
  }

  /**
   * Create stock adjustment with auto/manual approval logic
   */
  static async create(
    supabase: SupabaseClient,
    input: CreateAdjustmentInput,
    userId: string
  ): Promise<StockAdjustment> {
    // Get user's org_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    const orgId = user.org_id

    // Validate LP exists
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, quantity, location_id')
      .eq('id', input.lp_id)
      .single()

    if (lpError || !lp) {
      throw new Error('LP not found')
    }

    // Calculate variance with proper precision handling
    const original_qty = lp.quantity
    const new_qty = input.new_qty
    const variance = new_qty - original_qty
    // Round to 2 decimal places for percentage to avoid floating point precision issues
    const variance_pct = original_qty > 0 
      ? Math.round((variance / original_qty) * 10000) / 100  // Round to 2 decimal places
      : 0

    // Determine if requires approval
    const requiresApproval = this.requiresApproval(variance_pct, variance > 0)

    // Create adjustment - adjustment_date is set to NOW() by database (UTC by default)
    const { data: adjustment, error: createError } = await supabase
      .from('stock_adjustments')
      .insert({
        org_id: orgId,
        lp_id: input.lp_id,
        original_qty,
        new_qty,
        variance,
        variance_pct,
        reason_code: input.reason_code,
        reason_notes: input.reason_notes || null,
        status: requiresApproval ? 'pending' : 'approved',
        adjusted_by: userId,
        // Explicitly use UTC for timestamps
        approved_by: requiresApproval ? null : userId,
        approved_at: requiresApproval ? null : new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create stock adjustment: ${createError.message}`)
    }

    // If auto-approved, create stock_move and update LP
    if (!requiresApproval && adjustment) {
      await this.executeApprovedAdjustment(supabase, adjustment.id, userId)
    }

    // Fetch and return created adjustment
    const result = await this.getById(supabase, adjustment.id)
    if (!result) {
      throw new Error('Stock adjustment created but not found')
    }

    return result
  }

  /**
   * Approve pending adjustment
   */
  static async approve(
    supabase: SupabaseClient,
    adjustmentId: string,
    approverId: string
  ): Promise<StockAdjustment> {
    // Get existing adjustment
    const adjustment = await this.getById(supabase, adjustmentId)
    if (!adjustment) {
      throw new Error('Stock adjustment not found')
    }

    if (adjustment.status !== 'pending') {
      throw new Error(`Cannot approve adjustment with status: ${adjustment.status}`)
    }

    // Update to approved (timestamps in UTC)
    const { error } = await supabase
      .from('stock_adjustments')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),  // ISO string is always UTC
        updated_at: new Date().toISOString(),
      })
      .eq('id', adjustmentId)

    if (error) {
      throw new Error(`Failed to approve stock adjustment: ${error.message}`)
    }

    // Execute approved adjustment (create stock_move, update LP)
    await this.executeApprovedAdjustment(supabase, adjustmentId, approverId)

    // Return updated adjustment
    const result = await this.getById(supabase, adjustmentId)
    if (!result) {
      throw new Error('Stock adjustment not found after approval')
    }

    return result
  }

  /**
   * Reject pending adjustment
   */
  static async reject(
    supabase: SupabaseClient,
    adjustmentId: string,
    rejectorId: string,
    input: RejectAdjustmentInput
  ): Promise<StockAdjustment> {
    // Get existing adjustment
    const adjustment = await this.getById(supabase, adjustmentId)
    if (!adjustment) {
      throw new Error('Stock adjustment not found')
    }

    if (adjustment.status !== 'pending') {
      throw new Error(`Cannot reject adjustment with status: ${adjustment.status}`)
    }

    // Update to rejected (timestamps in UTC)
    const { error } = await supabase
      .from('stock_adjustments')
      .update({
        status: 'rejected',
        approved_by: rejectorId,
        approved_at: new Date().toISOString(),  // ISO string is always UTC
        rejection_reason: input.rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adjustmentId)

    if (error) {
      throw new Error(`Failed to reject stock adjustment: ${error.message}`)
    }

    // Do NOT create stock_move or update LP

    // Return updated adjustment
    const result = await this.getById(supabase, adjustmentId)
    if (!result) {
      throw new Error('Stock adjustment not found after rejection')
    }

    return result
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Calculate adjustment summary for filters
   */
  static async calculateSummary(
    supabase: SupabaseClient,
    filters: Partial<AdjustmentListFilters>
  ): Promise<AdjustmentSummary> {
    let query = supabase.from('stock_adjustments').select('variance, status')

    // Apply same filters as list
    if (filters.date_from) {
      query = query.gte('adjustment_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('adjustment_date', filters.date_to)
    }

    if (filters.reason) {
      query = query.eq('reason_code', filters.reason)
    }

    if (filters.adjusted_by) {
      query = query.eq('adjusted_by', filters.adjusted_by)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to calculate summary: ${error.message}`)
    }

    const summary: AdjustmentSummary = {
      total: data?.length || 0,
      qty_increased: 0,
      qty_decreased: 0,
      pending_approval: 0,
    }

    for (const adj of data || []) {
      if (adj.variance > 0) {
        summary.qty_increased += adj.variance
      } else {
        summary.qty_decreased += Math.abs(adj.variance)
      }

      if (adj.status === 'pending') {
        summary.pending_approval++
      }
    }

    return summary
  }

  /**
   * Determine if adjustment requires approval
   */
  static requiresApproval(variance_pct: number, isIncrease: boolean): boolean {
    // Always require approval for increases
    if (isIncrease) return true

    // Require approval for large decreases (>10%)
    if (Math.abs(variance_pct) > 10) return true

    return false
  }

  /**
   * Execute approved adjustment (create stock_move, update LP)
   */
  private static async executeApprovedAdjustment(
    supabase: SupabaseClient,
    adjustmentId: string,
    userId: string
  ): Promise<void> {
    // Get adjustment details
    const adjustment = await this.getById(supabase, adjustmentId)
    if (!adjustment) {
      throw new Error('Adjustment not found')
    }

    // Get LP details
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, location_id')
      .eq('id', adjustment.lp_id)
      .single()

    if (lpError || !lp) {
      throw new Error('LP not found')
    }

    // Create stock_move (adjustment type)
    const stockMove = await StockMoveService.create(
      supabase,
      {
        lpId: adjustment.lp_id,
        moveType: 'adjustment',
        quantity: adjustment.variance, // delta (can be negative)
        reason: adjustment.reason_notes || undefined,
        reasonCode: adjustment.reason_code,
        referenceId: adjustmentId,
        referenceType: 'adjustment',
      },
      userId
    )

    // Link stock_move to adjustment
    await supabase
      .from('stock_adjustments')
      .update({
        stock_move_id: stockMove.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adjustmentId)

    // Update LP quantity
    await supabase
      .from('license_plates')
      .update({
        quantity: adjustment.new_qty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adjustment.lp_id)

    // If new_qty = 0, mark LP as consumed
    if (adjustment.new_qty === 0) {
      await supabase
        .from('license_plates')
        .update({
          status: 'consumed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', adjustment.lp_id)
    }
  }

  /**
   * Check if stock adjustment exists
   */
  static async exists(supabase: SupabaseClient, id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('stock_adjustments')
      .select('id')
      .eq('id', id)
      .single()

    return !!data && !error
  }
}
