/**
 * LP Status Change Modal
 * Stories 5.1-5.4: LP Core UI
 * Change license plate status with validation
 */

'use client'

import { useState } from 'react'
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
import { LPStatusBadge } from './LPStatusBadge'
import { useToast } from '@/hooks/use-toast'
import { ArrowRight } from 'lucide-react'

interface LPStatusChangeModalProps {
  open: boolean
  lpId: string
  currentStatus: 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged' | 'split'
  onClose: () => void
  onSuccess: () => void
}

// Status transition rules from service
const STATUS_TRANSITIONS: Record<string, string[]> = {
  available: ['reserved', 'quarantine', 'shipped'],
  reserved: ['available', 'consumed', 'quarantine'],
  consumed: [], // Terminal
  shipped: [], // Terminal
  quarantine: ['available', 'recalled'],
  recalled: ['quarantine'],
  merged: [], // Terminal
  split: [], // Terminal
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  consumed: 'Consumed',
  shipped: 'Shipped',
  quarantine: 'Quarantine',
  recalled: 'Recalled',
  merged: 'Merged',
  split: 'Split',
}

export function LPStatusChangeModal({
  open,
  lpId,
  currentStatus,
  onClose,
  onSuccess,
}: LPStatusChangeModalProps) {
  const { toast } = useToast()

  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newStatus) {
      toast({
        title: 'Validation Error',
        description: 'Please select a new status',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      toast({
        title: 'Success',
        description: `Status changed to ${STATUS_LABELS[newStatus]}`,
      })

      setNewStatus('')
      setReason('')
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change License Plate Status</DialogTitle>
          <DialogDescription>
            Update the status of this license plate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="flex items-center gap-2">
              <LPStatusBadge status={currentStatus} />
            </div>
          </div>

          {/* Status Transition Arrow */}
          {allowedTransitions.length > 0 && (
            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* New Status */}
          <div className="space-y-2">
            <Label htmlFor="newStatus">New Status *</Label>
            {allowedTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This status cannot be changed (terminal state)
              </p>
            ) : (
              <Select value={newStatus} onValueChange={setNewStatus} required>
                <SelectTrigger id="newStatus">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason */}
          {allowedTransitions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Notes</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason for status change"
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {allowedTransitions.length > 0 && (
              <Button type="submit" disabled={loading || !newStatus}>
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
