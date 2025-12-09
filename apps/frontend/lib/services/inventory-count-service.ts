/**
 * Inventory Count Service
 * Story 5.35: Inventory Count for physical inventory verification
 */

import { createAdminClient } from '../supabase/admin-client'

// Types
export interface InventoryCount {
  id: string
  org_id: string
  count_number: string
  location_id: string
  status: CountStatus
  reason?: CountReason
  expected_lps: number
  scanned_lps: number
  found_lps: number
  missing_lps: number
  extra_lps: number
  variance_pct?: number
  initiated_by_user_id: string
  completed_by_user_id?: string
  initiated_at: string
  completed_at?: string
  created_at: string
  updated_at: string
  // Joins
  location?: {
    id: string
    code: string
    name: string
    warehouse_id: string
  }
  initiated_by?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  completed_by?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface CountItem {
  id: string
  count_id: string
  lp_id: string
  expected: boolean
  scanned_at?: string
  scanned_by_user_id?: string
  variance?: VarianceType
  created_at: string
  updated_at: string
  // Joins
  lp?: {
    id: string
    lp_number: string
    product_id: string
    current_qty: number
    status: string
    product?: {
      id: string
      code: string
      name: string
    }
  }
  scanned_by?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export type CountStatus = 'pending' | 'in_progress' | 'completed' | 'adjusted'
export type CountReason = 'cycle_count' | 'audit' | 'recount'
export type VarianceType = 'found' | 'missing' | 'extra'

export interface ScanResult {
  success: boolean
  message: string
  item?: CountItem
  variance?: VarianceType
}

export interface VarianceReport {
  count_id: string
  count_number: string
  location: { id: string; code: string; name: string }
  expected_lps: number
  scanned_lps: number
  found_lps: number
  missing_lps: number
  extra_lps: number
  variance_pct: number
  missing_items: CountItem[]
  extra_items: CountItem[]
  completed_at: string
}

export interface ReconciliationResult {
  success: boolean
  action: 'accept_loss' | 'investigate' | 'recount'
  adjustments_created?: number
  new_count_id?: string
  message: string
}

// ============================================
// Core Functions
// ============================================

/**
 * Initiate a new inventory count for a location
 */
export async function initiateCount(
  orgId: string,
  locationId: string,
  userId: string,
  reason?: CountReason
): Promise<InventoryCount> {
  const supabase = createAdminClient()

  // Generate count number
  const { data: countNumber, error: seqError } = await supabase.rpc('generate_count_number', {
    p_org_id: orgId,
  })

  if (seqError) {
    throw new Error(`Failed to generate count number: ${seqError.message}`)
  }

  // Get all LPs at this location (expected)
  const { data: lps, error: lpError } = await supabase
    .from('license_plates')
    .select('id')
    .eq('org_id', orgId)
    .eq('location_id', locationId)
    .in('status', ['available', 'reserved'])
    .gt('current_qty', 0)

  if (lpError) {
    throw new Error(`Failed to get LPs at location: ${lpError.message}`)
  }

  const expectedLps = lps?.length || 0

  // Create count record
  const { data: count, error: countError } = await supabase
    .from('inventory_counts')
    .insert({
      org_id: orgId,
      count_number: countNumber,
      location_id: locationId,
      status: 'pending',
      reason: reason,
      expected_lps: expectedLps,
      initiated_by_user_id: userId,
    })
    .select(`
      *,
      location:locations (id, code, name, warehouse_id),
      initiated_by:users!inventory_counts_initiated_by_user_id_fkey (id, email, first_name, last_name)
    `)
    .single()

  if (countError) {
    throw new Error(`Failed to create count: ${countError.message}`)
  }

  // Create count items for all expected LPs
  if (lps && lps.length > 0) {
    const items = lps.map(lp => ({
      count_id: count.id,
      lp_id: lp.id,
      expected: true,
    }))

    const { error: itemsError } = await supabase
      .from('inventory_count_items')
      .insert(items)

    if (itemsError) {
      throw new Error(`Failed to create count items: ${itemsError.message}`)
    }
  }

  return count
}

/**
 * Scan an LP during count
 */
export async function scanLP(
  countId: string,
  lpId: string,
  userId: string
): Promise<ScanResult> {
  const supabase = createAdminClient()

  // Get count to verify it's in progress
  const { data: count, error: countError } = await supabase
    .from('inventory_counts')
    .select('id, status, org_id, location_id')
    .eq('id', countId)
    .single()

  if (countError || !count) {
    return { success: false, message: 'Count not found' }
  }

  if (count.status !== 'pending' && count.status !== 'in_progress') {
    return { success: false, message: 'Count is not active' }
  }

  // Update count status to in_progress if pending
  if (count.status === 'pending') {
    await supabase
      .from('inventory_counts')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', countId)
  }

  // Check if LP exists in count items
  const { data: existingItem, error: itemError } = await supabase
    .from('inventory_count_items')
    .select('*')
    .eq('count_id', countId)
    .eq('lp_id', lpId)
    .single()

  if (existingItem) {
    // LP was expected - mark as scanned
    if (existingItem.scanned_at) {
      return { success: false, message: 'LP already scanned' }
    }

    const { data: item, error: updateError } = await supabase
      .from('inventory_count_items')
      .update({
        scanned_at: new Date().toISOString(),
        scanned_by_user_id: userId,
        variance: 'found',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingItem.id)
      .select(`
        *,
        lp:license_plates (
          id, lp_number, product_id, current_qty, status,
          product:products (id, code, name)
        )
      `)
      .single()

    if (updateError) {
      return { success: false, message: `Failed to update item: ${updateError.message}` }
    }

    // Update count statistics
    await updateCountStats(countId)

    return { success: true, message: 'LP found at expected location', item, variance: 'found' }
  } else {
    // LP was not expected - check if it belongs to org and is at this location
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, org_id, location_id')
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      return { success: false, message: 'LP not found' }
    }

    if (lp.org_id !== count.org_id) {
      return { success: false, message: 'LP does not belong to this organization' }
    }

    // Add as extra LP
    const { data: item, error: insertError } = await supabase
      .from('inventory_count_items')
      .insert({
        count_id: countId,
        lp_id: lpId,
        expected: false,
        scanned_at: new Date().toISOString(),
        scanned_by_user_id: userId,
        variance: 'extra',
      })
      .select(`
        *,
        lp:license_plates (
          id, lp_number, product_id, current_qty, status,
          product:products (id, code, name)
        )
      `)
      .single()

    if (insertError) {
      return { success: false, message: `Failed to add extra LP: ${insertError.message}` }
    }

    // Update count statistics
    await updateCountStats(countId)

    return { success: true, message: 'Extra LP found (not expected at this location)', item, variance: 'extra' }
  }
}

/**
 * Add an extra LP by LP number (for manual entry)
 */
export async function addExtraLP(
  countId: string,
  lpNumber: string,
  orgId: string,
  userId: string
): Promise<ScanResult> {
  const supabase = createAdminClient()

  // Find LP by number
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('id')
    .eq('lp_number', lpNumber)
    .eq('org_id', orgId)
    .single()

  if (lpError || !lp) {
    return { success: false, message: 'LP not found' }
  }

  return scanLP(countId, lp.id, userId)
}

/**
 * Complete count and calculate variance
 */
export async function completeCount(
  countId: string,
  userId: string
): Promise<VarianceReport> {
  const supabase = createAdminClient()

  // Get count
  const { data: count, error: countError } = await supabase
    .from('inventory_counts')
    .select(`
      *,
      location:locations (id, code, name)
    `)
    .eq('id', countId)
    .single()

  if (countError || !count) {
    throw new Error('Count not found')
  }

  if (count.status === 'completed' || count.status === 'adjusted') {
    throw new Error('Count already completed')
  }

  // Calculate final statistics
  const { data: items, error: itemsError } = await supabase
    .from('inventory_count_items')
    .select(`
      *,
      lp:license_plates (
        id, lp_number, product_id, current_qty, status,
        product:products (id, code, name)
      )
    `)
    .eq('count_id', countId)

  if (itemsError) {
    throw new Error(`Failed to get count items: ${itemsError.message}`)
  }

  // Mark unscanned expected items as missing
  const unscanned = items?.filter(i => i.expected && !i.scanned_at) || []
  for (const item of unscanned) {
    await supabase
      .from('inventory_count_items')
      .update({ variance: 'missing', updated_at: new Date().toISOString() })
      .eq('id', item.id)
  }

  // Calculate stats
  const expectedLps = items?.filter(i => i.expected).length || 0
  const scannedLps = items?.filter(i => i.scanned_at).length || 0
  const foundLps = items?.filter(i => i.variance === 'found').length || 0
  const missingLps = unscanned.length
  const extraLps = items?.filter(i => i.variance === 'extra').length || 0

  const variancePct = expectedLps > 0
    ? Math.round(((foundLps - expectedLps) / expectedLps) * 10000) / 100
    : 0

  // Update count
  const completedAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('inventory_counts')
    .update({
      status: 'completed',
      expected_lps: expectedLps,
      scanned_lps: scannedLps,
      found_lps: foundLps,
      missing_lps: missingLps,
      extra_lps: extraLps,
      variance_pct: variancePct,
      completed_by_user_id: userId,
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', countId)

  if (updateError) {
    throw new Error(`Failed to complete count: ${updateError.message}`)
  }

  // Get updated items with variance
  const { data: finalItems } = await supabase
    .from('inventory_count_items')
    .select(`
      *,
      lp:license_plates (
        id, lp_number, product_id, current_qty, status,
        product:products (id, code, name)
      )
    `)
    .eq('count_id', countId)

  return {
    count_id: countId,
    count_number: count.count_number,
    location: count.location,
    expected_lps: expectedLps,
    scanned_lps: scannedLps,
    found_lps: foundLps,
    missing_lps: missingLps,
    extra_lps: extraLps,
    variance_pct: variancePct,
    missing_items: finalItems?.filter(i => i.variance === 'missing') || [],
    extra_items: finalItems?.filter(i => i.variance === 'extra') || [],
    completed_at: completedAt,
  }
}

/**
 * Recount missing items
 */
export async function recountMissing(
  countId: string
): Promise<{ count: number }> {
  const supabase = createAdminClient()

  // Reset missing items to allow re-scanning
  const { data, error } = await supabase
    .from('inventory_count_items')
    .update({
      variance: null,
      scanned_at: null,
      scanned_by_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('count_id', countId)
    .eq('variance', 'missing')
    .select('id')

  if (error) {
    throw new Error(`Failed to reset missing items: ${error.message}`)
  }

  // Update count status back to in_progress
  await supabase
    .from('inventory_counts')
    .update({
      status: 'in_progress',
      completed_at: null,
      completed_by_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', countId)

  await updateCountStats(countId)

  return { count: data?.length || 0 }
}

/**
 * Reconcile variance (accept loss / investigate / recount)
 */
export async function reconcileVariance(
  countId: string,
  action: 'accept_loss' | 'investigate' | 'recount',
  userId: string,
  notes?: string
): Promise<ReconciliationResult> {
  const supabase = createAdminClient()

  // Get count with items
  const { data: count, error: countError } = await supabase
    .from('inventory_counts')
    .select('*, org_id, location_id')
    .eq('id', countId)
    .single()

  if (countError || !count) {
    throw new Error('Count not found')
  }

  if (count.status !== 'completed') {
    throw new Error('Count must be completed before reconciliation')
  }

  if (action === 'recount') {
    // Create new count for missing items
    const newCount = await initiateCount(count.org_id, count.location_id, userId, 'recount')

    return {
      success: true,
      action: 'recount',
      new_count_id: newCount.id,
      message: `New recount initiated: ${newCount.count_number}`,
    }
  }

  if (action === 'investigate') {
    // Just mark as pending investigation (no adjustments)
    await supabase
      .from('inventory_counts')
      .update({
        status: 'adjusted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', countId)

    return {
      success: true,
      action: 'investigate',
      message: 'Count marked for investigation',
    }
  }

  // accept_loss - create adjustment movements for missing LPs
  const { data: missingItems, error: itemsError } = await supabase
    .from('inventory_count_items')
    .select(`
      *,
      lp:license_plates (id, lp_number, current_qty, uom, org_id)
    `)
    .eq('count_id', countId)
    .eq('variance', 'missing')

  if (itemsError) {
    throw new Error(`Failed to get missing items: ${itemsError.message}`)
  }

  let adjustmentsCreated = 0

  for (const item of missingItems || []) {
    if (!item.lp) continue

    // Create adjustment movement (zero out the LP)
    await supabase.from('lp_movements').insert({
      org_id: item.lp.org_id,
      lp_id: item.lp_id,
      movement_type: 'adjustment',
      qty_change: -item.lp.current_qty,
      qty_before: item.lp.current_qty,
      qty_after: 0,
      uom: item.lp.uom,
      created_by_user_id: userId,
      notes: `Inventory count adjustment - Count: ${count.count_number}${notes ? ` - ${notes}` : ''}`,
    })

    // Update LP quantity to 0 and status to consumed (lost)
    await supabase
      .from('license_plates')
      .update({
        current_qty: 0,
        status: 'consumed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.lp_id)

    adjustmentsCreated++
  }

  // Handle extra LPs - update their location
  const { data: extraItems } = await supabase
    .from('inventory_count_items')
    .select('lp_id')
    .eq('count_id', countId)
    .eq('variance', 'extra')

  for (const item of extraItems || []) {
    await supabase
      .from('license_plates')
      .update({
        location_id: count.location_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.lp_id)

    // Create movement for location update
    await supabase.from('lp_movements').insert({
      org_id: count.org_id,
      lp_id: item.lp_id,
      movement_type: 'adjustment',
      qty_change: 0,
      qty_before: 0,
      qty_after: 0,
      uom: 'EA',
      created_by_user_id: userId,
      notes: `Location corrected via inventory count: ${count.count_number}`,
    })
  }

  // Mark count as adjusted
  await supabase
    .from('inventory_counts')
    .update({
      status: 'adjusted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', countId)

  return {
    success: true,
    action: 'accept_loss',
    adjustments_created: adjustmentsCreated,
    message: `${adjustmentsCreated} adjustment(s) created for missing LPs`,
  }
}

/**
 * Get count by ID
 */
export async function getCount(countId: string): Promise<InventoryCount | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('inventory_counts')
    .select(`
      *,
      location:locations (id, code, name, warehouse_id),
      initiated_by:users!inventory_counts_initiated_by_user_id_fkey (id, email, first_name, last_name),
      completed_by:users!inventory_counts_completed_by_user_id_fkey (id, email, first_name, last_name)
    `)
    .eq('id', countId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get count: ${error.message}`)
  }

  return data
}

/**
 * Get count items
 */
export async function getCountItems(countId: string): Promise<CountItem[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('inventory_count_items')
    .select(`
      *,
      lp:license_plates (
        id, lp_number, product_id, current_qty, status,
        product:products (id, code, name)
      ),
      scanned_by:users!inventory_count_items_scanned_by_user_id_fkey (id, email, first_name, last_name)
    `)
    .eq('count_id', countId)
    .order('expected', { ascending: false })
    .order('scanned_at', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(`Failed to get count items: ${error.message}`)
  }

  return data || []
}

/**
 * List counts with filters
 */
export async function listCounts(
  orgId: string,
  filters?: {
    status?: CountStatus | CountStatus[]
    location_id?: string
    reason?: CountReason
    limit?: number
    offset?: number
  }
): Promise<{ data: InventoryCount[]; count: number }> {
  const supabase = createAdminClient()

  let query = supabase
    .from('inventory_counts')
    .select(`
      *,
      location:locations (id, code, name, warehouse_id),
      initiated_by:users!inventory_counts_initiated_by_user_id_fkey (id, email, first_name, last_name),
      completed_by:users!inventory_counts_completed_by_user_id_fkey (id, email, first_name, last_name)
    `, { count: 'exact' })
    .eq('org_id', orgId)

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.location_id) {
    query = query.eq('location_id', filters.location_id)
  }

  if (filters?.reason) {
    query = query.eq('reason', filters.reason)
  }

  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)
  query = query.order('initiated_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list counts: ${error.message}`)
  }

  return { data: data || [], count: count || 0 }
}

// ============================================
// Helper Functions
// ============================================

async function updateCountStats(countId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: items } = await supabase
    .from('inventory_count_items')
    .select('expected, scanned_at, variance')
    .eq('count_id', countId)

  const stats = {
    expected_lps: items?.filter(i => i.expected).length || 0,
    scanned_lps: items?.filter(i => i.scanned_at).length || 0,
    found_lps: items?.filter(i => i.variance === 'found').length || 0,
    missing_lps: items?.filter(i => i.expected && !i.scanned_at).length || 0,
    extra_lps: items?.filter(i => i.variance === 'extra').length || 0,
    updated_at: new Date().toISOString(),
  }

  await supabase
    .from('inventory_counts')
    .update(stats)
    .eq('id', countId)
}
