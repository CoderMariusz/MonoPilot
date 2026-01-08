'use client'

/**
 * SequenceWarning Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Warning message shown when trying to start an operation out of sequence.
 * Uses role="alert" for screen reader announcements.
 */

import { useEffect, useRef } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { OperationStatusBadge, type OperationStatus } from './OperationStatusBadge'

export interface BlockingOperation {
  id: string
  sequence: number
  operation_name: string
  status: OperationStatus
}

export interface SequenceWarningProps {
  /** The operation that is blocked */
  blockedOperation: {
    id: string
    sequence: number
    operation_name: string
  }
  /** Operations that must be completed first */
  blockingOperations: BlockingOperation[]
  /** Callback when user dismisses the warning */
  onDismiss?: () => void
}

export function SequenceWarning({
  blockedOperation,
  blockingOperations,
  onDismiss,
}: SequenceWarningProps) {
  const dismissButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-focus dismiss button for accessibility
  useEffect(() => {
    dismissButtonRef.current?.focus()
  }, [])

  // Handle escape key to dismiss
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) {
        onDismiss()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onDismiss])

  return (
    <Alert
      variant="destructive"
      className="border-yellow-500 bg-yellow-50 text-yellow-900"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
      <AlertTitle className="text-yellow-800 font-semibold">
        Sequence Required
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Cannot start &quot;{blockedOperation.operation_name}&quot; yet.
        </p>

        {blockingOperations.length > 0 && (
          <>
            <p className="font-medium">Complete these operations first:</p>
            <ul className="list-none space-y-2 pl-0">
              {blockingOperations.map((op) => (
                <li
                  key={op.id}
                  className="flex items-center gap-2 pl-4 border-l-2 border-yellow-400"
                >
                  <span className="font-medium">
                    {op.sequence}. {op.operation_name}
                  </span>
                  <OperationStatusBadge status={op.status} size="sm" />
                </li>
              ))}
            </ul>
          </>
        )}

        {onDismiss && (
          <div className="flex justify-end pt-2">
            <Button
              ref={dismissButtonRef}
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
            >
              OK, Got It
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default SequenceWarning
