'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast'
import { Loader2, PauseCircle } from 'lucide-react'

interface PauseReason {
  id: string
  label: string
  enabled: boolean
}

interface WOPauseModalProps {
  woId: string
  woNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function WOPauseModal({
  woId,
  woNumber,
  open,
  onOpenChange,
  onSuccess,
}: WOPauseModalProps) {
  const [pauseReasons, setPauseReasons] = useState<PauseReason[]>([])
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingReasons, setLoadingReasons] = useState(true)
  const { toast } = useToast()

  // Load pause reasons when modal opens
  useEffect(() => {
    if (!open) return

    const fetchReasons = async () => {
      setLoadingReasons(true)
      try {
        const response = await fetch('/api/production/settings')
        if (response.ok) {
          const { data } = await response.json()
          const reasons = data?.pause_reasons || [
            { id: 'breakdown', label: 'Breakdown', enabled: true },
            { id: 'break', label: 'Break', enabled: true },
            { id: 'material_wait', label: 'Material Wait', enabled: true },
            { id: 'other', label: 'Other', enabled: true },
          ]
          setPauseReasons(reasons.filter((r: PauseReason) => r.enabled))
        }
      } catch {
        // Use defaults if fetch fails
        setPauseReasons([
          { id: 'breakdown', label: 'Breakdown', enabled: true },
          { id: 'break', label: 'Break', enabled: true },
          { id: 'material_wait', label: 'Material Wait', enabled: true },
          { id: 'other', label: 'Other', enabled: true },
        ])
      } finally {
        setLoadingReasons(false)
      }
    }

    fetchReasons()
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedReason('')
      setNotes('')
    }
  }, [open])

  const handleConfirmPause = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/production/work-orders/${woId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pause_reason: selectedReason || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const { message, error } = await response.json()
        throw new Error(message || error || 'Failed to pause work order')
      }

      toast({
        title: 'Success',
        description: 'Work order paused successfully',
      })

      // Auto-close after 1 second
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause work order'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-orange-500" />
            Pause Work Order
          </DialogTitle>
          <DialogDescription>
            Pause production on <strong>{woNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* WO Number (read-only) */}
          <div className="space-y-2">
            <Label>Work Order</Label>
            <div className="p-2 bg-gray-100 rounded-md font-medium">{woNumber}</div>
          </div>

          {/* Pause Reason (optional) */}
          <div className="space-y-2">
            <Label htmlFor="pause-reason">Pause Reason (optional)</Label>
            {loadingReasons ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading reasons...
              </div>
            ) : (
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger id="pause-reason">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {pauseReasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.label}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="pause-notes">Notes (optional)</Label>
            <Textarea
              id="pause-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPause}
            disabled={loading}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pausing...
              </>
            ) : (
              'Confirm Pause'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
