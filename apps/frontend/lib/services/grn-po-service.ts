/**
 * GRN from PO Service (Story 05.11)
 * Purpose: Handle GRN creation from Purchase Orders with LP generation
 *
 * This service orchestrates the "Receive PO" workflow:
 * 1. Validate PO status (approved/confirmed/partial only)
 * 2. Validate receipt data (batch, expiry, over-receipt)
 * 3. Create GRN header + items
 * 4. Create License Plates for each item
 * 5. Update PO line received quantities
 * 6. Update PO status (partial/closed)
 *
 * All operations are atomic via RPC function create_grn_with_lp()
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase parameterized queries
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateLPInput, LicensePlate } from './license-plate-service'

// =============================================================================
// Types
// =============================================================================

export interface CreateGRNFromPOInput {
  po_id: string
  warehouse_id: string
  location_id: string
  notes?: string
  items: CreateGRNItemInput[]
}

export interface CreateGRNItemInput {
  po_line_id: string
  received_qty: number
  batch_number?: string
  supplier_batch_number?: string
  expiry_date?: string
  manufacture_date?: string
  location_id?: string // override default
  notes?: string
}

export interface POForReceipt {
  id: string
  po_number: string
  status: string
  supplier_id: string
  supplier_name: string
  expected_date: string
  warehouse_id: string
  lines_count: number
  total_value: number
  created_at: string
}

export interface POLineForReceipt {
  id: string
  product_id: string
  product_name: string
  product_code: string
  ordered_qty: number
  received_qty: number
  remaining_qty: number
  uom: string
}

export interface GRNValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface OverReceiptCalculation {
  orderedQty: number
  alreadyReceivedQty: number
  attemptingQty: number
  totalAfterReceipt: number
  overReceiptQty: number
  overReceiptPct: number
  isOverReceipt: boolean
}

export interface OverReceiptValidation {
  allowed: boolean
  maxAllowed: number
  exceedsTolerance: boolean
  overReceiptPct: number
}

export interface WarehouseSettings {
  allow_over_receipt: boolean
  over_receipt_tolerance_pct: number
  require_batch_on_receipt: boolean
  require_expiry_on_receipt: boolean
  require_qa_on_receipt: boolean
  default_qa_status: string
}

export interface CreateGRNFromPOResult {
  grn: {
    id: string
    grn_number: string
    source_type: 'po'
    po_id: string
    supplier_id: string
    receipt_date: string
    warehouse_id: string
    location_id: string
    status: 'completed'
    notes: string | null
    created_at: string
    received_by: string
    total_items?: number
    total_qty?: number
  }
  items: {
    id: string
    product_id: string
    product_name: string
    ordered_qty: number
    received_qty: number
    uom: string
    lp_id: string
    lp_number: string
    batch_number: string | null
    expiry_date: string | null
    location_id: string
    qa_status: string
    // Over-receipt tracking (Story 05.13)
    over_receipt_flag: boolean
    over_receipt_percentage: number
  }[]
  po_status: string
  over_receipt_warnings: {
    po_line_id: string
    ordered_qty: number
    total_received: number
    over_receipt_pct: number
  }[]
  lps_created?: number
}

// =============================================================================
// PO Status Validation (AC-6)
// =============================================================================

const RECEIVABLE_STATUSES = ['approved', 'confirmed', 'partial']

/**
 * Validate if PO status allows receipt
 */
export function validatePOForReceipt(status: string): GRNValidationResult {
  const errors: string[] = []

  if (status === 'draft') {
    errors.push("Cannot receive from PO with status 'draft'. PO must be approved or confirmed.")
  } else if (status === 'cancelled') {
    errors.push('Cannot receive from cancelled PO')
  } else if (status === 'closed') {
    errors.push('PO is already closed - no more receipts allowed')
  } else if (!RECEIVABLE_STATUSES.includes(status)) {
    errors.push(`Cannot receive from PO with status '${status}'`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// Over-Receipt Calculation (AC-7, AC-8)
// =============================================================================

/**
 * Calculate over-receipt metrics for a PO line
 */
export function calculateOverReceipt(
  orderedQty: number,
  alreadyReceivedQty: number,
  attemptingQty: number
): OverReceiptCalculation {
  const totalAfterReceipt = alreadyReceivedQty + attemptingQty
  const overReceiptQty = Math.max(0, totalAfterReceipt - orderedQty)
  const overReceiptPct = orderedQty > 0 ? (overReceiptQty / orderedQty) * 100 : 0

  return {
    orderedQty,
    alreadyReceivedQty,
    attemptingQty,
    totalAfterReceipt,
    overReceiptQty,
    overReceiptPct,
    isOverReceipt: overReceiptQty > 0,
  }
}

/**
 * Validate over-receipt against warehouse settings
 */
export function validateOverReceipt(
  orderedQty: number,
  alreadyReceivedQty: number,
  attemptingQty: number,
  settings: Pick<WarehouseSettings, 'allow_over_receipt' | 'over_receipt_tolerance_pct'>
): OverReceiptValidation {
  const calc = calculateOverReceipt(orderedQty, alreadyReceivedQty, attemptingQty)
  const tolerancePct = settings.over_receipt_tolerance_pct
  const maxAllowed = settings.allow_over_receipt
    ? orderedQty * (1 + tolerancePct / 100)
    : orderedQty

  // Not over-receipt - always allowed
  if (!calc.isOverReceipt) {
    return {
      allowed: true,
      maxAllowed,
      exceedsTolerance: false,
      overReceiptPct: 0,
    }
  }

  // Over-receipt disabled - block any over
  if (!settings.allow_over_receipt) {
    return {
      allowed: false,
      maxAllowed,
      exceedsTolerance: true,
      overReceiptPct: calc.overReceiptPct,
    }
  }

  // Check within tolerance
  const exceedsTolerance = calc.overReceiptPct > tolerancePct

  return {
    allowed: !exceedsTolerance,
    maxAllowed,
    exceedsTolerance,
    overReceiptPct: calc.overReceiptPct,
  }
}

// =============================================================================
// Batch/Expiry Validation (AC-9, AC-10)
// =============================================================================

/**
 * Validate batch number requirement
 */
export function validateBatchRequired(
  items: CreateGRNItemInput[],
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
  items: CreateGRNItemInput[],
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
export function validateInput(input: CreateGRNFromPOInput): GRNValidationResult {
  const errors: string[] = []

  // Validate po_id
  if (!UUID_REGEX.test(input.po_id)) {
    errors.push('Invalid PO ID format')
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

      // Validate po_line_id
      if (!UUID_REGEX.test(item.po_line_id)) {
        errors.push(`Invalid PO line ID format (line ${lineNum})`)
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
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  }
}

// =============================================================================
// LP Creation Helper (AC-11)
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
  po_number: string
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
    po_number: grnData.po_number,
    batch_number: grnItem.batch_number,
    supplier_batch_number: grnItem.supplier_batch_number,
    expiry_date: grnItem.expiry_date,
    manufacture_date: grnItem.manufacture_date,
  }
}

// =============================================================================
// PO Status Calculation (AC-5)
// =============================================================================

interface POLineQuantities {
  ordered_qty: number
  received_qty: number
}

/**
 * Calculate new PO status based on line received quantities
 */
export function calculatePOStatusFromLines(lines: POLineQuantities[]): string {
  const totalOrdered = lines.reduce((sum, l) => sum + l.ordered_qty, 0)
  const totalReceived = lines.reduce((sum, l) => sum + l.received_qty, 0)

  if (totalReceived === 0) {
    return 'confirmed' // Keep current status
  }

  // All lines fully received (allow over-receipt)
  const allComplete = lines.every((l) => l.received_qty >= l.ordered_qty)
  if (allComplete) {
    return 'closed'
  }

  return 'partial'
}

// =============================================================================
// QA Status Helper (AC-20)
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
 * Get PO for receipt with validation
 */
export async function getPOForReceipt(
  poId: string,
  orgId: string,
  supabase: SupabaseClient
): Promise<POForReceipt> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      po_number,
      status,
      supplier_id,
      suppliers:supplier_id(name),
      expected_date,
      warehouse_id,
      created_at
    `)
    .eq('id', poId)
    .single()

  if (error || !data) {
    throw new Error('Purchase order not found')
  }

  // Get line count
  const { count: linesCount } = await supabase
    .from('purchase_order_lines')
    .select('id', { count: 'exact', head: true })
    .eq('po_id', poId)

  return {
    id: data.id,
    po_number: data.po_number,
    status: data.status,
    supplier_id: data.supplier_id,
    supplier_name: (data.suppliers as any)?.name || '',
    expected_date: data.expected_date,
    warehouse_id: data.warehouse_id,
    lines_count: linesCount || 0,
    total_value: 0, // TODO: Calculate from lines
    created_at: data.created_at,
  }
}

/**
 * Get PO lines for receipt wizard
 */
export async function getPOLinesForReceipt(
  poId: string,
  supabase: SupabaseClient
): Promise<POLineForReceipt[]> {
  const { data, error } = await supabase
    .from('purchase_order_lines')
    .select(`
      id,
      product_id,
      products:product_id(name, code),
      quantity,
      received_qty,
      uom
    `)
    .eq('po_id', poId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch PO lines: ${error.message}`)
  }

  return (data || []).map((line: any) => ({
    id: line.id,
    product_id: line.product_id,
    product_name: line.products?.name || '',
    product_code: line.products?.code || '',
    ordered_qty: line.quantity,
    received_qty: line.received_qty || 0,
    remaining_qty: line.quantity - (line.received_qty || 0),
    uom: line.uom,
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
      allow_over_receipt,
      over_receipt_tolerance_pct,
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
      allow_over_receipt: false,
      over_receipt_tolerance_pct: 0,
      require_batch_on_receipt: false,
      require_expiry_on_receipt: false,
      require_qa_on_receipt: true,
      default_qa_status: 'pending',
    }
  }

  return data as WarehouseSettings
}

/**
 * Generate GRN number via RPC
 */
export async function generateGRNNumber(
  orgId: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_grn_number', {
    p_org_id: orgId,
  })

  if (error) {
    throw new Error(`Failed to generate GRN number: ${error.message}`)
  }

  return data as string
}

/**
 * Create GRN from PO via RPC (atomic transaction)
 * Uses create_grn_with_lp() RPC function for atomicity
 */
export async function createFromPO(
  input: CreateGRNFromPOInput,
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<CreateGRNFromPOResult> {
  // Call RPC function for atomic operation
  const { data, error } = await supabase.rpc('create_grn_from_po', {
    p_org_id: orgId,
    p_user_id: userId,
    p_po_id: input.po_id,
    p_warehouse_id: input.warehouse_id,
    p_location_id: input.location_id,
    p_notes: input.notes || null,
    p_items: input.items,
  })

  if (error) {
    throw new Error(`Failed to create GRN: ${error.message}`)
  }

  return data as CreateGRNFromPOResult
}

/**
 * Full validation before GRN creation
 */
export async function validateReceipt(
  input: CreateGRNFromPOInput,
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

  // 2. Get PO and validate status
  const po = await getPOForReceipt(input.po_id, orgId, supabase)
  const statusValidation = validatePOForReceipt(po.status)
  allErrors.push(...statusValidation.errors)

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors, warnings: allWarnings }
  }

  // 3. Get warehouse settings
  const settings = await getWarehouseSettings(orgId, supabase)

  // 4. Validate batch requirement
  const batchValidation = validateBatchRequired(input.items, settings)
  allErrors.push(...batchValidation.errors)

  // 5. Validate expiry requirement
  const expiryValidation = validateExpiryRequired(input.items, settings)
  allErrors.push(...expiryValidation.errors)

  // 6. Get PO lines and validate over-receipt
  const poLines = await getPOLinesForReceipt(input.po_id, supabase)
  const lineMap = new Map(poLines.map((l) => [l.id, l]))

  for (const item of input.items) {
    const poLine = lineMap.get(item.po_line_id)
    if (!poLine) {
      allErrors.push(`PO line not found: ${item.po_line_id}`)
      continue
    }

    const overReceiptValidation = validateOverReceipt(
      poLine.ordered_qty,
      poLine.received_qty,
      item.received_qty,
      settings
    )

    if (!overReceiptValidation.allowed) {
      if (settings.allow_over_receipt) {
        allErrors.push(
          `Over-receipt exceeds tolerance. Max allowed: ${overReceiptValidation.maxAllowed.toFixed(0)} (${settings.over_receipt_tolerance_pct}% tolerance), Attempting: ${poLine.received_qty + item.received_qty}`
        )
      } else {
        allErrors.push(
          `Over-receipt not allowed. Ordered: ${poLine.ordered_qty}, Already received: ${poLine.received_qty}, Attempting: ${item.received_qty}`
        )
      }
    } else if (overReceiptValidation.overReceiptPct > 0) {
      allWarnings.push(
        `Over-receipt warning for line ${item.po_line_id}: ${overReceiptValidation.overReceiptPct.toFixed(1)}% over ordered quantity`
      )
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

export const GRNFromPOService = {
  // Validation
  validatePOForReceipt,
  calculateOverReceipt,
  validateOverReceipt,
  validateBatchRequired,
  validateExpiryRequired,
  validateInput,
  validateReceipt,

  // Helpers
  buildLPInputFromGRNItem,
  calculatePOStatusFromLines,
  getDefaultQAStatus,

  // Database Operations
  getPOForReceipt,
  getPOLinesForReceipt,
  getWarehouseSettings,
  generateGRNNumber,
  createFromPO,
}
