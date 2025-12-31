/**
 * WO Error State Component
 * Story 03.10: Work Order CRUD
 * Error state with retry per PLAN-013
 */

'use client'

import { AlertCircle, RefreshCw, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WOErrorStateProps {
  title?: string
  message?: string
  errorCode?: string
  onRetry?: () => void
  onContactSupport?: () => void
  className?: string
}

export function WOErrorState({
  title = 'Failed to Load Work Orders',
  message = 'Unable to retrieve work order data. Please check your connection and try again.',
  errorCode,
  onRetry,
  onContactSupport,
  className,
}: WOErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-2">{message}</p>
      {errorCode && (
        <p className="text-xs text-gray-400 font-mono mb-4">
          Error: {errorCode}
        </p>
      )}
      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
        {onContactSupport && (
          <Button onClick={onContactSupport} variant="ghost">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        )}
      </div>
    </div>
  )
}

export default WOErrorState
