/**
 * Date Utility Functions
 * Common date formatting and manipulation utilities.
 */

/**
 * Formats a last login date as a human-readable relative time string.
 *
 * @param lastLogin - ISO date string, null, or undefined
 * @returns "Never", "Just now", "X hours ago", "Yesterday", "X days ago", or formatted date
 *
 * @example
 * formatLastLogin(null) // => "Never"
 * formatLastLogin(new Date().toISOString()) // => "Just now"
 * formatLastLogin(yesterday.toISOString()) // => "Yesterday"
 */
export function formatLastLogin(lastLogin: string | null | undefined): string {
  if (!lastLogin) return 'Never'

  const date = new Date(lastLogin)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}
