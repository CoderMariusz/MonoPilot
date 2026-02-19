/**
 * AuditLogEmptyState Component
 * Story: 01.17 - Audit Trail
 *
 * Empty state when no logs match filters
 */

'use client'

import { FileSearch } from 'lucide-react'

interface AuditLogEmptyStateProps {
  hasFilters?: boolean
  onClearFilters?: () => void
}

export function AuditLogEmptyState({
  hasFilters = false,
  onClearFilters,
}: AuditLogEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="audit-empty-state"
    >
      <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? 'No matching audit logs' : 'No audit logs found'}
      </h3>
      <p className="text-muted-foreground max-w-md mb-4">
        {hasFilters
          ? 'Try adjusting your filters or search criteria to find what you\'re looking for.'
          : 'Audit logs will appear here when users perform actions in the system.'}
      </p>
      {hasFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="text-primary hover:underline text-sm"
          data-testid="audit-clear-filters"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
