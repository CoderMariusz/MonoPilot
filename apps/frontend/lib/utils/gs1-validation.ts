/**
 * GS1 Validation Utilities
 * Story: 02.1 - Products
 *
 * Implements GS1 standard validation for GTIN-14 barcodes.
 * Algorithm: https://www.gs1.org/services/how-calculate-check-digit-manually
 */

/** Length of a valid GTIN-14 barcode */
export const GTIN14_LENGTH = 14

/** Number of digits used in check digit calculation (excludes check digit itself) */
const GTIN14_CALCULATION_LENGTH = 13

/**
 * Calculate GTIN-14 check digit using GS1 algorithm
 *
 * The algorithm:
 * 1. Take first 13 digits
 * 2. Multiply odd positions (1st, 3rd, 5th...) by 3, even positions by 1
 * 3. Sum all results
 * 4. Check digit = (10 - (sum mod 10)) mod 10
 *
 * @param gtin - 14-digit string (only first 13 digits used)
 * @returns Calculated check digit (0-9)
 */
export function calculateGtinCheckDigit(gtin: string): number {
  const digits = gtin.substring(0, GTIN14_CALCULATION_LENGTH).split('').map(Number)
  let sum = 0

  for (let i = 0; i < GTIN14_CALCULATION_LENGTH; i++) {
    // Multiply odd positions (1st, 3rd, 5th...) by 3, even positions by 1
    const multiplier = i % 2 === 0 ? 3 : 1
    sum += digits[i] * multiplier
  }

  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

/**
 * Validate GTIN-14 check digit
 *
 * @param gtin - 14-digit string to validate
 * @returns true if valid GTIN-14 with correct check digit
 */
export function isValidGtin14(gtin: string): boolean {
  if (!/^\d{14}$/.test(gtin)) {
    return false
  }

  const checkDigit = parseInt(gtin.charAt(GTIN14_CALCULATION_LENGTH), 10)
  const calculatedCheckDigit = calculateGtinCheckDigit(gtin)

  return checkDigit === calculatedCheckDigit
}

/**
 * Validate decimal places count
 *
 * @param value - Number to check
 * @param maxDecimals - Maximum allowed decimal places
 * @returns true if value has maxDecimals or fewer decimal places
 */
export function hasMaxDecimals(value: number, maxDecimals: number): boolean {
  const decimalString = value.toString()
  if (!decimalString.includes('.')) {
    return true
  }
  const decimals = decimalString.split('.')[1]
  return decimals.length <= maxDecimals
}
