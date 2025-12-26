/**
 * Product Allergen Types (Story 02.3 - MVP)
 * Purpose: TypeScript interfaces for product allergen management
 *
 * MVP Scope: Basic allergen declaration with inheritance
 * Phase 1+: Custom allergens, thresholds, risk assessment (excluded)
 */

/**
 * Product Allergen Declaration
 * Links a product to an allergen with relation type and source tracking
 */
export interface ProductAllergen {
  id: string
  allergen_id: string
  allergen_code: string // A01-A14 (EU 14)
  allergen_name: string // e.g., "Gluten", "Peanuts"
  allergen_icon: string | null // Icon URL or emoji
  relation_type: 'contains' | 'may_contain'
  source: 'auto' | 'manual' // auto = inherited from BOM, manual = user-declared
  source_products?: {
    // For auto-inherited allergens
    id: string
    code: string
    name: string
  }[]
  reason?: string // Required for may_contain (AC-08)
  created_at: string
  created_by: string
  updated_at?: string
}

/**
 * Add Product Allergen Request
 * Used when manually declaring an allergen on a product
 */
export interface AddProductAllergenRequest {
  allergen_id: string
  relation_type: 'contains' | 'may_contain'
  reason?: string // Required if relation_type = 'may_contain' (min 10, max 500 chars)
}

/**
 * Product Allergens Response
 * Returned by GET /api/v1/technical/products/:id/allergens
 */
export interface ProductAllergensResponse {
  allergens: ProductAllergen[]
  inheritance_status: InheritanceStatus
}

/**
 * Inheritance Status
 * Tracks whether allergens need recalculation from BOM
 */
export interface InheritanceStatus {
  last_calculated: string | null // ISO datetime of last recalculation
  bom_version: string | null // BOM version used for last calculation
  ingredients_count: number // Number of BOM items (ingredients)
  needs_recalculation: boolean // True if BOM changed since last calculation
}

/**
 * Recalculate Allergens Response
 * Returned by POST /api/v1/technical/boms/:id/allergens
 */
export interface RecalculateAllergensResponse {
  inherited_allergens: ProductAllergen[] // Auto-inherited from BOM
  manual_allergens: ProductAllergen[] // Preserved manual declarations
  removed_count: number // Count of stale auto-inherited allergens removed
  bom_version: string // BOM version used for calculation
}

/**
 * Allergen (Master Data from Story 01.12)
 * Global reference data for EU 14 allergens
 */
export interface Allergen {
  id: string
  code: string // A01-A14
  name_en: string
  name_pl: string
  name_de: string | null
  name_fr: string | null
  icon_url: string | null
  is_eu_mandatory: boolean
  is_active: boolean
  display_order: number
}

/**
 * Allergens List Response
 * Returned by GET /api/v1/allergens
 */
export interface AllergensListResponse {
  allergens: Allergen[]
}

/**
 * Allergen Select Option
 * For dropdown/select components
 */
export interface AllergenSelectOption {
  value: string // allergen_id
  label: string // allergen name
  code: string // A01-A14
  icon_url: string | null
}
