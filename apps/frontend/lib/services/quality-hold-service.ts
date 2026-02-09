/**
 * Quality Hold Service
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides operations for quality holds:
 * - createHold(data, orgId, userId): Create hold with items and LP blocking
 * - getHoldById(holdId, orgId): Get hold detail with items
 * - releaseHold(holdId, disposition, releaseNotes, orgId, userId): Release hold with LP updates
 * - getActiveHolds(orgId): Get active holds with aging summary
 * - getHoldsList(orgId, filters): Get paginated list of holds
 * - getHoldsStats(orgId): Get hold statistics for dashboard
 * - deleteHold(holdId, orgId): Soft-delete hold (only if active and no items)
 * - calculateAgingStatus(priority, heldAt): Calculate aging status
 * - blockLPConsumption(lpId, orgId): Check if LP is on active hold
 * - getActiveLPHold(lpId, orgId): Get active hold containing LP
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies in migration 140 enforce org_id filtering
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { createServerSupabase } from '@/lib/supabase/server'
import type { CreateHoldInput, ReleaseHoldInput, HoldListFilters } from '@/lib/validation/quality-hold-validation'

// =============================================================================
// Types
// =============================================================================

export interface QualityHold {
  id: string
  org_id: string
  hold_number: string
  reason: string
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  status: 'active' | 'released' | 'disposed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  held_by: { id: string; name: string; email: string }
  held_at: string
  released_by?: { id: string; name: string; email: string } | null
  released_at?: string | null
  release_notes?: string | null
  disposition?: 'release' | 'rework' | 'scrap' | 'return' | null
  ncr_id?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface QualityHoldItem {
  id: string
  hold_id: string
  reference_type: 'lp' | 'wo' | 'batch'
  reference_id: string
  reference_display: string
  quantity_held?: number | null
  uom?: string | null
  location_id?: string | null
  location_name?: string | null
  notes?: string | null
  created_at: string
}

export interface QualityHoldSummary {
  id: string
  hold_number: string
  status: 'active' | 'released' | 'disposed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  reason: string
  items_count: number
  held_by: { id: string; name: string }
  held_at: string
  aging_hours: number
  aging_status: 'normal' | 'warning' | 'critical'
}

export interface CreateHoldResponse {
  hold: QualityHold
  items: QualityHoldItem[]
  lp_updates?: Array<{
    lp_id: string
    lp_number: string
    previous_status: string
    new_status: 'hold'
  }>
}

export interface HoldDetailResponse {
  hold: QualityHold
  items: QualityHoldItem[]
  ncr?: {
    id: string
    ncr_number: string
    title: string
    status: string
  } | null
}

export interface ReleaseHoldResponse {
  hold: QualityHold
  lp_updates?: Array<{
    lp_id: string
    lp_number: string
    previous_status: 'hold'
    new_status: string
    disposition_action: string
  }>
}

export interface ActiveHoldsResponse {
  holds: QualityHoldSummary[]
  aging_summary: {
    normal: number
    warning: number
    critical: number
  }
}

export interface HoldsListResponse {
  holds: QualityHoldSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
  filters_applied: {
    status?: string[]
    priority?: string[]
    hold_type?: string[]
    date_range?: { from: string; to: string }
  }
}

export interface HoldStatsResponse {
  active_count: number
  released_today: number
  aging_critical: number
  by_priority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  by_type: {
    qa_pending: number
    investigation: number
    recall: number
    quarantine: number
  }
  avg_resolution_time_hours: number
}

// =============================================================================
// Aging Thresholds (hours)
// =============================================================================

const AGING_THRESHOLDS = {
  critical: { warning: 12, critical: 24 },
  high: { warning: 24, critical: 48 },
  medium: { warning: 48, critical: 72 },
  low: { warning: 120, critical: 168 }, // 5d warning, 7d critical
}

// =============================================================================
// Service Implementation
// =============================================================================

/**
 * Calculate aging status based on priority and held_at timestamp
 */
export function calculateAgingStatus(
  priority: 'low' | 'medium' | 'high' | 'critical',
  heldAt: Date | string
): 'normal' | 'warning' | 'critical' {
  const heldAtDate = typeof heldAt === 'string' ? new Date(heldAt) : heldAt
  const now = new Date()
  const hoursElapsed = (now.getTime() - heldAtDate.getTime()) / (1000 * 60 * 60)

  const thresholds = AGING_THRESHOLDS[priority]

  if (hoursElapsed >= thresholds.critical) {
    return 'critical'
  }
  if (hoursElapsed >= thresholds.warning) {
    return 'warning'
  }
  return 'normal'
}

/**
 * Create a new quality hold with items
 */
export async function createHold(
  data: CreateHoldInput,
  orgId: string,
  userId: string
): Promise<CreateHoldResponse> {
  const supabase = await createServerSupabase()

  // Check for duplicate items in request
  const itemKeys = new Set<string>()
  for (const item of data.items) {
    const key = `${item.reference_type}:${item.reference_id}`
    if (itemKeys.has(key)) {
      throw new Error('Duplicate items in hold')
    }
    itemKeys.add(key)
  }

  // Validate referenced items exist and get LP details for status updates
  const lpItems = data.items.filter(i => i.reference_type === 'lp')
  const woItems = data.items.filter(i => i.reference_type === 'wo')

  // Verify LPs exist
  if (lpItems.length > 0) {
    const { data: lps, error: lpError } = await supabase
      .from('license_plates')
      .select('id, lp_number, qa_status, org_id')
      .in('id', lpItems.map(i => i.reference_id))

    if (lpError) throw new Error(`Failed to verify license plates: ${lpError.message}`)
    if (!lps || lps.length !== lpItems.length) {
      throw new Error('License plate not found')
    }
    // Verify all LPs belong to same org
    const invalidLPs = lps.filter(lp => lp.org_id !== orgId)
    if (invalidLPs.length > 0) {
      throw new Error('License plate not found')
    }
  }

  // Verify WOs exist
  if (woItems.length > 0) {
    const { data: wos, error: woError } = await supabase
      .from('work_orders')
      .select('id, wo_number, org_id')
      .in('id', woItems.map(i => i.reference_id))

    if (woError) throw new Error(`Failed to verify work orders: ${woError.message}`)
    if (!wos || wos.length !== woItems.length) {
      throw new Error('Work order not found')
    }
    // Verify all WOs belong to same org
    const invalidWOs = wos.filter(wo => wo.org_id !== orgId)
    if (invalidWOs.length > 0) {
      throw new Error('Work order not found')
    }
  }

  // Insert hold (hold_number auto-generated by trigger)
  const { data: hold, error: holdError } = await supabase
    .from('quality_holds')
    .insert({
      org_id: orgId,
      reason: data.reason,
      hold_type: data.hold_type,
      priority: data.priority || 'medium',
      held_by: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select('*')
    .single()

  if (holdError) throw new Error(`Failed to create hold: ${holdError.message}`)

  // Insert hold items
  const holdItemsToInsert = data.items.map(item => ({
    hold_id: hold.id,
    reference_type: item.reference_type,
    reference_id: item.reference_id,
    quantity_held: item.quantity_held ?? null,
    uom: item.uom ?? null,
    notes: item.notes ?? null,
  }))

  const { data: holdItems, error: itemsError } = await supabase
    .from('quality_hold_items')
    .insert(holdItemsToInsert)
    .select('*')

  if (itemsError) throw new Error(`Failed to create hold items: ${itemsError.message}`)

  // Update LP qa_status to hold for all LP items
  const lpUpdates: Array<{ lp_id: string; lp_number: string; previous_status: string; new_status: 'hold' }> = []

  if (lpItems.length > 0) {
    // Get current LP statuses
    const { data: currentLPs } = await supabase
      .from('license_plates')
      .select('id, lp_number, qa_status')
      .in('id', lpItems.map(i => i.reference_id))

    if (currentLPs) {
      for (const lp of currentLPs) {
        lpUpdates.push({
          lp_id: lp.id,
          lp_number: lp.lp_number,
          previous_status: (lp.qa_status as string).toLowerCase(),
          new_status: 'hold',
        })
      }
    }

    // Update LP qa_status to HOLD (database uses uppercase enum)
    const { error: lpUpdateError } = await supabase
      .from('license_plates')
      .update({ qa_status: 'HOLD', updated_at: new Date().toISOString() })
      .in('id', lpItems.map(i => i.reference_id))

    if (lpUpdateError) throw new Error(`Failed to update LP status: ${lpUpdateError.message}`)
  }

  // Get held_by user info
  const { data: heldByUser } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('id', userId)
    .single()

  // Build response items with reference_display
  const responseItems = await enrichHoldItems(supabase, holdItems || [])

  return {
    hold: {
      ...hold,
      held_by: heldByUser 
        ? { id: heldByUser.id, name: `${heldByUser.first_name} ${heldByUser.last_name}`.trim(), email: heldByUser.email }
        : { id: userId, name: 'Unknown', email: '' },
    } as QualityHold,
    items: responseItems,
    lp_updates: lpUpdates.length > 0 ? lpUpdates : undefined,
  }
}

/**
 * Get hold by ID with items
 */
export async function getHoldById(holdId: string, orgId: string): Promise<HoldDetailResponse> {
  const supabase = await createServerSupabase()

  // Get hold with held_by and released_by user info
  const { data: hold, error: holdError } = await supabase
    .from('quality_holds')
    .select(`
      *,
      held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name, email),
      released_by_user:users!quality_holds_released_by_fkey(id, first_name, last_name, email)
    `)
    .eq('id', holdId)
    .eq('org_id', orgId)
    .single()

  if (holdError) {
    if (holdError.code === 'PGRST116') {
      throw new Error('Hold not found')
    }
    throw new Error(`Failed to fetch hold: ${holdError.message}`)
  }

  // Get hold items
  const { data: items, error: itemsError } = await supabase
    .from('quality_hold_items')
    .select('*')
    .eq('hold_id', holdId)

  if (itemsError) throw new Error(`Failed to fetch hold items: ${itemsError.message}`)

  // Enrich items with reference_display and location_name
  const enrichedItems = await enrichHoldItems(supabase, items || [])

  // Transform response - combine first_name and last_name into name
  const heldByUser = hold.held_by_user as { id: string; first_name: string; last_name: string; email: string } | null
  const releasedByUser = hold.released_by_user as { id: string; first_name: string; last_name: string; email: string } | null

  const response: HoldDetailResponse = {
    hold: {
      ...hold,
      held_by: heldByUser 
        ? { id: heldByUser.id, name: `${heldByUser.first_name} ${heldByUser.last_name}`.trim(), email: heldByUser.email }
        : { id: hold.held_by, name: 'Unknown', email: '' },
      released_by: releasedByUser
        ? { id: releasedByUser.id, name: `${releasedByUser.first_name} ${releasedByUser.last_name}`.trim(), email: releasedByUser.email }
        : null,
    } as QualityHold,
    items: enrichedItems,
    ncr: null, // NCR table doesn't exist yet
  }

  return response
}

/**
 * Release a hold with disposition
 */
export async function releaseHold(
  holdId: string,
  disposition: 'release' | 'rework' | 'scrap' | 'return',
  releaseNotes: string,
  orgId: string,
  userId: string
): Promise<ReleaseHoldResponse> {
  const supabase = await createServerSupabase()

  // Get current hold
  const { data: currentHold, error: currentError } = await supabase
    .from('quality_holds')
    .select('*')
    .eq('id', holdId)
    .eq('org_id', orgId)
    .single()

  if (currentError) {
    if (currentError.code === 'PGRST116') {
      throw new Error('Hold not found')
    }
    throw new Error(`Failed to fetch hold: ${currentError.message}`)
  }

  // Validate hold is active
  if (currentHold.status === 'released') {
    throw new Error('Hold is already released')
  }
  if (currentHold.status === 'disposed') {
    throw new Error('Hold is already disposed')
  }

  // Update hold
  const { data: updatedHold, error: updateError } = await supabase
    .from('quality_holds')
    .update({
      status: 'released',
      released_by: userId,
      released_at: new Date().toISOString(),
      disposition,
      release_notes: releaseNotes,
      updated_by: userId,
    })
    .eq('id', holdId)
    .select(`
      *,
      held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name, email),
      released_by_user:users!quality_holds_released_by_fkey(id, first_name, last_name, email)
    `)
    .single()

  if (updateError) throw new Error(`Failed to release hold: ${updateError.message}`)

  // Get LP items
  const { data: items } = await supabase
    .from('quality_hold_items')
    .select('reference_type, reference_id')
    .eq('hold_id', holdId)
    .eq('reference_type', 'lp')

  // Determine new LP qa_status based on disposition
  // Database uses UPPERCASE enum, API response uses lowercase
  let dbQaStatus: string
  let apiQaStatus: string
  let setQuantityZero = false

  switch (disposition) {
    case 'release':
      dbQaStatus = 'PASSED'
      apiQaStatus = 'passed'
      break
    case 'rework':
      dbQaStatus = 'PENDING'
      apiQaStatus = 'pending'
      break
    case 'scrap':
      dbQaStatus = 'FAILED'
      apiQaStatus = 'failed'
      setQuantityZero = true
      break
    case 'return':
      dbQaStatus = 'FAILED'
      apiQaStatus = 'failed'
      break
    default:
      dbQaStatus = 'PENDING'
      apiQaStatus = 'pending'
  }

  // Update LP statuses
  const lpUpdates: Array<{
    lp_id: string
    lp_number: string
    previous_status: 'hold'
    new_status: string
    disposition_action: string
  }> = []

  if (items && items.length > 0) {
    const lpIds = items.map(i => i.reference_id)

    // Get current LP info
    const { data: lps } = await supabase
      .from('license_plates')
      .select('id, lp_number, qa_status')
      .in('id', lpIds)

    if (lps) {
      for (const lp of lps) {
        lpUpdates.push({
          lp_id: lp.id,
          lp_number: lp.lp_number,
          previous_status: 'hold',
          new_status: apiQaStatus,
          disposition_action: disposition,
        })
      }
    }

    // Update LP qa_status (database uses uppercase enum)
    const updateData: Record<string, unknown> = {
      qa_status: dbQaStatus,
      updated_at: new Date().toISOString(),
    }

    if (setQuantityZero) {
      updateData.quantity = 0
    }

    await supabase
      .from('license_plates')
      .update(updateData)
      .in('id', lpIds)
  }

  // Transform user info - combine first_name and last_name into name
  const heldByUser = updatedHold.held_by_user as { id: string; first_name: string; last_name: string; email: string } | null
  const releasedByUser = updatedHold.released_by_user as { id: string; first_name: string; last_name: string; email: string } | null

  return {
    hold: {
      ...updatedHold,
      held_by: heldByUser
        ? { id: heldByUser.id, name: `${heldByUser.first_name} ${heldByUser.last_name}`.trim(), email: heldByUser.email }
        : { id: updatedHold.held_by, name: 'Unknown', email: '' },
      released_by: releasedByUser
        ? { id: releasedByUser.id, name: `${releasedByUser.first_name} ${releasedByUser.last_name}`.trim(), email: releasedByUser.email }
        : null,
    } as QualityHold,
    lp_updates: lpUpdates.length > 0 ? lpUpdates : undefined,
  }
}

/**
 * Get active holds with aging summary
 */
export async function getActiveHolds(orgId: string): Promise<ActiveHoldsResponse> {
  const supabase = await createServerSupabase()

  const { data: holds, error } = await supabase
    .from('quality_holds')
    .select(`
      id, hold_number, status, priority, hold_type, reason, held_at,
      held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name)
    `)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .order('held_at', { ascending: true })
    .limit(20)

  if (error) throw new Error(`Failed to fetch active holds: ${error.message}`)

  const holdIds = (holds || []).map(h => h.id)
  const itemsCounts = await countHoldItems(supabase, holdIds)
  const holdsWithAging = buildHoldSummaries(holds as any || [], itemsCounts)
  const agingSummary = calculateAgingSummary(holdsWithAging)

  return {
    holds: holdsWithAging,
    aging_summary: agingSummary,
  }
}

/**
 * Get paginated list of holds with filters
 */
export async function getHoldsList(
  orgId: string,
  filters: HoldListFilters
): Promise<HoldsListResponse> {
  const supabase = await createServerSupabase()

  let query = supabase
    .from('quality_holds')
    .select(`
      id, hold_number, status, priority, hold_type, reason, held_at,
      held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name)
    `, { count: 'exact' })
    .eq('org_id', orgId)

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  if (filters.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }
  if (filters.hold_type && filters.hold_type.length > 0) {
    query = query.in('hold_type', filters.hold_type)
  }
  if (filters.from) {
    query = query.gte('held_at', filters.from)
  }
  if (filters.to) {
    query = query.lte('held_at', filters.to)
  }
  
  // Apply reason filter (exact match)
  if (filters.reason) {
    query = query.eq('reason', filters.reason)
  }

  // Apply search filter using OR (search in hold_number or reason)
  if (filters.search) {
    const searchTerm = filters.search
    query = query.or(`hold_number.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`)
  }

  // Apply sorting (default: held_at DESC)
  if (filters.sort) {
    const [field, direction] = filters.sort.split(' ')
    query = query.order(field, { ascending: direction?.toLowerCase() !== 'desc' })
  } else {
    query = query.order('held_at', { ascending: false })
  }

  // Apply pagination
  const limit = filters.limit || 20
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data: holds, count, error } = await query

  if (error) throw new Error(`Failed to fetch holds: ${error.message}`)

  const holdIds = (holds || []).map(h => h.id)
  const itemsCounts = await countHoldItems(supabase, holdIds)
  const holdsWithAging = buildHoldSummaries(holds as any || [], itemsCounts)

  const total = count || 0
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  return {
    holds: holdsWithAging,
    pagination: {
      total,
      page,
      limit,
      total_pages: totalPages,
    },
    filters_applied: {
      status: filters.status,
      priority: filters.priority,
      hold_type: filters.hold_type,
      date_range: filters.from || filters.to ? { from: filters.from || '', to: filters.to || '' } : undefined,
    },
  }
}

/**
 * Get hold statistics for dashboard
 */
export async function getHoldsStats(orgId: string): Promise<HoldStatsResponse> {
  const supabase = await createServerSupabase()

  // Get all holds for this org
  const { data: holds, error } = await supabase
    .from('quality_holds')
    .select('id, status, priority, hold_type, held_at, released_at')
    .eq('org_id', orgId)

  if (error) throw new Error(`Failed to fetch holds stats: ${error.message}`)

  const allHolds = holds || []

  // Calculate stats
  const activeHolds = allHolds.filter(h => h.status === 'active')
  const today = new Date().toISOString().split('T')[0]
  const releasedToday = allHolds.filter(
    h => h.status === 'released' && h.released_at?.startsWith(today)
  )

  // Count aging critical
  const agingCritical = activeHolds.filter(h =>
    calculateAgingStatus(h.priority as any, h.held_at) === 'critical'
  ).length

  // By priority
  const byPriority = {
    low: activeHolds.filter(h => h.priority === 'low').length,
    medium: activeHolds.filter(h => h.priority === 'medium').length,
    high: activeHolds.filter(h => h.priority === 'high').length,
    critical: activeHolds.filter(h => h.priority === 'critical').length,
  }

  // By type
  const byType = {
    qa_pending: activeHolds.filter(h => h.hold_type === 'qa_pending').length,
    investigation: activeHolds.filter(h => h.hold_type === 'investigation').length,
    recall: activeHolds.filter(h => h.hold_type === 'recall').length,
    quarantine: activeHolds.filter(h => h.hold_type === 'quarantine').length,
  }

  // Average resolution time
  const releasedHolds = allHolds.filter(h => h.status === 'released' && h.released_at)
  let avgResolutionTime = 0

  if (releasedHolds.length > 0) {
    const totalHours = releasedHolds.reduce((sum, h) => {
      const heldAt = new Date(h.held_at)
      const releasedAt = new Date(h.released_at!)
      return sum + (releasedAt.getTime() - heldAt.getTime()) / (1000 * 60 * 60)
    }, 0)
    avgResolutionTime = Math.round((totalHours / releasedHolds.length) * 100) / 100
  }

  return {
    active_count: activeHolds.length,
    released_today: releasedToday.length,
    aging_critical: agingCritical,
    by_priority: byPriority,
    by_type: byType,
    avg_resolution_time_hours: avgResolutionTime,
  }
}

/**
 * Update hold details (reason, priority, hold_type)
 * Only allowed for 'active' holds
 */
export async function updateHold(
  holdId: string,
  data: {
    reason?: string
    hold_type?: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
    priority?: 'low' | 'medium' | 'high' | 'critical'
  },
  orgId: string,
  userId: string
): Promise<QualityHold> {
  const supabase = await createServerSupabase()

  // Get current hold
  const { data: hold, error: holdError } = await supabase
    .from('quality_holds')
    .select(
      `id, org_id, hold_number, reason, hold_type, status, priority,
       held_at, released_at, release_notes, disposition, ncr_id,
       created_at, updated_at, created_by, updated_by,
       held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name, email),
       released_by_user:users!quality_holds_released_by_fkey(id, first_name, last_name, email)`
    )
    .eq('id', holdId)
    .eq('org_id', orgId)
    .single()

  if (holdError) {
    if (holdError.code === 'PGRST116') {
      throw new Error('Hold not found')
    }
    throw new Error(`Failed to fetch hold: ${holdError.message}`)
  }

  // Check status - can only update active holds
  if (hold.status !== 'active') {
    throw new Error(`Hold cannot be updated (not in active status): current status is '${hold.status}'`)
  }

  // Build update object
  const updateData: any = {}
  if (data.reason !== undefined) updateData.reason = data.reason
  if (data.hold_type !== undefined) updateData.hold_type = data.hold_type
  if (data.priority !== undefined) updateData.priority = data.priority
  updateData.updated_by = userId
  updateData.updated_at = new Date().toISOString()

  // Update hold
  const { data: updatedHold, error: updateError } = await supabase
    .from('quality_holds')
    .update(updateData)
    .eq('id', holdId)
    .eq('org_id', orgId)
    .select(
      `id, org_id, hold_number, reason, hold_type, status, priority,
       held_at, released_at, release_notes, disposition, ncr_id,
       created_at, updated_at, created_by, updated_by,
       held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name, email),
       released_by_user:users!quality_holds_released_by_fkey(id, first_name, last_name, email)`
    )
    .single()

  if (updateError) {
    throw new Error(`Failed to update hold: ${updateError.message}`)
  }

  const heldByUser = updatedHold.held_by_user as { id: string; first_name: string; last_name: string; email: string } | null
  const releasedByUser = updatedHold.released_by_user as { id: string; first_name: string; last_name: string; email: string } | null

  return {
    ...updatedHold,
    held_by: heldByUser
      ? { id: heldByUser.id, name: `${heldByUser.first_name} ${heldByUser.last_name}`.trim(), email: heldByUser.email }
      : { id: '', name: 'Unknown', email: '' },
    released_by: releasedByUser
      ? { id: releasedByUser.id, name: `${releasedByUser.first_name} ${releasedByUser.last_name}`.trim(), email: releasedByUser.email }
      : null,
  } as QualityHold
}

/**
 * Delete hold (only if active and has no items)
 */
export async function deleteHold(holdId: string, orgId: string): Promise<void> {
  const supabase = await createServerSupabase()

  // Get current hold
  const { data: hold, error: holdError } = await supabase
    .from('quality_holds')
    .select('id, status')
    .eq('id', holdId)
    .eq('org_id', orgId)
    .single()

  if (holdError) {
    if (holdError.code === 'PGRST116') {
      throw new Error('Hold not found')
    }
    throw new Error(`Failed to fetch hold: ${holdError.message}`)
  }

  // Check status
  if (hold.status === 'released') {
    throw new Error('Cannot delete released hold')
  }
  if (hold.status === 'disposed') {
    throw new Error('Cannot delete disposed hold')
  }

  // Check for items
  const { count, error: countError } = await supabase
    .from('quality_hold_items')
    .select('id', { count: 'exact', head: true })
    .eq('hold_id', holdId)

  if (countError) throw new Error(`Failed to check hold items: ${countError.message}`)
  if (count && count > 0) {
    throw new Error('Cannot delete hold with items')
  }

  // Delete hold
  const { error: deleteError } = await supabase
    .from('quality_holds')
    .delete()
    .eq('id', holdId)

  if (deleteError) throw new Error(`Failed to delete hold: ${deleteError.message}`)
}

/**
 * Check if LP is on active hold (for blocking consumption)
 */
export async function blockLPConsumption(lpId: string, orgId: string): Promise<boolean> {
  const hold = await getActiveLPHold(lpId, orgId)
  return hold !== null
}

/**
 * Get active hold containing specified LP
 */
export async function getActiveLPHold(
  lpId: string,
  orgId: string
): Promise<QualityHold | null> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('quality_hold_items')
    .select(`
      hold:quality_holds!inner(
        id, org_id, hold_number, reason, hold_type, status, priority,
        held_at, released_at, release_notes, disposition, ncr_id,
        created_at, updated_at, created_by, updated_by,
        held_by_user:users!quality_holds_held_by_fkey(id, first_name, last_name, email),
        released_by_user:users!quality_holds_released_by_fkey(id, first_name, last_name, email)
      )
    `)
    .eq('reference_type', 'lp')
    .eq('reference_id', lpId)
    .eq('hold.org_id', orgId)
    .eq('hold.status', 'active')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    // If no active hold found, return null
    return null
  }

  if (!data?.hold) return null

  const hold = data.hold as any
  const heldByUser = hold.held_by_user as { id: string; first_name: string; last_name: string; email: string } | null
  const releasedByUser = hold.released_by_user as { id: string; first_name: string; last_name: string; email: string } | null

  return {
    ...hold,
    held_by: heldByUser
      ? { id: heldByUser.id, name: `${heldByUser.first_name} ${heldByUser.last_name}`.trim(), email: heldByUser.email }
      : { id: '', name: 'Unknown', email: '' },
    released_by: releasedByUser
      ? { id: releasedByUser.id, name: `${releasedByUser.first_name} ${releasedByUser.last_name}`.trim(), email: releasedByUser.email }
      : null,
  } as QualityHold
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Count items for each hold
 */
async function countHoldItems(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  holdIds: string[]
): Promise<Record<string, number>> {
  if (holdIds.length === 0) return {}

  const { data: countData } = await supabase
    .from('quality_hold_items')
    .select('hold_id')
    .in('hold_id', holdIds)

  if (!countData) return {}

  return countData.reduce((acc: Record<string, number>, item: { hold_id: string }) => {
    acc[item.hold_id] = (acc[item.hold_id] || 0) + 1
    return acc
  }, {})
}

/**
 * Build hold summaries with aging status
 */
function buildHoldSummaries(
  holds: Array<{
    id: string
    hold_number: string
    status: string
    priority: string
    hold_type: string
    reason: string
    held_at: string
    held_by_user?: { id: string; first_name: string; last_name: string } | null
  }>,
  itemsCounts: Record<string, number>
): QualityHoldSummary[] {
  return holds.map(hold => {
    const heldAt = new Date(hold.held_at)
    const agingHours = (Date.now() - heldAt.getTime()) / (1000 * 60 * 60)
    const agingStatus = calculateAgingStatus(hold.priority as any, heldAt)

    // Combine first_name and last_name into name
    const heldByUser = hold.held_by_user
    const heldBy = heldByUser
      ? { id: heldByUser.id, name: `${heldByUser.first_name} ${heldByUser.last_name}`.trim() }
      : { id: '', name: 'Unknown' }

    return {
      id: hold.id,
      hold_number: hold.hold_number,
      status: hold.status as any,
      priority: hold.priority as any,
      hold_type: hold.hold_type as any,
      reason: truncateReason(hold.reason),
      items_count: itemsCounts[hold.id] || 0,
      held_by: heldBy,
      held_at: hold.held_at,
      aging_hours: Math.round(agingHours * 100) / 100,
      aging_status: agingStatus,
    }
  })
}

/**
 * Calculate aging summary from hold summaries
 */
function calculateAgingSummary(holds: QualityHoldSummary[]): { normal: number; warning: number; critical: number } {
  return holds.reduce(
    (acc, hold) => {
      acc[hold.aging_status]++
      return acc
    },
    { normal: 0, warning: 0, critical: 0 }
  )
}

/**
 * Truncate reason text to 100 characters
 */
function truncateReason(reason: string, maxLength: number = 100): string {
  return reason.length > maxLength ? reason.substring(0, maxLength) + '...' : reason
}

/**
 * Enrich hold items with reference_display and location_name
 */
async function enrichHoldItems(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  items: Array<{
    id: string
    hold_id: string
    reference_type: string
    reference_id: string
    quantity_held?: number | null
    uom?: string | null
    location_id?: string | null
    notes?: string | null
    created_at: string
  }>
): Promise<QualityHoldItem[]> {
  if (items.length === 0) return []

  // Group items by reference type
  const lpIds = items.filter(i => i.reference_type === 'lp').map(i => i.reference_id)
  const woIds = items.filter(i => i.reference_type === 'wo').map(i => i.reference_id)
  const locationIds = items.filter(i => i.location_id).map(i => i.location_id!)

  // Fetch reference displays
  const lpMap: Record<string, string> = {}
  const woMap: Record<string, string> = {}
  const locationMap: Record<string, string> = {}

  if (lpIds.length > 0) {
    const { data: lps } = await supabase
      .from('license_plates')
      .select('id, lp_number')
      .in('id', lpIds)

    if (lps) {
      for (const lp of lps) {
        lpMap[lp.id] = lp.lp_number
      }
    }
  }

  if (woIds.length > 0) {
    const { data: wos } = await supabase
      .from('work_orders')
      .select('id, wo_number')
      .in('id', woIds)

    if (wos) {
      for (const wo of wos) {
        woMap[wo.id] = wo.wo_number
      }
    }
  }

  if (locationIds.length > 0) {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', locationIds)

    if (locations) {
      for (const loc of locations) {
        locationMap[loc.id] = loc.name
      }
    }
  }

  return items.map(item => {
    let referenceDisplay = item.reference_id

    if (item.reference_type === 'lp') {
      referenceDisplay = lpMap[item.reference_id] || item.reference_id
    } else if (item.reference_type === 'wo') {
      referenceDisplay = woMap[item.reference_id] || item.reference_id
    }

    return {
      id: item.id,
      hold_id: item.hold_id,
      reference_type: item.reference_type as 'lp' | 'wo' | 'batch',
      reference_id: item.reference_id,
      reference_display: referenceDisplay,
      quantity_held: item.quantity_held,
      uom: item.uom,
      location_id: item.location_id,
      location_name: item.location_id ? locationMap[item.location_id] : null,
      notes: item.notes,
      created_at: item.created_at,
    }
  })
}

/**
 * Export service as default object
 */
export default {
  createHold,
  getHoldById,
  updateHold,
  releaseHold,
  getActiveHolds,
  getHoldsList,
  getHoldsStats,
  deleteHold,
  calculateAgingStatus,
  blockLPConsumption,
  getActiveLPHold,
}
