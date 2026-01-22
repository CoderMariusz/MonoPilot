/**
 * RMA Service
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * Handles RMA CRUD operations with business logic:
 * - List RMAs with filters, search, and pagination
 * - Create/update/delete RMAs (pending status only)
 * - Line management (add/edit/delete)
 * - Approval workflow (pending -> approved)
 * - Close workflow (-> closed)
 * - Auto-suggest disposition based on reason code
 * - RLS enforcement via org_id
 *
 * @module rma-service
 */

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type {
  RMAFormInput,
  RMAUpdateInput,
  RMALineInput,
  RMAListParams,
  RMAReasonCode,
  RMADisposition,
  RMAStatus,
} from '../validation/rma-schemas'
import { REASON_TO_DISPOSITION } from '../validation/rma-schemas'

// ============================================================================
// TYPES
// ============================================================================

export interface RMA {
  id: string
  org_id: string
  rma_number: string
  customer_id: string
  customer_name?: string
  sales_order_id: string | null
  sales_order_number?: string | null
  reason_code: RMAReasonCode
  disposition: RMADisposition | null
  status: RMAStatus
  notes: string | null
  total_value: number | null
  approved_at: string | null
  approved_by: string | null
  approved_by_name?: string | null
  created_at: string
  created_by: string
  created_by_name?: string
  updated_at: string
}

export interface RMALine {
  id: string
  org_id: string
  rma_request_id: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity_expected: number
  quantity_received: number
  lot_number: string | null
  reason_notes: string | null
  disposition: RMADisposition | null
  created_at: string
}

export interface RMADetail extends RMA {
  lines: RMALine[]
  permissions: RMAPermissions
}

export interface RMAPermissions {
  can_edit: boolean
  can_delete: boolean
  can_approve: boolean
  can_close: boolean
  can_add_lines: boolean
}

export interface RMAListResult {
  rmas: RMA[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    pending_count: number
    approved_count: number
    total_count: number
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current user's org_id from JWT
 */
async function getCurrentOrgId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase()
    const authResult = await supabase.auth.getUser()
    const user = authResult?.data?.user

    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      console.error('Failed to get org_id for user:', user.id, error)
      return null
    }

    return userData.org_id
  } catch (error) {
    console.error('Error getting org_id:', error)
    return null
  }
}

/**
 * Get current user's ID and role
 */
async function getCurrentUser(): Promise<{ id: string; role: string } | null> {
  try {
    const supabase = await createServerSupabase()
    const authResult = await supabase.auth.getUser()
    const user = authResult?.data?.user

    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, role_id, roles:role_id(code)')
      .eq('id', user.id)
      .single()

    if (error || !userData) return null

    // Handle the roles relation which may be an array or single object
    const roles = userData.roles as unknown as { code: string } | { code: string }[] | null
    const roleCode = Array.isArray(roles)
      ? (roles[0]?.code || 'viewer')
      : (roles?.code || 'viewer')
    return { id: userData.id, role: roleCode }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user has MANAGER+ role
 */
function isManagerOrAbove(role: string): boolean {
  const managerRoles = ['manager', 'admin', 'owner']
  return managerRoles.includes(role.toLowerCase())
}

/**
 * Suggest disposition based on reason code
 */
export function suggestDisposition(reasonCode: RMAReasonCode): RMADisposition | null {
  return REASON_TO_DISPOSITION[reasonCode] ?? null
}

/**
 * Calculate permissions for an RMA based on status and user role
 */
function calculatePermissions(
  status: RMAStatus,
  userRole: string
): RMAPermissions {
  const isPending = status === 'pending'
  const isManager = isManagerOrAbove(userRole)
  const canClose = isManager && !['pending', 'closed'].includes(status)

  return {
    can_edit: isPending,
    can_delete: isPending,
    can_approve: isPending && isManager,
    can_close: canClose,
    can_add_lines: isPending,
  }
}

// ============================================================================
// LIST / GET
// ============================================================================

/**
 * List RMAs with filters, search, and pagination
 */
export async function listRMAs(params: RMAListParams = {}): Promise<RMAListResult> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  const {
    page = 1,
    limit = 20,
    search,
    status,
    reason_code,
    customer_id,
    date_from,
    date_to,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = params

  // Build query with joins
  let query = supabaseAdmin
    .from('rma_requests')
    .select(
      `
      *,
      customer:customers!rma_requests_customer_id_fkey(id, name),
      line_count:rma_lines(count)
    `,
      { count: 'exact' }
    )
    .eq('org_id', orgId)

  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }

  if (reason_code) {
    query = query.eq('reason_code', reason_code)
  }

  if (customer_id) {
    query = query.eq('customer_id', customer_id)
  }

  if (date_from) {
    query = query.gte('created_at', date_from)
  }

  if (date_to) {
    query = query.lte('created_at', date_to + 'T23:59:59.999Z')
  }

  // Apply search (RMA number or customer name)
  if (search && search.length >= 2) {
    const escapedSearch = search.replace(/[%_\\]/g, '\\$&')
    query = query.or(`rma_number.ilike.%${escapedSearch}%`)
  }

  // Apply sorting
  const ascending = sort_order === 'asc'
  if (sort_by === 'customer_name') {
    // Sort by customer name requires a different approach
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order(sort_by, { ascending })
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing RMAs:', error)
    throw new Error(`Failed to list RMAs: ${error.message}`)
  }

  // Get stats
  const { data: statsData } = await supabaseAdmin
    .from('rma_requests')
    .select('status')
    .eq('org_id', orgId)

  const stats = {
    pending_count: statsData?.filter((r) => r.status === 'pending').length ?? 0,
    approved_count: statsData?.filter((r) => r.status === 'approved').length ?? 0,
    total_count: statsData?.length ?? 0,
  }

  // Transform data
  const rmas: RMA[] = (data ?? []).map((row) => ({
    id: row.id,
    org_id: row.org_id,
    rma_number: row.rma_number,
    customer_id: row.customer_id,
    customer_name: row.customer?.name ?? 'Unknown',
    sales_order_id: row.sales_order_id,
    reason_code: row.reason_code,
    disposition: row.disposition,
    status: row.status,
    notes: row.notes,
    total_value: row.total_value,
    approved_at: row.approved_at,
    approved_by: row.approved_by,
    created_at: row.created_at,
    created_by: row.created_by,
    updated_at: row.updated_at,
  }))

  const total = count ?? 0
  const pages = Math.ceil(total / limit)

  return {
    rmas,
    pagination: {
      total,
      page,
      limit,
      pages,
    },
    stats,
  }
}

/**
 * Get RMA detail by ID with lines and permissions
 */
export async function getRMA(id: string): Promise<RMADetail | null> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error('User not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get RMA with customer info
  const { data: rma, error } = await supabaseAdmin
    .from('rma_requests')
    .select(
      `
      *,
      customer:customers!rma_requests_customer_id_fkey(id, name),
      sales_order:sales_orders!rma_requests_sales_order_id_fkey(id, order_number),
      creator:users!rma_requests_created_by_fkey(id, name),
      approver:users!rma_requests_approved_by_fkey(id, name)
    `
    )
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error getting RMA:', error)
    throw new Error(`Failed to get RMA: ${error.message}`)
  }

  // Get lines with product info
  const { data: lines, error: linesError } = await supabaseAdmin
    .from('rma_lines')
    .select(
      `
      *,
      product:products!rma_lines_product_id_fkey(id, name, code)
    `
    )
    .eq('rma_request_id', id)
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (linesError) {
    console.error('Error getting RMA lines:', linesError)
    throw new Error(`Failed to get RMA lines: ${linesError.message}`)
  }

  // Calculate permissions
  const permissions = calculatePermissions(rma.status, currentUser.role)

  return {
    id: rma.id,
    org_id: rma.org_id,
    rma_number: rma.rma_number,
    customer_id: rma.customer_id,
    customer_name: rma.customer?.name ?? 'Unknown',
    sales_order_id: rma.sales_order_id,
    sales_order_number: rma.sales_order?.order_number ?? null,
    reason_code: rma.reason_code,
    disposition: rma.disposition,
    status: rma.status,
    notes: rma.notes,
    total_value: rma.total_value,
    approved_at: rma.approved_at,
    approved_by: rma.approved_by,
    approved_by_name: rma.approver?.name ?? null,
    created_at: rma.created_at,
    created_by: rma.created_by,
    created_by_name: rma.creator?.name ?? 'Unknown',
    updated_at: rma.updated_at,
    lines: (lines ?? []).map((line) => ({
      id: line.id,
      org_id: line.org_id,
      rma_request_id: line.rma_request_id,
      product_id: line.product_id,
      product_name: line.product?.name ?? 'Unknown',
      product_code: line.product?.code ?? '',
      quantity_expected: line.quantity_expected,
      quantity_received: line.quantity_received,
      lot_number: line.lot_number,
      reason_notes: line.reason_notes,
      disposition: line.disposition,
      created_at: line.created_at,
    })),
    permissions,
  }
}

// ============================================================================
// CREATE / UPDATE / DELETE
// ============================================================================

/**
 * Create a new RMA with lines
 */
export async function createRMA(input: RMAFormInput): Promise<RMADetail> {
  const orgId = await getCurrentOrgId()
  const currentUser = await getCurrentUser()

  if (!orgId) {
    throw new Error('Organization not found')
  }

  if (!currentUser) {
    throw new Error('User not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Validate customer exists
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('id', input.customer_id)
    .eq('org_id', orgId)
    .single()

  if (customerError || !customer) {
    throw new Error('Customer not found')
  }

  // Validate products exist
  for (const line of input.lines) {
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', line.product_id)
      .eq('org_id', orgId)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${line.product_id}`)
    }
  }

  // Validate sales_order_id if provided
  if (input.sales_order_id) {
    const { data: so, error: soError } = await supabaseAdmin
      .from('sales_orders')
      .select('id')
      .eq('id', input.sales_order_id)
      .eq('org_id', orgId)
      .single()

    if (soError || !so) {
      throw new Error('Sales order not found')
    }
  }

  // Auto-suggest disposition if not provided
  const disposition = input.disposition ?? suggestDisposition(input.reason_code)

  // Calculate total value from lines
  // For now, we don't have price info, so leave as null
  const totalValue = null

  // Create RMA (rma_number auto-generated by trigger)
  const { data: rma, error: createError } = await supabaseAdmin
    .from('rma_requests')
    .insert({
      org_id: orgId,
      customer_id: input.customer_id,
      sales_order_id: input.sales_order_id ?? null,
      reason_code: input.reason_code,
      disposition,
      notes: input.notes ?? null,
      total_value: totalValue,
      status: 'pending',
      created_by: currentUser.id,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating RMA:', createError)
    throw new Error(`Failed to create RMA: ${createError.message}`)
  }

  // Create lines
  const linesToInsert = input.lines.map((line) => ({
    org_id: orgId,
    rma_request_id: rma.id,
    product_id: line.product_id,
    quantity_expected: line.quantity_expected,
    quantity_received: 0,
    lot_number: line.lot_number ?? null,
    reason_notes: line.reason_notes ?? null,
    disposition: line.disposition ?? null,
  }))

  const { error: linesError } = await supabaseAdmin
    .from('rma_lines')
    .insert(linesToInsert)

  if (linesError) {
    // Rollback: delete the RMA
    await supabaseAdmin.from('rma_requests').delete().eq('id', rma.id)
    console.error('Error creating RMA lines:', linesError)
    throw new Error(`Failed to create RMA lines: ${linesError.message}`)
  }

  // Return full RMA detail
  const result = await getRMA(rma.id)
  if (!result) {
    throw new Error('Failed to retrieve created RMA')
  }

  return result
}

/**
 * Update an existing RMA (pending status only)
 */
export async function updateRMA(
  id: string,
  input: RMAUpdateInput
): Promise<RMADetail> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get current RMA
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('rma_requests')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !current) {
    throw new Error('RMA not found')
  }

  // Check status
  if (current.status !== 'pending') {
    throw new Error('Cannot edit non-pending RMA')
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {}

  if (input.reason_code !== undefined) {
    updatePayload.reason_code = input.reason_code
  }
  if (input.disposition !== undefined) {
    updatePayload.disposition = input.disposition
  }
  if (input.notes !== undefined) {
    updatePayload.notes = input.notes
  }

  // Update RMA
  const { error: updateError } = await supabaseAdmin
    .from('rma_requests')
    .update(updatePayload)
    .eq('id', id)
    .eq('org_id', orgId)

  if (updateError) {
    console.error('Error updating RMA:', updateError)
    throw new Error(`Failed to update RMA: ${updateError.message}`)
  }

  // Return updated RMA detail
  const result = await getRMA(id)
  if (!result) {
    throw new Error('Failed to retrieve updated RMA')
  }

  return result
}

/**
 * Delete an RMA (pending status only, cascades to lines)
 */
export async function deleteRMA(id: string): Promise<void> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get current RMA
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('rma_requests')
    .select('status')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !current) {
    throw new Error('RMA not found')
  }

  // Check status
  if (current.status !== 'pending') {
    throw new Error('Cannot delete non-pending RMA')
  }

  // Delete RMA (lines cascade delete)
  const { error: deleteError } = await supabaseAdmin
    .from('rma_requests')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (deleteError) {
    console.error('Error deleting RMA:', deleteError)
    throw new Error(`Failed to delete RMA: ${deleteError.message}`)
  }
}

// ============================================================================
// LINE MANAGEMENT
// ============================================================================

/**
 * Add a line to an RMA (pending status only)
 */
export async function addRMALine(
  rmaId: string,
  input: RMALineInput
): Promise<RMALine> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get RMA and check status
  const { data: rma, error: rmaError } = await supabaseAdmin
    .from('rma_requests')
    .select('id, org_id, status')
    .eq('id', rmaId)
    .eq('org_id', orgId)
    .single()

  if (rmaError || !rma) {
    throw new Error('RMA not found')
  }

  if (rma.status !== 'pending') {
    throw new Error('Cannot modify non-pending RMA')
  }

  // Validate product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name, code')
    .eq('id', input.product_id)
    .eq('org_id', orgId)
    .single()

  if (productError || !product) {
    throw new Error('Product not found')
  }

  // Create line
  const { data: line, error: lineError } = await supabaseAdmin
    .from('rma_lines')
    .insert({
      org_id: orgId,
      rma_request_id: rmaId,
      product_id: input.product_id,
      quantity_expected: input.quantity_expected,
      quantity_received: 0,
      lot_number: input.lot_number ?? null,
      reason_notes: input.reason_notes ?? null,
      disposition: input.disposition ?? null,
    })
    .select()
    .single()

  if (lineError) {
    console.error('Error adding RMA line:', lineError)
    throw new Error(`Failed to add RMA line: ${lineError.message}`)
  }

  return {
    id: line.id,
    org_id: line.org_id,
    rma_request_id: line.rma_request_id,
    product_id: line.product_id,
    product_name: product.name,
    product_code: product.code,
    quantity_expected: line.quantity_expected,
    quantity_received: line.quantity_received,
    lot_number: line.lot_number,
    reason_notes: line.reason_notes,
    disposition: line.disposition,
    created_at: line.created_at,
  }
}

/**
 * Update an RMA line (pending RMA only)
 */
export async function updateRMALine(
  rmaId: string,
  lineId: string,
  input: Partial<Omit<RMALineInput, 'product_id'>>
): Promise<RMALine> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get RMA and check status
  const { data: rma, error: rmaError } = await supabaseAdmin
    .from('rma_requests')
    .select('id, status')
    .eq('id', rmaId)
    .eq('org_id', orgId)
    .single()

  if (rmaError || !rma) {
    throw new Error('RMA not found')
  }

  if (rma.status !== 'pending') {
    throw new Error('Cannot modify non-pending RMA')
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {}

  if (input.quantity_expected !== undefined) {
    updatePayload.quantity_expected = input.quantity_expected
  }
  if (input.lot_number !== undefined) {
    updatePayload.lot_number = input.lot_number
  }
  if (input.reason_notes !== undefined) {
    updatePayload.reason_notes = input.reason_notes
  }
  if (input.disposition !== undefined) {
    updatePayload.disposition = input.disposition
  }

  // Update line
  const { data: line, error: updateError } = await supabaseAdmin
    .from('rma_lines')
    .update(updatePayload)
    .eq('id', lineId)
    .eq('rma_request_id', rmaId)
    .eq('org_id', orgId)
    .select(
      `
      *,
      product:products!rma_lines_product_id_fkey(id, name, code)
    `
    )
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      throw new Error('RMA line not found')
    }
    console.error('Error updating RMA line:', updateError)
    throw new Error(`Failed to update RMA line: ${updateError.message}`)
  }

  return {
    id: line.id,
    org_id: line.org_id,
    rma_request_id: line.rma_request_id,
    product_id: line.product_id,
    product_name: line.product?.name ?? 'Unknown',
    product_code: line.product?.code ?? '',
    quantity_expected: line.quantity_expected,
    quantity_received: line.quantity_received,
    lot_number: line.lot_number,
    reason_notes: line.reason_notes,
    disposition: line.disposition,
    created_at: line.created_at,
  }
}

/**
 * Delete an RMA line (pending RMA only)
 */
export async function deleteRMALine(rmaId: string, lineId: string): Promise<void> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get RMA and check status
  const { data: rma, error: rmaError } = await supabaseAdmin
    .from('rma_requests')
    .select('id, status')
    .eq('id', rmaId)
    .eq('org_id', orgId)
    .single()

  if (rmaError || !rma) {
    throw new Error('RMA not found')
  }

  if (rma.status !== 'pending') {
    throw new Error('Cannot modify non-pending RMA')
  }

  // Delete line
  const { error: deleteError } = await supabaseAdmin
    .from('rma_lines')
    .delete()
    .eq('id', lineId)
    .eq('rma_request_id', rmaId)
    .eq('org_id', orgId)

  if (deleteError) {
    console.error('Error deleting RMA line:', deleteError)
    throw new Error(`Failed to delete RMA line: ${deleteError.message}`)
  }
}

// ============================================================================
// WORKFLOW
// ============================================================================

/**
 * Approve an RMA (pending -> approved, MANAGER+ only)
 */
export async function approveRMA(id: string): Promise<RMADetail> {
  const orgId = await getCurrentOrgId()
  const currentUser = await getCurrentUser()

  if (!orgId) {
    throw new Error('Organization not found')
  }

  if (!currentUser) {
    throw new Error('User not found')
  }

  // Check role
  if (!isManagerOrAbove(currentUser.role)) {
    throw new Error('Only MANAGER+ can approve')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get RMA and check status
  const { data: rma, error: rmaError } = await supabaseAdmin
    .from('rma_requests')
    .select('id, status')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (rmaError || !rma) {
    throw new Error('RMA not found')
  }

  if (rma.status !== 'pending') {
    throw new Error('RMA is not pending')
  }

  // Check that RMA has at least one line
  const { count: lineCount } = await supabaseAdmin
    .from('rma_lines')
    .select('*', { count: 'exact', head: true })
    .eq('rma_request_id', id)
    .eq('org_id', orgId)

  if (!lineCount || lineCount === 0) {
    throw new Error('RMA must have at least one line')
  }

  // Update status to approved
  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('rma_requests')
    .update({
      status: 'approved',
      approved_at: now,
      approved_by: currentUser.id,
    })
    .eq('id', id)
    .eq('org_id', orgId)

  if (updateError) {
    console.error('Error approving RMA:', updateError)
    throw new Error(`Failed to approve RMA: ${updateError.message}`)
  }

  // Return updated RMA
  const result = await getRMA(id)
  if (!result) {
    throw new Error('Failed to retrieve approved RMA')
  }

  return result
}

/**
 * Close an RMA (final status, MANAGER+ only)
 */
export async function closeRMA(id: string): Promise<RMADetail> {
  const orgId = await getCurrentOrgId()
  const currentUser = await getCurrentUser()

  if (!orgId) {
    throw new Error('Organization not found')
  }

  if (!currentUser) {
    throw new Error('User not found')
  }

  // Check role
  if (!isManagerOrAbove(currentUser.role)) {
    throw new Error('Only MANAGER+ can close')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get RMA and check status
  const { data: rma, error: rmaError } = await supabaseAdmin
    .from('rma_requests')
    .select('id, status')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (rmaError || !rma) {
    throw new Error('RMA not found')
  }

  // Can close from approved, receiving, received, or processed
  const closableStatuses = ['approved', 'receiving', 'received', 'processed']
  if (!closableStatuses.includes(rma.status)) {
    if (rma.status === 'pending') {
      throw new Error('Cannot close pending RMA - must be approved first')
    }
    if (rma.status === 'closed') {
      throw new Error('RMA is already closed')
    }
    throw new Error(`Cannot close RMA from status: ${rma.status}`)
  }

  // Update status to closed
  const { error: updateError } = await supabaseAdmin
    .from('rma_requests')
    .update({ status: 'closed' })
    .eq('id', id)
    .eq('org_id', orgId)

  if (updateError) {
    console.error('Error closing RMA:', updateError)
    throw new Error(`Failed to close RMA: ${updateError.message}`)
  }

  // Return updated RMA
  const result = await getRMA(id)
  if (!result) {
    throw new Error('Failed to retrieve closed RMA')
  }

  return result
}

// ============================================================================
// STATIC CLASS EXPORTS (for compatibility)
// ============================================================================

export class RMAService {
  static listRMAs = listRMAs
  static getRMA = getRMA
  static createRMA = createRMA
  static updateRMA = updateRMA
  static deleteRMA = deleteRMA
  static addRMALine = addRMALine
  static updateRMALine = updateRMALine
  static deleteRMALine = deleteRMALine
  static approveRMA = approveRMA
  static closeRMA = closeRMA
  static suggestDisposition = suggestDisposition
}
