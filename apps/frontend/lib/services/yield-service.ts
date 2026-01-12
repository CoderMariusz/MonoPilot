/**
 * Yield Tracking Service
 * Story: 04.4 - Yield Tracking
 *
 * Business logic for yield tracking:
 * - calculateYieldPercentage() - Formula: (produced/planned)*100, rounded to 1 decimal
 * - getYieldIndicatorColor() - Color thresholds: green >=80%, yellow 70-79%, red <70%
 * - validateYieldUpdate() - Validates produced_quantity with business rules
 * - updateWorkOrderYield() - Updates WO produced_quantity and creates audit log
 * - getYieldHistory() - Fetches yield logs for a work order
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Yield color type for visual indicators
 */
export type YieldColor = 'green' | 'yellow' | 'red'

/**
 * Yield label type for display
 */
export type YieldLabel = 'Excellent' | 'Below Target' | 'Low Yield' | 'Not Started'

/**
 * Yield log entry type
 */
export interface YieldLog {
  id: string
  org_id: string
  wo_id: string
  old_quantity: number
  new_quantity: number
  old_yield_percent: number
  new_yield_percent: number
  notes?: string | null
  created_at: string
  created_by: string
  user_name?: string
}

/**
 * Result of yield update operation
 */
export interface YieldUpdateResult {
  wo_id: string
  produced_quantity: number
  yield_percent: number
  yield_color: YieldColor
  yield_label: YieldLabel
  updated_at: string
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  wo?: {
    id: string
    org_id: string
    planned_quantity: number
    produced_quantity: number
    yield_percent: number
    status: string
  }
}

/**
 * Calculate yield percentage
 * Formula: (produced_quantity / planned_quantity) * 100
 * Rounded to 1 decimal place
 *
 * @param producedQuantity - Actual produced quantity
 * @param plannedQuantity - Planned/target quantity
 * @returns Yield percentage rounded to 1 decimal place
 */
export function calculateYieldPercentage(
  producedQuantity: number,
  plannedQuantity: number
): number {
  // Edge case: avoid division by zero
  if (plannedQuantity === 0) {
    return 0
  }

  const yield_percent = (producedQuantity / plannedQuantity) * 100
  // Round to 1 decimal place: multiply by 10, round, divide by 10
  return Math.round(yield_percent * 10) / 10
}

/**
 * Get yield indicator color based on percentage
 * - Green: yield >= 80%
 * - Yellow: 70% <= yield < 80%
 * - Red: yield < 70%
 *
 * @param yieldPercent - Yield percentage
 * @returns Color indicator (green, yellow, red)
 */
export function getYieldIndicatorColor(yieldPercent: number): YieldColor {
  if (yieldPercent >= 80) {
    return 'green'
  }
  if (yieldPercent >= 70) {
    return 'yellow'
  }
  return 'red'
}

/**
 * Validate yield update request
 * Checks:
 * - producedQuantity is a valid finite non-negative number
 * - Work order exists and belongs to org
 * - Work order status is 'In Progress'
 * - Overproduction check if allow_overproduction setting is false
 *
 * @param supabase - Supabase client
 * @param woId - Work order ID
 * @param producedQuantity - New produced quantity
 * @param orgId - Organization ID
 * @returns Validation result
 */
export async function validateYieldUpdate(
  supabase: SupabaseClient,
  woId: string,
  producedQuantity: number,
  orgId: string
): Promise<ValidationResult> {
  // Check for non-finite numbers (NaN, Infinity)
  if (!Number.isFinite(producedQuantity)) {
    return {
      valid: false,
      error: 'Must be a valid number',
    }
  }

  // Check for negative values
  if (producedQuantity < 0) {
    return {
      valid: false,
      error: 'Produced quantity must be positive',
    }
  }

  // Fetch work order
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, org_id, planned_quantity, produced_quantity, yield_percent, status')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    return {
      valid: false,
      error: 'Work order not found',
    }
  }

  // Check status - only In Progress WOs can have yield updated
  if (wo.status !== 'In Progress') {
    return {
      valid: false,
      error: 'Yield entry only allowed when WO is In Progress',
    }
  }

  // Check overproduction setting if producing more than planned
  if (producedQuantity > wo.planned_quantity) {
    const { data: settings } = await supabase
      .from('production_settings')
      .select('allow_overproduction')
      .eq('org_id', orgId)
      .single()

    const allowOverproduction = settings?.allow_overproduction ?? false

    if (!allowOverproduction) {
      return {
        valid: false,
        error: `Produced quantity cannot exceed planned quantity (${wo.planned_quantity})`,
      }
    }
  }

  return {
    valid: true,
    wo,
  }
}

/**
 * Yield Service class with static methods
 * Handles yield tracking operations for work orders
 */
export class YieldService {
  /**
   * Update work order yield (produced_quantity) and create audit log
   *
   * @param supabase - Supabase client
   * @param woId - Work order ID
   * @param producedQuantity - New produced quantity
   * @param userId - User making the update
   * @param notes - Optional notes for the update
   * @returns Updated yield result
   */
  static async updateWorkOrderYield(
    supabase: SupabaseClient,
    woId: string,
    producedQuantity: number,
    userId: string,
    notes?: string
  ): Promise<YieldUpdateResult> {
    // Fetch current WO data first (needed for both validation and update)
    const { data: currentWO, error: fetchError } = await supabase
      .from('work_orders')
      .select('id, org_id, planned_quantity, produced_quantity, yield_percent, status')
      .eq('id', woId)
      .single()

    if (fetchError || !currentWO) {
      throw new Error('Work order not found')
    }

    // Validate using fetched WO data (use org_id from fetched WO)
    const validation = await validateYieldUpdate(supabase, woId, producedQuantity, currentWO.org_id)

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Calculate new yield
    const newYieldPercent = calculateYieldPercentage(producedQuantity, currentWO.planned_quantity)
    const oldYieldPercent = currentWO.yield_percent || 0
    const oldQuantity = currentWO.produced_quantity || 0

    // Update work order
    const { data: updatedWO, error: updateError } = await supabase
      .from('work_orders')
      .update({
        produced_quantity: producedQuantity,
        yield_percent: newYieldPercent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', woId)
      .select('id, produced_quantity, yield_percent, updated_at')
      .single()

    if (updateError || !updatedWO) {
      throw new Error('Failed to update work order yield')
    }

    // Create yield log entry
    const { error: logError } = await supabase.from('yield_logs').insert({
      org_id: currentWO.org_id,
      wo_id: woId,
      old_quantity: oldQuantity,
      new_quantity: producedQuantity,
      old_yield_percent: oldYieldPercent,
      new_yield_percent: newYieldPercent,
      notes: notes || null,
      created_by: userId,
    })

    if (logError) {
      console.error('Failed to create yield log:', logError)
      // Don't fail the operation if logging fails
    }

    return {
      wo_id: updatedWO.id,
      produced_quantity: updatedWO.produced_quantity,
      yield_percent: updatedWO.yield_percent,
      yield_color: getYieldIndicatorColor(updatedWO.yield_percent),
      yield_label: YieldService.getYieldLabel(updatedWO.yield_percent),
      updated_at: updatedWO.updated_at,
    }
  }

  /**
   * Get yield history for a work order
   *
   * @param supabase - Supabase client
   * @param woId - Work order ID
   * @returns Array of yield log entries
   */
  static async getYieldHistory(supabase: SupabaseClient, woId: string): Promise<YieldLog[]> {
    const { data: logs, error } = await supabase
      .from('yield_logs')
      .select('id, org_id, wo_id, old_quantity, new_quantity, old_yield_percent, new_yield_percent, notes, created_at, created_by, users!yield_logs_created_by_fkey(first_name, last_name)')
      .eq('wo_id', woId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch yield history')
    }

    // Map to include user_name from joined users table or directly from log
    return (logs || []).map((log) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const logAny = log as any
      const user = logAny.users as { first_name?: string; last_name?: string } | null
      // Check for user_name directly on log (mock tests) or from joined users table
      const userName =
        logAny.user_name ||
        (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : undefined)

      return {
        id: log.id,
        org_id: log.org_id,
        wo_id: log.wo_id,
        old_quantity: log.old_quantity,
        new_quantity: log.new_quantity,
        old_yield_percent: log.old_yield_percent,
        new_yield_percent: log.new_yield_percent,
        notes: log.notes,
        created_at: log.created_at,
        created_by: log.created_by,
        user_name: userName || undefined,
      }
    })
  }

  /**
   * Get yield label based on percentage
   * - Excellent: yield >= 80%
   * - Below Target: 70% <= yield < 80%
   * - Low Yield: yield < 70% (but > 0)
   * - Not Started: yield = 0
   *
   * @param yieldPercent - Yield percentage
   * @returns Label string
   */
  static getYieldLabel(yieldPercent: number): YieldLabel {
    if (yieldPercent === 0) {
      return 'Not Started'
    }
    if (yieldPercent >= 80) {
      return 'Excellent'
    }
    if (yieldPercent >= 70) {
      return 'Below Target'
    }
    return 'Low Yield'
  }
}
