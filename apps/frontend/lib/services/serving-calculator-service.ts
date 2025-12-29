/**
 * Serving Calculator Service
 * Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
 *
 * Provides serving size calculation utilities and FDA RACC lookup.
 *
 * Key Features:
 * - Calculate serving size by weight division
 * - Calculate serving size by piece dimensions
 * - Calculate serving size by volume
 * - FDA RACC (Reference Amount Customarily Consumed) lookup
 * - RACC variance validation with warnings
 *
 * AC Coverage:
 * - AC-13.14: Weight calculation (500g / 10 = 50g)
 * - AC-13.15: FDA RACC lookup (Bread = 50g)
 * - AC-13.16-13.17: RACC variance validation (>20% warning)
 */

import {
  ServingSize,
  RACCReference,
  RACCValidation,
  CommonServing,
  FDA_RACC_TABLE,
} from '../types/nutrition'

// ============================================
// CONSTANTS
// ============================================

/** Maximum variance percentage before warning */
const RACC_VARIANCE_THRESHOLD = 20

// ============================================
// SERVING CALCULATOR SERVICE
// ============================================

/**
 * ServingCalculatorService class
 * Handles serving size calculations and FDA RACC validation
 */
export default class ServingCalculatorService {
  /**
   * Calculate serving size by weight division
   *
   * @param totalWeightG - Total weight in grams
   * @param numServings - Number of servings
   * @returns ServingSize with calculated values
   * @throws Error if inputs are invalid
   */
  calculateByWeight(totalWeightG: number, numServings: number): ServingSize {
    if (totalWeightG <= 0) {
      throw new Error('Weight must be positive')
    }
    if (numServings < 1) {
      throw new Error('Servings must be at least 1')
    }

    const servingSizeG = this.roundToDecimals(totalWeightG / numServings, 2)

    return {
      serving_size_g: servingSizeG,
      servings_per_container: Math.floor(numServings),
    }
  }

  /**
   * Calculate serving size by piece dimensions (number of pieces)
   *
   * @param totalWeightG - Total weight in grams
   * @param numPieces - Number of pieces
   * @returns ServingSize with per-piece weight
   * @throws Error if inputs are invalid
   */
  calculateByDimensions(totalWeightG: number, numPieces: number): ServingSize {
    if (totalWeightG <= 0) {
      throw new Error('Weight must be positive')
    }
    if (numPieces <= 0) {
      throw new Error('Pieces must be positive')
    }

    const servingSizeG = this.roundToDecimals(totalWeightG / numPieces, 2)

    return {
      serving_size_g: servingSizeG,
      servings_per_container: Math.floor(numPieces),
    }
  }

  /**
   * Calculate servings by volume division
   *
   * @param totalVolumeMl - Total volume in milliliters
   * @param servingSizeMl - Serving size in milliliters
   * @param productType - Optional product type for density conversion
   * @returns ServingSize with calculated values
   * @throws Error if inputs are invalid
   */
  calculateByVolume(
    totalVolumeMl: number,
    servingSizeMl: number,
    productType?: string
  ): ServingSize {
    if (totalVolumeMl <= 0) {
      throw new Error('Volume must be positive')
    }
    if (servingSizeMl <= 0) {
      throw new Error('Serving size must be positive')
    }

    const numServings = totalVolumeMl / servingSizeMl

    // Convert ml to g using density (1ml = ~1g for water/milk)
    const density = this.getDensity(productType)
    const servingSizeG = this.roundToDecimals(servingSizeMl * density, 2)

    return {
      serving_size_g: servingSizeG,
      serving_size_ml: servingSizeMl,
      servings_per_container: Math.floor(numServings),
    }
  }

  /**
   * Lookup FDA RACC for a product category
   *
   * @param category - Product category (e.g., 'bread', 'cookies')
   * @returns RACCReference or null if not found
   */
  lookupRACC(category: string): RACCReference | null {
    if (!category) {
      return null
    }

    // Normalize category to lowercase for lookup
    const normalizedCategory = category.toLowerCase().trim()

    // Direct lookup
    let raccData = FDA_RACC_TABLE[normalizedCategory]

    // Try with underscores instead of spaces
    if (!raccData) {
      const underscoreCategory = normalizedCategory.replace(/\s+/g, '_')
      raccData = FDA_RACC_TABLE[underscoreCategory]
    }

    // Try with spaces instead of underscores
    if (!raccData) {
      const spaceCategory = normalizedCategory.replace(/_/g, ' ')
      raccData = FDA_RACC_TABLE[spaceCategory]
    }

    if (!raccData) {
      return null
    }

    // Build common servings array
    const commonServings: CommonServing[] = this.buildCommonServings(
      normalizedCategory,
      raccData.racc_g
    )

    return {
      category: normalizedCategory,
      racc_grams: raccData.racc_g,
      racc_description: raccData.description,
      common_servings: commonServings,
    }
  }

  /**
   * Validate serving size against FDA RACC
   *
   * @param servingSizeG - Proposed serving size in grams
   * @param raccG - FDA RACC reference amount in grams
   * @returns RACCValidation with match status and variance
   * @throws Error if RACC is zero or negative
   */
  validateAgainstRACC(servingSizeG: number, raccG: number): RACCValidation {
    if (raccG <= 0) {
      throw new Error('RACC must be positive')
    }

    // Calculate variance percentage
    // Variance = (serving - RACC) / RACC * 100
    const variance = ((servingSizeG - raccG) / raccG) * 100
    const absVariance = Math.abs(variance)
    const variancePercent = Math.round(absVariance)

    // Determine if within tolerance
    const matches = absVariance <= RACC_VARIANCE_THRESHOLD

    let warning: string | undefined
    if (!matches) {
      const direction = variance > 0 ? 'larger' : 'smaller'
      warning = `Serving size differs from FDA RACC by ${variancePercent}% (${direction}). Consider using ${raccG}g serving size.`
    }

    return {
      matches,
      variance_percent: variancePercent,
      warning,
      suggestion: matches ? undefined : raccG,
    }
  }

  /**
   * Get the full FDA RACC table
   *
   * @returns Object with all RACC categories
   */
  getFdaRaccTable(): typeof FDA_RACC_TABLE {
    return FDA_RACC_TABLE
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Round number to specified decimal places
   */
  private roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  }

  /**
   * Get density factor for liquid products (ml to g conversion)
   */
  private getDensity(productType?: string): number {
    if (!productType) return 1

    const type = productType.toLowerCase()

    // Common product densities (g/ml)
    const densities: Record<string, number> = {
      milk: 1.03,
      cream: 1.01,
      yogurt: 1.04,
      juice: 1.04,
      oil: 0.92,
      honey: 1.42,
      syrup: 1.35,
      water: 1.0,
    }

    return densities[type] || 1.0
  }

  /**
   * Build common serving examples for a category
   */
  private buildCommonServings(category: string, raccG: number): CommonServing[] {
    const servings: CommonServing[] = []

    // Always include the RACC value as a reference
    servings.push({
      description: `1 serving (${raccG}g)`,
      grams: raccG,
    })

    // Add category-specific examples
    switch (category) {
      case 'bread':
        servings.push(
          { description: '1 slice (25g)', grams: 25 },
          { description: '2 slices (50g)', grams: 50 }
        )
        break
      case 'cookies':
        servings.push(
          { description: '1 cookie (15g)', grams: 15 },
          { description: '2 cookies (30g)', grams: 30 }
        )
        break
      case 'milk':
        servings.push(
          { description: '1/2 cup (120ml)', grams: 120 },
          { description: '1 cup (240ml)', grams: 240 }
        )
        break
      case 'cheese':
        servings.push(
          { description: '1 slice (21g)', grams: 21 },
          { description: '1 oz (28g)', grams: 28 }
        )
        break
      default:
        // Add half and double servings
        servings.push(
          { description: `1/2 serving (${Math.round(raccG / 2)}g)`, grams: Math.round(raccG / 2) },
          { description: `2 servings (${raccG * 2}g)`, grams: raccG * 2 }
        )
    }

    return servings
  }
}

// Export a singleton instance for convenience
export const servingCalculatorService = new ServingCalculatorService()
