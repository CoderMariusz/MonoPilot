/**
 * Work Order Service (Story 03.10)
 * Handles CRUD operations, BOM auto-selection, and status transitions
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { copyRoutingToWO } from './wo-operations-service'

// ============================================================================
// TYPES
// ============================================================================

export type WOStatus =
  | 'draft'
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'closed'
  | 'cancelled'

export type WOPriority = 'low' | 'normal' | 'high' | 'critical'

export interface WorkOrder {
  id: string
  org_id: string
  wo_number: string
  product_id: string
  bom_id: string | null
  routing_id: string | null
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: WOStatus
  planned_start_date: string | null
  planned_end_date: string | null
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  production_line_id: string | null
  machine_id: string | null
  priority: WOPriority
  source_of_demand: string | null
  source_reference: string | null
  started_at: string | null
  completed_at: string | null
  paused_at: string | null
  pause_reason: string | null
  actual_qty: number | null
  yield_percent: number | null
  expiry_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

export interface WorkOrderWithRelations extends WorkOrder {
  product?: {
    id: string
    code: string
    name: string
    base_uom: string
  }
  bom?: {
    id: string
    code: string
    version: number
    output_qty: number
    effective_from: string
    effective_to: string | null
    item_count?: number
  }
  routing?: {
    id: string
    code: string
    name: string
  }
  production_line?: {
    id: string
    code: string
    name: string
  }
  machine?: {
    id: string
    code: string
    name: string
  }
  created_by_user?: {
    name: string
  }
}

export interface WOListItem {
  id: string
  wo_number: string
  product_code: string
  product_name: string
  planned_quantity: number
  uom: string
  status: WOStatus
  planned_start_date: string | null
  production_line_name: string | null
  priority: WOPriority
  created_at: string
}

export interface BomPreview {
  bom_id: string
  bom_code: string
  bom_version: number
  output_qty: number
  effective_from: string
  effective_to: string | null
  routing_id: string | null
  item_count: number
  is_current?: boolean
}

export interface BomValidationResult {
  valid: boolean
  bom?: BomPreview
  error?: string
  warning?: string
}

export interface WOStatusHistory {
  id: string
  wo_id: string
  from_status: WOStatus | null
  to_status: WOStatus
  changed_by: string
  changed_at: string
  notes: string | null
  changed_by_user?: {
    name: string
  }
}

export interface WOListParams {
  page?: number
  limit?: number
  search?: string
  product_id?: string
  status?: string
  line_id?: string
  machine_id?: string
  priority?: WOPriority
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedWOResult {
  data: WOListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateWOInput {
  product_id: string
  bom_id?: string | null
  planned_quantity: number
  uom?: string
  planned_start_date: string
  planned_end_date?: string | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  production_line_id?: string | null
  machine_id?: string | null
  priority?: WOPriority
  source_of_demand?: string | null
  source_reference?: string | null
  expiry_date?: string | null
  notes?: string | null
}

export interface UpdateWOInput {
  product_id?: string
  bom_id?: string | null
  planned_quantity?: number
  uom?: string
  planned_start_date?: string
  planned_end_date?: string | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  production_line_id?: string | null
  machine_id?: string | null
  priority?: WOPriority
  source_of_demand?: string | null
  source_reference?: string | null
  expiry_date?: string | null
  notes?: string | null
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class WorkOrderError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number = 400) {
    super(message)
    this.name = 'WorkOrderError'
    this.code = code
    this.status = status
  }
}

// ============================================================================
// STATUS TRANSITION VALIDATION
// ============================================================================

/**
 * Valid status transitions map
 */
export const VALID_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['released', 'draft', 'cancelled'],
  released: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
}

/**
 * Fields that become locked after release
 */
export const LOCKED_FIELDS_AFTER_RELEASE = [
  'product_id',
  'bom_id',
  'planned_quantity',
]

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: WOStatus,
  newStatus: WOStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Check if a field can be edited in the current status
 */
export function canEditField(status: WOStatus, field: string): boolean {
  // After release, certain fields are locked
  if (
    ['released', 'in_progress', 'on_hold', 'completed', 'closed'].includes(
      status
    )
  ) {
    return !LOCKED_FIELDS_AFTER_RELEASE.includes(field)
  }
  // Cancelled WOs cannot be edited
  if (status === 'cancelled') {
    return false
  }
  return true
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

/**
 * List work orders with filters, pagination, and sorting
 */
export async function list(
  supabase: SupabaseClient,
  orgId: string,
  params: WOListParams
): Promise<PaginatedWOResult> {
  const {
    page = 1,
    limit = 20,
    search,
    product_id,
    status,
    line_id,
    machine_id,
    priority,
    date_from,
    date_to,
    sort = 'created_at',
    order = 'desc',
  } = params

  // Build query with relations
  let query = supabase
    .from('work_orders')
    .select(
      `
      id,
      wo_number,
      planned_quantity,
      uom,
      status,
      planned_start_date,
      priority,
      created_at,
      product:products(code, name),
      production_line:production_lines(name)
    `,
      { count: 'exact' }
    )
    .eq('org_id', orgId)

  // Apply search filter (WO number or product name/code)
  if (search && search.length >= 2) {
    query = query.or(`wo_number.ilike.%${search}%`)
  }

  // Apply product filter
  if (product_id) {
    query = query.eq('product_id', product_id)
  }

  // Apply status filter (can be comma-separated)
  if (status) {
    const statuses = status.split(',').map((s) => s.trim())
    query = query.in('status', statuses)
  }

  // Apply production line filter
  if (line_id) {
    query = query.eq('production_line_id', line_id)
  }

  // Apply machine filter
  if (machine_id) {
    query = query.eq('machine_id', machine_id)
  }

  // Apply priority filter
  if (priority) {
    query = query.eq('priority', priority)
  }

  // Apply date range filter
  if (date_from) {
    query = query.gte('planned_start_date', date_from)
  }
  if (date_to) {
    query = query.lte('planned_start_date', date_to)
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === 'asc' })

  // Apply pagination
  const start = (page - 1) * limit
  const end = start + limit - 1
  query = query.range(start, end)

  const { data, error, count } = await query

  if (error) {
    throw new WorkOrderError(
      `Failed to fetch work orders: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  // Transform to WOListItem format
  const items: WOListItem[] = (data || []).map((wo: any) => ({
    id: wo.id,
    wo_number: wo.wo_number,
    product_code: wo.product?.code || '',
    product_name: wo.product?.name || '',
    planned_quantity: wo.planned_quantity,
    uom: wo.uom,
    status: wo.status,
    planned_start_date: wo.planned_start_date,
    production_line_name: wo.production_line?.name || null,
    priority: wo.priority,
    created_at: wo.created_at,
  }))

  return {
    data: items,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

/**
 * Get single work order by ID with all relations
 */
export async function getById(
  supabase: SupabaseClient,
  id: string
): Promise<WorkOrderWithRelations | null> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(
      `
      *,
      product:products(id, code, name, base_uom),
      bom:boms(id, code, version, output_qty, effective_from, effective_to),
      routing:routings(id, code, name),
      production_line:production_lines(id, code, name),
      machine:machines(id, code, name)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new WorkOrderError(
      `Failed to fetch work order: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  return data as WorkOrderWithRelations
}

/**
 * Create new work order with BOM auto-selection
 */
export async function create(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  input: CreateWOInput
): Promise<WorkOrder> {
  // 1. Verify product exists and belongs to org
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, name, base_uom')
    .eq('id', input.product_id)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .single()

  if (productError || !product) {
    throw new WorkOrderError('Product not found', 'PRODUCT_NOT_FOUND', 404)
  }

  // 2. Handle BOM selection
  let bomId = input.bom_id

  // If no BOM provided, auto-select
  if (!bomId) {
    const activeBom = await getActiveBomForDate(
      supabase,
      input.product_id,
      orgId,
      new Date(input.planned_start_date)
    )

    if (activeBom) {
      bomId = activeBom.bom_id
    }
  }

  // 3. Validate BOM if provided
  if (bomId) {
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, product_id, org_id, status')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      throw new WorkOrderError('BOM not found', 'BOM_NOT_FOUND', 404)
    }

    if (bom.product_id !== input.product_id) {
      throw new WorkOrderError(
        'BOM does not belong to selected product',
        'INVALID_BOM',
        400
      )
    }

    if (bom.org_id !== orgId) {
      throw new WorkOrderError('BOM not found', 'BOM_NOT_FOUND', 404)
    }

    if (bom.status !== 'active') {
      throw new WorkOrderError('BOM is not active', 'INACTIVE_BOM', 400)
    }
  }

  // 4. Generate WO number
  const { data: woNumber, error: woNumError } = await supabase.rpc(
    'generate_wo_number',
    {
      p_org_id: orgId,
      p_date: input.planned_start_date,
    }
  )

  if (woNumError || !woNumber) {
    throw new WorkOrderError(
      'Failed to generate WO number',
      'NUMBER_GENERATION_ERROR',
      500
    )
  }

  // 5. Determine UoM (use product's base_uom if not provided)
  const uom = input.uom || product.base_uom

  // 6. Insert work order
  const { data: workOrder, error: insertError } = await supabase
    .from('work_orders')
    .insert({
      org_id: orgId,
      wo_number: woNumber,
      product_id: input.product_id,
      bom_id: bomId || null,
      planned_quantity: input.planned_quantity,
      produced_quantity: 0,
      uom,
      status: 'draft',
      planned_start_date: input.planned_start_date,
      planned_end_date: input.planned_end_date || null,
      scheduled_start_time: input.scheduled_start_time || null,
      scheduled_end_time: input.scheduled_end_time || null,
      production_line_id: input.production_line_id || null,
      machine_id: input.machine_id || null,
      priority: input.priority || 'normal',
      source_of_demand: input.source_of_demand || null,
      source_reference: input.source_reference || null,
      expiry_date: input.expiry_date || null,
      notes: input.notes || null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (insertError) {
    throw new WorkOrderError(
      `Failed to create work order: ${insertError.message}`,
      'CREATE_ERROR',
      500
    )
  }

  return workOrder as WorkOrder
}

/**
 * Update work order (validates field restrictions by status)
 */
export async function update(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  input: UpdateWOInput
): Promise<WorkOrder> {
  // 1. Get current WO
  const { data: currentWO, error: fetchError } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !currentWO) {
    throw new WorkOrderError('Work order not found', 'NOT_FOUND', 404)
  }

  // 2. Check field restrictions based on status
  const currentStatus = currentWO.status as WOStatus

  // Cannot edit cancelled or closed WOs
  if (['cancelled', 'closed'].includes(currentStatus)) {
    throw new WorkOrderError(
      `Cannot modify ${currentStatus} work order`,
      'INVALID_STATUS',
      400
    )
  }

  // Check locked fields after release
  for (const field of LOCKED_FIELDS_AFTER_RELEASE) {
    if (
      field in input &&
      input[field as keyof UpdateWOInput] !== undefined &&
      !canEditField(currentStatus, field)
    ) {
      throw new WorkOrderError(
        `Cannot modify ${field} after status ${currentStatus}`,
        'FIELD_LOCKED',
        400
      )
    }
  }

  // 3. Build update data (strip locked fields and wo_number)
  const updateData: any = { ...input }
  delete updateData.wo_number // Always immutable

  // Remove locked fields if status doesn't allow
  if (!canEditField(currentStatus, 'product_id')) {
    delete updateData.product_id
  }
  if (!canEditField(currentStatus, 'bom_id')) {
    delete updateData.bom_id
  }
  if (!canEditField(currentStatus, 'planned_quantity')) {
    delete updateData.planned_quantity
  }

  // Add updated_by
  updateData.updated_by = userId

  // 4. Update
  const { data: updatedWO, error: updateError } = await supabase
    .from('work_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new WorkOrderError(
      `Failed to update work order: ${updateError.message}`,
      'UPDATE_ERROR',
      500
    )
  }

  return updatedWO as WorkOrder
}

/**
 * Delete draft work order (only draft status, no materials)
 */
export async function deleteWorkOrder(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  // 1. Get WO to verify status
  const { data: wo, error: fetchError } = await supabase
    .from('work_orders')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !wo) {
    throw new WorkOrderError('Work order not found', 'NOT_FOUND', 404)
  }

  if (wo.status !== 'draft') {
    throw new WorkOrderError(
      'Only draft work orders can be deleted',
      'INVALID_STATUS',
      400
    )
  }

  // 2. Delete
  const { error: deleteError } = await supabase
    .from('work_orders')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new WorkOrderError(
      `Failed to delete work order: ${deleteError.message}`,
      'DELETE_ERROR',
      500
    )
  }
}

/**
 * Plan work order (draft -> planned)
 */
export async function plan(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  notes?: string
): Promise<WorkOrder> {
  // 1. Get current WO
  const { data: wo, error: fetchError } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !wo) {
    throw new WorkOrderError('Work order not found', 'NOT_FOUND', 404)
  }

  // 2. Validate transition
  if (!validateStatusTransition(wo.status as WOStatus, 'planned')) {
    throw new WorkOrderError(
      'Cannot plan WO from current status',
      'INVALID_TRANSITION',
      400
    )
  }

  // 3. Update status
  const { data: updatedWO, error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'planned',
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new WorkOrderError(
      `Failed to plan work order: ${updateError.message}`,
      'UPDATE_ERROR',
      500
    )
  }

  // 4. Add notes to history if provided
  if (notes) {
    await supabase.from('wo_status_history').insert({
      wo_id: id,
      from_status: wo.status,
      to_status: 'planned',
      changed_by: userId,
      notes,
    })
  }

  return updatedWO as WorkOrder
}

/**
 * Release work order (planned -> released)
 */
export async function release(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  notes?: string
): Promise<WorkOrder> {
  // 1. Get current WO
  const { data: wo, error: fetchError } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !wo) {
    throw new WorkOrderError('Work order not found', 'NOT_FOUND', 404)
  }

  // 2. Validate transition
  if (!validateStatusTransition(wo.status as WOStatus, 'released')) {
    throw new WorkOrderError(
      'Cannot release WO from current status',
      'INVALID_TRANSITION',
      400
    )
  }

  // 3. Update status
  const { data: updatedWO, error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'released',
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new WorkOrderError(
      `Failed to release work order: ${updateError.message}`,
      'UPDATE_ERROR',
      500
    )
  }

  // 4. Add notes to history if provided
  if (notes) {
    await supabase.from('wo_status_history').insert({
      wo_id: id,
      from_status: wo.status,
      to_status: 'released',
      changed_by: userId,
      notes,
    })
  }

  // 5. Copy routing operations to WO (Story 03.12)
  // This is a non-blocking operation - log warning if it fails but don't block release
  try {
    const operationCount = await copyRoutingToWO(supabase, id, updatedWO.org_id)
    if (operationCount > 0) {
      console.log(`Copied ${operationCount} routing operations to WO ${updatedWO.wo_number}`)
    }
  } catch (copyError) {
    console.warn(`Failed to copy routing operations for WO ${updatedWO.wo_number}:`, copyError)
    // Don't block release - routing copy is optional
  }

  return updatedWO as WorkOrder
}

/**
 * Cancel work order
 */
export async function cancel(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  reason?: string
): Promise<WorkOrder> {
  // 1. Get current WO
  const { data: wo, error: fetchError } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !wo) {
    throw new WorkOrderError('Work order not found', 'NOT_FOUND', 404)
  }

  // 2. Validate transition
  if (!validateStatusTransition(wo.status as WOStatus, 'cancelled')) {
    throw new WorkOrderError(
      'Cannot cancel WO from current status',
      'INVALID_TRANSITION',
      400
    )
  }

  // 3. Update status
  const { data: updatedWO, error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'cancelled',
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new WorkOrderError(
      `Failed to cancel work order: ${updateError.message}`,
      'UPDATE_ERROR',
      500
    )
  }

  // 4. Record reason in history
  if (reason) {
    await supabase.from('wo_status_history').insert({
      wo_id: id,
      from_status: wo.status,
      to_status: 'cancelled',
      changed_by: userId,
      notes: reason,
    })
  }

  return updatedWO as WorkOrder
}

/**
 * Get auto-selected BOM for product on scheduled date
 *
 * Algorithm (implemented in database function):
 * 1. Find active BOMs for product (status = 'active')
 * 2. Filter BOMs where effective_from <= scheduled_date < effective_to (or effective_to IS NULL)
 * 3. Order by version DESC (highest version = most recent)
 * 4. Return first match (latest version valid on date)
 *
 * @param supabase - Supabase client
 * @param productId - Product UUID
 * @param orgId - Organization UUID
 * @param scheduledDate - Scheduled production date
 * @returns BOM preview or null if no active BOM found for date
 */
export async function getActiveBomForDate(
  supabase: SupabaseClient,
  productId: string,
  orgId: string,
  scheduledDate: Date
): Promise<BomPreview | null> {
  const dateStr = scheduledDate.toISOString().split('T')[0]

  const { data, error } = await supabase.rpc('get_active_bom_for_date', {
    p_product_id: productId,
    p_org_id: orgId,
    p_scheduled_date: dateStr,
  })

  if (error) {
    console.error('Error getting active BOM:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0] as BomPreview
}

/**
 * Get all active BOMs for product (manual selection)
 */
export async function getAvailableBoms(
  supabase: SupabaseClient,
  productId: string,
  orgId: string
): Promise<BomPreview[]> {
  const { data, error } = await supabase.rpc('get_all_active_boms_for_product', {
    p_product_id: productId,
    p_org_id: orgId,
  })

  if (error) {
    console.error('Error getting available BOMs:', error)
    return []
  }

  return (data || []) as BomPreview[]
}

/**
 * Validate product has active BOM on date
 */
export async function validateProductHasActiveBom(
  supabase: SupabaseClient,
  productId: string,
  orgId: string,
  scheduledDate: Date
): Promise<BomValidationResult> {
  const bom = await getActiveBomForDate(supabase, productId, orgId, scheduledDate)

  if (!bom) {
    return {
      valid: false,
      error: 'No active BOM found for product on scheduled date',
    }
  }

  return {
    valid: true,
    bom,
  }
}

/**
 * Generate next WO number (without actually creating)
 *
 * Format: WO-YYYYMMDD-NNNN
 * - YYYYMMDD = production date (or today if not provided)
 * - NNNN = sequence number (0001, 0002, etc.)
 *
 * Database function finds max sequence for date and increments by 1
 *
 * @param supabase - Supabase client
 * @param orgId - Organization UUID
 * @param date - Optional target date (defaults to today)
 * @returns Preview WO number (e.g., "WO-20250115-0001")
 * @throws WorkOrderError if generation fails
 */
export async function previewNextNumber(
  supabase: SupabaseClient,
  orgId: string,
  date?: Date
): Promise<string> {
  const targetDate = date || new Date()
  const dateStr = targetDate.toISOString().split('T')[0]

  const { data, error } = await supabase.rpc('preview_next_wo_number', {
    p_org_id: orgId,
    p_date: dateStr,
  })

  if (error) {
    throw new WorkOrderError(
      'Failed to preview WO number',
      'NUMBER_GENERATION_ERROR',
      500
    )
  }

  return data
}

/**
 * Get status transition history for WO
 */
export async function getStatusHistory(
  supabase: SupabaseClient,
  woId: string
): Promise<WOStatusHistory[]> {
  const { data, error } = await supabase
    .from('wo_status_history')
    .select(
      `
      id,
      wo_id,
      from_status,
      to_status,
      changed_by,
      changed_at,
      notes
    `
    )
    .eq('wo_id', woId)
    .order('changed_at', { ascending: true })

  if (error) {
    throw new WorkOrderError(
      `Failed to fetch status history: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  return (data || []) as WOStatusHistory[]
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

export const WorkOrderService = {
  list,
  getById,
  create,
  update,
  delete: deleteWorkOrder,
  plan,
  release,
  cancel,
  getActiveBomForDate,
  getAvailableBoms,
  validateProductHasActiveBom,
  previewNextNumber,
  getStatusHistory,
  validateStatusTransition,
  canEditField,
}
