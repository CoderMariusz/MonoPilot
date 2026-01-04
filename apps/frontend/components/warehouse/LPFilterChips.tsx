/**
 * LP Filter Chips Component
 * Story 05.5: LP Search & Filters
 *
 * Features:
 * - Displays active filters as removable chips
 * - X button on each chip to remove
 * - "Clear All" button when 2+ filters
 * - Responsive layout (horizontal on desktop, 2-col grid on mobile)
 */

'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface AppliedFilter {
  key: string // 'product', 'status', 'expiry', etc.
  label: string // Display label
  value: string // Display value
  displayText: string // Full chip text: "Product: Flour"
}

export interface LPFilterChipsProps {
  filters: AppliedFilter[]
  onRemoveFilter: (filterKey: string) => void
  onClearAll: () => void
}

export function LPFilterChips({ filters, onRemoveFilter, onClearAll }: LPFilterChipsProps) {
  if (filters.length === 0) {
    return null
  }

  const showClearAll = filters.length >= 2

  return (
    <div
      className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg"
      data-testid="lp-filter-chips"
      role="status"
      aria-label={`${filters.length} active filter${filters.length > 1 ? 's' : ''}`}
    >
      <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 flex-1">
        {filters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="gap-1 pr-1 hover:bg-secondary/80 transition-colors"
            data-testid={`filter-chip-${filter.key}`}
          >
            <span className="text-xs">{filter.displayText}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFilter(filter.key)}
              className="h-4 w-4 p-0 hover:bg-transparent"
              aria-label={`Remove ${filter.label} filter: ${filter.value}`}
              data-testid={`remove-filter-${filter.key}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Clear All button */}
      {showClearAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="ml-auto"
          aria-label={`Clear all ${filters.length} filters`}
          data-testid="clear-all-filters"
        >
          <X className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      )}
    </div>
  )
}
