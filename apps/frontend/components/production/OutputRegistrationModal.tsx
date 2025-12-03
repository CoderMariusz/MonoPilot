/**
 * Output Registration Modal
 * Story 4.12: Output Registration Desktop
 * Story 4.14: By-Product Registration integration
 * AC-4.12.1, AC-4.12.6, AC-4.12.8, AC-4.14.1
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ByProductRegistrationDialog } from './ByProductRegistrationDialog'

interface OutputRegistrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  woNumber: string
  productName: string
  plannedQty: number
  outputQty: number
  uom: string
  requireQaStatus: boolean
  onSuccess: () => void
}

interface AllocationPreview {
  allocations: Array<{
    lpId: string
    lpNumber: string
    qtyToConsume: number
  }>
  is_over_consumption: boolean
  cumulative_after: number
  remaining_unallocated: number
  total_reserved: number
  reserved_lps: Array<{ id: string; lp_number: string; qty: number }>
}

export function OutputRegistrationModal({
  open,
  onOpenChange,
  woId,
  woNumber,
  productName,
  plannedQty,
  outputQty,
  uom,
  requireQaStatus,
  onSuccess,
}: OutputRegistrationModalProps) {
  const [qty, setQty] = useState('')
  const [qaStatus, setQaStatus] = useState<string>('passed')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<AllocationPreview | null>(null)
  const [showOverProductionDialog, setShowOverProductionDialog] = useState(false)
  const [selectedParentLpId, setSelectedParentLpId] = useState<string>('')
  // By-product state (Story 4.14)
  const [showByProductDialog, setShowByProductDialog] = useState(false)
  const [lastOutputId, setLastOutputId] = useState<string>('')
  const [lastOutputQty, setLastOutputQty] = useState<number>(0)
  const { toast } = useToast()

  // Calculate remaining qty
  const remainingQty = plannedQty - outputQty

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setQty('')
      setQaStatus('passed')
      setNotes('')
      setPreview(null)
      setShowOverProductionDialog(false)
      setSelectedParentLpId('')
    }
  }, [open])

  // Preview allocation when qty changes
  useEffect(() => {
    const previewAllocation = async () => {
      const qtyNum = parseFloat(qty)
      if (!qtyNum || qtyNum <= 0) {
        setPreview(null)
        return
      }

      setPreviewLoading(true)
      try {
        const response = await fetch(`/api/production/work-orders/${woId}/outputs/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qty: qtyNum }),
        })

        if (response.ok) {
          const { data } = await response.json()
          setPreview(data)
        }
      } catch (err) {
        console.error('Preview error:', err)
      } finally {
        setPreviewLoading(false)
      }
    }

    const debounce = setTimeout(previewAllocation, 500)
    return () => clearTimeout(debounce)
  }, [qty, woId])

  const handleSubmit = async () => {
    const qtyNum = parseFloat(qty)
    if (!qtyNum || qtyNum <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      })
      return
    }

    // If over-consumption, check if we need parent LP selection
    if (preview?.is_over_consumption && !showOverProductionDialog) {
      setShowOverProductionDialog(true)
      return
    }

    // If over-production dialog shown but no LP selected
    if (showOverProductionDialog && !selectedParentLpId) {
      toast({
        title: 'Error',
        description: 'Please select a parent LP for over-production',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qty: qtyNum,
          qa_status: qaStatus,
          notes: notes || undefined,
          is_over_production: showOverProductionDialog,
          over_production_parent_lp_id: selectedParentLpId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle over-consumption conflict
        if (response.status === 409 && result.requires_confirmation) {
          setShowOverProductionDialog(true)
          if (result.details?.reserved_lps) {
            setPreview((prev) => prev ? {
              ...prev,
              reserved_lps: result.details.reserved_lps,
            } : null)
          }
          return
        }

        toast({
          title: 'Error',
          description: result.message || 'Failed to register output',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: `Output registered: ${result.data.output.lp_number}`,
      })

      // Store output info for by-product dialog (AC-4.14.1)
      setLastOutputId(result.data.output.id)
      setLastOutputQty(qtyNum)

      // Check if WO has by-products (AC-4.14.1)
      try {
        const bpResponse = await fetch(`/api/production/work-orders/${woId}/by-products`)
        if (bpResponse.ok) {
          const { data: byProducts } = await bpResponse.json()
          if (byProducts && byProducts.length > 0) {
            // Show by-product dialog
            setShowByProductDialog(true)
            return // Don't close main modal yet
          }
        }
      } catch (err) {
        console.error('Failed to check by-products:', err)
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Register Output
          </DialogTitle>
          <DialogDescription>
            {woNumber} - {productName}
          </DialogDescription>
        </DialogHeader>

        {!showOverProductionDialog ? (
          // Main output registration form
          <div className="space-y-4">
            {/* Progress info */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Planned:</span>
                <span className="font-mono">{plannedQty} {uom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Already produced:</span>
                <span className="font-mono">{outputQty} {uom}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">Remaining:</span>
                <span className="font-mono text-blue-600">{remainingQty} {uom}</span>
              </div>
            </div>

            {/* Quantity input */}
            <div className="space-y-2">
              <Label htmlFor="qty">Output Quantity *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter quantity"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="font-mono"
                />
                <span className="text-gray-500 whitespace-nowrap">{uom}</span>
              </div>
            </div>

            {/* QA Status (if required) */}
            {requireQaStatus && (
              <div className="space-y-2">
                <Label htmlFor="qaStatus">QA Status *</Label>
                <Select value={qaStatus} onValueChange={setQaStatus}>
                  <SelectTrigger id="qaStatus">
                    <SelectValue placeholder="Select QA status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Allocation preview */}
            {previewLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating allocation...
              </div>
            )}

            {preview && !previewLoading && (
              <div className="space-y-2">
                <Label className="text-gray-600">Material Consumption Preview</Label>
                <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                  {preview.allocations.map((alloc, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-mono">{alloc.lpNumber}</span>
                      <span className="font-mono">{alloc.qtyToConsume} {uom}</span>
                    </div>
                  ))}
                  {preview.allocations.length === 0 && (
                    <div className="text-gray-500">No materials to consume</div>
                  )}
                </div>

                {preview.is_over_consumption && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Over-consumption detected:</strong> Output exceeds reserved materials
                      by {preview.remaining_unallocated} {uom}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        ) : (
          // Over-production parent LP selection (AC-4.12b.1, AC-4.12b.2)
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription>
                <strong>Over-Production Detected</strong>
                <p className="mt-1 text-sm">
                  All reserved materials have been consumed. Please select which
                  reserved LP to link as the source for this over-production output.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Select Parent LP for Over-Production *</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {preview?.reserved_lps?.map((lp) => (
                  <div
                    key={lp.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedParentLpId === lp.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedParentLpId(lp.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{lp.lp_number}</span>
                      <span className="text-sm text-gray-500">
                        {lp.qty} {uom} reserved
                      </span>
                    </div>
                    {selectedParentLpId === lp.id && (
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowOverProductionDialog(false)}
              className="w-full"
            >
              Back to Form
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !qty}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {showOverProductionDialog ? 'Confirm Over-Production' : 'Register Output'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* By-Product Registration Dialog (Story 4.14) */}
      <ByProductRegistrationDialog
        open={showByProductDialog}
        onOpenChange={setShowByProductDialog}
        woId={woId}
        woNumber={woNumber}
        mainOutputId={lastOutputId}
        mainOutputQty={lastOutputQty}
        requireQaStatus={requireQaStatus}
        onComplete={() => {
          setShowByProductDialog(false)
          onSuccess()
          onOpenChange(false)
        }}
      />
    </Dialog>
  )
}
