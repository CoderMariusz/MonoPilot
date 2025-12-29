/**
 * GS1 Service - Story 02.10a
 * Purpose: GS1-128 barcode encoding for food manufacturing traceability
 *
 * GS1-128 Application Identifiers (AI):
 * - AI 00: SSCC-18 (Serial Shipping Container Code) - 18 digits
 * - AI 01: GTIN-14 (Global Trade Item Number) - 14 digits
 * - AI 10: Batch/Lot Number - max 20 alphanumeric
 * - AI 17: Use By/Expiry Date - YYMMDD format
 *
 * Coverage Target: 95% (CRITICAL - barcode scanning compliance)
 */

// FNC1 separator for variable-length AIs (used between AIs in barcode)
const FNC1 = '\u001d'

/**
 * GS1 Data structure for combined barcode generation
 */
export interface GS1Data {
  gtin?: string
  lotNumber?: string
  expiryDate?: Date
  sscc?: string
  serialNumber?: string
  quantity?: number
}

/**
 * SSCC Input structure for SSCC-18 generation
 */
export interface SSCCInput {
  extensionDigit: string
  companyPrefix: string
  serialReference: string
}

/**
 * Encode lot number as GS1-128 AI 10 format
 * AI 10: Batch/Lot Number (variable length, max 20 alphanumeric)
 *
 * @param lotNumber - The lot number to encode
 * @returns Encoded string with AI prefix "(10)"
 *
 * @example
 * encodeLotNumber("LOT-2025-000001") // Returns "(10)LOT-2025-000001"
 */
export function encodeLotNumber(lotNumber: string): string {
  if (lotNumber.length > 20) {
    console.warn(
      `Lot number exceeds GS1 AI 10 max length of 20 chars (${lotNumber.length} chars)`
    )
  }
  return `(10)${lotNumber}`
}

/**
 * Encode expiry date as GS1-128 AI 17 format
 * AI 17: Use By or Expiry Date (fixed 6 digits: YYMMDD)
 *
 * @param expiryDate - Date object to encode
 * @returns Encoded string with AI prefix "(17)" and YYMMDD date
 *
 * @example
 * encodeExpiryDate(new Date("2025-06-15")) // Returns "(17)250615"
 */
export function encodeExpiryDate(expiryDate: Date): string {
  const yy = String(expiryDate.getFullYear()).slice(-2)
  const mm = String(expiryDate.getMonth() + 1).padStart(2, '0')
  const dd = String(expiryDate.getDate()).padStart(2, '0')
  return `(17)${yy}${mm}${dd}`
}

/**
 * Validate GTIN-14 including check digit
 * Uses Modulo 10 algorithm (GS1 standard)
 *
 * @param gtin - 14-digit GTIN to validate
 * @returns Object with valid flag and optional error message
 *
 * @example
 * validateGTIN14("12345678901231") // Returns { valid: true }
 * validateGTIN14("12345678901230") // Returns { valid: false, error: "Invalid check digit..." }
 */
export function validateGTIN14(gtin: string): { valid: boolean; error: string | undefined } {
  // Remove any non-digit characters for validation
  const digits = gtin.replace(/\D/g, '')

  if (digits.length !== 14) {
    return {
      valid: false,
      error: `GTIN-14 must be exactly 14 digits, got ${digits.length}`
    }
  }

  const checkDigit = parseInt(digits[13], 10)
  const calculatedCheck = parseInt(calculateCheckDigit(digits.slice(0, 13)), 10)

  if (checkDigit !== calculatedCheck) {
    return {
      valid: false,
      error: `Invalid check digit. Expected ${calculatedCheck}, got ${checkDigit}`
    }
  }

  return { valid: true, error: undefined }
}

/**
 * Calculate GS1 check digit using Modulo 10 algorithm
 *
 * Algorithm:
 * 1. Number positions from right to left (check digit position = 1)
 * 2. Multiply odd position digits by 3, even position digits by 1
 * 3. Sum all products
 * 4. Check digit = (10 - (sum mod 10)) mod 10
 *
 * @param gtinWithoutCheck - GTIN string without check digit (13 digits for GTIN-14)
 * @returns Single digit (0-9) as string
 *
 * @example
 * calculateCheckDigit("1234567890123") // Returns "1"
 */
export function calculateCheckDigit(gtinWithoutCheck: string): string {
  const digits = gtinWithoutCheck.replace(/\D/g, '')
  let sum = 0

  // Process from right to left
  // In GS1, odd positions (from right) multiply by 3, even positions by 1
  // Since we're adding check digit at the end, current rightmost position is position 2
  for (let i = digits.length - 1; i >= 0; i--) {
    const digit = parseInt(digits[i], 10)
    // Position from right: (digits.length - i)
    // For the digit positions BEFORE check digit:
    // Position 2, 4, 6, 8... (even from right) multiply by 3
    // Position 3, 5, 7, 9... (odd from right) multiply by 1
    const position = digits.length - i
    const weight = position % 2 === 1 ? 3 : 1
    sum += digit * weight
  }

  return String((10 - (sum % 10)) % 10)
}

/**
 * Generate SSCC-18 code (Serial Shipping Container Code)
 * AI 00: SSCC (fixed 18 digits)
 *
 * Format: Extension Digit (1) + Company Prefix (7-10) + Serial Reference (padded) + Check Digit (1)
 *
 * @param input - SSCC components (extensionDigit, companyPrefix, serialReference)
 * @returns Encoded string with AI prefix "(00)" and 18-digit SSCC
 *
 * @example
 * encodeSSCC({ extensionDigit: "0", companyPrefix: "1234567", serialReference: "0000001" })
 * // Returns "(00)012345670000001X" where X is calculated check digit
 */
export function encodeSSCC(input: SSCCInput): string {
  const { extensionDigit, companyPrefix, serialReference } = input

  // Build base (17 digits): extension + company prefix + serial reference
  // Total must be 17 digits before check digit
  const baseWithoutCheck = extensionDigit + companyPrefix + serialReference

  // Pad or truncate to exactly 17 digits
  const paddedBase = baseWithoutCheck.padEnd(17, '0').slice(0, 17)

  // Calculate check digit for 18-digit SSCC
  const checkDigit = calculateCheckDigit(paddedBase)

  return `(00)${paddedBase}${checkDigit}`
}

/**
 * Generate combined GS1-128 barcode string
 * Combines multiple AIs in standard GS1 order
 *
 * Standard AI order: (01) GTIN -> (17) Expiry -> (10) Lot -> (00) SSCC
 *
 * @param data - GS1Data object with optional fields
 * @returns Combined barcode string with FNC1 separators where needed
 *
 * @example
 * generateGS1128Barcode({
 *   gtin: "12345678901234",
 *   lotNumber: "LOT001",
 *   expiryDate: new Date("2025-06-15")
 * })
 * // Returns "(01)12345678901234(17)250615(10)LOT001"
 */
export function generateGS1128Barcode(data: GS1Data): string {
  const parts: string[] = []

  // Add GTIN first (AI 01) - fixed length, no FNC1 needed
  if (data.gtin) {
    parts.push(`(01)${data.gtin}`)
  }

  // Add lot number (AI 10) - variable length, FNC1 needed after if followed by another AI
  // Note: GS1 standard order is (01) GTIN -> (10) Lot -> (17) Expiry
  if (data.lotNumber) {
    parts.push(encodeLotNumber(data.lotNumber))
  }

  // Add expiry date (AI 17) - fixed length, no FNC1 needed
  if (data.expiryDate) {
    parts.push(encodeExpiryDate(data.expiryDate))
  }

  // Add SSCC (AI 00) - fixed length, typically used alone on pallet labels
  if (data.sscc) {
    parts.push(`(00)${data.sscc}`)
  }

  // Join with FNC1 separator for variable-length AIs
  // In practice, variable-length AIs like AI 10 need FNC1 after them
  // For human-readable format, we just concatenate
  return parts.join(FNC1)
}
