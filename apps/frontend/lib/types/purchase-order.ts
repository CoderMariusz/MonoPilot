/**
 * Purchase Order Types
 * Story: 03.3 - PO CRUD + Lines
 * Type definitions for Purchase Order management
 */

// ============================================================================
// ENUMS
// ============================================================================

export type POStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'confirmed'
  | 'receiving'
  | 'closed'
  | 'cancelled'

export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP'

// ============================================================================
// STATUS CONFIG
// ============================================================================

export const PO_STATUS_CONFIG: Record<POStatus, {
  label: string
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
  },
  submitted: {
    label: 'Submitted',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
  pending_approval: {
    label: 'Pending Approval',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
  },
  rejected: {
    label: 'Rejected',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-300',
  },
  receiving: {
    label: 'Receiving',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
  },
  closed: {
    label: 'Closed',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-300',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface PurchaseOrder {
  id: string
  org_id: string
  po_number: string
  supplier_id: string
  warehouse_id: string
  status: POStatus
  approval_status: 'pending' | 'approved' | 'rejected' | null
  order_date: string
  expected_delivery_date: string
  actual_delivery_date: string | null
  currency: Currency
  tax_code_id: string
  payment_terms: string | null
  shipping_cost: number
  notes: string | null
  subtotal: number
  tax_amount: number
  discount_total: number
  total: number
  // Receiving tracking
  received_value: number
  receive_percent: number
  // Audit
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
  // Approval
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  rejection_reason: string | null
}

export interface POLine {
  id: string
  purchase_order_id: string
  line_number: number
  product_id: string
  quantity: number
  received_qty: number
  remaining_qty: number
  uom: string
  unit_price: number
  discount_percent: number
  discount_amount: number
  tax_code_id: string
  tax_rate: number
  tax_amount: number
  line_total: number
  notes: string | null
  status: 'pending' | 'partial' | 'complete'
  created_at: string
  updated_at: string
  // Relations
  product?: ProductSummary
  tax_code?: TaxCodeSummary
}

// ============================================================================
// RELATIONS
// ============================================================================

export interface SupplierSummary {
  id: string
  code: string
  name: string
  currency: Currency
  tax_code_id: string
  payment_terms: string
  lead_time_days: number | null
}

export interface WarehouseSummary {
  id: string
  code: string
  name: string
}

export interface ProductSummary {
  id: string
  code: string
  name: string
  base_uom: string
  std_price: number
  category?: string
  available_qty?: number
}

export interface TaxCodeSummary {
  id: string
  code: string
  name: string
  rate: number
}

export interface UserSummary {
  id: string
  name: string
  email?: string
}

// ============================================================================
// PURCHASE ORDER WITH RELATIONS
// ============================================================================

export interface PurchaseOrderWithLines extends PurchaseOrder {
  supplier?: SupplierSummary
  warehouse?: WarehouseSummary
  tax_code?: TaxCodeSummary
  lines: POLine[]
  created_by_user?: UserSummary
  approved_by_user?: UserSummary
}

// ============================================================================
// LIST ITEM (for table display)
// ============================================================================

export interface POListItem {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  supplier_code: string
  status: POStatus
  approval_status: 'pending' | 'approved' | 'rejected' | null
  order_date: string
  expected_delivery_date: string
  currency: Currency
  total: number
  lines_count: number
  receive_percent: number
  created_at: string
}

// ============================================================================
// KPI SUMMARY
// ============================================================================

export interface POSummary {
  open_count: number
  open_total: number
  pending_approval_count: number
  overdue_count: number
  this_month_total: number
  this_month_count: number
}

// ============================================================================
// STATUS HISTORY
// ============================================================================

export interface POStatusHistory {
  id: string
  purchase_order_id: string
  event_type: 'status_change' | 'po_created' | 'line_added' | 'line_updated' | 'line_deleted' | 'po_submitted' | 'po_approved' | 'po_rejected' | 'grn_created' | 'document_uploaded' | 'document_deleted'
  event_date: string
  user_id: string
  user_name: string
  details: {
    from_status?: POStatus
    to_status?: POStatus
    reason?: string
    grn_id?: string
    grn_number?: string
    product?: string
    quantity?: number
    file_name?: string
    approval_notes?: string
    rejection_reason?: string
    lines_received?: Array<{ product: string; quantity: number }>
    [key: string]: unknown
  }
}

// ============================================================================
// LIST PARAMS AND PAGINATION
// ============================================================================

export interface POListParams {
  page?: number
  limit?: number
  search?: string
  status?: POStatus | POStatus[]
  supplier_id?: string
  warehouse_id?: string
  from_date?: string
  to_date?: string
  sort?: 'created_at' | 'po_number' | 'expected_delivery_date' | 'total' | 'status'
  order?: 'asc' | 'desc'
}

export interface PaginatedPOResult {
  data: POListItem[]
  meta: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ============================================================================
// FILTER PARAMS
// ============================================================================

export interface POFilterParams {
  status: POStatus[]
  supplier_id: string | null
  warehouse_id: string | null
  date_range: 'this_week' | 'this_month' | 'last_30_days' | 'last_90_days' | 'custom' | null
  from_date: string | null
  to_date: string | null
  search: string
}

// ============================================================================
// CREATE/UPDATE INPUTS
// ============================================================================

export interface CreatePOInput {
  supplier_id: string
  warehouse_id: string
  order_date: string
  expected_delivery_date: string
  currency: Currency
  tax_code_id: string
  payment_terms?: string | null
  shipping_cost?: number
  notes?: string | null
  lines?: CreatePOLineInput[]
}

export interface UpdatePOInput {
  supplier_id?: string
  warehouse_id?: string
  order_date?: string
  expected_delivery_date?: string
  currency?: Currency
  tax_code_id?: string
  payment_terms?: string | null
  shipping_cost?: number
  notes?: string | null
}

export interface CreatePOLineInput {
  product_id: string
  quantity: number
  unit_price: number
  tax_code_id: string
  discount_percent?: number
  notes?: string | null
}

export interface UpdatePOLineInput {
  quantity?: number
  unit_price?: number
  tax_code_id?: string
  discount_percent?: number
  notes?: string | null
}

// ============================================================================
// PRICE INFO (for product selection)
// ============================================================================

export interface PriceInfo {
  price: number
  source: 'supplier' | 'standard'
  supplier_product_code?: string
  lead_time_days?: number
  moq?: number
}

// ============================================================================
// SUPPLIER DEFAULTS (for cascade)
// ============================================================================

export interface SupplierDefaults {
  currency: Currency
  tax_code_id: string
  payment_terms: string
  lead_time_days: number | null
}

// ============================================================================
// TOTALS CALCULATION
// ============================================================================

export interface POTotals {
  subtotal: number
  tax_amount: number
  tax_breakdown: TaxBreakdownItem[]
  discount_total: number
  shipping_cost: number
  total: number
}

export interface TaxBreakdownItem {
  rate: number
  subtotal: number
  tax: number
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export const VALID_PO_STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
  draft: ['submitted', 'pending_approval', 'cancelled'],
  submitted: ['pending_approval', 'confirmed', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['confirmed', 'cancelled'],
  rejected: ['draft', 'cancelled'], // Rejected POs can be edited (back to draft) or cancelled
  confirmed: ['receiving', 'cancelled'],
  receiving: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
}

export const EDITABLE_STATUSES: POStatus[] = ['draft', 'rejected']
export const LINE_EDITABLE_STATUSES: POStatus[] = ['draft', 'rejected']
export const CANCELABLE_STATUSES: POStatus[] = ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'confirmed']

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function canTransitionPOStatus(
  currentStatus: POStatus,
  targetStatus: POStatus
): boolean {
  return VALID_PO_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false
}

export function canEditPO(status: POStatus): boolean {
  return EDITABLE_STATUSES.includes(status)
}

export function canEditPOLines(status: POStatus): boolean {
  return LINE_EDITABLE_STATUSES.includes(status)
}

export function canCancelPO(status: POStatus, hasReceipts: boolean): boolean {
  if (!CANCELABLE_STATUSES.includes(status)) return false
  if (status === 'receiving' && hasReceipts) return false
  return true
}

export function formatPOStatus(status: POStatus): string {
  return PO_STATUS_CONFIG[status]?.label ?? status
}

export function getRelativeDeliveryDate(dateStr: string | null): string {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(dateStr)
  targetDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < -1) return 'Overdue'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isOverdue(po: { expected_delivery_date: string; status: POStatus }): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expectedDate = new Date(po.expected_delivery_date)
  expectedDate.setHours(0, 0, 0, 0)

  return expectedDate < today && !['closed', 'cancelled', 'receiving'].includes(po.status)
}

export function calculateLineTotal(quantity: number, unitPrice: number, discountPercent: number = 0): number {
  const gross = quantity * unitPrice
  const discount = gross * (discountPercent / 100)
  return gross - discount
}

export function calculateLineTax(lineTotal: number, taxRate: number): number {
  return lineTotal * (taxRate / 100)
}

export function calculatePOTotals(
  lines: Array<{ quantity: number; unit_price: number; discount_percent?: number; tax_rate: number }>,
  shippingCost: number = 0
): POTotals {
  const taxBreakdownMap = new Map<number, { subtotal: number; tax: number }>()

  let subtotal = 0
  let discountTotal = 0

  lines.forEach(line => {
    const gross = line.quantity * line.unit_price
    const discount = gross * ((line.discount_percent || 0) / 100)
    const lineTotal = gross - discount
    const lineTax = lineTotal * (line.tax_rate / 100)

    subtotal += lineTotal
    discountTotal += discount

    if (!taxBreakdownMap.has(line.tax_rate)) {
      taxBreakdownMap.set(line.tax_rate, { subtotal: 0, tax: 0 })
    }
    const entry = taxBreakdownMap.get(line.tax_rate)!
    entry.subtotal += lineTotal
    entry.tax += lineTax
  })

  const taxBreakdown = Array.from(taxBreakdownMap.entries())
    .map(([rate, amounts]) => ({
      rate,
      subtotal: amounts.subtotal,
      tax: amounts.tax,
    }))
    .sort((a, b) => b.rate - a.rate)

  const taxAmount = taxBreakdown.reduce((sum, item) => sum + item.tax, 0)
  const total = subtotal + taxAmount + shippingCost

  return {
    subtotal,
    tax_amount: taxAmount,
    tax_breakdown: taxBreakdown,
    discount_total: discountTotal,
    shipping_cost: shippingCost,
    total,
  }
}
