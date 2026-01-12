/**
 * Split LP Validation Component (Story 05.17)
 * Displays validation status and errors during split workflow
 *
 * States:
 * - Idle: No validation result yet
 * - Validating: Shows loading spinner
 * - Valid: Shows green checkmark with success message
 * - Invalid: Shows red X with error messages
 *
 * Per WH-008 wireframe
 */

'use client'

import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SplitValidationResult {
  valid: boolean
  errors: string[]
}

interface SplitLPValidationProps {
  isValidating: boolean
  validationResult: SplitValidationResult | null
}

export function SplitLPValidation({
  isValidating,
  validationResult,
}: SplitLPValidationProps) {
  // Loading state
  if (isValidating) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" role="status" />
        <span className="text-sm text-yellow-800 dark:text-yellow-200">
          Validating split parameters...
        </span>
      </div>
    )
  }

  // No result yet
  if (!validationResult) {
    return null
  }

  // Valid result
  if (validationResult.valid) {
    return (
      <div
        className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30"
        data-testid="split-validation-success"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className={cn('text-sm font-medium', 'text-green-800 dark:text-green-200')}>
            Split parameters are valid. Ready to split.
          </span>
        </div>
      </div>
    )
  }

  // Invalid result
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30"
      data-testid="split-validation-error"
    >
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
        <div className="space-y-2">
          <span className={cn('text-sm font-medium', 'text-red-800 dark:text-red-200')}>
            Cannot split license plate
          </span>
          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
            {validationResult.errors?.map((error, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
