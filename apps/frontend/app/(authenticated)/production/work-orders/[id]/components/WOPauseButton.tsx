'use client'

/**
 * WOPauseButton Component
 * Story: 04.2b - WO Pause/Resume
 *
 * A conditional action button that allows operators to pause an active work order.
 * Only visible when allow_pause_wo setting is enabled AND work order status is in_progress.
 *
 * States:
 * - Default (Enabled): Yellow outline button with pause icon
 * - Hover: Yellow-100 background
 * - Disabled: Greyed out with tooltip explaining why
 * - Loading: Spinner with "Pausing..." text
 * - Hidden: Not rendered when isPauseEnabled=false
 */

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WOPauseModal, type WOPauseRecord } from './WOPauseModal'
import type { WOStatus } from '@/lib/validation/production-schemas'

export type { WOStatus }

export interface WOPauseButtonProps {
  workOrderId: string
  workOrderNumber: string
  workOrderStatus: WOStatus
  isPauseEnabled: boolean
  onPauseSuccess?: (pauseRecord: WOPauseRecord) => void
  onPauseError?: (error: Error) => void
  disabled?: boolean
  className?: string
}

export function WOPauseButton({
  workOrderId,
  workOrderNumber,
  workOrderStatus,
  isPauseEnabled,
  onPauseSuccess,
  onPauseError,
  disabled = false,
  className,
}: WOPauseButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Don't render if pause is not enabled
  if (!isPauseEnabled) {
    return null
  }

  // Can only pause when status is in_progress
  const canPause = workOrderStatus === 'in_progress'
  const isDisabled = !canPause || disabled || isLoading

  // Tooltip message for disabled state
  const getTooltipMessage = (): string | null => {
    if (!canPause) {
      return 'WO must be In Progress to pause'
    }
    return null
  }

  const tooltipMessage = getTooltipMessage()

  // Handle button click
  const handleClick = () => {
    if (!isDisabled) {
      setIsModalOpen(true)
    }
  }

  // Handle pause success
  const handlePauseSuccess = (pauseRecord: WOPauseRecord) => {
    setIsLoading(false)
    onPauseSuccess?.(pauseRecord)
  }

  // Handle pause error
  const handlePauseError = (error: Error) => {
    setIsLoading(false)
    onPauseError?.(error)
  }

  // Button content
  const buttonContent = (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Pause work order"
      aria-disabled={isDisabled}
      className={cn(
        'border-yellow-600 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800',
        'dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-950',
        'min-h-[48px] min-w-[48px]',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="hidden md:inline">Pausing...</span>
        </>
      ) : (
        <>
          <Pause className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Pause</span>
        </>
      )}
    </Button>
  )

  return (
    <>
      {tooltipMessage ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        buttonContent
      )}

      <WOPauseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workOrderId={workOrderId}
        workOrderNumber={workOrderNumber}
        onSuccess={handlePauseSuccess}
        onError={handlePauseError}
      />
    </>
  )
}

export default WOPauseButton
