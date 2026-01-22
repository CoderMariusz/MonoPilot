/**
 * AllergenOverrideModal Component
 * Story: 07.6 - SO Allergen Validation
 *
 * Modal for manager to approve allergen override with reason capture.
 *
 * Features:
 * - Displays conflict summary
 * - Textarea for reason (20-500 characters)
 * - Confirmation checkbox
 * - Loading state during submission
 * - Error display
 *
 * Wireframe: SHIP-004
 */

'use client'

import { useState, useEffect, useCallback, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AllergenConflict } from './AllergenAlert'

// =============================================================================
// Types
// =============================================================================

export interface AllergenOverrideModalProps {
  /** Modal visibility */
  isOpen: boolean
  /** Allergen conflicts to display */
  conflicts: AllergenConflict[]
  /** Callback when override confirmed */
  onConfirm: (reason: string) => Promise<void>
  /** Callback when cancelled */
  onCancel: () => void
  /** Loading state during submission */
  isLoading?: boolean
  /** Error message if override failed */
  error?: string
}

// =============================================================================
// Constants
// =============================================================================

const MIN_REASON_LENGTH = 20
const MAX_REASON_LENGTH = 500

// =============================================================================
// Component
// =============================================================================

export function AllergenOverrideModal({
  isOpen,
  conflicts,
  onConfirm,
  onCancel,
  isLoading = false,
  error,
}: AllergenOverrideModalProps) {
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const titleId = useId()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setConfirmed(false)
      setValidationError(null)
      setTouched(false)
    }
  }, [isOpen])

  // Validate reason
  const validateReason = useCallback((value: string): string | null => {
    const trimmed = value.trim()
    if (trimmed.length < MIN_REASON_LENGTH) {
      return `Reason must be at least ${MIN_REASON_LENGTH} characters`
    }
    if (trimmed.length > MAX_REASON_LENGTH) {
      return `Reason must not exceed ${MAX_REASON_LENGTH} characters`
    }
    return null
  }, [])

  // Check if form is valid
  const isFormValid = reason.trim().length >= MIN_REASON_LENGTH &&
    reason.trim().length <= MAX_REASON_LENGTH &&
    confirmed

  // Handle reason change
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setReason(value)

    // Show validation error only after the field is touched and exceeds max
    if (value.length > MAX_REASON_LENGTH) {
      setValidationError(`Reason must not exceed ${MAX_REASON_LENGTH} characters`)
    } else if (touched) {
      setValidationError(validateReason(value))
    }
  }

  // Handle reason blur
  const handleReasonBlur = () => {
    setTouched(true)
    setValidationError(validateReason(reason))
  }

  // Handle submit
  const handleSubmit = async () => {
    // Validate
    const error = validateReason(reason)
    if (error) {
      setValidationError(error)
      return
    }

    if (!confirmed) {
      return
    }

    await onConfirm(reason.trim())
  }

  // Handle escape key and click outside
  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      onCancel()
    }
  }

  // Conflict count text
  const conflictCountText =
    conflicts.length === 1
      ? '1 allergen conflict'
      : `${conflicts.length} allergen conflicts`

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        aria-labelledby={titleId}
        onEscapeKeyDown={() => !isLoading && onCancel()}
        onPointerDownOutside={() => !isLoading && onCancel()}
        data-testid="modal-backdrop"
      >
        <DialogHeader>
          <DialogTitle id={titleId} className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Override Allergen Block
          </DialogTitle>
          <DialogDescription>
            <span className="text-amber-700 font-medium">
              Warning: This action may have food safety implications.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Conflict Summary */}
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm font-medium text-red-800 mb-2">
              {conflictCountText}
            </p>
            <ul className="space-y-1">
              {conflicts.map((conflict) => (
                <li
                  key={`${conflict.line_id}-${conflict.allergen_id}`}
                  className="text-sm text-red-700"
                >
                  <span className="font-medium">{conflict.product_name}</span>
                  {' - '}
                  <span>{conflict.allergen_name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="override-reason" className="text-sm font-medium">
              Override Reason
            </Label>
            <Textarea
              id="override-reason"
              value={reason}
              onChange={handleReasonChange}
              onBlur={handleReasonBlur}
              placeholder="Explain why this allergen conflict is acceptable..."
              className={cn(
                'min-h-[100px]',
                validationError && touched && 'border-red-500 focus-visible:ring-red-500'
              )}
              disabled={isLoading}
              aria-describedby="reason-error reason-counter"
              aria-invalid={!!validationError && touched}
            />
            <div className="flex justify-between items-center">
              <div id="reason-error" className="text-sm text-red-600">
                {/* Show exceeds max immediately, show min length only after touched */}
                {reason.length > MAX_REASON_LENGTH
                  ? `Reason must not exceed ${MAX_REASON_LENGTH} characters`
                  : touched && validationError}
              </div>
              <div id="reason-counter" className="text-sm text-muted-foreground">
                {reason.length} / {MAX_REASON_LENGTH}
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="override-confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={isLoading}
              aria-label="Confirm override authorization"
            />
            <Label
              htmlFor="override-confirm"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I confirm this override is authorized and documented
            </Label>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <Loader2
                  className="h-4 w-4 mr-2 animate-spin"
                  data-testid="loading-spinner"
                  aria-hidden="true"
                />
                Submitting...
              </>
            ) : (
              'Confirm Override'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AllergenOverrideModal
