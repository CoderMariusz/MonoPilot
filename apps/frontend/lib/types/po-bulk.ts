/**
 * PO Bulk Operations Types
 * Story: 03.6 - PO Bulk Operations
 * TypeScript interfaces for bulk PO import/export and status updates
 */

import type { Currency, POStatus } from './purchase-order'

// ============================================================================
// IMPORT TYPES
// ============================================================================

/**
 * Raw row from Excel/CSV import file
 */
export interface ImportRow {
  product_code: string
  quantity: number
  expected_delivery?: string
  unit_price?: number
  notes?: string
  warehouse_code?: string
}

/**
 * Import row with validation info and resolved data
 */
export interface ImportRowWithValidation extends ImportRow {
  row_number: number
  product_id?: string
  product_name?: string
  supplier_id?: string
  supplier_name?: string
  uom?: string
  resolved_price?: number
  line_total?: number
  errors?: string[]
  warnings?: string[]
  status: 'valid' | 'error' | 'warning'
}

/**
 * Grouped import rows by supplier for PO creation
 */
export interface ImportGroup {
  supplier_id: string
  supplier_name: string
  supplier_code: string
  warehouse_id?: string
  warehouse_name?: string
  expected_delivery: string
  payment_terms?: string
  currency: Currency
  tax_code_id: string
  tax_rate: number
  lines: ImportRowWithValidation[]
  subtotal: number
  tax_amount: number
  total: number
}

/**
 * Validation result from import/validate endpoint
 */
export interface ValidationResult {
  valid_rows: ImportRowWithValidation[]
  error_rows: ImportRowWithValidation[]
  warning_rows: ImportRowWithValidation[]
  groups: ImportGroup[]
  summary: {
    total: number
    valid: number
    errors: number
    warnings: number
    groups: number
    total_value: number
  }
}

/**
 * Issue found during validation
 */
export interface ValidationIssue {
  row_number: number
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  field?: string
  value?: string
  resolutions?: Array<{
    action: string
    label: string
  }>
}

// ============================================================================
// BULK CREATE TYPES
// ============================================================================

/**
 * Input for bulk PO creation
 */
export interface BulkCreatePOInput {
  products: Array<{
    product_code: string
    quantity: number
    expected_delivery?: string
    unit_price?: number
    notes?: string
    warehouse_code?: string
  }>
  default_warehouse_id?: string
  default_expected_delivery?: string
}

/**
 * Summary of a created PO
 */
export interface POSummary {
  po_id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  line_count: number
  total: number
  currency: Currency
  status: POStatus
}

/**
 * Error during bulk operation
 */
export interface BulkError {
  product_code?: string
  po_id?: string
  po_number?: string
  supplier_name?: string
  group_index?: number
  error: string
  code?: string
  row_number?: number
  details?: Record<string, unknown>
  resolutions?: string[]
}

/**
 * Result of bulk PO creation
 */
export interface BulkCreatePOResult {
  success: boolean
  pos_created: POSummary[]
  errors: BulkError[]
  total_lines: number
  total_value: number
}

// ============================================================================
// BULK STATUS UPDATE TYPES
// ============================================================================

/**
 * Valid bulk actions
 */
export type BulkAction = 'approve' | 'reject' | 'cancel' | 'confirm'

/**
 * Request for bulk status update
 */
export interface BulkStatusUpdateRequest {
  po_ids: string[]
  action: BulkAction
  reason?: string
  comments?: string
}

/**
 * Result of individual PO update
 */
export interface BulkUpdateItemResult {
  po_id: string
  po_number: string
  status?: POStatus
  success: boolean
  error?: string
}

/**
 * Result of bulk status update
 */
export interface BulkStatusUpdateResult {
  success: boolean
  success_count: number
  error_count: number
  results: BulkUpdateItemResult[]
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Request for PO export
 */
export interface POExportRequest {
  po_ids?: string[]
  filters?: {
    status?: POStatus | POStatus[]
    supplier_id?: string
    warehouse_id?: string
    date_from?: string
    date_to?: string
  }
}

/**
 * Export progress info
 */
export interface ExportProgress {
  status: 'preparing' | 'generating' | 'complete' | 'error'
  progress: number
  message?: string
}

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

/**
 * Import wizard step
 */
export type ImportWizardStep = 1 | 2 | 3 | 4

/**
 * Import wizard state
 */
export interface ImportWizardState {
  step: ImportWizardStep
  file: File | null
  fileName: string
  parsedRows: ImportRowWithValidation[]
  groups: ImportGroup[]
  validationResult: ValidationResult | null
  createResult: BulkCreatePOResult | null
  isProcessing: boolean
  processingMessage: string
  processingProgress: number
  error: string | null
}

/**
 * Selection state for bulk operations
 */
export interface POSelectionState {
  selectedIds: Set<string>
  selectedStatuses: Map<string, POStatus>
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const IMPORT_FILE_MAX_SIZE = 5 * 1024 * 1024 // 5MB
export const IMPORT_MAX_ROWS = 500
export const EXPORT_MAX_POS = 1000
export const BULK_STATUS_MAX_POS = 100

export const SUPPORTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
]

export const SUPPORTED_FILE_EXTENSIONS = ['.xlsx', '.xls', '.csv']

export const IMPORT_TEMPLATE_COLUMNS = [
  { name: 'product_code', required: true, description: 'Product code or SKU' },
  { name: 'quantity', required: true, description: 'Order quantity' },
  { name: 'unit_price', required: false, description: 'Unit price (uses default if empty)' },
  { name: 'supplier_code', required: false, description: 'Override default supplier' },
  { name: 'expected_date', required: false, description: 'Expected delivery (YYYY-MM-DD)' },
  { name: 'notes', required: false, description: 'Line notes' },
] as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if file type is supported for import
 */
export function isValidFileType(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  return SUPPORTED_FILE_EXTENSIONS.includes(extension)
}

/**
 * Check if file size is within limit
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= IMPORT_FILE_MAX_SIZE
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get status color classes for import row
 */
export function getImportRowStatusClasses(status: 'valid' | 'error' | 'warning'): string {
  switch (status) {
    case 'valid':
      return 'bg-green-50 border-green-200'
    case 'error':
      return 'bg-red-50 border-red-200'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200'
    default:
      return ''
  }
}

/**
 * Check if bulk action is available for given statuses
 */
export function canPerformBulkAction(
  action: BulkAction,
  statuses: POStatus[]
): { allowed: boolean; reason?: string } {
  switch (action) {
    case 'approve': {
      const canApprove = statuses.every(s => s === 'pending_approval' || s === 'submitted')
      return {
        allowed: canApprove,
        reason: canApprove ? undefined : 'Can only approve POs in Pending Approval or Submitted status',
      }
    }
    case 'reject': {
      const canReject = statuses.every(s => s === 'pending_approval' || s === 'submitted')
      return {
        allowed: canReject,
        reason: canReject ? undefined : 'Can only reject POs in Pending Approval or Submitted status',
      }
    }
    case 'cancel': {
      const canCancel = statuses.every(s => !['closed', 'cancelled', 'receiving'].includes(s))
      return {
        allowed: canCancel,
        reason: canCancel ? undefined : 'Cannot cancel POs that are Closed, Cancelled, or Receiving',
      }
    }
    case 'confirm': {
      const canConfirm = statuses.every(s => s === 'approved')
      return {
        allowed: canConfirm,
        reason: canConfirm ? undefined : 'Can only confirm Approved POs',
      }
    }
    default:
      return { allowed: false, reason: 'Unknown action' }
  }
}
