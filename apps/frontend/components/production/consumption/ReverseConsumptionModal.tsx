/**
 * Reverse Consumption Modal Component (Story 04.6a)
 * Confirmation modal for reversing consumption (Manager only)
 *
 * Wireframe: PROD-003 - Reverse Consumption Modal
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Loader2, X, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReverseConsumption } from '@/lib/hooks/use-consumption'
import type { Consumption } from '@/lib/services/consumption-service'

interface ReverseConsumptionModalProps {
  woId: string
  consumption: Consumption | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const REVERSAL_REASONS = [
  { value: 'scanned_wrong_lp', label: 'Scanned Wrong LP' },
  { value: 'wrong_quantity', label: 'Wrong Quantity Entered' },
  { value: 'operator_error', label: 'Operator Error' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'other', label: 'Other (specify)' },
]

export function ReverseConsumptionModal({
  woId,
  consumption,
  open,
  onClose,
  onSuccess,
}: ReverseConsumptionModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()
  const reverseConsumption = useReverseConsumption()

  // Get display values from joined data
  const getLpNumber = (): string => {
    if (!consumption?.license_plates) return 'Unknown'
    if (Array.isArray(consumption.license_plates)) {
      return (consumption.license_plates as { lp_number: string }[])[0]?.lp_number || 'Unknown'
    }
    return consumption.license_plates.lp_number
  }

  const getMaterialName = (): string => {
    if (!consumption?.wo_materials) return 'Unknown'
    if (Array.isArray(consumption.wo_materials)) {
      return (consumption.wo_materials as { material_name: string }[])[0]?.material_name || 'Unknown'
    }
    return consumption.wo_materials.material_name
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle reversal
  const handleConfirmReversal = async () => {
    if (!reason) {
      setError('Please select a reason for reversal')
      return
    }

    if (reason === 'other' && !notes.trim()) {
      setError('Please provide additional details for "Other" reason')
      return
    }

    if (!consumption) return

    try {
      setError(null)
      const reasonText =
        reason === 'other'
          ? notes
          : REVERSAL_REASONS.find((r) => r.value === reason)?.label || reason

      await reverseConsumption.mutateAsync({
        woId,
        request: {
          consumption_id: consumption.id,
          reason: reasonText,
          notes: notes || undefined,
        },
      })

      toast({
        title: 'Consumption reversed',
        description: `Reversed consumption of ${consumption.consumed_qty} ${consumption.uom} from ${getLpNumber()}`,
      })

      // Reset state
      setReason('')
      setNotes('')
      onSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reverse consumption'
      setError(message)
    }
  }

  // Reset state when modal closes
  const handleClose = () => {
    setReason('')
    setNotes('')
    setError(null)
    onClose()
  }

  if (!consumption) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg" data-testid="reversal-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Reverse Material Consumption
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={handleClose}
              aria-label="Close"
              data-testid="close-modal-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Consumption Details (Read-Only) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Consumption Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Material: </span>
                  <span className="font-medium">{getMaterialName()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">LP: </span>
                  <span className="font-mono">{getLpNumber()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity: </span>
                  <span className="font-mono font-medium">
                    {consumption.consumed_qty} {consumption.uom}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Consumed At: </span>
                  <span>{formatDate(consumption.consumed_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Warning</AlertTitle>
            <AlertDescription className="text-amber-700 text-sm space-y-1">
              <p>Reversing this consumption will:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>
                  Restore LP quantity back to {consumption.consumed_qty} {consumption.uom}
                </li>
                <li>Mark consumption as REVERSED in history</li>
                <li>
                  Update WO material consumed qty (subtract {consumption.consumed_qty}{' '}
                  {consumption.uom})
                </li>
                <li>Create audit log entry with your user ID and timestamp</li>
              </ol>
              <p className="mt-2 font-medium">
                This action is LOGGED and CANNOT be undone (but can be re-consumed if needed).
              </p>
            </AlertDescription>
          </Alert>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reversal-reason">
              Reason for Reversal <span className="text-red-500">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(v) => {
                setReason(v)
                setError(null)
              }}
            >
              <SelectTrigger id="reversal-reason" data-testid="reversal-reason">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {REVERSAL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="reversal-notes">
              Additional Notes{reason === 'other' && <span className="text-red-500"> *</span>}
            </Label>
            <Textarea
              id="reversal-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setError(null)
              }}
              placeholder="Enter additional details..."
              rows={3}
              className="resize-none"
              data-testid="reversal-notes"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{notes.length}/500 characters</p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Only Managers and Admins can reverse consumptions. This action is audited for
              compliance.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={reverseConsumption.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReversal}
            disabled={reverseConsumption.isPending || !reason || (reason === 'other' && !notes.trim())}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {reverseConsumption.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Confirm Reversal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
