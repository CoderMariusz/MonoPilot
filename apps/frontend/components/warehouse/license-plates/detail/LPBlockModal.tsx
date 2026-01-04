/**
 * LP Block Modal Component
 * Story 05.6: LP Detail Page
 *
 * Block LP confirmation modal with reason
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface LPBlockModalProps {
  lpId: string
  lpNumber: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LPBlockModal({
  lpId,
  lpNumber,
  isOpen,
  onClose,
  onSuccess,
}: LPBlockModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!reason.trim()) {
      setError('Reason is required')
      return
    }

    if (reason.length > 500) {
      setError('Reason must be 500 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to block license plate')
      }

      onSuccess()
      onClose()
      setReason('')
    } catch (err) {
      setError('Failed to block license plate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent data-testid="block-modal">
        <DialogHeader>
          <DialogTitle>Block License Plate</DialogTitle>
          <DialogDescription>
            Block <strong>{lpNumber}</strong> from being used or consumed. Please provide a reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="block-reason">Reason *</Label>
            <Textarea
              id="block-reason"
              data-testid="block-reason"
              placeholder="Enter reason for blocking this LP..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              <div className="text-sm text-red-600">{error}</div>
              <div className="text-sm text-gray-500" data-testid="char-count">
                {reason.length} / 500
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Blocking...' : 'Block LP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
