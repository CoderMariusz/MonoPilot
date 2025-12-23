/**
 * Location Breadcrumb Component
 * Story: 01.9 - Location Hierarchy Management
 *
 * Breadcrumb path display with navigation
 */

'use client'

import { ChevronRight } from 'lucide-react'

interface LocationBreadcrumbProps {
  fullPath: string
  onClick?: (segment: string, index: number) => void
}

export function LocationBreadcrumb({ fullPath, onClick }: LocationBreadcrumbProps) {
  const segments = fullPath.split('/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <nav aria-label="Location breadcrumb" className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        const isClickable = onClick && !isLast

        return (
          <div key={index} className="flex items-center gap-1">
            {isClickable ? (
              <button
                onClick={() => onClick(segment, index)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Navigate to ${segment}`}
              >
                {segment}
              </button>
            ) : (
              <span
                className={isLast ? 'font-semibold text-foreground' : 'text-muted-foreground'}
                aria-current={isLast ? 'location' : undefined}
              >
                {segment}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
