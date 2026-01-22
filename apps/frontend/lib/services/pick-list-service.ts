/**
 * Pick List Service (Story 07.8)
 * Handles pick list generation, wave picking, assignment, and queries
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PickList,
  PickListLine,
  PickListFilters,
  CreatePickListInput,
  CreatePickListResult,
  PickListsListResult,
  PickListDetailResult,
  PickListType,
  PickListStatus,
  PickListPriority,
} from '@/lib/validation/pick-list-schemas'
import { PRIORITY_ORDER, PICKER_ROLES } from '@/lib/validation/pick-list-schemas'

// =============================================================================
// Error Classes
// =============================================================================

export class PickListError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number = 400) {
    super(message)
    this.name = 'PickListError'
    this.code = code
    this.status = status
  }
}

// =============================================================================
// Types
// =============================================================================

interface AllocationLine {
  id: string
  sales_order_line_id: string
  license_plate_id: string
  quantity_allocated: number
  location_id: string
  product_id: string
  lot_number: string | null
  location?: {
    id: string
    zone: string | null
    aisle: string | null
    bin: string | null
  }
}

interface SalesOrder {
  id: string
  order_number: string
  status: string
  customer?: {
    id: string
    name: string
  }
}

// =============================================================================
// Service Methods
// =============================================================================

/**
 * Create a pick list from one or more sales orders
 *
 * Single order: pick_type = 'single_order'
 * Multiple orders (2+): pick_type = 'wave', lines consolidated by location+product
 */
export async function createPickList(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  input: CreatePickListInput
): Promise<CreatePickListResult> {
  const { sales_order_ids, priority = 'normal', assigned_to } = input

  // 1. Validate all SOs exist and are in confirmed status
  const { data: salesOrders, error: soError } = await supabase
    .from('sales_orders')
    .select('id, order_number, status, customer:customers(id, name)')
    .in('id', sales_order_ids)
    .eq('org_id', orgId)

  if (soError) {
    throw new PickListError(
      `Failed to fetch sales orders: ${soError.message}`,
      'FETCH_ERROR',
      500
    )
  }

  if (!salesOrders || salesOrders.length !== sales_order_ids.length) {
    const foundIds = (salesOrders || []).map((so) => so.id)
    const missingIds = sales_order_ids.filter((id) => !foundIds.includes(id))
    throw new PickListError(
      `Sales orders not found: ${missingIds.join(', ')}`,
      'NOT_FOUND',
      404
    )
  }

  // Check all SOs are confirmed
  const nonConfirmedSOs = salesOrders.filter((so) => so.status !== 'confirmed')
  if (nonConfirmedSOs.length > 0) {
    throw new PickListError(
      `Sales orders must be in confirmed status: ${nonConfirmedSOs.map((so) => so.order_number).join(', ')}`,
      'INVALID_SO_STATUS',
      400
    )
  }

  // 2. Get allocations for these SOs
  const { data: allocations, error: allocError } = await supabase
    .from('inventory_allocations')
    .select(`
      id,
      sales_order_line_id,
      license_plate_id,
      quantity_allocated,
      sales_order_line:sales_order_lines!inner(
        id,
        sales_order_id,
        product_id
      ),
      license_plate:license_plates!inner(
        id,
        location_id,
        batch_number,
        location:locations(id, zone, aisle, bin)
      )
    `)
    .in(
      'sales_order_line.sales_order_id',
      sales_order_ids
    )
    .eq('status', 'allocated')

  if (allocError) {
    throw new PickListError(
      `Failed to fetch allocations: ${allocError.message}`,
      'FETCH_ERROR',
      500
    )
  }

  if (!allocations || allocations.length === 0) {
    throw new PickListError(
      'No inventory allocations found for selected sales orders',
      'NO_ALLOCATIONS',
      400
    )
  }

  // 3. Validate assigned_to user if provided
  if (assigned_to) {
    const { data: assignedUser, error: userError } = await supabase
      .from('users')
      .select('id, role:roles(code)')
      .eq('id', assigned_to)
      .eq('org_id', orgId)
      .single()

    if (userError || !assignedUser) {
      throw new PickListError('Assigned user not found', 'USER_NOT_FOUND', 400)
    }

    // Check user has picker role
    const roleData = assignedUser.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    if (!userRole || !PICKER_ROLES.includes(userRole.toLowerCase())) {
      throw new PickListError(
        'Assigned user does not have picker role',
        'INVALID_ROLE',
        400
      )
    }
  }

  // 4. Generate pick list number
  const { data: pickListNumber, error: numError } = await supabase.rpc(
    'generate_pick_list_number',
    { p_org_id: orgId }
  )

  if (numError || !pickListNumber) {
    throw new PickListError(
      'Failed to generate pick list number',
      'NUMBER_GENERATION_ERROR',
      500
    )
  }

  // 5. Determine pick type
  const pickType: PickListType = sales_order_ids.length === 1 ? 'single_order' : 'wave'

  // 6. Create pick list
  const initialStatus: PickListStatus = assigned_to ? 'assigned' : 'pending'

  const { data: pickList, error: plError } = await supabase
    .from('pick_lists')
    .insert({
      org_id: orgId,
      pick_list_number: pickListNumber,
      pick_type: pickType,
      status: initialStatus,
      priority,
      assigned_to: assigned_to || null,
      created_by: userId,
    })
    .select()
    .single()

  if (plError) {
    throw new PickListError(
      `Failed to create pick list: ${plError.message}`,
      'CREATE_ERROR',
      500
    )
  }

  // 7. Link SOs to pick list
  const soLinks = sales_order_ids.map((soId) => ({
    pick_list_id: pickList.id,
    sales_order_id: soId,
  }))

  const { error: linkError } = await supabase
    .from('pick_list_sales_orders')
    .insert(soLinks)

  if (linkError) {
    // Cleanup pick list on failure
    await supabase.from('pick_lists').delete().eq('id', pickList.id)
    throw new PickListError(
      `Failed to link sales orders: ${linkError.message}`,
      'LINK_ERROR',
      500
    )
  }

  // 8. Process allocations into pick lines
  const pickLines = processAllocationsToPickLines(
    allocations,
    pickList.id,
    orgId,
    pickType
  )

  if (pickLines.length === 0) {
    // Cleanup pick list on failure
    await supabase.from('pick_list_sales_orders').delete().eq('pick_list_id', pickList.id)
    await supabase.from('pick_lists').delete().eq('id', pickList.id)
    throw new PickListError(
      'No pick lines could be created from allocations',
      'NO_PICK_LINES',
      400
    )
  }

  // 9. Insert pick lines
  const { error: linesError } = await supabase
    .from('pick_list_lines')
    .insert(pickLines)

  if (linesError) {
    // Cleanup
    await supabase.from('pick_list_sales_orders').delete().eq('pick_list_id', pickList.id)
    await supabase.from('pick_lists').delete().eq('id', pickList.id)
    throw new PickListError(
      `Failed to create pick lines: ${linesError.message}`,
      'LINES_ERROR',
      500
    )
  }

  // 10. Update SO status to 'picking'
  const { error: soUpdateError } = await supabase
    .from('sales_orders')
    .update({ status: 'picking' })
    .in('id', sales_order_ids)

  if (soUpdateError) {
    console.warn('Failed to update SO status to picking:', soUpdateError.message)
    // Non-blocking error
  }

  return {
    pick_list_id: pickList.id,
    pick_list_number: pickListNumber,
    pick_type: pickType,
    line_count: pickLines.length,
    status: initialStatus,
  }
}

/**
 * Process allocations into pick lines with location-based sorting
 * For wave picks, consolidate by (location_id, product_id)
 */
function processAllocationsToPickLines(
  allocations: any[],
  pickListId: string,
  orgId: string,
  pickType: PickListType
): Array<{
  org_id: string
  pick_list_id: string
  sales_order_line_id: string
  license_plate_id: string
  location_id: string
  product_id: string
  lot_number: string | null
  quantity_to_pick: number
  pick_sequence: number
}> {
  // Transform allocations to pick line candidates
  type PickLineCandidate = {
    sales_order_line_id: string
    license_plate_id: string
    location_id: string
    product_id: string
    lot_number: string | null
    quantity_to_pick: number
    zone: string
    aisle: string
    bin: string
  }

  const candidates: PickLineCandidate[] = allocations.map((alloc) => {
    const location = alloc.license_plate?.location || {}
    return {
      sales_order_line_id: alloc.sales_order_line?.id || alloc.sales_order_line_id,
      license_plate_id: alloc.license_plate_id,
      location_id: alloc.license_plate?.location_id,
      product_id: alloc.sales_order_line?.product_id,
      lot_number: alloc.license_plate?.batch_number || null,
      quantity_to_pick: alloc.quantity_allocated,
      zone: location.zone || '',
      aisle: location.aisle || '',
      bin: location.bin || '',
    }
  })

  // For wave picking, consolidate by (location_id, product_id)
  let finalCandidates: PickLineCandidate[]

  if (pickType === 'wave') {
    const consolidated = new Map<string, PickLineCandidate>()

    for (const candidate of candidates) {
      const key = `${candidate.location_id}:${candidate.product_id}`

      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!
        existing.quantity_to_pick += candidate.quantity_to_pick
      } else {
        consolidated.set(key, { ...candidate })
      }
    }

    finalCandidates = Array.from(consolidated.values())
  } else {
    finalCandidates = candidates
  }

  // Sort by location hierarchy: zone (alphabetical) -> aisle (numeric) -> bin (numeric)
  finalCandidates.sort((a, b) => {
    // Zone comparison (alphabetical)
    const zoneCmp = (a.zone || '').localeCompare(b.zone || '')
    if (zoneCmp !== 0) return zoneCmp

    // Aisle comparison (numeric)
    const aisleA = parseInt(a.aisle || '0', 10)
    const aisleB = parseInt(b.aisle || '0', 10)
    if (aisleA !== aisleB) return aisleA - aisleB

    // Bin comparison (numeric)
    const binA = parseInt(a.bin || '0', 10)
    const binB = parseInt(b.bin || '0', 10)
    return binA - binB
  })

  // Assign pick sequence and create final pick lines
  return finalCandidates.map((candidate, index) => ({
    org_id: orgId,
    pick_list_id: pickListId,
    sales_order_line_id: candidate.sales_order_line_id,
    license_plate_id: candidate.license_plate_id,
    location_id: candidate.location_id,
    product_id: candidate.product_id,
    lot_number: candidate.lot_number,
    quantity_to_pick: candidate.quantity_to_pick,
    pick_sequence: index + 1,
  }))
}

/**
 * Assign picker to a pick list
 */
export async function assignPicker(
  supabase: SupabaseClient,
  orgId: string,
  pickListId: string,
  assignedTo: string
): Promise<PickList> {
  // 1. Get pick list
  const { data: pickList, error: plError } = await supabase
    .from('pick_lists')
    .select('*')
    .eq('id', pickListId)
    .eq('org_id', orgId)
    .single()

  if (plError || !pickList) {
    throw new PickListError('Pick list not found', 'NOT_FOUND', 404)
  }

  // 2. Validate status allows assignment
  const allowedStatuses = ['pending', 'assigned']
  if (!allowedStatuses.includes(pickList.status)) {
    throw new PickListError(
      `Cannot assign picker to ${pickList.status} pick list`,
      'INVALID_STATUS',
      400
    )
  }

  // 3. Validate user exists and has picker role
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role:roles(code)')
    .eq('id', assignedTo)
    .eq('org_id', orgId)
    .single()

  if (userError || !user) {
    throw new PickListError('User not found', 'USER_NOT_FOUND', 400)
  }

  const roleData = user.role as any
  const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
  if (!userRole || !PICKER_ROLES.includes(userRole.toLowerCase())) {
    throw new PickListError(
      'User does not have picker role',
      'INVALID_ROLE',
      400
    )
  }

  // 4. Update pick list
  const { data: updatedPL, error: updateError } = await supabase
    .from('pick_lists')
    .update({
      assigned_to: assignedTo,
      status: 'assigned',
    })
    .eq('id', pickListId)
    .select()
    .single()

  if (updateError) {
    throw new PickListError(
      `Failed to assign picker: ${updateError.message}`,
      'UPDATE_ERROR',
      500
    )
  }

  return updatedPL as PickList
}

/**
 * List pick lists with filters and pagination
 */
export async function listPickLists(
  supabase: SupabaseClient,
  orgId: string,
  filters: PickListFilters
): Promise<PickListsListResult> {
  const {
    status,
    assigned_to,
    priority,
    date_from,
    date_to,
    search,
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = filters

  // Build query
  let query = supabase
    .from('pick_lists')
    .select(
      `
      *,
      assigned_user:users!pick_lists_assigned_to_fkey(id, name),
      created_by_user:users!pick_lists_created_by_fkey(id, name)
    `,
      { count: 'exact' }
    )
    .eq('org_id', orgId)

  // Apply status filter (comma-separated)
  if (status) {
    const statuses = status.split(',').map((s) => s.trim())
    query = query.in('status', statuses)
  }

  // Apply assigned_to filter
  if (assigned_to) {
    if (assigned_to === 'unassigned') {
      query = query.is('assigned_to', null)
    } else {
      query = query.eq('assigned_to', assigned_to)
    }
  }

  // Apply priority filter
  if (priority) {
    query = query.eq('priority', priority)
  }

  // Apply date range filters
  if (date_from) {
    query = query.gte('created_at', `${date_from}T00:00:00Z`)
  }
  if (date_to) {
    query = query.lte('created_at', `${date_to}T23:59:59Z`)
  }

  // Apply search filter
  if (search && search.length >= 2) {
    query = query.ilike('pick_list_number', `%${search}%`)
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' })

  // Apply pagination
  const start = (page - 1) * limit
  const end = start + limit - 1
  query = query.range(start, end)

  const { data, error, count } = await query

  if (error) {
    throw new PickListError(
      `Failed to fetch pick lists: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  const total = count || 0
  const pages = Math.ceil(total / limit)

  // Get line counts for each pick list
  const pickListIds = (data || []).map((pl) => pl.id)

  if (pickListIds.length > 0) {
    const { data: lineCounts } = await supabase
      .from('pick_list_lines')
      .select('pick_list_id, status')
      .in('pick_list_id', pickListIds)

    // Calculate counts per pick list
    const countMap = new Map<string, { total: number; picked: number; short: number }>()
    for (const line of lineCounts || []) {
      if (!countMap.has(line.pick_list_id)) {
        countMap.set(line.pick_list_id, { total: 0, picked: 0, short: 0 })
      }
      const counts = countMap.get(line.pick_list_id)!
      counts.total++
      if (line.status === 'picked') counts.picked++
      if (line.status === 'short') counts.short++
    }

    // Add counts to pick lists
    for (const pl of data || []) {
      const counts = countMap.get(pl.id)
      pl.line_count = counts?.total || 0
      pl.lines_picked = counts?.picked || 0
      pl.lines_short = counts?.short || 0
    }
  }

  return {
    pick_lists: (data || []) as PickList[],
    total,
    page,
    pages,
  }
}

/**
 * Get pick list detail with lines
 */
export async function getPickListDetail(
  supabase: SupabaseClient,
  orgId: string,
  pickListId: string
): Promise<PickListDetailResult> {
  // Get pick list
  const { data: pickList, error: plError } = await supabase
    .from('pick_lists')
    .select(
      `
      *,
      assigned_user:users!pick_lists_assigned_to_fkey(id, name),
      created_by_user:users!pick_lists_created_by_fkey(id, name)
    `
    )
    .eq('id', pickListId)
    .eq('org_id', orgId)
    .single()

  if (plError || !pickList) {
    throw new PickListError('Pick list not found', 'NOT_FOUND', 404)
  }

  // Get pick lines with product and location details
  const { data: lines, error: linesError } = await supabase
    .from('pick_list_lines')
    .select(
      `
      *,
      product:products(id, code, name),
      location:locations(id, zone, aisle, bin),
      license_plate:license_plates(id, lp_number, quantity, expiry_date)
    `
    )
    .eq('pick_list_id', pickListId)
    .order('pick_sequence', { ascending: true })

  if (linesError) {
    throw new PickListError(
      `Failed to fetch pick lines: ${linesError.message}`,
      'FETCH_ERROR',
      500
    )
  }

  // Get linked sales orders
  const { data: soLinks } = await supabase
    .from('pick_list_sales_orders')
    .select(
      `
      sales_order:sales_orders(id, order_number, customer:customers(name))
    `
    )
    .eq('pick_list_id', pickListId)

  const salesOrders = (soLinks || []).map((link: any) => ({
    id: link.sales_order.id,
    order_number: link.sales_order.order_number,
    customer_name: link.sales_order.customer?.name || 'Unknown',
  }))

  // Add location full path
  const linesWithPath = (lines || []).map((line: any) => ({
    ...line,
    location: line.location
      ? {
          ...line.location,
          full_path: `${line.location.zone || ''} / Aisle ${line.location.aisle || ''} / Bin ${line.location.bin || ''}`,
        }
      : null,
  }))

  return {
    pick_list: {
      ...pickList,
      sales_orders: salesOrders,
      line_count: lines?.length || 0,
      lines_picked: lines?.filter((l: any) => l.status === 'picked').length || 0,
      lines_short: lines?.filter((l: any) => l.status === 'short').length || 0,
    } as PickList,
    lines: linesWithPath as PickListLine[],
  }
}

/**
 * Get pick lines for a pick list
 */
export async function getPickLines(
  supabase: SupabaseClient,
  orgId: string,
  pickListId: string
): Promise<PickListLine[]> {
  // Verify pick list exists and belongs to org
  const { data: pickList, error: plError } = await supabase
    .from('pick_lists')
    .select('id')
    .eq('id', pickListId)
    .eq('org_id', orgId)
    .single()

  if (plError || !pickList) {
    throw new PickListError('Pick list not found', 'NOT_FOUND', 404)
  }

  // Get pick lines
  const { data: lines, error: linesError } = await supabase
    .from('pick_list_lines')
    .select(
      `
      *,
      product:products(id, code, name),
      location:locations(id, zone, aisle, bin),
      license_plate:license_plates(id, lp_number, quantity, expiry_date)
    `
    )
    .eq('pick_list_id', pickListId)
    .order('pick_sequence', { ascending: true })

  if (linesError) {
    throw new PickListError(
      `Failed to fetch pick lines: ${linesError.message}`,
      'FETCH_ERROR',
      500
    )
  }

  // Add location full path
  return (lines || []).map((line: any) => ({
    ...line,
    location: line.location
      ? {
          ...line.location,
          full_path: `${line.location.zone || ''} / Aisle ${line.location.aisle || ''} / Bin ${line.location.bin || ''}`,
        }
      : null,
  })) as PickListLine[]
}

/**
 * Get pick lists assigned to current user
 */
export async function getMyPicks(
  supabase: SupabaseClient,
  orgId: string,
  userId: string
): Promise<PickList[]> {
  const { data, error } = await supabase
    .from('pick_lists')
    .select(
      `
      *,
      assigned_user:users!pick_lists_assigned_to_fkey(id, name),
      created_by_user:users!pick_lists_created_by_fkey(id, name)
    `
    )
    .eq('org_id', orgId)
    .eq('assigned_to', userId)
    .in('status', ['assigned', 'in_progress'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new PickListError(
      `Failed to fetch my picks: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  // Get line counts for each pick list
  const pickListIds = (data || []).map((pl) => pl.id)

  if (pickListIds.length > 0) {
    const { data: lineCounts } = await supabase
      .from('pick_list_lines')
      .select('pick_list_id, status')
      .in('pick_list_id', pickListIds)

    // Calculate counts per pick list
    const countMap = new Map<string, { total: number; picked: number; short: number }>()
    for (const line of lineCounts || []) {
      if (!countMap.has(line.pick_list_id)) {
        countMap.set(line.pick_list_id, { total: 0, picked: 0, short: 0 })
      }
      const counts = countMap.get(line.pick_list_id)!
      counts.total++
      if (line.status === 'picked') counts.picked++
      if (line.status === 'short') counts.short++
    }

    // Add counts to pick lists
    for (const pl of data || []) {
      const counts = countMap.get(pl.id)
      pl.line_count = counts?.total || 0
      pl.lines_picked = counts?.picked || 0
      pl.lines_short = counts?.short || 0
    }
  }

  // Sort by priority (urgent first) then by created_at
  const sorted = [...(data || [])].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.priority as PickListPriority] ?? 2
    const priorityB = PRIORITY_ORDER[b.priority as PickListPriority] ?? 2
    if (priorityA !== priorityB) return priorityA - priorityB
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return sorted as PickList[]
}

// =============================================================================
// Export Service Object
// =============================================================================

export const PickListService = {
  createPickList,
  assignPicker,
  listPickLists,
  getPickListDetail,
  getPickLines,
  getMyPicks,
}
