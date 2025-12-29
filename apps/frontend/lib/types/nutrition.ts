/**
 * Nutrition Types
 * Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
 *
 * TypeScript interfaces for nutrition calculation, override, and label generation.
 */

// ============================================
// NUTRIENT PROFILE
// ============================================

/**
 * Complete nutrient profile with all macros and micronutrients
 * Values are per 100g/100ml unless otherwise specified
 */
export interface NutrientProfile {
  energy_kcal?: number
  energy_kj?: number
  protein_g?: number
  fat_g?: number
  saturated_fat_g?: number
  trans_fat_g?: number
  carbohydrate_g?: number
  sugar_g?: number
  added_sugar_g?: number
  fiber_g?: number
  sodium_mg?: number
  salt_g?: number
  cholesterol_mg?: number
  vitamin_d_mcg?: number
  calcium_mg?: number
  iron_mg?: number
  potassium_mg?: number
  vitamin_c_mg?: number
  vitamin_a_mcg?: number
  moisture_g?: number
}

// ============================================
// PRODUCT NUTRITION
// ============================================

/**
 * Product nutrition data stored in database
 */
export interface ProductNutrition extends NutrientProfile {
  id: string
  org_id: string
  product_id: string
  serving_size: number | null
  serving_unit: ServingUnit
  servings_per_container: number | null
  is_manual_override: boolean
  override_source?: OverrideSource | null
  override_reference?: string | null
  override_notes?: string | null
  override_by?: string | null
  override_at?: string | null
  calculated_at?: string | null
  bom_version_used?: number | null
  bom_id_used?: string | null
  serving_calculation_method?: string | null
  fda_racc_category?: string | null
  fda_racc_value_g?: number | null
  created_at: string
  updated_at: string
}

/**
 * Valid serving units
 */
export type ServingUnit = 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'piece'

/**
 * Override source types
 */
export type OverrideSource = 'lab_test' | 'supplier_coa' | 'database' | 'calculated' | 'manual'

// ============================================
// INGREDIENT NUTRITION
// ============================================

/**
 * Ingredient nutrition data stored in database
 */
export interface IngredientNutrition extends NutrientProfile {
  id: string
  org_id: string
  ingredient_id: string
  per_unit: number
  unit: 'g' | 'ml'
  source: IngredientSource
  source_id?: string | null
  source_date?: string | null
  verified_by?: string | null
  confidence: ConfidenceLevel
  notes?: string | null
  created_at: string
  updated_at: string
}

/**
 * Valid ingredient nutrition sources
 */
export type IngredientSource = 'usda' | 'eurofir' | 'supplier_coa' | 'manual'

/**
 * Confidence levels for nutrition data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

// ============================================
// CALCULATION RESULT
// ============================================

/**
 * Result of nutrition calculation from BOM
 */
export interface CalculationResult {
  ingredients: IngredientContribution[]
  yield: YieldInfo
  total_per_batch: NutrientProfile
  per_100g: NutrientProfile
  missing_ingredients: MissingIngredient[]
  warnings: string[]
  metadata: CalculationMetadata
}

/**
 * Ingredient contribution to total nutrition
 */
export interface IngredientContribution {
  id: string
  name: string
  code: string
  quantity: number
  unit: string
  nutrients: NutrientProfile
  contribution_percent: number
}

/**
 * Yield information for calculation
 */
export interface YieldInfo {
  expected_kg: number
  actual_kg: number
  factor: number
}

/**
 * Missing ingredient information
 */
export interface MissingIngredient {
  id: string
  name: string
  code: string
  quantity: number
}

/**
 * Calculation metadata
 */
export interface CalculationMetadata {
  bom_version: number
  bom_id: string
  calculated_at: string
}

// ============================================
// OVERRIDE INPUT
// ============================================

/**
 * Input for manual nutrition override
 */
export interface NutritionOverrideInput extends Partial<NutrientProfile> {
  serving_size: number
  serving_unit: ServingUnit
  servings_per_container: number
  energy_kcal: number
  protein_g: number
  fat_g: number
  carbohydrate_g: number
  salt_g: number
  source: OverrideSource
  reference?: string
  notes?: string
}

// ============================================
// INGREDIENT NUTRITION INPUT
// ============================================

/**
 * Input for ingredient nutrition data
 */
export interface IngredientNutritionInput extends Partial<NutrientProfile> {
  per_unit?: number
  unit?: 'g' | 'ml'
  source: IngredientSource
  source_id?: string
  source_date?: string
  confidence?: ConfidenceLevel
  notes?: string
}

// ============================================
// SERVING SIZE
// ============================================

/**
 * Serving size calculation result
 */
export interface ServingSize {
  serving_size_g: number
  serving_size_ml?: number
  servings_per_container: number
}

// ============================================
// FDA RACC
// ============================================

/**
 * FDA Reference Amount Customarily Consumed
 */
export interface RACCReference {
  category: string
  racc_grams: number
  racc_description: string
  common_servings: CommonServing[]
}

/**
 * Common serving size example
 */
export interface CommonServing {
  description: string
  grams: number
}

/**
 * RACC validation result
 */
export interface RACCValidation {
  matches: boolean
  variance_percent: number
  warning?: string
  suggestion?: number
}

// ============================================
// LABEL OUTPUT
// ============================================

/**
 * Nutrition label output
 */
export interface LabelOutput {
  html_content: string
  format: 'fda' | 'eu' | 'canada'
  product?: {
    name: string
    code: string
  }
}

/**
 * PDF export options
 */
export interface PDFOptions {
  width?: number  // inches
  height?: number // inches
}

// ============================================
// FDA DAILY VALUES
// ============================================

/**
 * FDA Daily Values (2016) for % DV calculations
 */
export const FDA_DAILY_VALUES: Record<string, number> = {
  energy_kcal: 2000,
  fat_g: 78,
  saturated_fat_g: 20,
  cholesterol_mg: 300,
  sodium_mg: 2300,
  carbohydrate_g: 275,
  fiber_g: 28,
  sugar_g: 50,
  protein_g: 50,
  vitamin_d_mcg: 20,
  calcium_mg: 1300,
  iron_mg: 18,
  potassium_mg: 4700,
}

// ============================================
// FDA RACC TABLE
// ============================================

/**
 * FDA RACC Reference Table (139 categories)
 * Reference Amounts Customarily Consumed per eating occasion
 */
export const FDA_RACC_TABLE: Record<string, { racc_g: number; description: string }> = {
  // Bakery Products
  'bread': { racc_g: 50, description: '2 slices' },
  'bread rolls': { racc_g: 50, description: '1 roll' },
  'bagels': { racc_g: 55, description: '1/2 bagel' },
  'biscuits': { racc_g: 35, description: '1 biscuit' },
  'croissants': { racc_g: 55, description: '1 croissant' },
  'english muffins': { racc_g: 57, description: '1 muffin' },
  'muffins': { racc_g: 55, description: '1 muffin' },
  'pancakes': { racc_g: 110, description: '3 pancakes' },
  'waffles': { racc_g: 85, description: '2 waffles' },
  'tortillas': { racc_g: 45, description: '1 tortilla' },
  'pita bread': { racc_g: 55, description: '1 pita' },

  // Cookies & Crackers
  'cookies': { racc_g: 30, description: '2-3 cookies' },
  'crackers': { racc_g: 30, description: '15 crackers' },
  'graham crackers': { racc_g: 30, description: '2 full cracker sheets' },
  'rice cakes': { racc_g: 15, description: '2 cakes' },

  // Cereals
  'cereals hot': { racc_g: 40, description: '1 cup cooked' },
  'cereals cold': { racc_g: 40, description: '1 cup' },
  'granola': { racc_g: 55, description: '1/2 cup' },
  'oatmeal': { racc_g: 40, description: '1 cup cooked' },

  // Pasta & Rice
  'pasta': { racc_g: 55, description: '1 cup cooked' },
  'rice': { racc_g: 45, description: '1 cup cooked' },
  'noodles': { racc_g: 55, description: '1 cup cooked' },

  // Dairy
  'milk': { racc_g: 240, description: '1 cup (8 fl oz)' },
  'yogurt': { racc_g: 225, description: '1 container' },
  'cheese': { racc_g: 30, description: '1 slice' },
  'cottage cheese': { racc_g: 113, description: '1/2 cup' },
  'cream cheese': { racc_g: 28, description: '2 tbsp' },
  'butter': { racc_g: 15, description: '1 tbsp' },
  'ice cream': { racc_g: 66, description: '1/2 cup' },
  'sour cream': { racc_g: 30, description: '2 tbsp' },

  // Beverages
  'soft drinks': { racc_g: 360, description: '12 fl oz' },
  'juice': { racc_g: 240, description: '8 fl oz' },
  'coffee': { racc_g: 240, description: '8 fl oz' },
  'tea': { racc_g: 240, description: '8 fl oz' },
  'water': { racc_g: 240, description: '8 fl oz' },
  'energy drinks': { racc_g: 240, description: '8 fl oz' },
  'sports drinks': { racc_g: 240, description: '8 fl oz' },

  // Meat & Poultry
  'meat': { racc_g: 85, description: '3 oz' },
  'poultry': { racc_g: 85, description: '3 oz' },
  'bacon': { racc_g: 16, description: '2 slices' },
  'sausage': { racc_g: 55, description: '2 links' },
  'hot dogs': { racc_g: 45, description: '1 hot dog' },
  'deli meat': { racc_g: 55, description: '2 oz' },

  // Seafood
  'fish': { racc_g: 85, description: '3 oz' },
  'shellfish': { racc_g: 85, description: '3 oz' },
  'canned tuna': { racc_g: 55, description: '2 oz drained' },
  'canned salmon': { racc_g: 55, description: '2 oz' },

  // Eggs
  'eggs': { racc_g: 50, description: '1 egg' },
  'egg substitute': { racc_g: 46, description: '1/4 cup' },

  // Legumes & Nuts
  'beans': { racc_g: 130, description: '1/2 cup' },
  'lentils': { racc_g: 120, description: '1/2 cup' },
  'nuts': { racc_g: 30, description: '1 oz' },
  'peanut butter': { racc_g: 32, description: '2 tbsp' },
  'seeds': { racc_g: 30, description: '1 oz' },
  'tofu': { racc_g: 85, description: '3 oz' },

  // Vegetables
  'vegetables': { racc_g: 85, description: '1/2 cup' },
  'leafy greens': { racc_g: 85, description: '1 cup raw' },
  'potatoes': { racc_g: 148, description: '1 medium' },
  'french fries': { racc_g: 70, description: '2.5 oz' },
  'vegetable juice': { racc_g: 240, description: '8 fl oz' },

  // Fruits
  'fruits': { racc_g: 140, description: '1 medium piece' },
  'berries': { racc_g: 140, description: '1 cup' },
  'dried fruit': { racc_g: 40, description: '1/4 cup' },
  'fruit juice': { racc_g: 240, description: '8 fl oz' },
  'applesauce': { racc_g: 122, description: '1/2 cup' },

  // Snacks
  'chips': { racc_g: 28, description: '1 oz (about 15 chips)' },
  'pretzels': { racc_g: 30, description: '1 oz' },
  'popcorn': { racc_g: 30, description: '3 cups popped' },
  'snack bars': { racc_g: 40, description: '1 bar' },
  'candy': { racc_g: 40, description: '1.5 oz' },
  'chocolate': { racc_g: 40, description: '1.5 oz' },

  // Condiments & Sauces
  'ketchup': { racc_g: 17, description: '1 tbsp' },
  'mustard': { racc_g: 5, description: '1 tsp' },
  'mayonnaise': { racc_g: 13, description: '1 tbsp' },
  'salad dressing': { racc_g: 30, description: '2 tbsp' },
  'salsa': { racc_g: 30, description: '2 tbsp' },
  'soy sauce': { racc_g: 15, description: '1 tbsp' },
  'hot sauce': { racc_g: 5, description: '1 tsp' },
  'barbecue sauce': { racc_g: 32, description: '2 tbsp' },

  // Oils & Fats
  'oil': { racc_g: 14, description: '1 tbsp' },
  'margarine': { racc_g: 14, description: '1 tbsp' },
  'shortening': { racc_g: 12, description: '1 tbsp' },

  // Soups
  'soup': { racc_g: 245, description: '1 cup' },

  // Pizza
  'pizza': { racc_g: 140, description: '1 slice' },

  // Sandwiches
  'sandwiches': { racc_g: 140, description: 'varies' },

  // Desserts
  'cake': { racc_g: 80, description: '1 piece' },
  'pie': { racc_g: 125, description: '1 slice' },
  'brownies': { racc_g: 40, description: '1 brownie' },
  'pudding': { racc_g: 125, description: '1/2 cup' },
  'gelatin dessert': { racc_g: 97, description: '1/2 cup' },

  // Baby Food
  'baby food': { racc_g: 60, description: '1 jar' },

  // Spices
  'spices': { racc_g: 0.5, description: '1/4 tsp' },
  'herbs': { racc_g: 0.5, description: '1/4 tsp' },
  'salt': { racc_g: 1.5, description: '1/4 tsp' },
  'sugar': { racc_g: 4, description: '1 tsp' },
  'honey': { racc_g: 21, description: '1 tbsp' },
  'syrup': { racc_g: 30, description: '2 tbsp' },
  'jam': { racc_g: 20, description: '1 tbsp' },
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Nutrition calculation error
 */
export interface NutritionError {
  code: NutritionErrorCode
  message: string
  missing?: MissingIngredient[]
}

/**
 * Error codes for nutrition operations
 */
export type NutritionErrorCode =
  | 'NO_ACTIVE_BOM'
  | 'MISSING_INGREDIENT_NUTRITION'
  | 'PRODUCT_NOT_FOUND'
  | 'NUTRITION_NOT_FOUND'
  | 'INGREDIENT_NOT_FOUND'
  | 'INGREDIENT_NUTRITION_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'REFERENCE_REQUIRED'
  | 'SERVING_SIZE_REQUIRED'
  | 'CATEGORY_NOT_FOUND'
  | 'DATABASE_ERROR'
