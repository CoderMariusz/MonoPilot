/**
 * Split LP Modal Component (Story 05.17)
 * Main modal for LP split workflow
 *
 * Features:
 * - Display source LP details (product, lot, qty available)
 * - Input for split quantity
 * - Destination location selection (optional)
 * - Validation feedback
 * - Preview before split
 * - Confirm button
 *
 * Per WH-008 wireframe
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Scissors, X, Package, MapPin, Scale, Hash, Calendar, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { SplitLPValidation } from './SplitLPValidation'
import { SplitLPPreview } from './SplitLPPreview'
import { useSplitLP, useValidateSplit } from '@/lib/hooks/use-lp-split'

// Types
interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  product?: { name: string; code: string; id: string }
  quantity: number
  uom: string
  batch_number: string | null
  expiry_date: string | null
  qa_status: string
  status: string
  location_id: string
  location?: { id: string; name?: string; full_path?: string }
  warehouse_id: string
  warehouse?: { id: string; name: string }
}

interface Location {
  id: string
  name: string
  full_path?: string
}

interface SplitResult {
  success: boolean
  source_lp: {
    id: string
    lp_number: string
    new_quantity: number
  }
  new_lp: {
    id: string
    lp_number: string
    quantity: number
  }
}

interface SplitLPModalProps {
  open: boolean
  lp: LicensePlate | null
  onClose: () => void
  onSuccess: (result: SplitResult) => void
}

function getQAStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    case 'quarantine':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">Quarantine</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'available':
      return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>
    case 'reserved':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Reserved</Badge>
    case 'consumed':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Consumed</Badge>
    case 'blocked':
      return <Badge variant="destructive">Blocked</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function SplitLPModal({ open, lp, onClose, onSuccess }: SplitLPModalProps) {
  const { toast } = useToast()
  const splitMutation = useSplitLP()

  // State
  const [splitQty, setSplitQty] = useState<string>('')
  const [destinationLocationId, setDestinationLocationId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  // Get warehouse ID from LP
  const warehouseId = lp?.warehouse_id || ''

  // Parse split quantity
  const splitQtyNum = parseFloat(splitQty) || 0

  // Client-side validation
  const validationInput = lp ? {
    splitQty: splitQtyNum,
    sourceLpQty: lp.quantity,
    sourceStatus: lp.status,
  } : null

  const validationResult = useValidateSplit(validationInput)

  // Build validation display result
  const displayValidation = splitQtyNum > 0 ? {
    valid: validationResult.valid,
    errors: validationResult.error ? [validationResult.error] : [],
  } : null

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open && lp) {
      setSplitQty('')
      setDestinationLocationId(null)
      setError(null)
      fetchLocations()
    }
  }, [open, warehouseId])

  // Fetch locations for the warehouse
  const fetchLocations = async () => {
    if (!warehouseId) return

    setIsLoadingLocations(true)
    try {
      const response = await fetch(`/api/settings/locations?warehouse_id=${warehouseId}`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.data || [])
      }
    } catch (err) {
      // Silent fail - locations are optional
      setLocations([])
    } finally {
      setIsLoadingLocations(false)
    }
  }

  // Handle split quantity change
  const handleSplitQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty, numbers, and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSplitQty(value)
      setError(null)
    }
  }

  // Handle split submission
  const handleSplit = async () => {
    if (!lp || !validationResult.valid) return

    setError(null)

    try {
      const result = await splitMutation.mutateAsync({
        lpId: lp.id,
        splitQty: splitQtyNum,
        destinationLocationId: destinationLocationId,
      })

      toast({
        title: 'LP Split Successfully',
        description: `New LP ${result.new_lp.lp_number} created with ${result.new_lp.quantity} ${lp.uom}`,
      })

      onSuccess(result)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Split operation failed'
      setError(message)
      toast({
        title: 'Split Failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // Can't split if LP is null
  if (!lp) {
    return null
  }

  // Can proceed to split?
  const canSplit = validationResult.valid && !splitMutation.isPending && splitQtyNum > 0

  // Get destination location name for preview
  const destinationLocationName = destinationLocationId
    ? locations.find((l) => l.id === destinationLocationId)?.name
    : undefined

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Split License Plate
          </DialogTitle>
          <DialogDescription>
            Split {lp.lp_number} into two separate license plates. The new LP will inherit batch, expiry, and QA status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source LP Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Source LP Info
            </h3>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <div className="text-lg font-bold">{lp.lp_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {lp.product?.name || 'Unknown Product'} ({lp.product?.code || 'N/A'})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(lp.status)}
                  {getQAStatusBadge(lp.qa_status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Scale className="h-3 w-3" />
                    Current Qty
                  </div>
                  <div className="font-semibold">{lp.quantity} {lp.uom}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </div>
                  <div className="font-semibold">{lp.location?.full_path || lp.location?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Hash className="h-3 w-3" />
                    Batch
                  </div>
                  <div className="font-semibold">{lp.batch_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Expiry
                  </div>
                  <div className="font-semibold">{formatDate(lp.expiry_date)}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Split Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Split Details</h3>

            {/* Split Quantity */}
            <div className="space-y-2">
              <Label htmlFor="split-qty">
                Split Quantity <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="split-qty"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter quantity to split"
                  value={splitQty}
                  onChange={handleSplitQtyChange}
                  className="max-w-[200px]"
                  aria-describedby="split-qty-help"
                />
                <span className="text-sm text-muted-foreground">{lp.uom}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Max: {(lp.quantity - 0.01).toFixed(2)}
                </span>
              </div>
              <p id="split-qty-help" className="text-xs text-muted-foreground">
                Must be less than current quantity ({lp.quantity} {lp.uom})
              </p>
            </div>

            {/* Destination Location */}
            <div className="space-y-2">
              <Label htmlFor="destination-location">
                Destination Location (Optional)
              </Label>
              <Select
                value={destinationLocationId || 'same'}
                onValueChange={(value) => {
                  setDestinationLocationId(value === 'same' ? null : value)
                }}
              >
                <SelectTrigger id="destination-location" className="max-w-[350px]">
                  <SelectValue placeholder="Same as source location">
                    {destinationLocationId
                      ? locations.find((l) => l.id === destinationLocationId)?.name || 'Unknown'
                      : `Same as source (${lp.location?.name || 'N/A'})`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same">
                    Same as source ({lp.location?.name || 'N/A'})
                  </SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                      {location.full_path && (
                        <span className="ml-2 text-xs text-gray-500">
                          {location.full_path}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                New LP will be created at: {destinationLocationName || lp.location?.name || 'Source location'}
              </p>
            </div>
          </div>

          {/* Validation Results */}
          {splitQtyNum > 0 && (
            <SplitLPValidation
              isValidating={false}
              validationResult={displayValidation}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Preview (only if validation passed) */}
          {validationResult.valid && splitQtyNum > 0 && (
            <>
              <Separator />
              <SplitLPPreview
                sourceLp={{
                  lp_number: lp.lp_number,
                  quantity: lp.quantity,
                  uom: lp.uom,
                  batch_number: lp.batch_number,
                  expiry_date: lp.expiry_date,
                  qa_status: lp.qa_status,
                  location_name: lp.location?.name || 'N/A',
                  product_name: lp.product?.name || 'Unknown',
                  product_code: lp.product?.code || 'N/A',
                }}
                splitQty={splitQtyNum}
                destinationLocationName={destinationLocationName}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={splitMutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSplit}
            disabled={!canSplit}
          >
            {splitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" role="status" />
                Splitting...
              </>
            ) : (
              <>
                <Scissors className="mr-2 h-4 w-4" />
                Split License Plate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
