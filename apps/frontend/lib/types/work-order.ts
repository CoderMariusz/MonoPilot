/**
 * Work Order Types (Story 03.10)
 * Type definitions for Work Order CRUD with BOM Auto-Select
 */

// ============================================================================
// ENUMS
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

export type SourceOfDemand =
  | 'manual'
  | 'po'
  | 'customer_order'
  | 'forecast'

// ============================================================================
// STATUS CONFIG
// ============================================================================

export const WO_STATUS_CONFIG: Record<WOStatus, {
  label: string
  bgColor: string
  textColor: string
}> = {
  draft: { label: 'Draft', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  planned: { label: 'Planned', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  released: { label: 'Released', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  in_progress: { label: 'In Progress', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  on_hold: { label: 'On Hold', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  completed: { label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  closed: { label: 'Closed', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-800' },
}

export const WO_PRIORITY_CONFIG: Record<WOPriority, {
  label: string
  bgColor: string
  textColor: string
  showIndicator: boolean
}> = {
  low: { label: 'Low', bgColor: 'bg-slate-100', textColor: 'text-slate-600', showIndicator: false },
  normal: { label: 'Normal', bgColor: 'bg-blue-100', textColor: 'text-blue-700', showIndicator: false },
  high: { label: 'High', bgColor: 'bg-amber-100', textColor: 'text-amber-700', showIndicator: true },
  critical: { label: 'Critical', bgColor: 'bg-red-100', textColor: 'text-red-700', showIndicator: true },
}

// ============================================================================
// BASE TYPES
// ============================================================================

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
  source_of_demand: SourceOfDemand | null
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

// ============================================================================
// RELATIONS
// ============================================================================

export interface ProductSummary {
  id: string
  code: string
  name: string
  base_uom: string
}

export interface BomSummary {
  id: string
  code: string
  version: number
  output_qty: number
  effective_from: string
  effective_to: string | null
  item_count?: number
}

export interface RoutingSummary {
  id: string
  code: string
  name: string
}

export interface ProductionLineSummary {
  id: string
  code: string
  name: string
}

export interface MachineSummary {
  id: string
  code: string
  name: string
}

export interface UserSummary {
  id: string
  name: string
}

// ============================================================================
// WORK ORDER WITH RELATIONS
// ============================================================================

export interface WorkOrderWithRelations extends WorkOrder {
  product?: ProductSummary
  bom?: BomSummary
  routing?: RoutingSummary
  production_line?: ProductionLineSummary
  machine?: MachineSummary
  created_by_user?: UserSummary
}

// ============================================================================
// LIST ITEM
// ============================================================================

export interface WOListItem {
  id: string
  wo_number: string
  product_id: string
  product_code: string
  product_name: string
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: WOStatus
  planned_start_date: string | null
  production_line_id: string | null
  production_line_name: string | null
  priority: WOPriority
  bom_id: string | null
  created_at: string
}

// ============================================================================
// BOM SELECTION
// ============================================================================

export interface BomPreview {
  bom_id: string
  bom_code: string
  bom_version: number
  output_qty: number
  output_uom: string
  effective_from: string
  effective_to: string | null
  routing_id: string | null
  routing_name: string | null
  item_count: number
  is_current?: boolean
  is_recommended?: boolean
}

export interface BomValidationResult {
  valid: boolean
  bom?: BomPreview
  error?: string
  warning?: string
}

// ============================================================================
// STATUS HISTORY
// ============================================================================

export interface WOStatusHistory {
  id: string
  wo_id: string
  from_status: WOStatus | null
  to_status: WOStatus
  changed_by: string
  changed_at: string
  notes: string | null
  changed_by_user?: UserSummary
}

// ============================================================================
// LIST PARAMS AND PAGINATION
// ============================================================================

export interface WOListParams {
  page?: number
  limit?: number
  search?: string
  product_id?: string
  status?: string | string[]
  line_id?: string
  machine_id?: string
  priority?: WOPriority
  date_from?: string
  date_to?: string
  sort?: 'created_at' | 'wo_number' | 'planned_start_date' | 'status' | 'priority'
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

// ============================================================================
// KPI SUMMARY
// ============================================================================

export interface WOKPISummary {
  scheduled_today_count: number
  in_progress_count: number
  on_hold_count: number
  this_week_count: number
}

// ============================================================================
// CREATE/UPDATE INPUTS
// ============================================================================

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
  source_of_demand?: SourceOfDemand | null
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
  source_of_demand?: SourceOfDemand | null
  source_reference?: string | null
  expiry_date?: string | null
  notes?: string | null
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['released', 'draft', 'cancelled'],
  released: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
}

export const LOCKED_FIELDS_AFTER_RELEASE = [
  'product_id',
  'bom_id',
  'planned_quantity',
]

export function canTransitionStatus(
  currentStatus: WOStatus,
  targetStatus: WOStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false
}

export function canEditField(status: WOStatus, field: string): boolean {
  if (['released', 'in_progress', 'on_hold', 'completed', 'closed'].includes(status)) {
    return !LOCKED_FIELDS_AFTER_RELEASE.includes(field)
  }
  if (status === 'cancelled') {
    return false
  }
  return true
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatWOStatus(status: WOStatus): string {
  return WO_STATUS_CONFIG[status]?.label ?? status
}

export function formatWOPriority(priority: WOPriority): string {
  return WO_PRIORITY_CONFIG[priority]?.label ?? priority
}

export function getRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const targetDate = new Date(dateStr)
  targetDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function calculateProgress(produced: number, planned: number): number {
  if (planned <= 0) return 0
  return Math.min(100, Math.round((produced / planned) * 100))
}
