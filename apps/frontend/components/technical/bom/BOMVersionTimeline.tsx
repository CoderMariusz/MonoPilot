/**
 * BOMVersionTimeline Component (Story 02.4)
 * Timeline visualization component showing all BOM versions for a product
 *
 * Features:
 * - Horizontal timeline bars
 * - Color-coded by status
 * - Currently active version highlighting
 * - Overlap warning indicators
 * - Hover tooltips with details
 * - Click to navigate to BOM detail
 * - Date gap visualization
 * - Keyboard navigation support
 *
 * Acceptance Criteria Coverage:
 * - AC-24 to AC-30: Timeline visualization and interaction
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertTriangle } from 'lucide-react'
import type { BOMTimelineVersion, BOMStatus } from '@/lib/types/bom'

interface BOMVersionTimelineProps {
  versions: BOMTimelineVersion[]
  currentDate: string
  onVersionClick: (bomId: string) => void
}

// Status color configuration
const statusConfig: Record<
  BOMStatus,
  {
    bg: string
    border: string
    text: string
    label: string
  }
> = {
  draft: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    label: 'draft',
  },
  active: {
    bg: 'bg-green-100',
    border: 'border-green-400',
    text: 'text-green-800',
    label: 'active',
  },
  phased_out: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    label: 'phased_out',
  },
  inactive: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
    label: 'inactive',
  },
}

/**
 * Format a date string to "MMM D, YYYY" format
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

/**
 * Format date range for display
 */
function formatDateRange(from: string, to: string | null): string {
  const fromFormatted = formatDate(from)
  if (!to) {
    return `${fromFormatted} - ongoing`
  }
  const toFormatted = formatDate(to)
  return `${fromFormatted} - ${toFormatted}`
}

/**
 * Check if two date ranges are adjacent (no gap between them)
 */
function areDatesAdjacent(date1End: string, date2Start: string): boolean {
  const end = new Date(date1End)
  const start = new Date(date2Start)
  // Add one day to end date
  const nextDay = new Date(end)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.getTime() === start.getTime()
}

/**
 * Determine if a version is currently active based on the current date
 */
function isVersionActiveForDate(
  version: BOMTimelineVersion,
  currentDate: string
): boolean {
  const current = new Date(currentDate)
  const from = new Date(version.effective_from)

  if (current < from) return false

  if (version.effective_to) {
    const to = new Date(version.effective_to)
    return current <= to
  }

  return true
}

export function BOMVersionTimeline({
  versions,
  currentDate,
  onVersionClick,
}: BOMVersionTimelineProps) {
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null)

  // Sort versions by effective_from date
  const sortedVersions = useMemo(() => {
    return [...versions].sort(
      (a, b) =>
        new Date(a.effective_from).getTime() -
        new Date(b.effective_from).getTime()
    )
  }, [versions])

  // Calculate which version is currently active based on currentDate prop
  const activeVersionId = useMemo(() => {
    // First check if any version has is_currently_active flag set
    const flaggedActive = versions.find((v) => v.is_currently_active)
    if (flaggedActive) return flaggedActive.id

    // Otherwise calculate based on currentDate
    for (const version of versions) {
      if (isVersionActiveForDate(version, currentDate)) {
        return version.id
      }
    }
    return null
  }, [versions, currentDate])

  // Calculate gaps between versions
  const gaps = useMemo(() => {
    const gapsList: { afterVersion: string; startDate: string; endDate: string }[] = []
    for (let i = 0; i < sortedVersions.length - 1; i++) {
      const current = sortedVersions[i]
      const next = sortedVersions[i + 1]

      if (current.effective_to && !areDatesAdjacent(current.effective_to, next.effective_from)) {
        gapsList.push({
          afterVersion: current.id,
          startDate: current.effective_to,
          endDate: next.effective_from,
        })
      }
    }
    return gapsList
  }, [sortedVersions])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, bomId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onVersionClick(bomId)
      }
    },
    [onVersionClick]
  )

  // Empty state
  if (versions.length === 0) {
    return (
      <div
        data-testid="bom-timeline"
        role="region"
        aria-label="BOM Version Timeline"
        className="w-full overflow-x-auto p-4"
      >
        <h3 className="text-sm font-medium text-gray-700 mb-4">Timeline</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No BOMs found for this product.</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        data-testid="bom-timeline"
        role="region"
        aria-label="BOM Version Timeline"
        className="w-full overflow-x-auto"
      >
        <h3 className="text-sm font-medium text-gray-700 mb-4">Timeline</h3>

        <div className="flex flex-col gap-2 min-w-fit">
          {sortedVersions.map((version, index) => {
            const isActive = version.id === activeVersionId
            const config = statusConfig[version.status]
            const hasGapAfter = gaps.some((g) => g.afterVersion === version.id)

            return (
              <div key={version.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      data-testid="timeline-bar"
                      data-active={isActive}
                      data-overlap={version.has_overlap}
                      tabIndex={0}
                      role="button"
                      aria-label={`Version ${version.version}, ${config.label}, ${formatDateRange(version.effective_from, version.effective_to)}`}
                      className={cn(
                        'relative flex items-center justify-between px-4 py-3 rounded-lg border-2 cursor-pointer',
                        'transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        config.bg,
                        config.border,
                        isActive && 'ring-2 ring-blue-500 ring-offset-2',
                        version.has_overlap && 'warning-border border-orange-500'
                      )}
                      onClick={() => onVersionClick(version.id)}
                      onKeyDown={(e) => handleKeyDown(e, version.id)}
                      onMouseEnter={() => setHoveredVersion(version.id)}
                      onMouseLeave={() => setHoveredVersion(null)}
                    >
                      {/* Left section: Version and status */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm">
                          v{version.version}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            config.text,
                            version.status === 'active' && 'bg-green-100',
                            version.status === 'draft' && 'bg-gray-100'
                          )}
                        >
                          {version.status}
                        </Badge>
                        {isActive && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            Current
                          </Badge>
                        )}
                        {version.has_overlap && (
                          <span
                            data-overlap="true"
                            className="text-orange-500"
                            aria-label="Overlap warning"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      {/* Right section: Date range */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className={cn('text-gray-600', config.text)}>
                          {formatDateRange(
                            version.effective_from,
                            version.effective_to
                          )}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    role="tooltip"
                    side="top"
                    className="max-w-xs bg-white text-gray-900 border shadow-lg p-3"
                  >
                    <div className="space-y-2">
                      <p className="font-semibold">Version {version.version}</p>
                      <p className="text-sm">
                        <span className="text-gray-500">Status:</span>{' '}
                        {version.status}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Effective:</span>{' '}
                        {formatDateRange(
                          version.effective_from,
                          version.effective_to
                        )}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Output:</span>{' '}
                        {version.output_qty} {version.output_uom}
                      </p>
                      {version.notes && (
                        <p className="text-sm">
                          <span className="text-gray-500">Notes:</span>{' '}
                          {version.notes}
                        </p>
                      )}
                      {version.has_overlap && (
                        <p className="text-sm text-orange-600 font-medium">
                          Warning: This version overlaps with another BOM
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Gap indicator */}
                {hasGapAfter && (
                  <div
                    data-testid="timeline-gap"
                    className="mx-4 my-2 border-l-2 border-dashed border-gray-300 h-4"
                    aria-label="Gap in coverage"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default BOMVersionTimeline
