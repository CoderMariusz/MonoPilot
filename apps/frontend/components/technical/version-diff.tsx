/**
 * VersionDiff Component (Story 02.2)
 * Displays field changes in "old → new" format
 *
 * Features:
 * - Color-coded old (muted) and new (highlighted) values
 * - Handles various data types (string, number, boolean, date, null)
 * - Readable field name formatting
 */

import { cn } from '@/lib/utils'

interface VersionDiffProps {
  changedFields: Record<string, { old: unknown; new: unknown }>
  className?: string
}

/**
 * Format field name to be human-readable
 * e.g., "shelf_life_days" → "Shelf Life Days"
 */
function formatFieldName(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format value for display
 * Handles null, boolean, date, number, and string types
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 100) {
      return `${value.substring(0, 97)}...`
    }
    return value
  }

  // Fallback for complex objects
  return JSON.stringify(value)
}

export function VersionDiff({ changedFields, className }: VersionDiffProps) {
  const entries = Object.entries(changedFields)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {entries.map(([field, change]) => (
        <div key={field} className="text-sm">
          <div className="font-medium text-foreground mb-1">
            {formatFieldName(field)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground line-through">
              Old: {formatValue(change.old)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              New: {formatValue(change.new)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
