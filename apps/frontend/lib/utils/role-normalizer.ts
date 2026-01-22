/**
 * Role Normalizer Utility
 * Extracted from Story 07.6 - SO Allergen Validation
 *
 * Normalizes role data from Supabase queries to a lowercase string.
 * Handles various formats returned by Supabase joins:
 * - String: "Admin" -> "admin"
 * - Array with objects: [{code: "Admin"}] -> "admin"
 * - Object: {code: "Admin"} -> "admin"
 * - null/undefined -> null
 */

/**
 * Normalize role data to lowercase string
 *
 * Supabase role joins can return:
 * - A simple string: "Admin"
 * - An array of objects: [{code: "Admin"}]
 * - A single object: {code: "Admin"}
 *
 * @param roleData - Role data from Supabase query
 * @returns Lowercase role string or null if invalid
 */
export function normalizeRoleFromQuery(roleData: unknown): string | null {
  // String: direct role code
  if (typeof roleData === 'string') {
    return roleData.toLowerCase()
  }

  // Array: [{code: "Admin"}]
  if (Array.isArray(roleData) && roleData.length > 0) {
    const first = roleData[0]
    if (typeof first === 'string') return first.toLowerCase()
    if (first && typeof first === 'object' && 'code' in first) {
      return (first as { code: string }).code.toLowerCase()
    }
  }

  // Object: {code: "Admin"}
  if (roleData && typeof roleData === 'object' && 'code' in roleData) {
    return ((roleData as { code: string }).code ?? '').toLowerCase()
  }

  return null
}
