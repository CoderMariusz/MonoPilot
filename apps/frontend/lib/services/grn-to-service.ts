/**
 * GRN from TO Service (Story 05.12)
 * Purpose: Handle GRN creation from Transfer Orders with LP generation
 *
 * This service orchestrates the "Receive TO" workflow:
 * 1. Validate TO status (shipped/partial only)
 * 2. Validate destination warehouse
 * 3. Validate receipt data (batch, expiry, variance)
 * 4. Create GRN header + items
 * 5. Create License Plates for each item
 * 6. Update TO line received quantities
 * 7. Update TO status (partial/received)
 *
 * All operations are atomic via RPC function create_grn_from_to()
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase parameterized queries
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateLPInput } from './license-plate-service'

// =============================================================================
// Types
// =============================================================================

export interface CreateGRNFromTOInput {
  to_id: string
  warehouse_id: string
  location_id: string
  notes?: string
  items: CreateGRNItemFromTOInput[]
}

export interface CreateGRNItemFromTOInput {
  to_line_id: string
  received_qty: number
  variance_reason?: string
  batch_number?: string
  supplier_batch_number?: string
  expiry_date?: string
  manufacture_date?: string
  location_id?: string // override default
  notes?: string
}

export interface TOForReceipt {
  id: string
  to_number: string
  status: string
  from_warehouse_id: string
  from_warehouse_name: string
  to_warehouse_id: string
  to_warehouse_name: string
  planned_ship_date: string
  planned_receive_date: string
  actual_ship_date: string | null
  lines_count: number
  created_at: string
}

export interface TOLineForReceipt {
  id: string
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  shipped_qty: number
  received_qty: number
  remaining_qty: number
  uom: string
}

export interface GRNValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface VarianceCalculation {
  shippedQty: number
  alreadyReceivedQty: number
  attemptingQty: number
  remainingQty: number
  varianceQty: number
  variancePct: number
  isShortage: boolean
  isOverage: boolean
}

export interface WarehouseSettings {
  require_batch_on_receipt: boolean
  require_expiry_on_receipt: boolean
  require_qa_on_receipt: boolean
  default_qa_status: string
}

export interface CreateGRNFromTOResult {
  grn: {
    id: string
    grn_number: string
    source_type: 'to'
    to_id: string
    from_warehouse_id: string
    to_warehouse_id: string
    receipt_date: string
    warehouse_id: string
    location_id: string
    status: 'completed'
    notes: string | null
    created_at: string
    received_by: string
  }
  items: {
    id: string
    product_id: string
    product_name: string
    shipped_qty: number
    received_qty: number
    variance_qty: number
    variance_reason: string | null
    uom: string
    lp_id: string
    lp_number: string
    batch_number: string | null
    expiry_date: string | null
    location_id: string
    qa_status: string
  }[]
  to_status: string
  variances: {
    to_line_id: string
    product_name: string
    shipped_qty: number
    received_qty: number
    variance_qty: number
    variance_pct: number
  }[]
  lps_created: number
}

// =============================================================================
// TO Status Validation (AC-3)
// =============================================================================

const RECEIVABLE_STATUSES = ['shipped', 'partial']

/**
 * Validate if TO status allows receipt
 */
export function validateTOForReceipt(status: string): GRNValidationResult {
  const errors: string[] = []

  if (status === 'draft' || status === 'planned') {
    errors.push(`Cannot receive from TO with status '${status}'. TO must be shipped or partial.`)
  } else if (status === 'cancelled') {
    errors.push('Cannot receive from cancelled TO')
  } else if (status === 'received') {
    errors.push('TO is already fully received - no more receipts allowed')
  } else if (status === 'closed') {
    errors.push('TO is already closed - no more receipts allowed')
  } else if (!RECEIVABLE_STATUSES.includes(status)) {
    errors.push(`Cannot receive from TO with status '${status}'`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// Destination Warehouse Validation (AC-6)
// =============================================================================

interface TOWarehouseInfo {
  from_warehouse_id: string
  to_warehouse_id: string
}

/**
 * Validate receipt is at correct destination warehouse
 */
export function validateDestinationWarehouse(
  receiptWarehouseId: string,
  to: TOWarehouseInfo
): GRNValidationResult {
  const errors: string[] = []

  if (receiptWarehouseId !== to.to_warehouse_id) {
    errors.push('Receipt must occur at destination warehouse')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// Variance Calculation (AC-4)
// =============================================================================

/**
 * Calculate variance metrics for a TO line receipt
 */
export function calculateVariance(
  shippedQty: number,
  alreadyReceivedQty: number,
  attemptingQty: number
): VarianceCalculation {
  const remainingQty = shippedQty - alreadyReceivedQty
  const varianceQty = attemptingQty - remainingQty
  const variancePct = shippedQty > 0 ? (varianceQty / shippedQty) * 100 : 0

  return {
    shippedQty,
    alreadyReceivedQty,
    attemptingQty,
    remainingQty,
    varianceQty,
    variancePct,
    isShortage: varianceQty < 0,
    isOverage: varianceQty > 0,
  }
}

/**
 * Validate receipt quantity against shipped
 */
export function validateReceiptQty(
  shippedQty: number,
  alreadyReceivedQty: number,
  attemptingQty: number
): GRNValidationResult {
  const errors: string[] = []
  const totalAfterReceipt = alreadyReceivedQty + attemptingQty

  if (totalAfterReceipt > shippedQty) {
    errors.push(
      `Cannot receive more than shipped quantity. Shipped: ${shippedQty}, Already received: ${alreadyReceivedQty}, Attempting: ${attemptingQty}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

/**
 * Validate variance reason is provided when qty differs
 */
export function validateVarianceReason(
  shippedQty: number,
  alreadyReceivedQty: number,
  attemptingQty: number,
  varianceReason: string | undefined
): GRNValidationResult {
  const errors: string[] = []
  const remainingQty = shippedQty - alreadyReceivedQty
  const hasVariance = attemptingQty !== remainingQty

  if (hasVariance && !varianceReason) {
    errors.push('Variance reason required when received qty differs from shipped')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// Batch/Expiry Validation (AC-7, AC-8)
// =============================================================================

/**
 * Validate batch number requirement
 */
export function validateBatchRequired(
  items: CreateGRNItemFromTOInput[],
  settings: Pick<WarehouseSettings, 'require_batch_on_receipt'>
): GRNValidationResult {
  const errors: string[] = []

  if (settings.require_batch_on_receipt) {
    items.forEach((item, index) => {
      if (!item.batch_number) {
        errors.push(`Batch number required for receipt (line ${index + 1})`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

/**
 * Validate expiry date requirement
 */
export function validateExpiryRequired(
  items: CreateGRNItemFromTOInput[],
  settings: Pick<WarehouseSettings, 'require_expiry_on_receipt'>
): GRNValidationResult {
  const errors: string[] = []

  if (settings.require_expiry_on_receipt) {
    items.forEach((item, index) => {
      if (!item.expiry_date) {
        errors.push(`Expiry date required for receipt (line ${index + 1})`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// Input Validation
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validate input data structure
 */
export function validateInput(input: CreateGRNFromTOInput): GRNValidationResult {
  const errors: string[] = []

  // Validate to_id
  if (!UUID_REGEX.test(input.to_id)) {
    errors.push('Invalid TO ID format')
  }

  // Validate warehouse_id
  if (!UUID_REGEX.test(input.warehouse_id)) {
    errors.push('Invalid warehouse ID format')
  }

  // Validate location_id
  if (!UUID_REGEX.test(input.location_id)) {
    errors.push('Invalid location ID format')
  }

  // Validate items array
  if (!input.items || input.items.length === 0) {
    errors.push('At least one item required')
  } else {
    input.items.forEach((item, index) => {
      const lineNum = index + 1

      // Validate to_line_id
      if (!UUID_REGEX.test(item.to_line_id)) {
        errors.push(`Invalid TO line ID format (line ${lineNum})`)
      }

      // Validate received_qty
      if (item.received_qty <= 0) {
        errors.push(`Received quantity must be positive (line ${lineNum})`)
      }

      // Validate expiry_date format if provided
      if (item.expiry_date && !DATE_REGEX.test(item.expiry_date)) {
        errors.push(`Invalid expiry date format (expected YYYY-MM-DD) (line ${lineNum})`)
      }

      // Validate manufacture_date format if provided
      if (item.manufacture_date && !DATE_REGEX.test(item.manufacture_date)) {
        errors.push(`Invalid manufacture date format (expected YYYY-MM-DD) (line ${lineNum})`)
      }

      // Validate location_id override if provided
      if (item.location_id && !UUID_REGEX.test(item.location_id)) {
        errors.push(`Invalid location ID format (line ${lineNum})`)
      }

      // Validate variance_reason length
      if (item.variance_reason && item.variance_reason.length > 500) {
        errors.push(`Variance reason max 500 characters (line ${lineNum})`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// LP Creation Helper (AC-9)
// =============================================================================

interface GRNItemForLP {
  product_id: string
  received_qty: number
  uom?: string
  batch_number?: string
  supplier_batch_number?: string
  expiry_date?: string
  manufacture_date?: string
  location_id: string
  warehouse_id: string
}

interface GRNDataForLP {
  grn_id: string
  to_number: string
}

/**
 * Build LP creation input from GRN item data
 */
export function buildLPInputFromGRNItem(
  grnItem: GRNItemForLP,
  grnData: GRNDataForLP
): CreateLPInput {
  return {
    product_id: grnItem.product_id,
    quantity: grnItem.received_qty,
    uom: grnItem.uom || 'EA',
    location_id: grnItem.location_id,
    warehouse_id: grnItem.warehouse_id,
    source: 'receipt',
    grn_id: grnData.grn_id,
    batch_number: grnItem.batch_number,
    supplier_batch_number: grnItem.supplier_batch_number,
    expiry_date: grnItem.expiry_date,
    manufacture_date: grnItem.manufacture_date,
  }
}

// =============================================================================
// TO Status Calculation (AC-2)
// =============================================================================

interface TOLineQuantities {
  shipped_qty: number
  received_qty: number
}

/**
 * Calculate new TO status based on line received quantities
 */
export function calculateTOStatusFromLines(lines: TOLineQuantities[]): string {
  // Filter out lines with zero shipped (they don't affect status)
  const relevantLines = lines.filter((l) => l.shipped_qty > 0)

  if (relevantLines.length === 0) {
    return 'received' // No lines to receive
  }

  // All lines fully received
  const allComplete = relevantLines.every((l) => l.received_qty >= l.shipped_qty)
  if (allComplete) {
    return 'received'
  }

  return 'partial'
}

// =============================================================================
// QA Status Helper (AC-15)
// =============================================================================

/**
 * Get default QA status based on warehouse settings
 */
export function getDefaultQAStatus(
  settings: Pick<WarehouseSettings, 'require_qa_on_receipt' | 'default_qa_status'>
): string {
  if (!settings.require_qa_on_receipt) {
    return 'passed' // Auto-approve if QA not required
  }
  return settings.default_qa_status || 'pending'
}

// =============================================================================
// Database Operations
// =============================================================================

/**
 * Get TO for receipt with validation
 */
export async function getTOForReceipt(
  toId: string,
  orgId: string,
  supabase: SupabaseClient
): Promise<TOForReceipt> {
  const { data, error } = await supabase
    .from('transfer_orders')
    .select(`
      id,
      to_number,
      status,
      from_warehouse_id,
      from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(name),
      to_warehouse_id,
      to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(name),
      planned_ship_date,
      planned_receive_date,
      actual_ship_date,
      created_at
    `)
    .eq('id', toId)
    .single()

  if (error || !data) {
    throw new Error('Transfer order not found')
  }

  // Get line count
  const { count: linesCount } = await supabase
    .from('transfer_order_lines')
    .select('id', { count: 'exact', head: true })
    .eq('to_id', toId)

  return {
    id: data.id,
    to_number: data.to_number,
    status: data.status,
    from_warehouse_id: data.from_warehouse_id,
    from_warehouse_name: (data.from_warehouse as any)?.name || '',
    to_warehouse_id: data.to_warehouse_id,
    to_warehouse_name: (data.to_warehouse as any)?.name || '',
    planned_ship_date: data.planned_ship_date,
    planned_receive_date: data.planned_receive_date,
    actual_ship_date: data.actual_ship_date,
    lines_count: linesCount || 0,
    created_at: data.created_at,
  }
}

/**
 * Get TO lines for receipt wizard
 */
export async function getTOLinesForReceipt(
  toId: string,
  supabase: SupabaseClient
): Promise<TOLineForReceipt[]> {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select(`
      id,
      product_id,
      products:product_id(name, code),
      quantity,
      shipped_qty,
      received_qty,
      uom
    `)
    .eq('to_id', toId)
    .order('line_number', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch TO lines: ${error.message}`)
  }

  return (data || []).map((line: any) => ({
    id: line.id,
    product_id: line.product_id,
    product_name: line.products?.name || '',
    product_code: line.products?.code || '',
    quantity: line.quantity,
    shipped_qty: line.shipped_qty || 0,
    received_qty: line.received_qty || 0,
    remaining_qty: (line.shipped_qty || 0) - (line.received_qty || 0),
    uom: line.uom,
  }))
}

/**
 * Get receivable TOs (status = shipped or partial)
 */
export async function getReceivableTOs(
  orgId: string,
  supabase: SupabaseClient,
  warehouseId?: string
): Promise<TOForReceipt[]> {
  let query = supabase
    .from('transfer_orders')
    .select(`
      id,
      to_number,
      status,
      from_warehouse_id,
      from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(name),
      to_warehouse_id,
      to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(name),
      planned_ship_date,
      planned_receive_date,
      actual_ship_date,
      created_at
    `)
    .in('status', ['shipped', 'partial'])
    .order('actual_ship_date', { ascending: false })

  if (warehouseId) {
    query = query.eq('to_warehouse_id', warehouseId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch receivable TOs: ${error.message}`)
  }

  return (data || []).map((to: any) => ({
    id: to.id,
    to_number: to.to_number,
    status: to.status,
    from_warehouse_id: to.from_warehouse_id,
    from_warehouse_name: to.from_warehouse?.name || '',
    to_warehouse_id: to.to_warehouse_id,
    to_warehouse_name: to.to_warehouse?.name || '',
    planned_ship_date: to.planned_ship_date,
    planned_receive_date: to.planned_receive_date,
    actual_ship_date: to.actual_ship_date,
    lines_count: 0, // Would need separate query
    created_at: to.created_at,
  }))
}

/**
 * Get warehouse settings for receipt validation
 */
export async function getWarehouseSettings(
  orgId: string,
  supabase: SupabaseClient
): Promise<WarehouseSettings> {
  const { data, error } = await supabase
    .from('warehouse_settings')
    .select(`
      require_batch_on_receipt,
      require_expiry_on_receipt,
      require_qa_on_receipt,
      default_qa_status
    `)
    .eq('org_id', orgId)
    .single()

  if (error || !data) {
    // Return defaults if no settings
    return {
      require_batch_on_receipt: false,
      require_expiry_on_receipt: false,
      require_qa_on_receipt: true,
      default_qa_status: 'pending',
    }
  }

  return data as WarehouseSettings
}

/**
 * Create GRN from TO via RPC (atomic transaction)
 * Uses create_grn_from_to() RPC function for atomicity
 */
export async function createFromTO(
  input: CreateGRNFromTOInput,
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<CreateGRNFromTOResult> {
  // Call RPC function for atomic operation
  const { data, error } = await supabase.rpc('create_grn_from_to', {
    p_org_id: orgId,
    p_user_id: userId,
    p_to_id: input.to_id,
    p_warehouse_id: input.warehouse_id,
    p_location_id: input.location_id,
    p_notes: input.notes || null,
    p_items: input.items,
  })

  if (error) {
    throw new Error(`Failed to create GRN: ${error.message}`)
  }

  return data as CreateGRNFromTOResult
}

/**
 * Full validation before GRN creation from TO
 */
export async function validateReceipt(
  input: CreateGRNFromTOInput,
  orgId: string,
  supabase: SupabaseClient
): Promise<GRNValidationResult> {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // 1. Validate input format
  const inputValidation = validateInput(input)
  allErrors.push(...inputValidation.errors)

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors, warnings: allWarnings }
  }

  // 2. Get TO and validate status
  const to = await getTOForReceipt(input.to_id, orgId, supabase)
  const statusValidation = validateTOForReceipt(to.status)
  allErrors.push(...statusValidation.errors)

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors, warnings: allWarnings }
  }

  // 3. Validate destination warehouse
  const warehouseValidation = validateDestinationWarehouse(input.warehouse_id, to)
  allErrors.push(...warehouseValidation.errors)

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors, warnings: allWarnings }
  }

  // 4. Get warehouse settings
  const settings = await getWarehouseSettings(orgId, supabase)

  // 5. Validate batch requirement
  const batchValidation = validateBatchRequired(input.items, settings)
  allErrors.push(...batchValidation.errors)

  // 6. Validate expiry requirement
  const expiryValidation = validateExpiryRequired(input.items, settings)
  allErrors.push(...expiryValidation.errors)

  // 7. Get TO lines and validate receipt quantities
  const toLines = await getTOLinesForReceipt(input.to_id, supabase)
  const lineMap = new Map(toLines.map((l) => [l.id, l]))

  for (const item of input.items) {
    const toLine = lineMap.get(item.to_line_id)
    if (!toLine) {
      allErrors.push(`TO line not found: ${item.to_line_id}`)
      continue
    }

    // Validate cannot receive more than shipped
    const qtyValidation = validateReceiptQty(
      toLine.shipped_qty,
      toLine.received_qty,
      item.received_qty
    )
    allErrors.push(...qtyValidation.errors)

    // Calculate variance and check if reason needed
    const variance = calculateVariance(toLine.shipped_qty, toLine.received_qty, item.received_qty)
    if (variance.isShortage || variance.isOverage) {
      if (!item.variance_reason) {
        allWarnings.push(
          `Variance detected for ${toLine.product_name}: ${variance.varianceQty} (${variance.variancePct.toFixed(1)}%). Consider providing variance reason.`
        )
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

// =============================================================================
// Export Service Object
// =============================================================================

export const GRNFromTOService = {
  // Validation
  validateTOForReceipt,
  validateDestinationWarehouse,
  calculateVariance,
  validateReceiptQty,
  validateVarianceReason,
  validateBatchRequired,
  validateExpiryRequired,
  validateInput,
  validateReceipt,

  // Helpers
  buildLPInputFromGRNItem,
  calculateTOStatusFromLines,
  getDefaultQAStatus,

  // Database Operations
  getTOForReceipt,
  getTOLinesForReceipt,
  getReceivableTOs,
  getWarehouseSettings,
  createFromTO,
}
