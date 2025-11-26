/**
 * PO Fast Flow Main Component
 * Story 3.1: Purchase Order Creation - Fast Flow
 * Combines ProductLineForm and ReviewModal into a multi-step wizard
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductLineForm, type POLineInput } from './ProductLineForm'
import { ReviewModal } from './ReviewModal'

type Step = 'entry' | 'review'

interface POFastFlowModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  warehouseId?: string
}

export function POFastFlowModal({
  open,
  onClose,
  onSuccess,
  warehouseId
}: POFastFlowModalProps) {
  const [step, setStep] = useState<Step>('entry')
  const [lines, setLines] = useState<POLineInput[]>([])

  // Handle close - reset state
  const handleClose = () => {
    setStep('entry')
    setLines([])
    onClose()
  }

  // Handle success - reset and notify parent
  const handleSuccess = () => {
    setStep('entry')
    setLines([])
    onSuccess()
  }

  // Handle go to review
  const handleNext = () => {
    setStep('review')
  }

  // Handle go back to entry
  const handleBack = () => {
    setStep('review') // Keep review modal open but switch back
    setStep('entry')
  }

  if (step === 'review') {
    return (
      <ReviewModal
        open={open}
        onClose={handleClose}
        lines={lines}
        onBack={() => setStep('entry')}
        onSuccess={handleSuccess}
        warehouseId={warehouseId}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick PO Entry</DialogTitle>
          <DialogDescription>
            Enter product codes and quantities to create purchase orders. Products will be
            automatically grouped by their default supplier.
          </DialogDescription>
        </DialogHeader>

        <ProductLineForm
          lines={lines}
          onLinesChange={setLines}
          onNext={handleNext}
          warehouseId={warehouseId}
        />
      </DialogContent>
    </Dialog>
  )
}

// Re-export types
export type { POLineInput } from './ProductLineForm'
export type { POAssignmentBySupplier, POAssignmentLine } from './ReviewModal'
