/**
 * License Plate Service
 * Epic 5 Batch 05A-1: LP Core (Stories 5.1-5.4)
 */

import { createAdminClient } from '../supabase/admin-client'

// Types
export interface LicensePlate {
  id: string
  org_id: string
  lp_number: string
  batch_number?: string
  supplier_batch_number?: string
  product_id: string
  quantity: number
  current_qty: number
  uom: string
  status: LPStatus
  qa_status: QAStatus
  location_id?: string
  warehouse_id?: string
  manufacturing_date?: string
  expiry_date?: string
  received_date?: string
  consumed_by_wo_id?: string
  consumed_at?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  // Joins
  product?: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
  location?: {
    id: string
    code: string
    name: string
  }
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

export type LPStatus = 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged' | 'split'
export type QAStatus = 'pending' | 'passed' | 'failed' | 'on_hold'

export interface CreateLPInput {
  product_id: string
  quantity: number
  uom: string
  warehouse_id: string
  location_id?: string
  batch_number?: string
  supplier_batch_number?: string
  manufacturing_date?: string
  expiry_date?: string
  received_date?: string
  qa_status?: QAStatus
  status?: LPStatus
}

export interface UpdateLPInput {
  batch_number?: string
  supplier_batch_number?: string
  location_id?: string
  warehouse_id?: string
  qa_status?: QAStatus
  expiry_date?: string
  manufacturing_date?: string
}

export interface LPFilter {
  status?: LPStatus | LPStatus[]
  qa_status?: QAStatus | QAStatus[]
  product_id?: string
  warehouse_id?: string
  location_id?: string
  batch_number?: string
  expiry_before?: string
  expiry_after?: string
  search?: string
  limit?: number
  offset?: number
}

// ============================================
// Story 5.1: LP Creation
// ============================================

/**
 * Create a new License Plate (AC-5.1.1, AC-5.1.2)
 */
export async function createLP(
  input: CreateLPInput,
  orgId: string,
  userId: string
): Promise<LicensePlate> {
  const supabase = createAdminClient()

  // Generate LP number using database function (Story 5.4)
  const { data: lpNumber, error: seqError } = await supabase.rpc('generate_lp_number', {
    p_org_id: orgId,
    p_warehouse_id: input.warehouse_id,
  })

  if (seqError) {
    // Fallback to simple generation
    const fallbackNumber = `LP-${Date.now().toString(36).toUpperCase()}`
    console.warn('LP number generation failed, using fallback:', fallbackNumber)
  }

  const { data, error } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: lpNumber || `LP-${Date.now().toString(36).toUpperCase()}`,
      product_id: input.product_id,
      quantity: input.quantity,
      current_qty: input.quantity,
      uom: input.uom,
      status: input.status || 'available',
      qa_status: input.qa_status || 'pending',
      warehouse_id: input.warehouse_id,
      location_id: input.location_id,
      batch_number: input.batch_number,
      supplier_batch_number: input.supplier_batch_number,
      manufacturing_date: input.manufacturing_date,
      expiry_date: input.expiry_date,
      received_date: input.received_date || new Date().toISOString().split('T')[0],
      created_by: userId,
    })
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create LP: ${error.message}`)
  }

  return data
}

/**
 * Get LP by ID (AC-5.1.3)
 */
export async function getLP(lpId: string): Promise<LicensePlate | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .eq('id', lpId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get LP: ${error.message}`)
  }

  return data
}

/**
 * Get LP by number (AC-5.1.4)
 */
export async function getLPByNumber(lpNumber: string, orgId: string): Promise<LicensePlate | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .eq('lp_number', lpNumber)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get LP: ${error.message}`)
  }

  return data
}

/**
 * List LPs with filters (AC-5.1.5)
 */
export async function listLPs(
  orgId: string,
  filter: LPFilter = {}
): Promise<{ data: LicensePlate[]; count: number }> {
  const supabase = createAdminClient()

  let query = supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `, { count: 'exact' })
    .eq('org_id', orgId)

  // Apply filters
  if (filter.status) {
    if (Array.isArray(filter.status)) {
      query = query.in('status', filter.status)
    } else {
      query = query.eq('status', filter.status)
    }
  }

  if (filter.qa_status) {
    if (Array.isArray(filter.qa_status)) {
      query = query.in('qa_status', filter.qa_status)
    } else {
      query = query.eq('qa_status', filter.qa_status)
    }
  }

  if (filter.product_id) {
    query = query.eq('product_id', filter.product_id)
  }

  if (filter.warehouse_id) {
    query = query.eq('warehouse_id', filter.warehouse_id)
  }

  if (filter.location_id) {
    query = query.eq('location_id', filter.location_id)
  }

  if (filter.batch_number) {
    query = query.ilike('batch_number', `%${filter.batch_number}%`)
  }

  if (filter.expiry_before) {
    query = query.lte('expiry_date', filter.expiry_before)
  }

  if (filter.expiry_after) {
    query = query.gte('expiry_date', filter.expiry_after)
  }

  if (filter.search) {
    query = query.or(`lp_number.ilike.%${filter.search}%,batch_number.ilike.%${filter.search}%`)
  }

  // Pagination
  const limit = filter.limit || 50
  const offset = filter.offset || 0
  query = query.range(offset, offset + limit - 1)

  // Order by created_at desc (newest first)
  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list LPs: ${error.message}`)
  }

  return { data: data || [], count: count || 0 }
}

/**
 * Update LP (AC-5.1.6)
 */
export async function updateLP(
  lpId: string,
  input: UpdateLPInput,
  userId: string
): Promise<LicensePlate> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('license_plates')
    .update({
      ...input,
      updated_by: userId,
    })
    .eq('id', lpId)
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update LP: ${error.message}`)
  }

  return data
}

// ============================================
// Story 5.2: LP Status Management
// ============================================

export const LP_STATUS_TRANSITIONS: Record<LPStatus, LPStatus[]> = {
  available: ['reserved', 'quarantine', 'shipped'],
  reserved: ['available', 'consumed', 'quarantine'],
  consumed: [], // Terminal state
  shipped: [], // Terminal state
  quarantine: ['available', 'recalled'],
  recalled: ['quarantine'], // Can go back to quarantine for re-evaluation
  merged: [], // Terminal state
  split: [], // Terminal state
}

/**
 * Update LP status with validation (AC-5.2.1, AC-5.2.2)
 */
export async function updateLPStatus(
  lpId: string,
  newStatus: LPStatus,
  userId: string,
  reason?: string
): Promise<LicensePlate> {
  const supabase = createAdminClient()

  // Get current LP
  const { data: lp, error: fetchError } = await supabase
    .from('license_plates')
    .select('id, status, org_id')
    .eq('id', lpId)
    .single()

  if (fetchError || !lp) {
    throw new Error('LP not found')
  }

  // Validate transition
  const currentStatus = lp.status as LPStatus
  const allowedTransitions = LP_STATUS_TRANSITIONS[currentStatus]

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`)
  }

  // Update status
  const { data, error } = await supabase
    .from('license_plates')
    .update({
      status: newStatus,
      updated_by: userId,
    })
    .eq('id', lpId)
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update LP status: ${error.message}`)
  }

  // Create movement record for audit trail
  await supabase.from('lp_movements').insert({
    org_id: lp.org_id,
    lp_id: lpId,
    movement_type: 'status_change',
    qty_change: 0,
    qty_before: data.current_qty,
    qty_after: data.current_qty,
    uom: data.uom,
    created_by_user_id: userId,
    notes: reason || `Status changed: ${currentStatus} → ${newStatus}`,
  })

  return data
}

// ============================================
// Story 5.3: Batch & Expiry Tracking
// ============================================

/**
 * Get LPs expiring soon (AC-5.3.1)
 */
export async function getExpiringLPs(
  orgId: string,
  daysAhead: number = 30
): Promise<LicensePlate[]> {
  const supabase = createAdminClient()

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + daysAhead)

  const { data, error } = await supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .eq('org_id', orgId)
    .in('status', ['available', 'reserved'])
    .gt('current_qty', 0)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', expiryDate.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to get expiring LPs: ${error.message}`)
  }

  return data || []
}

/**
 * Get expired LPs (AC-5.3.2)
 */
export async function getExpiredLPs(orgId: string): Promise<LicensePlate[]> {
  const supabase = createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .eq('org_id', orgId)
    .in('status', ['available', 'reserved'])
    .gt('current_qty', 0)
    .lt('expiry_date', today)
    .order('expiry_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to get expired LPs: ${error.message}`)
  }

  return data || []
}

/**
 * Get LPs by batch number (AC-5.3.3)
 */
export async function getLPsByBatch(
  orgId: string,
  batchNumber: string
): Promise<LicensePlate[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .eq('org_id', orgId)
    .or(`batch_number.eq.${batchNumber},supplier_batch_number.eq.${batchNumber}`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get LPs by batch: ${error.message}`)
  }

  return data || []
}

/**
 * Get available LPs for product sorted by FEFO (AC-5.3.4)
 */
export async function getAvailableLPsFEFO(
  orgId: string,
  productId: string,
  warehouseId?: string
): Promise<LicensePlate[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('license_plates')
    .select(`
      *,
      product:products (id, code, name, type, uom),
      location:locations (id, code, name),
      warehouse:warehouses (id, code, name)
    `)
    .eq('org_id', orgId)
    .eq('product_id', productId)
    .eq('status', 'available')
    .gt('current_qty', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('manufacturing_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get available LPs: ${error.message}`)
  }

  return data || []
}

// ============================================
// Story 5.4: LP Numbering (handled by generate_lp_number function)
// ============================================

/**
 * Get warehouse settings for LP numbering (AC-5.4.1)
 */
export async function getWarehouseSettings(warehouseId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('warehouse_settings')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get warehouse settings: ${error.message}`)
  }

  return data
}

/**
 * Update warehouse settings (AC-5.4.2)
 */
export async function updateWarehouseSettings(
  warehouseId: string,
  orgId: string,
  settings: Partial<{
    lp_number_format: string
    lp_number_prefix: string
    allow_over_receipt: boolean
    over_receipt_tolerance_percent: number
    printer_ip: string
    auto_print_on_receive: boolean
    copies_per_label: number
    default_expiry_days: number
    expiry_warning_days: number
  }>
) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('warehouse_settings')
    .upsert({
      warehouse_id: warehouseId,
      org_id: orgId,
      ...settings,
    }, {
      onConflict: 'warehouse_id',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update warehouse settings: ${error.message}`)
  }

  return data
}
