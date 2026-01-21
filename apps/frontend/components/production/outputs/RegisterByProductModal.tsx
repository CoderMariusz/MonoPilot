'use client'

/**
 * RegisterByProductModal Component (Story 04.7c)
 *
 * Modal for registering by-product output with:
 * - By-product info display
 * - Expected vs actual quantity
 * - Pre-filled quantity from expected
 * - Auto-generated batch number
 * - QA status selection
 * - Location dropdown
 */

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
import { Loader2, Package, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface ByProduct {
  product_id: string
  product_name: string
  product_code: string
  material_id: string
  yield_percent: number
  expected_qty: number
  actual_qty: number
  uom: string
  lp_count: number
  status: 'registered' | 'not_registered'
  last_registered_at: string | null
}

export interface RegisterByProductModalProps {
  /** By-product to register */
  byProduct: ByProduct
  /** Main output LP ID for genealogy */
  mainOutputLpId: string
  /** Main batch number for batch generation */
  mainBatch: string
  /** Whether modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback on successful registration */
  onSuccess: () => void
  /** Optional locations for dropdown */
  locations?: Array<{ id: string; name: string }>
  /** Whether QA status is required */
  requireQAStatus?: boolean
}

/**
 * Generate by-product batch number
 */
function generateBatch(mainBatch: string, productCode: string): string {
  const sanitizedCode = productCode.replace(/[^a-zA-Z0-9]/g, '-')
  const batch = `${mainBatch}-BP-${sanitizedCode}`
  return batch.length > 50 ? batch.slice(0, 50) : batch
}

/**
 * Format number for display
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function RegisterByProductModal({
  byProduct,
  mainOutputLpId,
  mainBatch,
  open,
  onOpenChange,
  onSuccess,
  locations = [],
  requireQAStatus = false,
}: RegisterByProductModalProps) {
  // Form state
  const [quantity, setQuantity] = useState<string>('')
  const [batchNumber, setBatchNumber] = useState('')
  const [qaStatus, setQaStatus] = useState<string>('pending')
  const [locationId, setLocationId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when modal opens
  useEffect(() => {
    if (open && byProduct) {
      setQuantity(byProduct.expected_qty.toFixed(2))
      setBatchNumber(generateBatch(mainBatch, byProduct.product_code))
      setQaStatus('pending')
      setLocationId(locations[0]?.id || '')
      setNotes('')
      setError(null)
    }
  }, [open, byProduct, mainBatch, locations])

  // Validate form
  const quantityNum = parseFloat(quantity)
  const hasQuantity = !isNaN(quantityNum) && quantity.trim() !== ''
  const isValid = hasQuantity && quantityNum >= 0 && batchNumber.trim() !== ''

  // Handle form submission
  const handleSubmit = async () => {
    if (!hasQuantity || quantity.trim() === '') {
      setError('Quantity is required')
      return
    }
    if (!isValid) {
      setError('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/production/by-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          by_product_material_id: byProduct.material_id,
          main_output_lp_id: mainOutputLpId,
          quantity: quantityNum,
          batch_number: batchNumber,
          qa_status: qaStatus || undefined,
          location_id: locationId || undefined,
          notes: notes || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Registration failed')
        return
      }

      onSuccess()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Register By-Product: {byProduct.product_name}
          </DialogTitle>
          <DialogDescription>
            {byProduct.product_code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* By-product info */}
          <div className="rounded-lg border bg-amber-50 p-3 space-y-2 text-sm">
            <h4 className="font-medium text-amber-800">By-Product Information</h4>
            <div className="grid grid-cols-2 gap-2 text-amber-700">
              <div>
                <span className="text-amber-600">Product:</span>{' '}
                <span className="font-medium" data-testid="product-name">{byProduct.product_name}</span>
              </div>
              <div>
                <span className="text-amber-600">Code:</span>{' '}
                <span className="font-mono" data-testid="product-code">{byProduct.product_code}</span>
              </div>
              <div className="col-span-2">
                <span className="text-amber-600">BOM Configuration:</span>{' '}
                <span>is_by_product: true, yield_percent: {byProduct.yield_percent}%</span>
              </div>
            </div>
          </div>

          {/* Expected vs actual */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="flex justify-between" data-testid="expected-qty">
                  <span>Expected ({byProduct.yield_percent}%):</span>
                  <span className="font-mono font-medium">
                    {formatNumber(byProduct.expected_qty)} {byProduct.uom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Already Registered:</span>
                  <span className="font-mono">
                    {formatNumber(byProduct.actual_qty)} {byProduct.uom}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Recommended:</span>
                  <span className="font-mono text-amber-600">
                    {formatNumber(Math.max(0, byProduct.expected_qty - byProduct.actual_qty))} {byProduct.uom}
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Quantity input */}
          <div className="space-y-2">
            <Label htmlFor="bp-quantity">
              Actual Quantity <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="bp-quantity"
                type="number"
                role="spinbutton"
                step="0.01"
                min="0"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono flex-1"
                aria-label="Quantity"
              />
              <span className="flex items-center px-3 text-muted-foreground bg-muted rounded-md">
                {byProduct.uom}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pre-filled with expected qty, editable
            </p>
          </div>

          {/* Batch number */}
          <div className="space-y-2">
            <Label htmlFor="bp-batch">
              Batch Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bp-batch"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="font-mono"
              aria-label="Batch Number"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated: {'{main}-BP-{code}'}, editable
            </p>
          </div>

          {/* QA Status */}
          <div className="space-y-2">
            <Label htmlFor="bp-qa">
              QA Status {requireQAStatus && <span className="text-destructive">*</span>}
            </Label>
            <Select value={qaStatus} onValueChange={setQaStatus}>
              <SelectTrigger id="bp-qa">
                <SelectValue placeholder="Select QA status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          {locations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bp-location">Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger id="bp-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="bp-notes">Notes (Optional)</Label>
            <Textarea
              id="bp-notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Summary */}
          {quantityNum > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
              <h4 className="font-medium">By-Product Summary</h4>
              <div className="grid grid-cols-2 gap-1">
                <div>By-Product: <span className="font-medium">{byProduct.product_name}</span></div>
                <div>Quantity: <span className="font-mono">{formatNumber(quantityNum)} {byProduct.uom}</span></div>
                <div>Batch: <span className="font-mono">{batchNumber}</span></div>
                <div>QA Status: <span>{qaStatus || '-'}</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Genealogy: Same parent materials as main output
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive" role="alert" data-testid="error-message">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Register By-Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterByProductModal
