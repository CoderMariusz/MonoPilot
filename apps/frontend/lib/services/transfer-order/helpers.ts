/**
 * Transfer Order Service Helpers
 * Story 03.8 - Refactor
 *
 * Extracted helper functions to reduce duplication
 */

import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import type { UserData, WarehouseInfo } from './types'
import { ALLOWED_ROLES, TO_NUMBER_PREFIX, TO_NUMBER_PADDING } from './constants'

// ============================================================================
// USER & AUTH HELPERS
// ============================================================================

/**
 * Get current user's org_id, role, and user_id from JWT
 * AC-3.6.7: Role-based authorization for Transfer Orders
 */
export async function getCurrentUserData(): Promise<UserData | null> {
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
export async function getCurrentOrgId(): Promise<string | null> {
  const userData = await getCurrentUserData()
  return userData?.orgId || null
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const userData = await getCurrentUserData()
  return userData?.userId || null
}

/**
 * Validate user role for Transfer Order operations
 * Allowed roles: warehouse, purchasing, technical, admin
 */
export function validateRole(role: string): boolean {
  return ALLOWED_ROLES.includes(role.toLowerCase() as any)
}

// ============================================================================
// TO NUMBER GENERATION
// ============================================================================

/**
 * Generate next TO number in format: TO-YYYY-NNN
 * Resets sequence each year
 */
export async function generateToNumber(orgId: string): Promise<string> {
  const supabaseAdmin = createServerSupabaseAdmin()
  const currentYear = new Date().getFullYear()
  const prefix = `${TO_NUMBER_PREFIX}${currentYear}-`

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

  // Pad to configured digits (e.g., 001, 002, ...)
  const paddedNumber = nextNumber.toString().padStart(TO_NUMBER_PADDING, '0')
  return `${prefix}${paddedNumber}`
}

// ============================================================================
// STATUS CALCULATION
// ============================================================================

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
export async function calculateToStatus(transferOrderId: string): Promise<string> {
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
// WAREHOUSE ENRICHMENT (Reduce Duplication)
// ============================================================================

/**
 * Fetch warehouse info and enrich transfer order data
 * Reduces code duplication across 6+ service methods
 */
export async function enrichWithWarehouses<T extends { from_warehouse_id: string; to_warehouse_id: string }>(
  data: T | T[]
): Promise<T | T[]> {
  const supabaseAdmin = createServerSupabaseAdmin()
  const items = Array.isArray(data) ? data : [data]

  if (items.length === 0) {
    return Array.isArray(data) ? [] : data
  }

  // Collect unique warehouse IDs
  const allWarehouseIds = [
    ...items.map((item) => item.from_warehouse_id),
    ...items.map((item) => item.to_warehouse_id),
  ].filter(Boolean)

  const warehouseIds = Array.from(new Set(allWarehouseIds))

  if (warehouseIds.length === 0) {
    return data
  }

  // Fetch warehouses in one query
  const { data: warehouses } = await supabaseAdmin
    .from('warehouses')
    .select('id, code, name')
    .in('id', warehouseIds)

  const warehouseMap = new Map<string, WarehouseInfo>(
    warehouses?.map((w: any) => [w.id, { id: w.id, code: w.code, name: w.name }]) || []
  )

  // Enrich items with warehouse info
  const enriched = items.map((item) => ({
    ...item,
    from_warehouse: warehouseMap.get(item.from_warehouse_id) || null,
    to_warehouse: warehouseMap.get(item.to_warehouse_id) || null,
  }))

  return Array.isArray(data) ? enriched : enriched[0]
}
