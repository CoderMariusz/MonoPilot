/**
 * SSCC Service - Story 07.13
 * Purpose: SSCC-18 generation, validation, formatting, and parsing
 *
 * SSCC-18 Format:
 * - Extension Digit (1): 0=carton, 9=pallet
 * - GS1 Company Prefix (7-10 digits): Globally unique org identifier
 * - Serial Reference (variable): Padded to fill remaining digits
 * - Check Digit (1): MOD 10 algorithm
 *
 * Coverage Target: 95% (CRITICAL - GS1 compliance)
 */

// =============================================================================
// Types
// =============================================================================

export interface SSCCValidationResult {
  valid: boolean
  error?: string
}

export interface SSCCParseResult {
  extensionDigit: string
  companyPrefix: string
  serialReference: string
  checkDigit: string
}

export interface SSCCGenerationResult {
  sscc: string
  formatted: string
  checkDigit: string
}

export interface SSCCFormatOptions {
  compact?: boolean
  includeAI?: boolean
}

// =============================================================================
// Check Digit Calculation (MOD 10 Algorithm)
// =============================================================================

/**
 * Calculate GS1 check digit using MOD 10 algorithm
 *
 * Algorithm (per GS1 standard):
 * 1. Starting from rightmost digit, assign multipliers (odd positions = 3, even = 1)
 * 2. Multiply each digit by its multiplier
 * 3. Sum all products
 * 4. Check digit = (10 - (sum % 10)) % 10
 *
 * @param digits - 17-digit SSCC base (without check digit)
 * @returns Single check digit character (0-9)
 * @throws Error if input is invalid
 */
export function calculateGS1CheckDigit(digits: string): string {
  // Input validation
  if (digits === null || digits === undefined) {
    throw new Error('Input cannot be null or undefined')
  }

  if (typeof digits !== 'string') {
    throw new Error('Input must be a string')
  }

  if (digits.length !== 17) {
    throw new Error(`SSCC base must be exactly 17 digits, got ${digits.length}`)
  }

  if (!/^\d{17}$/.test(digits)) {
    throw new Error('SSCC base must contain only digits')
  }

  let sum = 0

  // Process from left to right, calculating position from right
  for (let i = 0; i < 17; i++) {
    const digit = parseInt(digits[i], 10)
    // Position from right: 17 - i
    // Odd positions (from right) multiply by 3, even by 1
    const positionFromRight = 17 - i
    const multiplier = positionFromRight % 2 === 1 ? 3 : 1
    sum += digit * multiplier
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

// =============================================================================
// SSCC Validation
// =============================================================================

/**
 * Validate SSCC-18 code including check digit
 *
 * @param sscc - 18-digit SSCC to validate
 * @returns Object with valid flag and optional error message
 */
export function validateSSCC(sscc: string): SSCCValidationResult {
  // Handle null/undefined
  if (sscc === null || sscc === undefined) {
    return {
      valid: false,
      error: 'SSCC cannot be null or undefined',
    }
  }

  // Type check
  if (typeof sscc !== 'string') {
    return {
      valid: false,
      error: 'SSCC must be a string',
    }
  }

  // Length check
  if (sscc.length !== 18) {
    return {
      valid: false,
      error: `SSCC must be exactly 18 digits, got ${sscc.length}`,
    }
  }

  // Numeric check
  if (!/^\d{18}$/.test(sscc)) {
    return {
      valid: false,
      error: 'SSCC must contain only digits',
    }
  }

  // Extract base and check digit
  const base = sscc.substring(0, 17)
  const providedCheckDigit = sscc[17]

  // Calculate expected check digit
  const calculatedCheckDigit = calculateGS1CheckDigit(base)

  if (providedCheckDigit !== calculatedCheckDigit) {
    return {
      valid: false,
      error: `Invalid check digit. Expected ${calculatedCheckDigit}, got ${providedCheckDigit}`,
    }
  }

  return { valid: true }
}

// =============================================================================
// SSCC Formatting
// =============================================================================

/**
 * Format 18-digit SSCC with spaces for human readability
 *
 * Format: "XX XXXX XXXX XXXX XXXX XX"
 * - First 2 digits (extension + first GS1 digit)
 * - Then 4 groups of 4 digits each
 * - Last 2 digits
 *
 * @param sscc - 18-digit SSCC to format
 * @param options - Formatting options
 * @returns Formatted SSCC string
 * @throws Error if input is invalid
 */
export function formatSSCC(sscc: string, options: SSCCFormatOptions = {}): string {
  // Validation
  if (!sscc || typeof sscc !== 'string') {
    throw new Error('SSCC must be a non-empty string')
  }

  if (sscc.length !== 18) {
    throw new Error(`SSCC must be exactly 18 digits, got ${sscc.length}`)
  }

  if (!/^\d{18}$/.test(sscc)) {
    throw new Error('SSCC must contain only digits')
  }

  // Compact format - no spaces
  if (options.compact) {
    return sscc
  }

  // AI format - with Application Identifier prefix
  if (options.includeAI) {
    return `(00)${sscc}`
  }

  // Standard human-readable format: "00 6141 4100 0012 3456 78"
  // Pattern: 2 + 4 + 4 + 4 + 4 = 18 digits
  // Split: [0-1] [2-5] [6-9] [10-13] [14-17]
  return `${sscc.substring(0, 2)} ${sscc.substring(2, 6)} ${sscc.substring(6, 10)} ${sscc.substring(10, 14)} ${sscc.substring(14, 18)}`
}

// =============================================================================
// SSCC Parsing
// =============================================================================

/**
 * Parse SSCC-18 into its components
 *
 * Note: This assumes a 7-digit GS1 prefix as default.
 * Actual prefix length can vary (7-10 digits).
 *
 * @param sscc - 18-digit SSCC to parse
 * @returns Parsed SSCC components
 */
export function parseSSCC(sscc: string): SSCCParseResult {
  // Validation
  if (!sscc || typeof sscc !== 'string' || sscc.length !== 18 || !/^\d{18}$/.test(sscc)) {
    throw new Error('Invalid SSCC format')
  }

  // Extract components
  // Extension digit: position 0
  const extensionDigit = sscc[0]

  // Check digit: last position
  const checkDigit = sscc[17]

  // Company prefix: typically 7-10 digits starting at position 1
  // For simplicity, assume 7-digit prefix (common for food manufacturing)
  // This gives 9 digits for serial reference
  const companyPrefix = sscc.substring(1, 8)

  // Serial reference: remaining digits between prefix and check digit
  const serialReference = sscc.substring(8, 17)

  return {
    extensionDigit,
    companyPrefix,
    serialReference,
    checkDigit,
  }
}

// =============================================================================
// SSCC Generation for Organization
// =============================================================================

/**
 * Generate SSCC-18 for an organization
 *
 * @param orgId - Organization UUID (for logging/audit)
 * @param gs1Prefix - GS1 Company Prefix (7-10 digits)
 * @param serialNumber - Serial reference number (must be positive)
 * @param extensionDigit - Extension digit (default: '0' for carton)
 * @returns Generated SSCC with formatted version
 * @throws Error if parameters are invalid
 */
export async function generateSSCCForOrganization(
  orgId: string,
  gs1Prefix: string,
  serialNumber: number,
  extensionDigit: string = '0'
): Promise<SSCCGenerationResult> {
  // Validate GS1 prefix
  if (!gs1Prefix || typeof gs1Prefix !== 'string') {
    throw new Error('GS1 Company Prefix is required')
  }

  if (!/^\d{7,10}$/.test(gs1Prefix)) {
    throw new Error('GS1 Company Prefix must be 7-10 digits')
  }

  // Validate serial number
  if (serialNumber <= 0) {
    throw new Error('Serial number must be positive')
  }

  // Calculate available digits for serial reference
  // Total 17 digits (without check digit): 1 extension + prefix + serial
  const serialLength = 17 - 1 - gs1Prefix.length

  // Check for overflow
  const maxSerial = Math.pow(10, serialLength) - 1
  if (serialNumber > maxSerial) {
    throw new Error(`Serial number ${serialNumber} exceeds maximum ${maxSerial} for prefix length ${gs1Prefix.length}`)
  }

  // Build base (17 digits)
  const serialPadded = serialNumber.toString().padStart(serialLength, '0')
  const base = extensionDigit + gs1Prefix + serialPadded

  // Calculate check digit
  const checkDigit = calculateGS1CheckDigit(base)

  // Build full SSCC
  const sscc = base + checkDigit

  return {
    sscc,
    formatted: formatSSCC(sscc),
    checkDigit,
  }
}

// =============================================================================
// SSCCService Class (for dependency injection)
// =============================================================================

export class SSCCService {
  /**
   * Calculate check digit for SSCC base
   */
  static calculateCheckDigit(base: string): string {
    return calculateGS1CheckDigit(base)
  }

  /**
   * Validate SSCC-18
   */
  static validate(sscc: string): SSCCValidationResult {
    return validateSSCC(sscc)
  }

  /**
   * Format SSCC for display
   */
  static format(sscc: string, options?: SSCCFormatOptions): string {
    return formatSSCC(sscc, options)
  }

  /**
   * Parse SSCC into components
   */
  static parse(sscc: string): SSCCParseResult {
    return parseSSCC(sscc)
  }

  /**
   * Generate SSCC for organization
   */
  static async generate(
    orgId: string,
    gs1Prefix: string,
    serialNumber: number,
    extensionDigit?: string
  ): Promise<SSCCGenerationResult> {
    return generateSSCCForOrganization(orgId, gs1Prefix, serialNumber, extensionDigit)
  }
}
