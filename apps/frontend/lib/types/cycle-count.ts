/**
 * Cycle Count Types
 * Wireframe: WH-INV-001 - Cycle Counts Tab (Screen 5)
 * PRD: FR-023 (Cycle Count)
 */

// =============================================================================
// Enums and Constants
// =============================================================================

export type CycleCountType = 'full' | 'partial' | 'cycle' | 'spot'

export type CycleCountStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type CycleCountScopeType = 'zone' | 'location' | 'abc_class' | 'product_category'

// =============================================================================
// Filter Types
// =============================================================================

export interface CycleCountFilters {
  status: CycleCountStatus | 'all'
  warehouse_id?: string
  type?: CycleCountType
  date_from?: string
  date_to?: string
}

// =============================================================================
// Summary Types
// =============================================================================

export interface CycleCountSummary {
  planned_count: number
  in_progress_count: number
  completed_count: number
  with_variances_count: number
}

// =============================================================================
// Main Entity Types
// =============================================================================

export interface CycleCount {
  id: string
  count_number: string
  count_type: CycleCountType
  warehouse_id: string
  warehouse_name: string
  scope: string
  scope_type: CycleCountScopeType
  scope_details: {
    locations?: number
    lp_count: number
    products?: number
  }
  scheduled_date: string
  status: CycleCountStatus
  started_at?: string
  completed_at?: string
  counted_items: number
  total_items: number
  accuracy_pct?: number
  variance_count?: number
  created_by_id: string
  created_by_name: string
  counter_id?: string
  counter_name?: string
  org_id: string
  created_at: string
  updated_at: string
}

// =============================================================================
// Create/Update Types
// =============================================================================

export interface CreateCycleCountInput {
  count_type: CycleCountType
  warehouse_id: string
  scope_type: CycleCountScopeType
  scope_ids: string[]
  scheduled_date: string
  counter_id?: string
}

export interface UpdateCycleCountInput {
  scheduled_date?: string
  counter_id?: string
  status?: CycleCountStatus
}

// =============================================================================
// API Response Types
// =============================================================================

export interface CycleCountPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface CycleCountsResponse {
  success: boolean
  data: CycleCount[]
  summary: CycleCountSummary
  pagination: CycleCountPagination
}

export interface CycleCountResponse {
  success: boolean
  data: CycleCount
}

// =============================================================================
// Status Badge Config
// =============================================================================

export const CYCLE_COUNT_STATUS_CONFIG: Record<
  CycleCountStatus,
  { label: string; className: string }
> = {
  planned: {
    label: 'Planned',
    className: 'bg-blue-100 text-blue-800',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-500',
  },
}

export const CYCLE_COUNT_TYPE_CONFIG: Record<
  CycleCountType,
  { label: string; className: string }
> = {
  full: {
    label: 'Full',
    className: 'bg-purple-100 text-purple-800',
  },
  partial: {
    label: 'Partial',
    className: 'bg-indigo-100 text-indigo-800',
  },
  cycle: {
    label: 'Cycle',
    className: 'bg-cyan-100 text-cyan-800',
  },
  spot: {
    label: 'Spot',
    className: 'bg-orange-100 text-orange-800',
  },
}
