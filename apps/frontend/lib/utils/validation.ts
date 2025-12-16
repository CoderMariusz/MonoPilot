/**
 * Validation Utilities
 * Story: 01.1 - Org Context + Base RLS
 */

/**
 * UUID v4 regex pattern
 * Validates format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validate UUID format
 *
 * @param value - String to validate
 * @returns true if valid UUID v4 format
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  return UUID_V4_REGEX.test(value)
}

/**
 * Assert UUID format and throw error if invalid
 *
 * @param value - String to validate
 * @param fieldName - Name of field for error message
 * @throws Error if invalid UUID format
 */
export function assertValidUUID(value: string, fieldName = 'ID'): void {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid ${fieldName} format`)
  }
}
