/**
 * PO Error State Component
 * Story 03.3: PO CRUD + Lines
 * Error state display per PLAN-004
 */

'use client'

import { AlertCircle, RefreshCw, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface POErrorStateProps {
  title?: string
  message?: string
  errorCode?: string
  onRetry?: () => void
  onContactSupport?: () => void
  className?: string
}

export function POErrorState({
  title = 'Failed to Load Purchase Orders',
  message = 'Unable to retrieve purchase order data. Please check your connection and try again.',
  errorCode = 'PO_LIST_FETCH_FAILED',
  onRetry,
  onContactSupport,
  className,
}: POErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="mb-6 rounded-full bg-red-50 p-4">
        <AlertCircle className="h-12 w-12 text-red-600" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-500 max-w-md mb-4">{message}</p>

      {/* Error Code */}
      {errorCode && (
        <p className="text-sm text-gray-400 mb-6 font-mono">
          Error: {errorCode}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
        {onContactSupport && (
          <Button
            variant="outline"
            onClick={onContactSupport}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </Button>
        )}
      </div>
    </div>
  )
}

export default POErrorState
