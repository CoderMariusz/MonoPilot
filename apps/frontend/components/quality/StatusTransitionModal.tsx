'use client'

/**
 * StatusTransitionModal Component
 * Story: 06.1 - Quality Status Types
 *
 * Modal for changing quality status with:
 * - Current status display
 * - Valid transitions dropdown (based on business rules)
 * - Required reason field (min 10 chars)
 * - Transition requirements indicators
 * - Loading, success, and error states
 *
 * States:
 * - Loading: Shows skeleton during data fetch
 * - Ready: Form ready for input
 * - Submitting: Status change in progress
 * - Success: Status updated successfully
 * - Error: Validation or update failed
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

import { QualityStatusBadge, type QualityStatus } from './QualityStatusBadge'
import type { StatusTransition } from '@/lib/services/quality-status-service'

// ============================================================================
// Types
// ============================================================================

export type EntityType = 'lp' | 'batch' | 'inspection'

export interface StatusTransitionModalProps {
  /** Modal open state */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Entity type (lp, batch, inspection) */
  entityType: EntityType
  /** Entity ID (UUID) */
  entityId: string
  /** Current status */
  currentStatus: QualityStatus
  /** Entity display name/number for context */
  entityDisplayName?: string
  /** Callback on successful status change */
  onSuccess?: (newStatus: QualityStatus, historyId: string) => void
  /** Valid transitions (fetched from API) */
  validTransitions?: StatusTransition[]
  /** Loading state for transitions */
  loadingTransitions?: boolean
  /** Error loading transitions */
  transitionsError?: string | null
  /** Test ID for testing */
  testId?: string
}

// ============================================================================
// Form Schema
// ============================================================================

const transitionFormSchema = z.object({
  toStatus: z.enum([
    'PENDING',
    'PASSED',
    'FAILED',
    'HOLD',
    'RELEASED',
    'QUARANTINED',
    'COND_APPROVED',
  ], {
    required_error: 'Please select a new status',
  }),
  reason: z
    .string({ required_error: 'Reason is required for status changes' })
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
})

type TransitionFormData = z.infer<typeof transitionFormSchema>

// ============================================================================
// Sub-Components
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-4 py-6" data-testid="transition-modal-loading">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function SubmittingState({ entityDisplayName }: { entityDisplayName?: string }) {
  return (
    <div className="space-y-4 py-6" data-testid="transition-modal-submitting">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Updating Status...</p>
          {entityDisplayName && (
            <p className="text-sm text-gray-500">{entityDisplayName}</p>
          )}
        </div>
        <div className="w-full space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Validating transition</span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Updating status</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
            <span>Creating audit trail</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessState({
  fromStatus,
  toStatus,
  reason,
  onClose,
}: {
  fromStatus: QualityStatus
  toStatus: QualityStatus
  reason: string
  onClose: () => void
}) {
  return (
    <div className="space-y-6 py-6" data-testid="transition-modal-success">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Status Updated Successfully</h3>
      </div>

      <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
        <div className="flex items-center justify-center gap-3">
          <QualityStatusBadge status={fromStatus} size="md" />
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <QualityStatusBadge status={toStatus} size="md" />
        </div>
        <Separator />
        <div>
          <span className="text-sm text-gray-500">Reason:</span>
          <p className="mt-1 text-sm">{reason}</p>
        </div>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Audit trail entry created</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={onClose} variant="default">
          Close
        </Button>
      </DialogFooter>
    </div>
  )
}

function TransitionRequirements({
  transition,
}: {
  transition: StatusTransition
}) {
  if (
    !transition.requires_inspection &&
    !transition.requires_approval &&
    !transition.requires_reason
  ) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {transition.requires_inspection && (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
          <FileCheck className="h-3 w-3" />
          Inspection Required
        </span>
      )}
      {transition.requires_approval && (
        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
          <ShieldCheck className="h-3 w-3" />
          Approval Required
        </span>
      )}
      {transition.requires_reason && (
        <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded">
          <MessageSquare className="h-3 w-3" />
          Reason Required
        </span>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function StatusTransitionModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  currentStatus,
  entityDisplayName,
  onSuccess,
  validTransitions = [],
  loadingTransitions = false,
  transitionsError = null,
  testId = 'status-transition-modal',
}: StatusTransitionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<{
    fromStatus: QualityStatus
    toStatus: QualityStatus
    reason: string
  } | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransitionFormData>({
    resolver: zodResolver(transitionFormSchema),
  })

  const selectedStatus = watch('toStatus')
  const reason = watch('reason')
  const characterCount = reason?.length || 0

  // Find selected transition for requirements display
  const selectedTransition = validTransitions.find(
    (t) => t.to_status === selectedStatus
  )

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset()
      setIsSubmitting(false)
      setIsSuccess(false)
      setSubmittedData(null)
    }
  }, [open, reset])

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const onSubmit = async (data: TransitionFormData) => {
    // Validate same status
    if (currentStatus === data.toStatus) {
      toast({
        title: 'Same Status',
        description: `Status is already ${data.toStatus}`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Call API to change status
      const response = await fetch('/api/quality/status/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          to_status: data.toStatus,
          reason: data.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      const result = await response.json()

      setSubmittedData({
        fromStatus: currentStatus,
        toStatus: data.toStatus,
        reason: data.reason,
      })
      setIsSuccess(true)

      if (onSuccess) {
        onSuccess(data.toStatus, result.history_id)
      }

      toast({
        title: 'Status Updated',
        description: `Status changed from ${currentStatus} to ${data.toStatus}`,
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] max-w-xl overflow-y-auto"
        data-testid={testId}
      >
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? 'Status Updated' : 'Change Quality Status'}
          </DialogTitle>
          {!isSuccess && entityDisplayName && (
            <DialogDescription>
              {entityDisplayName}
            </DialogDescription>
          )}
        </DialogHeader>

        {loadingTransitions ? (
          <LoadingState />
        ) : transitionsError ? (
          <Alert variant="destructive" data-testid="transition-modal-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{transitionsError}</AlertDescription>
          </Alert>
        ) : isSubmitting ? (
          <SubmittingState entityDisplayName={entityDisplayName} />
        ) : isSuccess && submittedData ? (
          <SuccessState
            fromStatus={submittedData.fromStatus}
            toStatus={submittedData.toStatus}
            reason={submittedData.reason}
            onClose={handleClose}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Current Status
              </Label>
              <div className="flex items-center">
                <QualityStatusBadge status={currentStatus} size="md" />
              </div>
            </div>

            <Separator />

            {/* New Status Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                New Status <span className="text-red-500">*</span>
              </Label>

              {validTransitions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No valid transitions available from {currentStatus} status.
                  </AlertDescription>
                </Alert>
              ) : (
                <RadioGroup
                  value={selectedStatus}
                  onValueChange={(value) => setValue('toStatus', value as QualityStatus)}
                  className="space-y-3"
                  data-testid="transition-status-options"
                >
                  {validTransitions.map((transition) => (
                    <div
                      key={transition.to_status}
                      className={cn(
                        'flex items-start space-x-3 rounded-lg border p-3 transition-colors',
                        selectedStatus === transition.to_status
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <RadioGroupItem
                        value={transition.to_status}
                        id={transition.to_status}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={transition.to_status}
                        className="flex flex-1 cursor-pointer flex-col gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <QualityStatusBadge
                            status={transition.to_status as QualityStatus}
                            size="sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {transition.description}
                        </p>
                        <TransitionRequirements transition={transition} />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {errors.toStatus && (
                <p className="text-sm text-red-500">{errors.toStatus.message}</p>
              )}
            </div>

            {/* Reason Field */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Status Change <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change (minimum 10 characters)..."
                rows={3}
                maxLength={500}
                {...register('reason')}
                className={cn(errors.reason && 'border-red-500')}
                data-testid="transition-reason-input"
              />
              <div className="flex items-center justify-between text-xs">
                {errors.reason ? (
                  <p className="text-red-500">{errors.reason.message}</p>
                ) : (
                  <p className="text-gray-500">
                    Reason is required for all status changes
                  </p>
                )}
                <span className="text-gray-400">
                  {characterCount} / 500
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="transition-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedStatus || validTransitions.length === 0}
                data-testid="transition-submit-button"
              >
                Update Status
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StatusTransitionModal
