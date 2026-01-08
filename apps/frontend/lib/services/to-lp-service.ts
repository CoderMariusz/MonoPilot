/**
 * TO LP Service
 * Story: 03.9b - TO License Plate Pre-selection
 *
 * Service layer for LP assignment to Transfer Order lines.
 * Handles:
 * - assignLPsToTOLine(): Validate and assign LPs to TO line
 * - getAvailableLPsForTOLine(): Filter LPs by TO line criteria
 * - removeLPFromTOLine(): Remove LP assignment
 * - getLPAssignmentsForTOLine(): Get existing LP assignments
 * - validateLPAssignment(): Validate single LP against business rules
 *
 * Business Rules:
 * 1. LP.warehouse_id must equal TO.from_warehouse_id
 * 2. LP.product_id must equal TO line.product_id
 * 3. LP.available_qty must be >= assigned quantity
 * 4. Same LP cannot be assigned twice to same line (UNIQUE constraint)
 * 5. LP assignment only allowed when TO status is DRAFT or PLANNED
 * 6. LP status must be 'available' and available_qty > 0
 * 7. Exclude expired LPs (expiry_date < today)
 */

import { createServerSupabaseAdmin, createServerSupabase } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export interface LPAssignmentInput {
  lp_id: string
  quantity: number
}

export interface TOLineLPAssignment {
  id: string
  to_line_id: string
  lp_id: string
  lp_number: string
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  quantity: number
  product: {
    id: string
    code: string
    name: string
  } | null
}

export interface AvailableLP {
  id: string
  lp_number: string
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  available_qty: number
  uom: string
  warehouse: {
    id: string
    code: string
    name: string
  } | null
  product: {
    id: string
    code: string
    name: string
  } | null
}

export interface AvailableLPsFilters {
  lot_number?: string
  expiry_from?: string
  expiry_to?: string
  search?: string
}

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface AssignLPsResult {
  assignments: TOLineLPAssignment[]
  total_assigned: number
  total_required: number
  is_complete: boolean
  message: string
}

export interface LPAssignmentsResult {
  assignments: TOLineLPAssignment[]
  total_assigned: number
  total_required: number
  is_complete: boolean
}

export interface AvailableLPsResult {
  lps: AvailableLP[]
  total_count: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EDITABLE_STATUSES = ['draft', 'planned']
const LP_VALID_STATUSES = ['available']

// Error codes
export const TOLPErrorCode = {
  TO_NOT_FOUND: 'TO_NOT_FOUND',
  TO_LINE_NOT_FOUND: 'TO_LINE_NOT_FOUND',
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  LP_NOT_IN_WAREHOUSE: 'LP_NOT_IN_WAREHOUSE',
  LP_PRODUCT_MISMATCH: 'LP_PRODUCT_MISMATCH',
  INSUFFICIENT_QUANTITY: 'INSUFFICIENT_QUANTITY',
  INVALID_STATUS: 'INVALID_STATUS',
  DUPLICATE_ASSIGNMENT: 'DUPLICATE_ASSIGNMENT',
  QUANTITY_MISMATCH: 'QUANTITY_MISMATCH',
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current user's org_id and user_id from JWT
 */
async function getCurrentUserData(): Promise<{ orgId: string; userId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    console.error('Failed to get user data:', user.id, error)
    return null
  }

  return {
    orgId: userData.org_id,
    userId: user.id,
  }
}

/**
 * Get TO with from_warehouse_id and status
 */
async function getTransferOrder(toId: string, orgId: string) {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('transfer_orders')
    .select('id, org_id, from_warehouse_id, status')
    .eq('id', toId)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get TO line with product_id and quantity
 */
async function getTOLine(toLineId: string, toId: string) {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('transfer_order_lines')
    .select('id, to_id, product_id, quantity')
    .eq('id', toLineId)
    .eq('to_id', toId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get LP with warehouse_id, product_id, and available quantity
 */
async function getLicensePlate(lpId: string, orgId: string) {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('license_plates')
    .select(`
      id,
      lp_number,
      warehouse_id,
      product_id,
      quantity,
      status,
      batch_number,
      expiry_date,
      location_id,
      product:products(id, code, name)
    `)
    .eq('id', lpId)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return null
  return {
    ...data,
    available_qty: data.quantity, // For simplicity, using quantity as available_qty
    lot_number: data.batch_number,
  }
}

/**
 * Get location name by ID
 */
async function getLocationName(locationId: string | null): Promise<string | null> {
  if (!locationId) return null

  const supabaseAdmin = createServerSupabaseAdmin()

  const { data } = await supabaseAdmin
    .from('locations')
    .select('name')
    .eq('id', locationId)
    .single()

  return data?.name || null
}

// ============================================================================
// VALIDATE LP ASSIGNMENT
// ============================================================================

/**
 * Validate single LP against TO line requirements
 */
export function validateLPAssignment(
  lp: { warehouse_id: string; product_id: string; available_qty: number; status: string },
  toLine: { product_id: string },
  fromWarehouseId: string,
  requestedQty: number
): ValidationResult {
  // Rule 1: LP.warehouse_id must equal TO.from_warehouse_id
  if (lp.warehouse_id !== fromWarehouseId) {
    return {
      valid: false,
      error: `LP is not in source warehouse`,
    }
  }

  // Rule 2: LP.product_id must equal TO line.product_id
  if (lp.product_id !== toLine.product_id) {
    return {
      valid: false,
      error: `LP product mismatch`,
    }
  }

  // Rule 3: LP.available_qty must be >= assigned quantity
  if (lp.available_qty < requestedQty) {
    return {
      valid: false,
      error: `LP has only ${lp.available_qty} units available, cannot assign ${requestedQty} units`,
    }
  }

  // Rule 6: LP status must be 'available'
  if (!LP_VALID_STATUSES.includes(lp.status)) {
    return {
      valid: false,
      error: `LP status is ${lp.status}, must be available`,
    }
  }

  return { valid: true }
}

// ============================================================================
// ASSIGN LPS TO TO LINE
// ============================================================================

/**
 * Assign License Plates to a Transfer Order line
 */
export async function assignLPsToTOLine(
  toId: string,
  toLineId: string,
  lps: LPAssignmentInput[]
): Promise<ServiceResult<AssignLPsResult>> {
  try {
    const userData = await getCurrentUserData()
    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    const { orgId, userId } = userData
    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Validate TO exists and belongs to org
    const to = await getTransferOrder(toId, orgId)
    if (!to) {
      return {
        success: false,
        error: 'Transfer order not found',
        code: TOLPErrorCode.TO_NOT_FOUND,
      }
    }

    // 2. Validate TO status is DRAFT or PLANNED
    if (!EDITABLE_STATUSES.includes(to.status)) {
      return {
        success: false,
        error: `Cannot assign LPs to ${to.status} Transfer Order`,
        code: TOLPErrorCode.INVALID_STATUS,
      }
    }

    // 3. Validate TO line exists and belongs to TO
    const toLine = await getTOLine(toLineId, toId)
    if (!toLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: TOLPErrorCode.TO_LINE_NOT_FOUND,
      }
    }

    // 4. Check for existing assignments (duplicate check)
    const { data: existingAssignments } = await supabaseAdmin
      .from('to_line_lps')
      .select('lp_id')
      .eq('to_line_id', toLineId)

    const existingLpIds = new Set(existingAssignments?.map(a => a.lp_id) || [])

    // 5. Validate each LP
    const assignments: TOLineLPAssignment[] = []
    const insertData: any[] = []

    for (const lpInput of lps) {
      // Check for duplicate in request
      if (existingLpIds.has(lpInput.lp_id)) {
        return {
          success: false,
          error: `LP is already assigned to this line`,
          code: TOLPErrorCode.DUPLICATE_ASSIGNMENT,
        }
      }

      // Get LP details
      const lp = await getLicensePlate(lpInput.lp_id, orgId)
      if (!lp) {
        return {
          success: false,
          error: `LP not found`,
          code: TOLPErrorCode.LP_NOT_FOUND,
        }
      }

      // Validate LP against TO line requirements
      const validation = validateLPAssignment(
        {
          warehouse_id: lp.warehouse_id,
          product_id: lp.product_id,
          available_qty: lp.available_qty,
          status: lp.status,
        },
        { product_id: toLine.product_id },
        to.from_warehouse_id,
        lpInput.quantity
      )

      if (!validation.valid) {
        // Determine specific error code
        let code: string = TOLPErrorCode.DATABASE_ERROR
        if (validation.error?.includes('not in source warehouse')) {
          code = TOLPErrorCode.LP_NOT_IN_WAREHOUSE
        } else if (validation.error?.includes('product mismatch')) {
          code = TOLPErrorCode.LP_PRODUCT_MISMATCH
        } else if (validation.error?.includes('available')) {
          code = TOLPErrorCode.INSUFFICIENT_QUANTITY
        }

        return {
          success: false,
          error: validation.error,
          code,
        }
      }

      // Get location name
      const locationName = await getLocationName(lp.location_id)

      insertData.push({
        to_line_id: toLineId,
        lp_id: lpInput.lp_id,
        quantity: lpInput.quantity,
        created_by: userId,
      })

      assignments.push({
        id: '', // Will be set after insert
        to_line_id: toLineId,
        lp_id: lp.id,
        lp_number: lp.lp_number,
        lot_number: lp.lot_number,
        expiry_date: lp.expiry_date,
        location: locationName,
        quantity: lpInput.quantity,
        product: lp.product as any,
      })
    }

    // 6. Insert assignments
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('to_line_lps')
      .insert(insertData)
      .select('id')

    if (insertError) {
      console.error('Error inserting LP assignments:', insertError)

      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return {
          success: false,
          error: 'LP is already assigned to this line',
          code: TOLPErrorCode.DUPLICATE_ASSIGNMENT,
        }
      }

      return {
        success: false,
        error: 'Failed to assign LPs',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    // Update assignment IDs
    if (inserted) {
      inserted.forEach((row, index) => {
        if (assignments[index]) {
          assignments[index].id = row.id
        }
      })
    }

    // Calculate totals
    const totalAssigned = assignments.reduce((sum, a) => sum + a.quantity, 0)
    const totalRequired = toLine.quantity
    const isComplete = totalAssigned >= totalRequired

    return {
      success: true,
      data: {
        assignments,
        total_assigned: totalAssigned,
        total_required: totalRequired,
        is_complete: isComplete,
        message: `${assignments.length} License Plate${assignments.length === 1 ? '' : 's'} assigned successfully`,
      },
    }
  } catch (error) {
    console.error('Error in assignLPsToTOLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: TOLPErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// GET AVAILABLE LPS FOR TO LINE
// ============================================================================

/**
 * Get available License Plates for a Transfer Order line
 */
export async function getAvailableLPsForTOLine(
  toId: string,
  toLineId: string,
  filters?: AvailableLPsFilters
): Promise<ServiceResult<AvailableLPsResult>> {
  try {
    const userData = await getCurrentUserData()
    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    const { orgId } = userData
    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Validate TO exists and belongs to org
    const to = await getTransferOrder(toId, orgId)
    if (!to) {
      return {
        success: false,
        error: 'Transfer order not found',
        code: TOLPErrorCode.TO_NOT_FOUND,
      }
    }

    // 2. Validate TO line exists and belongs to TO
    const toLine = await getTOLine(toLineId, toId)
    if (!toLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: TOLPErrorCode.TO_LINE_NOT_FOUND,
      }
    }

    // 3. Query available LPs
    let query = supabaseAdmin
      .from('license_plates')
      .select(`
        id,
        lp_number,
        batch_number,
        expiry_date,
        location_id,
        quantity,
        uom,
        warehouse_id,
        product_id,
        status,
        warehouse:warehouses(id, code, name),
        product:products(id, code, name)
      `)
      .eq('org_id', orgId)
      .eq('warehouse_id', to.from_warehouse_id)
      .eq('product_id', toLine.product_id)
      .gt('quantity', 0)
      .eq('status', 'available')

    // Filter: Exclude expired LPs
    const today = new Date().toISOString().split('T')[0]
    query = query.or(`expiry_date.is.null,expiry_date.gte.${today}`)

    // Filter: lot_number
    if (filters?.lot_number) {
      query = query.ilike('batch_number', `%${filters.lot_number}%`)
    }

    // Filter: expiry_from
    if (filters?.expiry_from) {
      query = query.gte('expiry_date', filters.expiry_from)
    }

    // Filter: expiry_to
    if (filters?.expiry_to) {
      query = query.lte('expiry_date', filters.expiry_to)
    }

    // Filter: search (LP number)
    if (filters?.search) {
      query = query.ilike('lp_number', `%${filters.search}%`)
    }

    // Order by expiry date (FEFO) then created_at (FIFO)
    query = query.order('expiry_date', { ascending: true, nullsFirst: false })
    query = query.order('created_at', { ascending: true })

    const { data: lps, error } = await query

    if (error) {
      console.error('Error fetching available LPs:', error)
      return {
        success: false,
        error: 'Failed to fetch available LPs',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    // 4. Get LPs already assigned to OTHER TOs (exclude from available)
    const { data: assignedLps } = await supabaseAdmin
      .from('to_line_lps')
      .select('lp_id, to_line_id')

    // Get TO line IDs for the current TO
    const { data: currentToLines } = await supabaseAdmin
      .from('transfer_order_lines')
      .select('id')
      .eq('to_id', toId)

    const currentToLineIds = new Set(currentToLines?.map(l => l.id) || [])
    const assignedToOtherTOs = new Set(
      assignedLps
        ?.filter(a => !currentToLineIds.has(a.to_line_id))
        .map(a => a.lp_id) || []
    )

    // 5. Filter out LPs assigned to other TOs and map results
    const availableLps: AvailableLP[] = []

    for (const lp of lps || []) {
      if (assignedToOtherTOs.has(lp.id)) continue

      const locationName = await getLocationName(lp.location_id)

      availableLps.push({
        id: lp.id,
        lp_number: lp.lp_number,
        lot_number: lp.batch_number,
        expiry_date: lp.expiry_date,
        location: locationName,
        available_qty: lp.quantity,
        uom: lp.uom,
        warehouse: lp.warehouse as any,
        product: lp.product as any,
      })
    }

    return {
      success: true,
      data: {
        lps: availableLps,
        total_count: availableLps.length,
      },
    }
  } catch (error) {
    console.error('Error in getAvailableLPsForTOLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: TOLPErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// REMOVE LP FROM TO LINE
// ============================================================================

/**
 * Remove LP assignment from a Transfer Order line
 */
export async function removeLPFromTOLine(
  toId: string,
  toLineId: string,
  lpId: string
): Promise<ServiceResult<{ message: string }>> {
  try {
    const userData = await getCurrentUserData()
    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    const { orgId } = userData
    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Validate TO exists and belongs to org
    const to = await getTransferOrder(toId, orgId)
    if (!to) {
      return {
        success: false,
        error: 'Transfer order not found',
        code: TOLPErrorCode.TO_NOT_FOUND,
      }
    }

    // 2. Validate TO status is DRAFT or PLANNED
    if (!EDITABLE_STATUSES.includes(to.status)) {
      return {
        success: false,
        error: `Cannot remove LP from ${to.status} Transfer Order`,
        code: TOLPErrorCode.INVALID_STATUS,
      }
    }

    // 3. Validate TO line exists and belongs to TO
    const toLine = await getTOLine(toLineId, toId)
    if (!toLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: TOLPErrorCode.TO_LINE_NOT_FOUND,
      }
    }

    // 4. Check if assignment exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('to_line_lps')
      .select('id, lp_id')
      .eq('to_line_id', toLineId)
      .eq('lp_id', lpId)
      .single()

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Assignment not found',
        code: TOLPErrorCode.ASSIGNMENT_NOT_FOUND,
      }
    }

    // 5. Delete assignment
    const { error: deleteError } = await supabaseAdmin
      .from('to_line_lps')
      .delete()
      .eq('id', existing.id)

    if (deleteError) {
      console.error('Error deleting LP assignment:', deleteError)
      return {
        success: false,
        error: 'Failed to remove LP assignment',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    return {
      success: true,
      data: {
        message: 'LP removed successfully',
      },
    }
  } catch (error) {
    console.error('Error in removeLPFromTOLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: TOLPErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// GET LP ASSIGNMENTS FOR TO LINE
// ============================================================================

/**
 * Get all LP assignments for a Transfer Order line
 */
export async function getLPAssignmentsForTOLine(
  toId: string,
  toLineId: string
): Promise<ServiceResult<LPAssignmentsResult>> {
  try {
    const userData = await getCurrentUserData()
    if (!userData) {
      return {
        success: false,
        error: 'User not authenticated',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    const { orgId } = userData
    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Validate TO exists and belongs to org
    const to = await getTransferOrder(toId, orgId)
    if (!to) {
      return {
        success: false,
        error: 'Transfer order not found',
        code: TOLPErrorCode.TO_NOT_FOUND,
      }
    }

    // 2. Validate TO line exists and belongs to TO
    const toLine = await getTOLine(toLineId, toId)
    if (!toLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: TOLPErrorCode.TO_LINE_NOT_FOUND,
      }
    }

    // 3. Get assignments with LP details
    const { data: dbAssignments, error } = await supabaseAdmin
      .from('to_line_lps')
      .select(`
        id,
        to_line_id,
        lp_id,
        quantity,
        license_plate:license_plates(
          id,
          lp_number,
          batch_number,
          expiry_date,
          location_id,
          product:products(id, code, name)
        )
      `)
      .eq('to_line_id', toLineId)

    if (error) {
      console.error('Error fetching LP assignments:', error)
      return {
        success: false,
        error: 'Failed to fetch LP assignments',
        code: TOLPErrorCode.DATABASE_ERROR,
      }
    }

    // 4. Map results
    const assignments: TOLineLPAssignment[] = []

    for (const assignment of dbAssignments || []) {
      const lp = assignment.license_plate as any
      if (!lp) continue

      const locationName = await getLocationName(lp.location_id)

      assignments.push({
        id: assignment.id,
        to_line_id: assignment.to_line_id,
        lp_id: assignment.lp_id,
        lp_number: lp.lp_number,
        lot_number: lp.batch_number,
        expiry_date: lp.expiry_date,
        location: locationName,
        quantity: assignment.quantity,
        product: lp.product,
      })
    }

    // 5. Calculate totals
    const totalAssigned = assignments.reduce((sum, a) => sum + a.quantity, 0)
    const totalRequired = toLine.quantity
    const isComplete = totalAssigned >= totalRequired

    return {
      success: true,
      data: {
        assignments,
        total_assigned: totalAssigned,
        total_required: totalRequired,
        is_complete: isComplete,
      },
    }
  } catch (error) {
    console.error('Error in getLPAssignmentsForTOLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: TOLPErrorCode.DATABASE_ERROR,
    }
  }
}
