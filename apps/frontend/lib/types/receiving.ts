/**
 * Receiving Types
 * Story 5.32a: Shared Receiving Service - Technical Foundation
 *
 * Types for receiving operations from PO, TO, and manual receiving.
 */

// ============================================================================
// Common Types
// ============================================================================

export type UUID = string

export type ReceiveOperationType = 'po' | 'to' | 'manual'

export type SourceDocumentType = 'po' | 'to'

// ============================================================================
// Receive from PO Types
// ============================================================================

export interface ReceiveLineItem {
  po_line_id: UUID
  qty_received: number
  batch_number: string
  manufacture_date?: Date | string
  expiry_date?: Date | string
  location_id: UUID
}

export interface ReceiveFromPOInput {
  org_id: UUID
  po_id: UUID
  items: ReceiveLineItem[]
  notes?: string
}

export interface ReceiveFromPOResult {
  grn_id: UUID
  grn_number: string
  lp_ids: UUID[]
  lp_numbers: string[]
  po_status_changed: boolean
  po_new_status?: 'PartiallyReceived' | 'Closed'
  items_received: number
  total_qty_received: number
}

// ============================================================================
// Receive from TO Types
// ============================================================================

export interface ReceiveFromTOInput {
  org_id: UUID
  to_id: UUID
  location_id: UUID
  notes?: string
}

export interface ReceiveFromTOResult {
  lp_count: number
  lps_updated: UUID[]
  stock_moves_created: number
  to_status: 'Received'
  to_id: UUID
}

// ============================================================================
// Manual Receive Types
// ============================================================================

export interface ManualReceiveItem {
  product_id: UUID
  qty: number
  batch_number: string
  manufacture_date?: Date | string
  expiry_date?: Date | string
  location_id: UUID
  warehouse_id: UUID
  notes?: string
}

export interface ManualReceiveInput {
  org_id: UUID
  item: ManualReceiveItem
}

export interface ManualReceiveResult {
  lp_id: UUID
  lp_number: string
  qty_received: number
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field?: string
  code: string
  message: string
  line_index?: number
}

export interface ValidationWarning {
  field?: string
  code: string
  message: string
  line_index?: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export type ReceiveOperation =
  | { type: 'po'; data: ReceiveFromPOInput }
  | { type: 'to'; data: ReceiveFromTOInput }
  | { type: 'manual'; data: ManualReceiveInput }

// ============================================================================
// Source Document Types
// ============================================================================

export interface SourceDocumentLine {
  id: UUID
  sequence: number
  product_id: UUID
  product_code: string
  product_name: string
  expected_qty: number
  received_qty: number
  remaining_qty: number
  uom: string
}

export interface SourceDocument {
  id: UUID
  doc_number: string
  doc_type: SourceDocumentType
  status: string
  warehouse_id: UUID
  warehouse_name: string
  supplier_id?: UUID
  supplier_name?: string
  from_warehouse_id?: UUID
  from_warehouse_name?: string
  expected_date?: string
  lines: SourceDocumentLine[]
  created_at: string
  notes?: string
}

// ============================================================================
// Warehouse Settings (for validation)
// ============================================================================

export interface ReceivingSettings {
  allow_over_receipt: boolean
  over_receipt_tolerance_pct: number
  require_batch_number: boolean
  require_expiry_date: boolean
  default_qa_status: 'pending' | 'passed'
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface ReceivingServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: ReceivingErrorCode
  validation?: ValidationResult
}

export type ReceivingErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_STATUS'
  | 'INVALID_QUANTITY'
  | 'OVER_RECEIPT_NOT_ALLOWED'
  | 'OVER_RECEIPT_EXCEEDS_TOLERANCE'
  | 'BATCH_NUMBER_REQUIRED'
  | 'LOCATION_NOT_FOUND'
  | 'PRODUCT_MISMATCH'
  | 'DATABASE_ERROR'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
