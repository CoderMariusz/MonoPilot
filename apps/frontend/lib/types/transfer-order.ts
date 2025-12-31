/**
 * Transfer Order Types (Story 03.8)
 *
 * TypeScript interfaces for:
 * - Transfer Orders (headers)
 * - Transfer Order Lines
 * - Combined views with relations
 * - Input/output types for CRUD operations
 */

import type { Warehouse } from './warehouse'

// ============================================================================
// STATUS & PRIORITY ENUMS
// ============================================================================

export type TOStatus = 'draft' | 'planned' | 'partially_shipped' | 'shipped' | 'partially_received' | 'received' | 'closed' | 'cancelled'
export type TOPriority = 'low' | 'normal' | 'high' | 'urgent'

// Status display labels
export const TO_STATUS_LABELS: Record<TOStatus, string> = {
  draft: 'Draft',
  planned: 'Planned',
  partially_shipped: 'Partially Shipped',
  shipped: 'Shipped',
  partially_received: 'Partially Received',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

// Status badge colors
export const TO_STATUS_COLORS: Record<TOStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  planned: { bg: 'bg-blue-100', text: 'text-blue-800' },
  partially_shipped: { bg: 'bg-orange-100', text: 'text-orange-800' },
  shipped: { bg: 'bg-green-100', text: 'text-green-800' },
  partially_received: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  received: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  closed: { bg: 'bg-purple-100', text: 'text-purple-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
}

// Priority display labels
export const TO_PRIORITY_LABELS: Record<TOPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

// Priority badge colors
export const TO_PRIORITY_COLORS: Record<TOPriority, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-700' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700' },
}

// ============================================================================
// TRANSFER ORDER (Header)
// ============================================================================

export interface TransferOrder {
  id: string
  org_id: string
  to_number: string
  from_warehouse_id: string
  to_warehouse_id: string
  planned_ship_date: string
  planned_receive_date: string
  actual_ship_date: string | null
  actual_receive_date: string | null
  status: TOStatus
  priority: TOPriority
  notes: string | null
  shipped_by: string | null
  received_by: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

// ============================================================================
// TRANSFER ORDER LINE
// ============================================================================

export interface TransferOrderLine {
  id: string
  to_id: string
  line_number: number
  product_id: string
  quantity: number
  uom: string
  shipped_qty: number
  received_qty: number
  notes: string | null
  created_at: string
  updated_at: string
}

// Line with product info
export interface TransferOrderLineWithProduct extends TransferOrderLine {
  product: {
    id: string
    code: string
    name: string
    base_uom: string
  }
}

// ============================================================================
// TRANSFER ORDER WITH RELATIONS
// ============================================================================

// Minimal warehouse info for list display
export interface WarehouseInfo {
  id: string
  code: string
  name: string
}

// User info for audit display
export interface UserInfo {
  id: string
  first_name: string
  last_name: string
}

// TO with warehouses (for list view)
export interface TransferOrderWithWarehouses extends TransferOrder {
  from_warehouse: WarehouseInfo
  to_warehouse: WarehouseInfo
  lines_count?: number
}

// TO with full details (for detail view)
export interface TransferOrderWithLines extends TransferOrder {
  from_warehouse: WarehouseInfo
  to_warehouse: WarehouseInfo
  lines: TransferOrderLineWithProduct[]
  created_by_user?: UserInfo
  shipped_by_user?: UserInfo | null
  received_by_user?: UserInfo | null
}

// ============================================================================
// INPUT TYPES (for forms)
// ============================================================================

export interface CreateTOInput {
  from_warehouse_id: string
  to_warehouse_id: string
  planned_ship_date: string
  planned_receive_date: string
  priority?: TOPriority
  notes?: string | null
  lines?: CreateTOLineInput[]
}

export interface UpdateTOInput {
  from_warehouse_id?: string
  to_warehouse_id?: string
  planned_ship_date?: string
  planned_receive_date?: string
  priority?: TOPriority
  notes?: string | null
}

export interface CreateTOLineInput {
  product_id: string
  quantity: number
  notes?: string | null
}

export interface UpdateTOLineInput {
  quantity?: number
  notes?: string | null
}

// ============================================================================
// LIST PARAMETERS
// ============================================================================

export interface TOListParams {
  search?: string
  status?: TOStatus | TOStatus[]
  from_warehouse_id?: string
  to_warehouse_id?: string
  priority?: TOPriority
  sort?: 'to_number' | 'planned_ship_date' | 'status' | 'created_at'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// ============================================================================
// PAGINATED RESULT
// ============================================================================

export interface PaginatedTOResult {
  data: TransferOrderWithWarehouses[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// ============================================================================
// ACTION PERMISSIONS
// ============================================================================

export interface EditPermission {
  canEdit: boolean
  reason?: string
}

export interface DeletePermission {
  canDelete: boolean
  reason?: string
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  valid: boolean
  message?: string
  code?: string
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<TOStatus, TOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['partially_shipped', 'shipped', 'cancelled'],
  partially_shipped: ['shipped', 'partially_received', 'received'],
  shipped: ['partially_received', 'received'],
  partially_received: ['received'],
  received: ['closed'],
  closed: [],
  cancelled: [],
}

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(currentStatus: TOStatus, newStatus: TOStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus)
}

/**
 * Check if a TO can be edited based on status
 */
export function canEditTO(status: TOStatus): boolean {
  return ['draft', 'planned'].includes(status)
}

/**
 * Check if lines can be added/modified based on TO status
 */
export function canModifyLines(status: TOStatus): boolean {
  return status === 'draft'
}

/**
 * Check if a TO can be released (draft -> planned)
 */
export function canRelease(status: TOStatus, linesCount: number): boolean {
  return status === 'draft' && linesCount > 0
}

/**
 * Check if a TO can be cancelled
 */
export function canCancel(status: TOStatus): boolean {
  return ['draft', 'planned'].includes(status)
}

/**
 * Check if Ship action is visible based on TO status
 * AC-8: PLANNED, PARTIALLY_SHIPPED -> Ship visible
 */
export function canShipTO(status: TOStatus): boolean {
  return ['planned', 'partially_shipped'].includes(status)
}

/**
 * Check if Receive action is visible based on TO status
 * AC-8: SHIPPED, PARTIALLY_SHIPPED, PARTIALLY_RECEIVED -> Receive visible
 */
export function canReceiveTO(status: TOStatus): boolean {
  return ['shipped', 'partially_shipped', 'partially_received'].includes(status)
}
