/**
 * Cost History Types (Story 02.15)
 * Type definitions for cost history and trend analysis
 */

/**
 * Product cost record from product_costs table
 */
export interface ProductCost {
  id: string
  product_id: string
  org_id: string
  cost_type: 'standard' | 'actual' | 'planned'
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number | null
  currency?: string
  effective_from: string
  effective_to: string | null
  bom_id?: string | null
  bom_version: number | null
  routing_id?: string | null
  calculation_method?: string | null
  notes?: string | null
  created_at: string
  created_by: string | null
  updated_at?: string
}

/**
 * Trend summary for cost history
 */
export interface TrendSummary {
  trend_30d: number
  trend_90d: number
  trend_ytd: number
}

/**
 * Cost history item in API response
 */
export interface CostHistoryItem {
  id: string
  cost_type: string
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number | null
  effective_from: string
  effective_to: string | null
  created_at: string
  created_by: string | null
  bom_version: number | null
}

/**
 * Component breakdown data
 */
export interface ComponentBreakdownData {
  current: {
    material: number
    labor: number
    overhead: number
    total: number
  }
  historical: {
    material: number
    labor: number
    overhead: number
    total: number
  }
  changes: {
    material: { amount: number; percent: number }
    labor: { amount: number; percent: number }
    overhead: { amount: number; percent: number }
    total: { amount: number; percent: number }
  }
}

/**
 * Component breakdown input
 */
export interface ComponentBreakdownInput {
  material: number
  labor: number
  overhead: number
  total?: number
}

/**
 * Component breakdown percentages output
 */
export interface ComponentBreakdownPercentages {
  material: number
  labor: number
  overhead: number
  material_change?: number
  labor_change?: number
  overhead_change?: number
}

/**
 * Cost driver data
 */
export interface CostDriver {
  ingredient_id: string
  ingredient_name: string
  ingredient_code: string
  current_cost: number
  historical_cost: number
  change_amount: number
  change_percent: number
  impact_percent: number
}

/**
 * Cost history summary in API response
 */
export interface CostHistorySummary {
  current_cost: number
  current_cost_per_unit: number
  previous_cost: number | null
  change_amount: number
  change_percentage: number
  trend_30d: number
  trend_90d: number
  trend_ytd: number
}

/**
 * Pagination data
 */
export interface PaginationData {
  total: number
  page: number
  limit: number
  total_pages: number
}

/**
 * Product info in API response
 */
export interface ProductInfo {
  id: string
  code: string
  name: string
}

/**
 * Full cost history API response
 */
export interface CostHistoryResponse {
  product: ProductInfo
  summary: CostHistorySummary
  history: CostHistoryItem[]
  pagination: PaginationData
  component_breakdown: ComponentBreakdownData
  cost_drivers: CostDriver[]
}

/**
 * Cost history query options
 */
export interface CostHistoryOptions {
  from?: string
  to?: string
  type?: 'standard' | 'actual' | 'planned' | 'all'
  page?: number
  limit?: number
}
