'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, PlayCircle, Clock } from 'lucide-react'

interface WOResumeModalProps {
  woId: string
  woNumber: string
  pausedAt?: string
  pauseReason?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function WOResumeModal({
  woId,
  woNumber,
  pausedAt,
  pauseReason,
  open,
  onOpenChange,
  onSuccess,
}: WOResumeModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Calculate pause duration
  const getPauseDuration = () => {
    if (!pausedAt) return null

    const pausedTime = new Date(pausedAt)
    const now = new Date()
    const diffMs = now.getTime() - pausedTime.getTime()
    const minutes = Math.floor(diffMs / 60000)

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    }

    return `${hours}h ${remainingMinutes}m`
  }

  const handleConfirmResume = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/production/work-orders/${woId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const { message, error } = await response.json()
        throw new Error(message || error || 'Failed to resume work order')
      }

      toast({
        title: 'Success',
        description: 'Work order resumed successfully',
      })

      // Auto-close after 1 second
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume work order'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const pauseDuration = getPauseDuration()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-green-500" />
            Resume Work Order
          </DialogTitle>
          <DialogDescription>
            Resume production on <strong>{woNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* WO Number */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <span className="text-sm text-gray-600">Work Order</span>
              <p className="font-medium">{woNumber}</p>
            </div>

            {pauseReason && (
              <div>
                <span className="text-sm text-gray-600">Pause Reason</span>
                <p className="font-medium">{pauseReason}</p>
              </div>
            )}

            {pauseDuration && (
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Paused for {pauseDuration}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Are you sure you want to resume this work order? Production will continue from where it
            was paused.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmResume}
            disabled={loading}
            className="gap-2 bg-green-500 hover:bg-green-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resuming...
              </>
            ) : (
              'Confirm Resume'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
