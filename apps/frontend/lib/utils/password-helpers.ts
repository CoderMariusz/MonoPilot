/**
 * Password Helper Utilities
 * Story: 01.15 - Session & Password Management
 * Purpose: Client-side password validation helpers
 */

/**
 * Calculate password strength (0-4)
 * 0 = very weak, 1 = weak, 2 = fair, 3 = good, 4 = strong
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0

  let score = 0

  // Length check (1 point for 8+, 1 for 12+)
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Complexity checks (1 point each)
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++ // Has both cases
  if (/[0-9]/.test(password)) score++ // Has number
  if (/[^A-Za-z0-9]/.test(password)) score++ // Has special char

  // Cap at 4
  return Math.min(score, 4)
}

/**
 * Check if password meets minimum length requirement
 */
export function meetsMinLength(password: string, minLength: number = 8): boolean {
  return password.length >= minLength
}

/**
 * Check if password contains uppercase letter
 */
export function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password)
}

/**
 * Check if password contains lowercase letter
 */
export function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password)
}

/**
 * Check if password contains number
 */
export function hasNumber(password: string): boolean {
  return /[0-9]/.test(password)
}

/**
 * Check if password contains special character
 */
export function hasSpecialChar(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password)
}

/**
 * Map password strength score to color
 */
export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return 'red'
  if (score <= 2) return 'yellow'
  return 'green'
}

/**
 * Map password strength score to label
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score <= 1) return 'Weak'
  if (score <= 2) return 'Medium'
  return 'Strong'
}
