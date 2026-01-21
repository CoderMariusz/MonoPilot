'use client'

/**
 * RegisterOutputModal Component (Story 04.7a)
 *
 * Modal for registering production output with:
 * - WO/Product info display
 * - Quantity input
 * - Batch number (pre-filled from WO)
 * - QA status selection (required if settings enabled)
 * - Location dropdown
 * - Expiry date auto-calculated from shelf life
 * - Notes textarea
 * - Output summary preview
 */

import { useState, useEffect, useMemo } from 'react'
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
import { Loader2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface WorkOrderSummary {
  id: string
  wo_number: string
  status: string
  product_id: string
  product_name: string
  product_code: string
  batch_number: string
  planned_qty: number
  output_qty: number
  uom: string
  progress_percent: number
  remaining_qty: number
  default_location_id: string | null
  default_location_name: string | null
  shelf_life_days?: number
}

export interface Location {
  id: string
  name: string
  full_path?: string
}

export interface RegisterOutputInput {
  wo_id: string
  quantity: number
  uom: string
  batch_number: string
  qa_status?: 'approved' | 'pending' | 'rejected'
  location_id: string
  expiry_date: string
  notes?: string
}

export interface RegisterOutputModalProps {
  /** Work order summary data */
  wo: WorkOrderSummary
  /** Default location for output */
  defaultLocation?: Location
  /** Whether QA status is required */
  requireQAStatus: boolean
  /** Confirm callback with form data */
  onConfirm: (data: RegisterOutputInput) => Promise<void>
  /** Cancel callback */
  onCancel: () => void
  /** Available locations for dropdown */
  locations?: Location[]
}

/**
 * Calculate expiry date from shelf life days
 */
function calculateExpiryDate(shelfLifeDays?: number): string {
  const days = shelfLifeDays ?? 90 // Default 90 days
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function RegisterOutputModal({
  wo,
  defaultLocation,
  requireQAStatus,
  onConfirm,
  onCancel,
  locations = [],
}: RegisterOutputModalProps) {
  // Form state
  const [quantity, setQuantity] = useState<string>('')
  const [batchNumber, setBatchNumber] = useState(wo.batch_number || wo.wo_number)
  const [qaStatus, setQaStatus] = useState<string>('')
  const [locationId, setLocationId] = useState(defaultLocation?.id || '')
  const [expiryDate, setExpiryDate] = useState(() => calculateExpiryDate(wo.shelf_life_days))
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens
  useEffect(() => {
    setQuantity('')
    setBatchNumber(wo.batch_number || wo.wo_number)
    setQaStatus('')
    setLocationId(defaultLocation?.id || '')
    setExpiryDate(calculateExpiryDate(wo.shelf_life_days))
    setNotes('')
    setErrors({})
  }, [wo.id, wo.batch_number, wo.wo_number, wo.shelf_life_days, defaultLocation?.id])

  // Calculated values
  const quantityNum = parseFloat(quantity) || 0
  const projectedTotal = wo.output_qty + quantityNum
  const projectedProgress = wo.planned_qty > 0
    ? Math.round((projectedTotal / wo.planned_qty) * 100 * 10) / 10
    : 0

  // Form validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!quantity || quantityNum <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    if (requireQAStatus && !qaStatus) {
      newErrors.qaStatus = 'QA status is required'
    }

    if (!batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required'
    }

    if (!locationId) {
      newErrors.locationId = 'Location is required'
    }

    if (!expiryDate) {
      newErrors.expiryDate = 'Expiry date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if form is valid for enabling submit button
  const isFormValid = useMemo(() => {
    if (!quantity || quantityNum <= 0) return false
    if (requireQAStatus && !qaStatus) return false
    if (!batchNumber.trim()) return false
    if (!locationId) return false
    if (!expiryDate) return false
    return true
  }, [quantity, quantityNum, requireQAStatus, qaStatus, batchNumber, locationId, expiryDate])

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onConfirm({
        wo_id: wo.id,
        quantity: quantityNum,
        uom: wo.uom,
        batch_number: batchNumber,
        qa_status: qaStatus as 'approved' | 'pending' | 'rejected' | undefined,
        location_id: locationId,
        expiry_date: expiryDate,
        notes: notes || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && isFormValid) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  // Get location name for display
  const selectedLocationName = useMemo(() => {
    if (locationId === defaultLocation?.id) {
      return defaultLocation?.full_path || defaultLocation?.name || ''
    }
    const loc = locations.find(l => l.id === locationId)
    return loc?.full_path || loc?.name || ''
  }, [locationId, defaultLocation, locations])

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        aria-describedby="register-output-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Register Production Output
          </DialogTitle>
          <DialogDescription id="register-output-description">
            {wo.wo_number} - {wo.product_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Information (Read-Only) */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Product Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Product:</span>{' '}
                <span className="font-medium">{wo.product_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Code:</span>{' '}
                <span className="font-mono">{wo.product_code}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Work Order:</span>{' '}
                <span className="font-mono">{wo.wo_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Batch:</span>{' '}
                <span className="font-mono">{wo.batch_number}</span>
              </div>
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-mono">
                  {formatNumber(wo.output_qty)} / {formatNumber(wo.planned_qty)} {wo.uom} ({wo.progress_percent}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-mono text-blue-600">
                  {formatNumber(wo.remaining_qty)} {wo.uom}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={cn(
                  'font-mono flex-1',
                  errors.quantity && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.quantity}
                aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              />
              <span className="flex items-center px-3 text-muted-foreground bg-muted rounded-md">
                {wo.uom}
              </span>
            </div>
            {errors.quantity && (
              <p id="quantity-error" className="text-sm text-destructive" role="alert">
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Batch Number */}
          <div className="space-y-2">
            <Label htmlFor="batch_number">
              Batch Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="batch_number"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className={cn(
                'font-mono',
                errors.batchNumber && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-invalid={!!errors.batchNumber}
            />
            <p className="text-xs text-muted-foreground">Auto-filled from WO, editable</p>
            {errors.batchNumber && (
              <p className="text-sm text-destructive" role="alert">
                {errors.batchNumber}
              </p>
            )}
          </div>

          {/* QA Status */}
          <div className="space-y-2">
            <Label htmlFor="qa_status">
              QA Status {requireQAStatus && <span className="text-destructive">*</span>}
            </Label>
            <Select value={qaStatus} onValueChange={setQaStatus}>
              <SelectTrigger
                id="qa_status"
                className={cn(errors.qaStatus && 'border-destructive')}
                aria-invalid={!!errors.qaStatus}
              >
                <SelectValue placeholder="-- Select QA Status --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {errors.qaStatus && (
              <p className="text-sm text-destructive" role="alert">
                {errors.qaStatus}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location <span className="text-destructive">*</span>
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger
                id="location"
                className={cn(errors.locationId && 'border-destructive')}
                aria-invalid={!!errors.locationId}
              >
                <SelectValue placeholder="-- Select Location --">
                  {selectedLocationName || '-- Select Location --'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {defaultLocation && (
                  <SelectItem value={defaultLocation.id}>
                    {defaultLocation.full_path || defaultLocation.name}
                  </SelectItem>
                )}
                {locations
                  .filter((l) => l.id !== defaultLocation?.id)
                  .map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.full_path || loc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.locationId && (
              <p className="text-sm text-destructive" role="alert">
                {errors.locationId}
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry_date">
              Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={cn(
                'font-mono',
                errors.expiryDate && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-invalid={!!errors.expiryDate}
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated: Today + {wo.shelf_life_days || 90} days shelf life
            </p>
            {errors.expiryDate && (
              <p className="text-sm text-destructive" role="alert">
                {errors.expiryDate}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Output Summary Preview */}
          {quantityNum > 0 && (
            <div className="rounded-lg border bg-blue-50 p-3 space-y-2">
              <h4 className="text-sm font-medium text-blue-800">Output Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div>Quantity: <span className="font-mono font-medium">{formatNumber(quantityNum)} {wo.uom}</span></div>
                <div>Batch: <span className="font-mono">{batchNumber}</span></div>
                <div>QA Status: <span>{qaStatus || 'Not selected'}</span></div>
                <div>Expiry: <span className="font-mono">{expiryDate}</span></div>
              </div>
              <div className="pt-2 border-t border-blue-200 text-sm text-blue-700">
                <div>
                  After registration: {formatNumber(projectedTotal)} / {formatNumber(wo.planned_qty)} {wo.uom} ({projectedProgress}%)
                </div>
              </div>
            </div>
          )}

          {/* Error summary */}
          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-destructive" role="alert">
              Please correct the errors above before proceeding
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Registering...' : 'Confirm Registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterOutputModal
