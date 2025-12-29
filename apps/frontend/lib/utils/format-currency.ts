/**
 * Currency Formatting Utility (Story 02.9)
 * Formats numbers as currency using Intl.NumberFormat
 */

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - Currency code (default: PLN)
 * @param locale - Locale for formatting (default: pl-PL)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PLN',
  locale: string = 'pl-PL'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number as compact currency (for large amounts)
 * @param amount - The amount to format
 * @param currency - Currency code (default: PLN)
 * @param locale - Locale for formatting (default: pl-PL)
 * @returns Formatted compact currency string
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = 'PLN',
  locale: string = 'pl-PL'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

/**
 * Format percentage value
 * @param value - Percentage value (e.g., 25.5 for 25.5%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
