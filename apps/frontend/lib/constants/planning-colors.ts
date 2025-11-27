/**
 * Planning Module Color Palette
 * Story 3.30: Color Consistency
 *
 * Standard colors for all Planning components
 */

export const PLANNING_COLORS = {
  // Button colors
  button: {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
  },

  // Status badge colors (PO, TO, WO)
  status: {
    // Generic
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    closed: 'bg-purple-100 text-purple-700',

    // PO specific
    submitted: 'bg-blue-100 text-blue-700',
    receiving: 'bg-yellow-100 text-yellow-700',

    // TO specific
    in_transit: 'bg-orange-100 text-orange-700',
    shipped: 'bg-orange-100 text-orange-700',
    received: 'bg-green-100 text-green-700',

    // WO specific
    released: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    paused: 'bg-orange-100 text-orange-700',
  },

  // Card accent colors (left border)
  card: {
    po: 'border-l-blue-500',
    to: 'border-l-orange-500',
    wo: 'border-l-green-500',
  },

  // Background tints for cards
  cardBg: {
    po: 'bg-blue-50/50',
    to: 'bg-orange-50/50',
    wo: 'bg-green-50/50',
  },
}

/**
 * Get status badge classes by status code
 */
export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, '_')
  return (
    PLANNING_COLORS.status[normalized as keyof typeof PLANNING_COLORS.status] ||
    PLANNING_COLORS.status.draft
  )
}

/**
 * Get button classes by type
 */
export function getButtonColor(
  type: 'primary' | 'secondary' | 'danger' | 'outline'
): string {
  return PLANNING_COLORS.button[type]
}
