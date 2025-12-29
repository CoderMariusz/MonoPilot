/**
 * Nutrition Service
 * Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
 *
 * Provides nutrition calculation from BOM ingredients, manual override,
 * and ingredient nutrition CRUD operations.
 *
 * Key Features:
 * - Weighted average calculation from BOM ingredients
 * - Yield adjustment (concentration factor)
 * - Per 100g and per serving calculations
 * - % Daily Value calculations
 * - Manual override with audit trail
 * - Missing ingredient detection
 *
 * AC Coverage:
 * - AC-13.3: Energy calculation formula
 * - AC-13.4: Yield adjustment
 * - AC-13.5: Per-100g calculations
 * - AC-13.6-13.8: Missing ingredient handling
 * - AC-13.10-13.11: Manual override with audit trail
 * - AC-13.20: % DV calculation
 */

import { createClient } from '@/lib/supabase/client'
import {
  ProductNutrition,
  IngredientNutrition,
  CalculationResult,
  NutrientProfile,
  NutritionOverrideInput,
  IngredientNutritionInput,
  FDA_DAILY_VALUES,
  IngredientContribution,
  MissingIngredient,
} from '../types/nutrition'
import { nutritionOverrideSchema } from '../validation/nutrition-schema'

// Type for Supabase client (can be real or mock)
type SupabaseClient = ReturnType<typeof createClient>

// ============================================
// CONSTANTS
// ============================================

/**
 * All nutrient fields used in calculations
 * Extracted to prevent duplication and typos
 */
const NUTRIENT_KEYS = [
  'energy_kcal',
  'energy_kj',
  'protein_g',
  'fat_g',
  'saturated_fat_g',
  'trans_fat_g',
  'carbohydrate_g',
  'sugar_g',
  'added_sugar_g',
  'fiber_g',
  'sodium_mg',
  'salt_g',
  'cholesterol_mg',
  'vitamin_d_mcg',
  'calcium_mg',
  'iron_mg',
  'potassium_mg',
  'vitamin_c_mg',
  'vitamin_a_mcg',
  'moisture_g',
] as const

/**
 * Error class for nutrition-specific errors
 */
class NutritionError extends Error {
  code: string
  missing?: MissingIngredient[]

  constructor(code: string, message: string, missing?: MissingIngredient[]) {
    super(message)
    this.name = 'NutritionError'
    this.code = code
    this.missing = missing
  }
}

/**
 * NutritionService class
 * Handles all nutrition calculation and CRUD operations
 */
export default class NutritionService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Get product nutrition data
   * @param productId - UUID of the product
   * @returns ProductNutrition or null if not found
   */
  async getProductNutrition(productId: string): Promise<ProductNutrition | null> {
    const supabase = this.supabase

    const { data, error } = await supabase
      .from('product_nutrition')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null
      }
      throw new Error(`Database error: ${error.message}`)
    }

    return data as ProductNutrition
  }

  /**
   * Calculate nutrition from BOM ingredients
   *
   * Formula:
   * 1. total_N = SUM(ingredient_N_per_100g * ingredient_qty_kg * 10)
   * 2. yield_factor = expected_output_kg / actual_output_kg
   * 3. adjusted_N = total_N * yield_factor
   * 4. per_100g_N = adjusted_N / (actual_output_kg * 10)
   *
   * @param productId - UUID of the product
   * @param bomId - Optional specific BOM ID (defaults to active BOM)
   * @param actualYieldKg - Optional actual yield for adjustment
   * @param allowPartial - Continue calculation with missing ingredient data
   * @returns CalculationResult with all nutrition data
   */
  async calculateFromBOM(
    productId: string,
    bomId?: string,
    actualYieldKg?: number,
    allowPartial: boolean = false
  ): Promise<CalculationResult> {
    const supabase = this.supabase

    // Step 1: Get BOM (active or specified)
    let bomQuery = supabase
      .from('boms')
      .select('id, product_id, version, output_qty, output_uom, is_active')
      .eq('product_id', productId)

    if (bomId) {
      bomQuery = bomQuery.eq('id', bomId)
    } else {
      bomQuery = bomQuery.eq('is_active', true)
    }

    const { data: boms, error: bomError } = await bomQuery.limit(1)

    if (bomError) {
      throw new Error(`Database error: ${bomError.message}`)
    }

    if (!boms || boms.length === 0) {
      throw new NutritionError(
        'NO_ACTIVE_BOM',
        'No active BOM found for this product. Raw materials do not have BOMs.'
      )
    }

    const bom = boms[0]

    // Step 2: Get BOM items with component details
    const { data: bomItems, error: itemsError } = await supabase
      .from('bom_items')
      .select(`
        id,
        component_id,
        quantity,
        uom,
        sequence,
        products!component_id (
          id,
          code,
          name
        )
      `)
      .eq('bom_id', bom.id)
      .order('sequence', { ascending: true })

    if (itemsError) {
      throw new Error(`Database error: ${itemsError.message}`)
    }

    // Step 3: Get ingredient nutrition data (batch query)
    const ingredientIds = (bomItems || []).map((item: any) => item.component_id)
    const nutritionMap = await this.getBatchIngredientNutrition(ingredientIds)

    // Step 4: Check for missing ingredient nutrition
    const missingIngredients: MissingIngredient[] = []
    for (const item of bomItems || []) {
      if (!nutritionMap.has(item.component_id)) {
        const product = (item as any).products
        missingIngredients.push({
          id: item.component_id,
          name: product?.name || 'Unknown',
          code: product?.code || 'Unknown',
          quantity: item.quantity,
        })
      }
    }

    // Throw error if missing ingredients and not allowing partial
    if (missingIngredients.length > 0 && !allowPartial) {
      throw new NutritionError(
        'MISSING_INGREDIENT_NUTRITION',
        `Missing nutrition data for ingredients: ${missingIngredients.map(i => i.name).join(', ')}`,
        missingIngredients
      )
    }

    // Step 5: Calculate weighted totals
    const totalNutrients: NutrientProfile = {}
    const ingredientContributions: IngredientContribution[] = []
    let totalInputKg = 0

    for (const item of bomItems || []) {
      const nutrition = nutritionMap.get(item.component_id)
      const product = (item as any).products

      // Convert quantity to grams (assuming kg input)
      const quantityKg = this.convertToKg(item.quantity, item.uom)
      const quantityG = quantityKg * 1000
      totalInputKg += quantityKg

      if (nutrition) {
        // Calculate weighted contribution for each nutrient
        for (const key of NUTRIENT_KEYS) {
          const valuePer100g = (nutrition as any)[key]
          if (typeof valuePer100g === 'number') {
            // Weighted contribution: value_per_100g * (quantity_g / 100)
            const weighted = (valuePer100g / 100) * quantityG
            totalNutrients[key as keyof NutrientProfile] =
              ((totalNutrients[key as keyof NutrientProfile] as number) || 0) + weighted
          }
        }

        ingredientContributions.push({
          id: item.component_id,
          name: product?.name || 'Unknown',
          code: product?.code || 'Unknown',
          quantity: item.quantity,
          unit: item.uom,
          nutrients: nutrition as NutrientProfile,
          contribution_percent: 0, // Calculate after total
        })
      } else if (allowPartial) {
        ingredientContributions.push({
          id: item.component_id,
          name: product?.name || 'Unknown',
          code: product?.code || 'Unknown',
          quantity: item.quantity,
          unit: item.uom,
          nutrients: {},
          contribution_percent: 0,
        })
      }
    }

    // Step 6: Apply yield adjustment
    const expectedOutputKg = bom.output_qty || totalInputKg
    const actualOutputKg = actualYieldKg ?? expectedOutputKg
    const yieldFactor = actualOutputKg > 0 ? expectedOutputKg / actualOutputKg : 1

    // Apply yield factor to totals
    for (const key of Object.keys(totalNutrients)) {
      const value = totalNutrients[key as keyof NutrientProfile] as number
      if (typeof value === 'number') {
        ;(totalNutrients as any)[key] = value * yieldFactor
      }
    }

    // Step 7: Convert to per 100g
    const outputGrams = actualOutputKg * 1000
    const per100g: NutrientProfile = {}

    for (const key of Object.keys(totalNutrients)) {
      const value = totalNutrients[key as keyof NutrientProfile] as number
      if (typeof value === 'number' && outputGrams > 0) {
        ;(per100g as any)[key] = (value / outputGrams) * 100
      }
    }

    // Step 8: Calculate contribution percentages
    const totalEnergy = totalNutrients.energy_kcal || 0
    for (const contrib of ingredientContributions) {
      if (contrib.nutrients.energy_kcal && totalEnergy > 0) {
        const ingredientQtyG = this.convertToKg(contrib.quantity, contrib.unit) * 1000
        const ingredientEnergy = ((contrib.nutrients.energy_kcal || 0) / 100) * ingredientQtyG
        contrib.contribution_percent = (ingredientEnergy / totalEnergy) * 100
      }
    }

    // Build warnings for partial calculation
    const warnings: string[] = []
    if (missingIngredients.length > 0) {
      for (const missing of missingIngredients) {
        warnings.push(`Missing ingredient nutrition for ${missing.name} (${missing.code})`)
      }
    }

    return {
      ingredients: ingredientContributions,
      yield: {
        expected_kg: expectedOutputKg,
        actual_kg: actualOutputKg,
        factor: yieldFactor,
      },
      total_per_batch: totalNutrients,
      per_100g: per100g,
      missing_ingredients: missingIngredients,
      warnings,
      metadata: {
        bom_version: bom.version,
        bom_id: bom.id,
        calculated_at: new Date().toISOString(),
      },
    }
  }

  /**
   * Save manual nutrition override with audit trail
   *
   * @param productId - UUID of the product
   * @param data - Override input data
   * @returns Updated ProductNutrition
   */
  async saveOverride(
    productId: string,
    data: NutritionOverrideInput
  ): Promise<ProductNutrition> {
    // Validate input
    const validationResult = nutritionOverrideSchema.safeParse(data)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ')
      throw new NutritionError('VALIDATION_ERROR', errors)
    }

    const supabase = this.supabase

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    // Check if product exists and belongs to user's org
    const { data: product } = await supabase
      .from('products')
      .select('id, org_id')
      .eq('id', productId)
      .single()

    if (!product) {
      throw new NutritionError('PRODUCT_NOT_FOUND', 'Product not found')
    }

    if (product.org_id !== userData.org_id) {
      throw new NutritionError('PRODUCT_NOT_FOUND', 'Product not found')
    }

    const now = new Date().toISOString()

    // Prepare nutrition data
    const nutritionData = {
      org_id: userData.org_id,
      product_id: productId,
      serving_size: data.serving_size,
      serving_unit: data.serving_unit,
      servings_per_container: data.servings_per_container,
      is_manual_override: true,
      override_source: data.source,
      override_reference: data.reference || null,
      override_notes: data.notes || null,
      override_by: user.id,
      override_at: now,
      energy_kcal: data.energy_kcal,
      energy_kj: data.energy_kj || Math.round(data.energy_kcal * 4.184),
      protein_g: data.protein_g,
      fat_g: data.fat_g,
      saturated_fat_g: data.saturated_fat_g,
      trans_fat_g: data.trans_fat_g,
      carbohydrate_g: data.carbohydrate_g,
      sugar_g: data.sugar_g,
      added_sugar_g: data.added_sugar_g,
      fiber_g: data.fiber_g,
      sodium_mg: data.sodium_mg,
      salt_g: data.salt_g,
      cholesterol_mg: data.cholesterol_mg,
      vitamin_d_mcg: data.vitamin_d_mcg,
      calcium_mg: data.calcium_mg,
      iron_mg: data.iron_mg,
      potassium_mg: data.potassium_mg,
      updated_at: now,
    }

    // Upsert nutrition record
    const { data: result, error } = await supabase
      .from('product_nutrition')
      .upsert(nutritionData, {
        onConflict: 'org_id,product_id',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return result as ProductNutrition
  }

  /**
   * Get ingredient nutrition by ID
   *
   * @param ingredientId - UUID of the ingredient/product
   * @returns IngredientNutrition or null if not found
   */
  async getIngredientNutrition(ingredientId: string): Promise<IngredientNutrition | null> {
    const supabase = this.supabase

    const { data, error } = await supabase
      .from('ingredient_nutrition')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Database error: ${error.message}`)
    }

    return data as IngredientNutrition
  }

  /**
   * Save ingredient nutrition data
   *
   * @param ingredientId - UUID of the ingredient/product
   * @param data - Nutrition input data
   * @returns Saved IngredientNutrition
   */
  async saveIngredientNutrition(
    ingredientId: string,
    data: IngredientNutritionInput
  ): Promise<IngredientNutrition> {
    const supabase = this.supabase

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    const now = new Date().toISOString()

    const nutritionData = {
      org_id: userData.org_id,
      ingredient_id: ingredientId,
      per_unit: data.per_unit || 100,
      unit: data.unit || 'g',
      source: data.source,
      source_id: data.source_id,
      source_date: data.source_date,
      confidence: data.confidence || 'medium',
      notes: data.notes,
      energy_kcal: data.energy_kcal,
      energy_kj: data.energy_kj,
      protein_g: data.protein_g,
      fat_g: data.fat_g,
      saturated_fat_g: data.saturated_fat_g,
      trans_fat_g: data.trans_fat_g,
      carbohydrate_g: data.carbohydrate_g,
      sugar_g: data.sugar_g,
      added_sugar_g: data.added_sugar_g,
      fiber_g: data.fiber_g,
      sodium_mg: data.sodium_mg,
      salt_g: data.salt_g,
      cholesterol_mg: data.cholesterol_mg,
      vitamin_d_mcg: data.vitamin_d_mcg,
      calcium_mg: data.calcium_mg,
      iron_mg: data.iron_mg,
      potassium_mg: data.potassium_mg,
      vitamin_c_mg: data.vitamin_c_mg,
      vitamin_a_mcg: data.vitamin_a_mcg,
      moisture_g: data.moisture_g,
      updated_at: now,
    }

    const { data: result, error } = await supabase
      .from('ingredient_nutrition')
      .upsert(nutritionData, {
        onConflict: 'org_id,ingredient_id',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return result as IngredientNutrition
  }

  /**
   * Get ingredient nutrition in batch
   *
   * @param ingredientIds - Array of ingredient UUIDs
   * @returns Map of ingredient ID to nutrition data
   */
  async getBatchIngredientNutrition(
    ingredientIds: string[]
  ): Promise<Map<string, IngredientNutrition>> {
    if (ingredientIds.length === 0) {
      return new Map()
    }

    const supabase = this.supabase

    const { data, error } = await supabase
      .from('ingredient_nutrition')
      .select('*')
      .in('ingredient_id', ingredientIds)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    const nutritionMap = new Map<string, IngredientNutrition>()
    for (const item of data || []) {
      nutritionMap.set(item.ingredient_id, item as IngredientNutrition)
    }

    return nutritionMap
  }

  /**
   * Calculate % Daily Value for a nutrient
   *
   * @param nutrient - Nutrient key (e.g., 'sodium_mg')
   * @param value - Value per serving
   * @returns Rounded percentage (whole number)
   */
  calculatePercentDV(nutrient: string, value: number): number {
    const dailyValue = FDA_DAILY_VALUES[nutrient]
    if (!dailyValue || dailyValue === 0) {
      return 0
    }
    const percentDV = (value / dailyValue) * 100
    return Math.round(percentDV)
  }

  /**
   * Convert quantity to kilograms based on UOM
   */
  private convertToKg(quantity: number, uom: string): number {
    const uomLower = uom.toLowerCase()
    switch (uomLower) {
      case 'kg':
        return quantity
      case 'g':
        return quantity / 1000
      case 'mg':
        return quantity / 1000000
      case 'lb':
      case 'lbs':
        return quantity * 0.453592
      case 'oz':
        return quantity * 0.0283495
      case 'l':
      case 'liter':
      case 'litre':
        return quantity // Assuming 1L = 1kg for liquids
      case 'ml':
        return quantity / 1000
      default:
        return quantity // Default to kg
    }
  }
}

// Export a singleton instance for convenience
export const nutritionService = new NutritionService()
