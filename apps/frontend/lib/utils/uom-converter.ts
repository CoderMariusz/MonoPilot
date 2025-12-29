/**
 * UOM (Unit of Measure) Converter Utility
 * Story: 02.13 - Nutrition Calculation (Refactoring)
 *
 * Centralized unit conversion logic for nutrition calculations.
 * Supports weight and volume conversions to kilograms.
 */

// ============================================
// CONVERSION CONSTANTS
// ============================================

/**
 * Conversion factors to kilograms
 */
const CONVERSION_TO_KG: Record<string, number> = {
  // Weight units
  kg: 1,
  g: 0.001,
  mg: 0.000001,
  lb: 0.453592,
  lbs: 0.453592,
  oz: 0.0283495,

  // Volume units (assuming 1L = 1kg for liquids - density correction applied separately)
  l: 1,
  liter: 1,
  litre: 1,
  ml: 0.001,
}

// ============================================
// UOM CONVERTER
// ============================================

/**
 * Convert quantity to kilograms based on UOM
 *
 * @param quantity - Numeric quantity to convert
 * @param uom - Unit of measure (case-insensitive)
 * @returns Converted quantity in kilograms
 *
 * @example
 * convertToKg(1000, 'g') // => 1
 * convertToKg(2, 'lb') // => 0.907184
 * convertToKg(500, 'ml') // => 0.5 (assuming water density)
 */
export function convertToKg(quantity: number, uom: string): number {
  const uomLower = uom.toLowerCase().trim()
  const conversionFactor = CONVERSION_TO_KG[uomLower]

  if (conversionFactor !== undefined) {
    return quantity * conversionFactor
  }

  // Default to kg if unit not recognized
  return quantity
}

/**
 * Get all supported UOM codes
 *
 * @returns Array of supported UOM codes
 */
export function getSupportedUOMs(): string[] {
  return Object.keys(CONVERSION_TO_KG)
}

/**
 * Check if a UOM is supported
 *
 * @param uom - Unit of measure to check
 * @returns True if supported, false otherwise
 */
export function isSupportedUOM(uom: string): boolean {
  const uomLower = uom.toLowerCase().trim()
  return uomLower in CONVERSION_TO_KG
}
