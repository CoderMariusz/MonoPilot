'use client'

/**
 * WOResumeButton Component
 * Story: 04.2b - WO Pause/Resume
 *
 * An action button that allows operators to resume a paused work order.
 * Only visible when work order status is paused.
 *
 * States:
 * - Default (Enabled): Green button with play icon
 * - Hover: Darker green background
 * - Loading: Spinner with "Resuming..." text
 * - Hidden: Not rendered when status !== paused
 */

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WOResumeModal, type PauseInfo } from './WOResumeModal'
import { getPauseReasonLabel } from './PauseReasonSelect'
import type { PauseReason, WOStatus } from '@/lib/validation/production-schemas'

export type { WOStatus }

/**
 * Current pause record shape (from API)
 */
export interface WOPauseRecord {
  id: string
  paused_at: string
  pause_reason: PauseReason
  notes?: string
  paused_by_user: {
    id: string
    full_name: string
  }
}

export interface WOResumeButtonProps {
  workOrderId: string
  workOrderNumber: string
  workOrderStatus: WOStatus
  currentPause?: WOPauseRecord
  onResumeSuccess?: () => void
  onResumeError?: (error: Error) => void
  disabled?: boolean
  className?: string
}

export function WOResumeButton({
  workOrderId,
  workOrderNumber,
  workOrderStatus,
  currentPause,
  onResumeSuccess,
  onResumeError,
  disabled = false,
  className,
}: WOResumeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Don't render if status is not paused
  if (workOrderStatus !== 'paused') {
    return null
  }

  const isDisabled = disabled || isLoading

  // Handle button click
  const handleClick = () => {
    if (!isDisabled) {
      setIsModalOpen(true)
    }
  }

  // Handle resume success
  const handleResumeSuccess = () => {
    setIsLoading(false)
    onResumeSuccess?.()
  }

  // Handle resume error
  const handleResumeError = (error: Error) => {
    setIsLoading(false)
    onResumeError?.(error)
  }

  // Build pause info for modal
  const pauseInfo: PauseInfo = currentPause
    ? {
        paused_at: currentPause.paused_at,
        pause_reason: currentPause.pause_reason,
        pause_reason_label: getPauseReasonLabel(currentPause.pause_reason),
        notes: currentPause.notes,
        paused_by_user: currentPause.paused_by_user,
      }
    : {
        paused_at: new Date().toISOString(),
        pause_reason: 'other',
        pause_reason_label: 'Other',
        paused_by_user: { id: '', full_name: 'Unknown' },
      }

  return (
    <>
      <Button
        variant="default"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Resume work order"
        className={cn(
          'bg-green-600 hover:bg-green-700 text-white',
          'min-h-[48px] min-w-[48px]',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Resuming...</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Resume</span>
          </>
        )}
      </Button>

      <WOResumeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workOrderId={workOrderId}
        workOrderNumber={workOrderNumber}
        pauseInfo={pauseInfo}
        onSuccess={handleResumeSuccess}
        onError={handleResumeError}
      />
    </>
  )
}

export default WOResumeButton
