/**
 * Shelf Life Types - Story 02.11
 * Purpose: TypeScript types for shelf life configuration and management
 */

// ============================================================================
// Storage Condition Types
// ============================================================================

/**
 * Available storage conditions for shelf life configuration
 */
export type StorageCondition =
  | 'original_packaging'
  | 'protect_sunlight'
  | 'refrigeration_required'
  | 'freezing_allowed'
  | 'controlled_atmosphere'

/**
 * Shelf life calculation methods
 */
export type CalculationMethod = 'auto_min_ingredients' | 'manual'

/**
 * Shelf life mode for best before date calculation
 */
export type ShelfLifeMode = 'fixed' | 'rolling'

/**
 * Label format for best before/use by dates
 */
export type LabelFormat = 'best_before_day' | 'best_before_month' | 'use_by'

/**
 * Picking strategy for warehouse operations
 */
export type PickingStrategy = 'FIFO' | 'FEFO'

/**
 * Enforcement level for FEFO settings
 */
export type EnforcementLevel = 'suggest' | 'warn' | 'block'

/**
 * Source of ingredient shelf life data
 */
export type ShelfLifeSource =
  | 'supplier'
  | 'internal_testing'
  | 'regulatory'
  | 'industry_standard'

// ============================================================================
// Shelf Life Configuration Types
// ============================================================================

/**
 * Shelf life configuration stored in product_shelf_life table
 */
export interface ShelfLifeConfig {
  id: string
  org_id: string
  product_id: string
  calculated_days: number | null
  override_days: number | null
  final_days: number
  calculation_method: CalculationMethod
  shortest_ingredient_id: string | null
  processing_impact_days: number
  safety_buffer_percent: number
  safety_buffer_days: number
  override_reason: string | null
  storage_temp_min: number | null
  storage_temp_max: number | null
  storage_humidity_min: number | null
  storage_humidity_max: number | null
  storage_conditions: StorageCondition[]
  storage_instructions: string | null
  shelf_life_mode: ShelfLifeMode
  label_format: LabelFormat
  picking_strategy: PickingStrategy
  min_remaining_for_shipment: number | null
  enforcement_level: EnforcementLevel
  expiry_warning_days: number
  expiry_critical_days: number
  needs_recalculation: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

/**
 * Ingredient with shelf life information
 * Note: Backend uses ingredient_id/ingredient_code/ingredient_name format
 */
export interface IngredientShelfLife {
  // Support both naming conventions
  id?: string
  code?: string
  name?: string
  ingredient_id?: string
  ingredient_code?: string
  ingredient_name?: string

  shelf_life_days: number | null
  shelf_life_source: ShelfLifeSource | null
  supplier_name: string | null
  specification_reference: string | null
  storage_temp_min: number | null
  storage_temp_max: number | null
  storage_humidity_min: number | null
  storage_humidity_max: number | null
  storage_conditions: string[]
  min_acceptable_on_receipt: number | null
  quarantine_required: boolean
  quarantine_duration_days: number | null
  notes?: string | null
}

/**
 * Full API response for shelf life configuration
 * This is a flat structure matching the backend service response
 */
export interface ShelfLifeConfigResponse {
  // Product info
  product_id: string
  product_code: string
  product_name: string

  // BOM info
  bom_version: string | null
  bom_effective_date: string | null

  // Calculated values
  calculated_days: number | null
  calculation_method: CalculationMethod
  shortest_ingredient_id: string | null
  shortest_ingredient_name: string | null
  shortest_ingredient_days: number | null
  processing_impact_days: number
  safety_buffer_percent: number
  safety_buffer_days: number

  // Override values
  override_days: number | null
  override_reason: string | null
  final_days: number

  // Storage conditions
  storage_temp_min: number | null
  storage_temp_max: number | null
  storage_humidity_min: number | null
  storage_humidity_max: number | null
  storage_conditions: StorageCondition[]
  storage_instructions: string | null

  // Best before settings
  shelf_life_mode: ShelfLifeMode
  label_format: LabelFormat

  // FEFO settings
  picking_strategy: PickingStrategy
  min_remaining_for_shipment: number | null
  enforcement_level: EnforcementLevel
  expiry_warning_days: number
  expiry_critical_days: number

  // Status
  needs_recalculation: boolean
  calculated_at: string | null
  updated_at: string
  updated_by: string | null

  // Ingredients list
  ingredients: IngredientShelfLife[]

  // Optional warning (returned when override exceeds calculated)
  warning?: string
}

/**
 * Calculation result from shelf life calculation endpoint
 */
export interface CalculateShelfLifeResponse {
  calculated_days: number
  shortest_ingredient_id: string
  shortest_ingredient_name: string
  shortest_ingredient_days: number
  processing_impact_days: number
  safety_buffer_percent: number
  safety_buffer_days: number
  ingredients_analyzed: number
  missing_shelf_life: {
    id: string
    name: string
  }[]
  calculation_timestamp: string
}

/**
 * Request body for updating shelf life configuration
 */
export interface UpdateShelfLifeRequest {
  use_override?: boolean
  override_days?: number | null
  override_reason?: string | null
  processing_impact_days?: number
  safety_buffer_percent?: number
  storage_temp_min?: number | null
  storage_temp_max?: number | null
  storage_humidity_min?: number | null
  storage_humidity_max?: number | null
  storage_conditions?: StorageCondition[]
  storage_instructions?: string | null
  shelf_life_mode?: ShelfLifeMode
  label_format?: LabelFormat
  picking_strategy?: PickingStrategy
  min_remaining_for_shipment?: number | null
  enforcement_level?: EnforcementLevel
  expiry_warning_days?: number
  expiry_critical_days?: number
}

/**
 * Request body for updating ingredient shelf life
 */
export interface UpdateIngredientShelfLifeRequest {
  shelf_life_days: number
  shelf_life_source: ShelfLifeSource
  supplier_name?: string | null
  specification_reference?: string | null
  storage_temp_min: number
  storage_temp_max: number
  storage_humidity_min?: number | null
  storage_humidity_max?: number | null
  storage_conditions?: string[]
  min_acceptable_on_receipt?: number | null
  quarantine_required?: boolean
  quarantine_duration_days?: number | null
}

// ============================================================================
// Shipment Eligibility Types
// ============================================================================

/**
 * Result of shipment eligibility check
 */
export interface ShipmentEligibility {
  eligible: boolean
  blocked: boolean
  requires_confirmation: boolean
  remaining_days: number
  minimum_required: number
  enforcement_level: EnforcementLevel
  message: string
}

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * Audit action types
 */
export type AuditActionType = 'calculate' | 'override' | 'update_config' | 'recalculate' | 'clear_override'

/**
 * Shelf life audit log entry
 */
export interface ShelfLifeAuditEntry {
  id: string
  product_id: string
  action_type: AuditActionType
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown>
  change_reason: string | null
  changed_at: string
  changed_by: string
  changed_by_name: string
}

/**
 * Audit log response with pagination
 */
export interface ShelfLifeAuditLogResponse {
  total: number
  entries: ShelfLifeAuditEntry[]
}

// ============================================================================
// Recalculation Queue Types
// ============================================================================

/**
 * Product in recalculation queue
 */
export interface RecalculationQueueItem {
  product_id: string
  product_code: string
  product_name: string
  current_days: number | null
  last_calculated_at: string | null
  flagged_at: string
}

/**
 * Recalculation queue response
 */
export interface RecalculationQueueResponse {
  count: number
  products: RecalculationQueueItem[]
}

/**
 * Result of bulk recalculation
 */
export interface BulkRecalculationResult {
  total_processed: number
  successful: number
  failed: number
  results: {
    product_id: string
    product_name: string
    old_days: number | null
    new_days: number | null
    success: boolean
    error?: string
  }[]
}

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Form state for shelf life configuration modal
 */
export interface ShelfLifeFormState {
  use_override: boolean
  override_days: string
  override_reason: string
  processing_impact_days: string
  safety_buffer_percent: string
  storage_temp_min: string
  storage_temp_max: string
  storage_humidity_min: string
  storage_humidity_max: string
  storage_conditions: StorageCondition[]
  storage_instructions: string
  shelf_life_mode: ShelfLifeMode
  label_format: LabelFormat
  picking_strategy: PickingStrategy
  min_remaining_for_shipment: string
  enforcement_level: EnforcementLevel
  expiry_warning_days: string
  expiry_critical_days: string
}

/**
 * Form errors for validation display
 */
export interface ShelfLifeFormErrors {
  override_days?: string
  override_reason?: string
  processing_impact_days?: string
  safety_buffer_percent?: string
  storage_temp_min?: string
  storage_temp_max?: string
  storage_humidity_min?: string
  storage_humidity_max?: string
  storage_instructions?: string
  min_remaining_for_shipment?: string
  expiry_warning_days?: string
  expiry_critical_days?: string
}

// ============================================================================
// Backend Service Types (for shelf-life-service.ts compatibility)
// ============================================================================

/**
 * Audit log response type for backend service
 */
export interface AuditLogResponse {
  total: number
  entries: ShelfLifeAuditEntry[]
}

/**
 * Product needing recalculation
 */
export interface ProductNeedsRecalculation {
  product_id: string
  product_code: string
  product_name: string
  current_days: number | null
  last_calculated_at: string | null
}

/**
 * Single recalculation result
 */
export interface RecalculationResult {
  product_id: string
  product_name: string
  old_days: number | null
  new_days: number | null
  success: boolean
  error?: string
}
