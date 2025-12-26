/**
 * VersionWarningBanner Component (Story 02.2)
 * Warning banner in product edit modal showing version increment warning
 *
 * Features:
 * - Yellow alert banner with warning icon
 * - Shows current version and next version
 * - BOM/WO impact warning message
 * - Optional "View History" link
 */

'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VersionWarningBannerProps {
  currentVersion: number
  onViewHistory?: () => void
  className?: string
}

export function VersionWarningBanner({
  currentVersion,
  onViewHistory,
  className,
}: VersionWarningBannerProps) {
  // Don't render for negative versions
  if (currentVersion < 0) {
    return null
  }

  const nextVersion = currentVersion + 1

  return (
    <Alert
      role="alert"
      className={cn(
        'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100',
        className
      )}
    >
      <AlertTriangle
        className="h-4 w-4 text-yellow-600 dark:text-yellow-400"
        data-testid="warning-icon"
        aria-hidden="true"
      />
      <AlertDescription className="ml-2">
        <span>
          Editing this product will create version <strong>v{nextVersion}</strong>. Changes will
          not affect existing BOMs or Work Orders.
        </span>
        {onViewHistory && (
          <>
            {' '}
            <button
              onClick={onViewHistory}
              className="underline font-medium hover:text-yellow-700 dark:hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded"
              type="button"
            >
              View History
            </button>
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}
