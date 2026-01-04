/**
 * LP Unblock Modal Component
 * Story 05.6: LP Detail Page
 *
 * Unblock LP confirmation modal
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface LPUnblockModalProps {
  lpId: string
  lpNumber: string
  blockReason: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LPUnblockModal({
  lpId,
  lpNumber,
  blockReason,
  isOpen,
  onClose,
  onSuccess,
}: LPUnblockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/unblock`, {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Failed to unblock license plate')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to unblock license plate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="unblock-modal">
        <DialogHeader>
          <DialogTitle>Unblock License Plate</DialogTitle>
          <DialogDescription>
            Unblock <strong>{lpNumber}</strong> to make it available for use again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {blockReason ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm font-medium mb-1">Original Block Reason:</div>
                <div className="text-sm" data-testid="original-block-reason">
                  {blockReason}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-gray-500">No reason provided</div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Unblocking...' : 'Unblock LP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
