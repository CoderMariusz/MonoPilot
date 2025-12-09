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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'

interface ReconciliationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  countId: string
  missingCount: number
  onReconcile: (action: 'accept_loss' | 'investigate' | 'recount', notes?: string) => Promise<void>
}

export function ReconciliationModal({
  open,
  onOpenChange,
  countId,
  missingCount,
  onReconcile,
}: ReconciliationModalProps) {
  const [action, setAction] = useState<'accept_loss' | 'investigate' | 'recount'>('investigate')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    try {
      await onReconcile(action, notes || undefined)
      onOpenChange(false)
      setNotes('')
      setAction('investigate')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reconcile Variance</DialogTitle>
          <DialogDescription>
            Choose how to handle {missingCount} missing LP(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={action} onValueChange={(v) => setAction(v as any)}>
            {/* Investigate Option */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="investigate" id="investigate" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="investigate" className="flex items-center gap-2 cursor-pointer">
                  <Search className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Investigate</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark for investigation. No stock adjustments will be made.
                </p>
              </div>
            </div>

            {/* Recount Option */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="recount" id="recount" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="recount" className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Recount</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new count for the same location to verify.
                </p>
              </div>
            </div>

            {/* Accept Loss Option */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-red-200 hover:bg-red-50/50 cursor-pointer">
              <RadioGroupItem value="accept_loss" id="accept_loss" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="accept_loss" className="flex items-center gap-2 cursor-pointer">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700">Accept as Loss</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Zero out missing LPs and create adjustment records.
                  <span className="text-red-600 font-medium"> This action cannot be undone.</span>
                </p>
              </div>
            </div>
          </RadioGroup>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes..."
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant={action === 'accept_loss' ? 'destructive' : 'default'}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === 'accept_loss' && 'Accept Loss'}
            {action === 'investigate' && 'Mark for Investigation'}
            {action === 'recount' && 'Start Recount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
