/**
 * LP Merge Modal Component (Story 05.18)
 * Main modal for LP merge workflow
 *
 * Features:
 * - Display selected LPs in table
 * - Validate merge eligibility
 * - Show validation results
 * - Location picker for target
 * - Confirmation before merge
 * - Success/error handling
 *
 * Per AC-15 to AC-20
 */

'use client'

import { useState, useEffect } from 'react'
import { Loader2, GitMerge, X } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'

import { LPMergeSelectedList } from './LPMergeSelectedList'
import { LPMergeValidation } from './LPMergeValidation'
import { LPMergeSummary } from './LPMergeSummary'
import { LPMergeLocationPicker } from './LPMergeLocationPicker'
import { LPMergeConfirmDialog } from './LPMergeConfirmDialog'

// Types
interface SelectedLP {
  id: string
  lp_number: string
  product_id: string
  product?: { name: string; code: string }
  quantity: number
  uom: string
  batch_number: string | null
  expiry_date: string | null
  qa_status: string
  status: string
  location_id: string
  warehouse_id: string
}

interface Location {
  id: string
  name: string
  full_path?: string
}

interface ValidationSummary {
  productName: string
  productCode: string
  totalQuantity: number
  uom: string
  batchNumber: string | null
  expiryDate: string | null
  qaStatus: string
  lpCount: number
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  summary?: ValidationSummary | null
}

interface MergeResult {
  newLpId: string
  newLpNumber: string
  mergedQuantity: number
  sourceLpIds: string[]
}

interface LPMergeModalProps {
  open: boolean
  selectedLPs: SelectedLP[]
  onClose: () => void
  onSuccess: (result: MergeResult) => void
}

export function LPMergeModal({
  open,
  selectedLPs,
  onClose,
  onSuccess,
}: LPMergeModalProps) {
  const { toast } = useToast()

  // State
  const [isValidating, setIsValidating] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get warehouse ID from first selected LP
  const warehouseId = selectedLPs[0]?.warehouse_id || ''

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setValidationResult(null)
      setSelectedLocationId(null)
      setError(null)
      setShowConfirmDialog(false)
      // Fetch locations for the warehouse
      fetchLocations()
    }
  }, [open, warehouseId])

  // Fetch locations for the warehouse
  const fetchLocations = async () => {
    if (!warehouseId) return

    try {
      const response = await fetch(`/api/settings/locations?warehouse_id=${warehouseId}`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.data || [])
      }
    } catch (err) {
      // Silent fail - locations are optional
      setLocations([])
    }
  }

  // Handle validation
  const handleValidate = async () => {
    setIsValidating(true)
    setError(null)

    try {
      const sourceLpIds = selectedLPs.map((lp) => lp.id)

      const response = await fetch('/api/warehouse/license-plates/validate-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceLpIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed')
      }

      setValidationResult(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed'
      setError(message)
      toast({
        title: 'Validation Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Handle merge
  const handleMerge = async () => {
    setIsMerging(true)
    setError(null)

    try {
      const sourceLpIds = selectedLPs.map((lp) => lp.id)

      const response = await fetch('/api/warehouse/license-plates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLpIds,
          targetLocationId: selectedLocationId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Merge failed')
      }

      toast({
        title: 'LPs merged successfully',
        description: `New LP: ${data.newLpNumber}`,
      })

      onSuccess(data)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Merge failed'
      setError(message)
      toast({
        title: 'Merge failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsMerging(false)
      setShowConfirmDialog(false)
    }
  }

  // Can proceed to merge?
  const canMerge = validationResult?.valid && !isValidating && !isMerging

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Merge License Plates
            </DialogTitle>
            <DialogDescription>
              Combine {selectedLPs.length} LPs into a single consolidated LP.
              Validation is required before merge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selected LPs Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected License Plates</h3>
              <LPMergeSelectedList selectedLPs={selectedLPs} />
            </div>

            <Separator />

            {/* Validate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleValidate}
                disabled={isValidating || isMerging}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Merge'
                )}
              </Button>
            </div>

            {/* Validation Results */}
            <LPMergeValidation
              isValidating={isValidating}
              validationResult={validationResult}
            />

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Summary and Location Picker (only if validation passed) */}
            {validationResult?.valid && validationResult.summary && (
              <>
                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <LPMergeSummary summary={validationResult.summary} />

                  <div className="space-y-4">
                    <LPMergeLocationPicker
                      locations={locations}
                      selectedLocationId={selectedLocationId}
                      onLocationChange={setSelectedLocationId}
                      warehouseId={warehouseId}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              aria-label="close"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!canMerge}
            >
              {isMerging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" role="status" />
                  Merging...
                </>
              ) : (
                <>
                  <GitMerge className="mr-2 h-4 w-4" />
                  Merge LPs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <LPMergeConfirmDialog
        open={showConfirmDialog}
        lpCount={selectedLPs.length}
        onConfirm={handleMerge}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </>
  )
}
