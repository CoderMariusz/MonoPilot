/**
 * ShortPickModal Component
 * Story: 07.9 - Pick Confirmation Desktop
 * Phase: GREEN - Full implementation
 *
 * Modal for handling short picks with reason selection.
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { ShortPickReason } from '@/lib/validation/pick-confirmation-schemas'

export interface ShortPickModalProps {
  isOpen: boolean
  line: {
    id: string
    product_name: string
    product_sku: string
    quantity_to_pick: number
    quantity_picked: number
  }
  quantity_picked: number
  onConfirm: (reason: string, notes?: string) => Promise<void>
  onCancel: () => void
}

const REASON_OPTIONS: Array<{ value: ShortPickReason; label: string }> = [
  { value: 'insufficient_inventory', label: 'Insufficient Inventory' },
  { value: 'damaged', label: 'Damaged Units Found' },
  { value: 'expired', label: 'Expired / Wrong Lot' },
  { value: 'location_empty', label: 'Location Empty' },
  { value: 'quality_hold', label: 'Quality Hold' },
  { value: 'other', label: 'Other' },
]

export function ShortPickModal({
  isOpen,
  line,
  quantity_picked,
  onConfirm,
  onCancel,
}: ShortPickModalProps): React.JSX.Element | null {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const shortQuantity = line.quantity_to_pick - quantity_picked

  const handleConfirm = async () => {
    if (!selectedReason) return

    setIsSubmitting(true)
    try {
      await onConfirm(selectedReason, notes || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
  }

  const isConfirmDisabled = !selectedReason || isSubmitting

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Short Pick Detected
          </DialogTitle>
          <DialogDescription>
            Unable to fulfill the full quantity for this pick line.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="font-medium">{line.product_name}</p>
            <p className="text-sm text-muted-foreground">SKU: {line.product_sku}</p>
          </div>

          {/* Quantity Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Required</p>
              <p className="text-xl font-bold">{line.quantity_to_pick}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-amber-600">{quantity_picked}</p>
            </div>
            <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/20">
              <p className="text-sm text-muted-foreground">Short</p>
              <p className="text-xl font-bold text-red-600">{shortQuantity}</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (required)</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason" role="combobox">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
            {notes.length >= 500 && (
              <p className="text-xs text-red-500">Maximum 500 characters allowed</p>
            )}
          </div>

          {/* Backorder Info */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              A backorder will be created for <strong>{shortQuantity} Units</strong>
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Go Back
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
            {isSubmitting && <Loader2 data-testid="loading-spinner" className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Short Pick
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
