/**
 * Costing Types (Story 02.9)
 * Type definitions for BOM cost calculation and display
 */

/**
 * Material/Ingredient cost breakdown
 */
export interface MaterialCostBreakdown {
  ingredient_id: string
  ingredient_code: string
  ingredient_name: string
  quantity: number
  uom: string
  unit_cost: number
  scrap_percent: number
  scrap_cost: number
  total_cost: number
  percentage: number
}

/**
 * Operation cost breakdown from routing
 */
export interface OperationCostBreakdown {
  operation_seq: number
  operation_name: string
  machine_name: string | null
  setup_time_min: number
  duration_min: number
  cleanup_time_min: number
  labor_rate: number
  setup_cost: number
  run_cost: number
  cleanup_cost: number
  total_cost: number
  percentage: number
}

/**
 * Routing cost breakdown (for BOM cost response)
 */
export interface RoutingCostBreakdown {
  routing_id: string
  routing_code: string
  setup_cost: number
  working_cost_per_unit: number
  total_working_cost: number
  total_routing_cost: number
}

/**
 * Routing cost summary (legacy alias)
 */
export type RoutingCostSummary = RoutingCostBreakdown

/**
 * Overhead cost breakdown
 */
export interface OverheadBreakdown {
  allocation_method: 'percentage' | 'labor_hours' | 'fixed'
  overhead_percent?: number
  overhead_rate_per_hour?: number
  labor_hours?: number
  subtotal_before_overhead: number
  overhead_cost: number
}

/**
 * Cost breakdown details
 */
export interface CostBreakdown {
  materials: MaterialCostBreakdown[]
  operations: OperationCostBreakdown[]
  routing: RoutingCostBreakdown
  overhead: OverheadBreakdown
}

/**
 * Margin analysis data
 */
export interface MarginAnalysisData {
  std_price: number | null
  target_margin_percent: number
  actual_margin_percent: number | null
  below_target: boolean
}

/**
 * BOM Cost Response from API
 */
export interface BOMCostResponse {
  bom_id: string
  product_id: string
  cost_type: 'standard' | 'actual' | 'planned'
  batch_size: number
  batch_uom: string
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number
  currency: string
  calculated_at: string
  calculated_by: string | null
  is_stale: boolean
  breakdown: CostBreakdown
  margin_analysis: MarginAnalysisData | null
}

/**
 * Recalculate cost response
 */
export interface RecalculateCostResponse {
  success: boolean
  cost: BOMCostResponse
  calculated_at: string
  warnings?: string[]
  message?: string
}

/**
 * Routing cost response (standalone)
 */
export interface RoutingCostResponse {
  routing_id: string
  routing_code: string
  total_operation_cost: number
  total_routing_cost: number
  total_cost: number
  currency: string
  breakdown: {
    operations: OperationCostBreakdown[]
    routing: RoutingCostBreakdown
  }
}

/**
 * Cost calculation error details
 */
export interface CostCalculationError {
  code: 'NO_ROUTING' | 'MISSING_COSTS' | 'INVALID_BOM' | 'CALCULATION_ERROR'
  message: string
  missing_ingredients?: Array<{
    id: string
    code: string
    name: string
    reason: string
  }>
}
