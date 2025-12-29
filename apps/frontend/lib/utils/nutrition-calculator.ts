/**
 * Nutrition Calculation Utilities
 * Story: 02.13 - Nutrition Calculation (Refactoring)
 *
 * Shared calculation helpers for nutrition services.
 * Extracted to reduce duplication and improve testability.
 */

import { NutrientProfile, ProductNutrition } from '../types/nutrition'

/**
 * Calculate per-serving nutrient values from per-100g values
 *
 * @param nutrition - Nutrition data (per 100g/100ml)
 * @param servingSizeG - Serving size in grams
 * @returns Nutrient profile scaled to serving size
 *
 * @example
 * const per100g = { energy_kcal: 250, protein_g: 10 }
 * const perServing = calculatePerServing(per100g, 50)
 * // => { energy_kcal: 125, protein_g: 5 }
 */
export function calculatePerServing(
  nutrition: ProductNutrition | NutrientProfile,
  servingSizeG: number
): NutrientProfile {
  const servingFactor = servingSizeG / 100

  return {
    energy_kcal: Math.round((nutrition.energy_kcal || 0) * servingFactor),
    energy_kj: Math.round((nutrition.energy_kj || 0) * servingFactor),
    protein_g: round((nutrition.protein_g || 0) * servingFactor, 1),
    fat_g: round((nutrition.fat_g || 0) * servingFactor, 1),
    saturated_fat_g: round((nutrition.saturated_fat_g || 0) * servingFactor, 1),
    trans_fat_g: round((nutrition.trans_fat_g || 0) * servingFactor, 1),
    carbohydrate_g: round((nutrition.carbohydrate_g || 0) * servingFactor, 1),
    sugar_g: round((nutrition.sugar_g || 0) * servingFactor, 1),
    added_sugar_g: round((nutrition.added_sugar_g || 0) * servingFactor, 1),
    fiber_g: round((nutrition.fiber_g || 0) * servingFactor, 1),
    sodium_mg: Math.round((nutrition.sodium_mg || 0) * servingFactor),
    salt_g: round((nutrition.salt_g || 0) * servingFactor, 2),
    cholesterol_mg: Math.round((nutrition.cholesterol_mg || 0) * servingFactor),
    vitamin_d_mcg: round((nutrition.vitamin_d_mcg || 0) * servingFactor, 1),
    calcium_mg: Math.round((nutrition.calcium_mg || 0) * servingFactor),
    iron_mg: round((nutrition.iron_mg || 0) * servingFactor, 1),
    potassium_mg: Math.round((nutrition.potassium_mg || 0) * servingFactor),
  }
}

/**
 * Round number to specified decimal places
 *
 * @param value - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Calculate % Daily Value for a nutrient
 *
 * @param value - Nutrient value (per serving)
 * @param dailyValue - FDA daily value for the nutrient
 * @returns Percentage (whole number)
 */
export function calculatePercentDV(value: number, dailyValue: number): number {
  if (!dailyValue || dailyValue === 0) {
    return 0
  }
  const percentDV = (value / dailyValue) * 100
  return Math.round(percentDV)
}

/**
 * Format % DV for display
 *
 * @param percent - Percentage value
 * @returns Formatted string (e.g., "10%" or "<1%")
 */
export function formatPercentDV(percent: number): string {
  if (percent < 1) return '<1%'
  return `${percent}%`
}
