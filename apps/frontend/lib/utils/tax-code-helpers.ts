/**
 * Tax Code Helper Functions
 * Story: 01.13 - Tax Codes CRUD
 *
 * Pure utility functions for tax code display and status calculation.
 * No side effects, suitable for use in both server and client components.
 *
 * @module tax-code-helpers
 */

import type { TaxCode, TaxCodeStatus } from '@/lib/types/tax-code'

/**
 * Calculates the current status of a tax code based on validity dates.
 *
 * Status logic:
 * - 'scheduled': valid_from is in the future
 * - 'expired': valid_to is in the past
 * - 'active': currently valid (today is between valid_from and valid_to)
 *
 * @param taxCode - The tax code to evaluate
 * @returns The computed status: 'active' | 'expired' | 'scheduled'
 *
 * @example
 * ```ts
 * const status = getTaxCodeStatus(taxCode)
 * // Returns 'active' if valid today
 * // Returns 'expired' if valid_to < today
 * // Returns 'scheduled' if valid_from > today
 * ```
 */
export function getTaxCodeStatus(taxCode: TaxCode): TaxCodeStatus {
  const today = new Date().toISOString().split('T')[0]

  if (taxCode.valid_from > today) {
    return 'scheduled'
  }

  if (taxCode.valid_to && taxCode.valid_to < today) {
    return 'expired'
  }

  return 'active'
}

/**
 * Maps tax code status to ShadCN Badge variant.
 *
 * @param status - The tax code status
 * @returns Badge variant: 'success' (green), 'destructive' (red), or 'secondary' (gray)
 */
export function getStatusBadgeVariant(status: TaxCodeStatus): 'success' | 'destructive' | 'secondary' {
  switch (status) {
    case 'active':
      return 'success'
    case 'expired':
      return 'destructive'
    case 'scheduled':
      return 'secondary'
  }
}

/**
 * Returns human-readable label for tax code status.
 *
 * @param status - The tax code status
 * @returns Capitalized status label: 'Active', 'Expired', or 'Scheduled'
 */
export function getStatusLabel(status: TaxCodeStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'expired':
      return 'Expired'
    case 'scheduled':
      return 'Scheduled'
  }
}

/** Color configuration for rate badge */
interface RateBadgeColor {
  /** Tailwind background class */
  bg: string
  /** Tailwind text class */
  text: string
}

/**
 * Determines badge colors based on tax rate value.
 *
 * Color thresholds:
 * - 0%: Gray (exempt/zero-rated)
 * - 1-10%: Green (reduced rate)
 * - 11-20%: Blue (standard rate)
 * - 21%+: Purple (higher rate)
 *
 * @param rate - Tax rate percentage (0-100)
 * @returns Object with Tailwind bg and text color classes
 */
export function getRateBadgeColor(rate: number): RateBadgeColor {
  if (rate === 0) {
    return { bg: 'bg-gray-100', text: 'text-gray-800' }
  }
  if (rate <= 10) {
    return { bg: 'bg-green-100', text: 'text-green-800' }
  }
  if (rate <= 20) {
    return { bg: 'bg-blue-100', text: 'text-blue-800' }
  }
  return { bg: 'bg-purple-100', text: 'text-purple-800' }
}

/**
 * Formats tax rate for display with percentage symbol.
 *
 * @param rate - Tax rate as a number (e.g., 23)
 * @returns Formatted string with 2 decimal places (e.g., "23.00%")
 */
export function formatRate(rate: number): string {
  return `${rate.toFixed(2)}%`
}

/**
 * Formats ISO date string for user-friendly display.
 *
 * @param dateString - ISO date string (YYYY-MM-DD) or null
 * @returns Formatted date (e.g., "Dec 23, 2025") or "No expiry" for null
 *
 * @example
 * \`\`\`ts
 * formatDate('2025-12-23') // "Dec 23, 2025"
 * formatDate(null)         // "No expiry"
 * \`\`\`
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No expiry'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
