/**
 * Quantity and Date Formatting Utilities (Story 03.11b)
 * Shared formatting functions for reservation components
 * Purpose: DRY - eliminate duplicated formatting code across components
 */

/**
 * Format a number with locale-aware separators
 * Used for quantities with up to 2 decimal places
 * @param num - The number to format
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return num.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a date string as a short date
 * Returns '-' for null/undefined dates
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(dateString: string | null, locale: string = 'en-US'): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a date string with time
 * @param dateString - ISO date string (expected to be in UTC)
 * @param locale - Locale for formatting (default: en-US)
 * @param timezone - User's timezone (e.g., 'America/New_York'). If not provided, uses browser's local timezone.
 * @returns Formatted date-time string (e.g., "Jan 15, 2025, 2:30 PM")
 */
export function formatDateTime(dateString: string, locale: string = 'en-US', timezone?: string): string {
  const date = new Date(dateString)
  
  // If timezone is provided, format using that timezone
  if (timezone) {
    try {
      const formattedDate = date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      })
      return formattedDate
    } catch (e) {
      // Fallback to browser timezone if invalid timezone is provided
      console.warn(`Invalid timezone provided: ${timezone}. Falling back to browser timezone.`)
    }
  }
  
  // Fall back to browser's local timezone
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Calculate shelf life information from expiry date
 * Returns text representation and whether item is near expiry
 * @param expiryDate - ISO date string or null
 * @returns Object with text and isNearExpiry flag
 */
export function getShelfLife(expiryDate: string | null): { text: string; isNearExpiry: boolean } {
  if (!expiryDate) return { text: '-', isNearExpiry: false }

  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffMs = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return { text: 'Expired', isNearExpiry: true }
  } else if (diffDays <= 30) {
    return { text: `${diffDays} days`, isNearExpiry: true }
  } else {
    const months = Math.round(diffDays / 30)
    return { text: `${months} mo`, isNearExpiry: false }
  }
}
