/**
 * Add Consumption Modal Component (Story 04.6a)
 * Two-step modal for LP selection and quantity entry
 *
 * Wireframe: PROD-003 - Add Consumption Modal (Step 1 & Step 2)
 *
 * Steps:
 * 1. Select License Plate (search/scan, validate)
 * 2. Confirm Quantity (enter qty, preview changes)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Check,
  AlertCircle,
  AlertTriangle,
  Lock,
  Loader2,
  Info,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LPSearchInput } from './LPSearchInput'
import { useAvailableLPs, useRecordConsumption } from '@/lib/hooks/use-consumption'
import { validateLP } from '@/lib/services/consumption-service'
import type { ConsumptionMaterial, AvailableLP } from '@/lib/services/consumption-service'

interface AddConsumptionModalProps {
  woId: string
  material: ConsumptionMaterial | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 1 | 2

export function AddConsumptionModal({
  woId,
  material,
  open,
  onClose,
  onSuccess,
}: AddConsumptionModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedLP, setSelectedLP] = useState<AvailableLP | null>(null)
  const [consumeQty, setConsumeQty] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationSuccess, setValidationSuccess] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const { toast } = useToast()
  const recordConsumption = useRecordConsumption()

  // Fetch available LPs for this material
  const { data: availableLPs = [], isLoading: isLoadingLPs } = useAvailableLPs(
    woId,
    material?.product_id || '',
    material?.uom || '',
    undefined,
    { enabled: open && !!material }
  )

  // Reset state when modal opens/closes or material changes
  useEffect(() => {
    if (open && material) {
      setStep(1)
      setSelectedLP(null)
      setConsumeQty('')
      setValidationError(null)
      setValidationSuccess(false)
    }
  }, [open, material])

  // Pre-fill quantity for whole LP materials
  useEffect(() => {
    if (selectedLP && material?.consume_whole_lp) {
      setConsumeQty(String(selectedLP.current_qty))
    }
  }, [selectedLP, material?.consume_whole_lp])

  // Validate LP selection
  const handleLPSelect = useCallback(async (lp: AvailableLP) => {
    if (!material) return

    setIsValidating(true)
    setValidationError(null)
    setValidationSuccess(false)

    const result = await validateLP(woId, lp.lp_number, material)

    setIsValidating(false)

    if (!result.valid) {
      setValidationError(result.error || 'LP validation failed')
      setSelectedLP(null)
      return
    }

    setSelectedLP(lp)
    setValidationSuccess(true)

    // Auto-advance to step 2 after brief delay
    setTimeout(() => {
      setStep(2)
      // Pre-fill with remaining quantity or LP qty, whichever is smaller
      const remaining = material.required_qty - material.consumed_qty
      const suggestedQty = Math.min(lp.current_qty, remaining > 0 ? remaining : lp.current_qty)
      if (material.consume_whole_lp) {
        setConsumeQty(String(lp.current_qty))
      } else {
        setConsumeQty(String(suggestedQty))
      }
    }, 300)
  }, [woId, material])

  // Validate quantity input
  const validateQuantity = useCallback((): string | null => {
    if (!selectedLP || !material) return 'No LP selected'

    const qty = parseFloat(consumeQty)
    if (isNaN(qty) || qty <= 0) {
      return 'Quantity must be greater than zero'
    }

    if (qty > selectedLP.current_qty) {
      return `Insufficient quantity: LP has ${selectedLP.current_qty} ${material.uom}, requested ${qty}`
    }

    if (material.consume_whole_lp && qty !== selectedLP.current_qty) {
      return `Full LP consumption required. LP quantity is ${selectedLP.current_qty} ${material.uom}`
    }

    return null
  }, [consumeQty, selectedLP, material])

  // Handle consumption submission
  const handleConfirmConsumption = async () => {
    const error = validateQuantity()
    if (error) {
      setValidationError(error)
      return
    }

    if (!material || !selectedLP) return

    try {
      await recordConsumption.mutateAsync({
        woId,
        request: {
          wo_material_id: material.id,
          lp_id: selectedLP.id,
          consume_qty: parseFloat(consumeQty),
        },
      })

      toast({
        title: 'Consumption recorded',
        description: `Consumed ${consumeQty} ${material.uom} from ${selectedLP.lp_number}`,
      })

      onSuccess()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record consumption'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // Calculate summary values
  const currentConsumed = material?.consumed_qty || 0
  const required = material?.required_qty || 0
  const remaining = Math.max(0, required - currentConsumed)
  const qtyNum = parseFloat(consumeQty) || 0
  const newConsumed = currentConsumed + qtyNum
  const newRemaining = required - newConsumed
  const newProgress = required > 0 ? Math.round((newConsumed / required) * 100) : 0
  const isOverConsuming = newConsumed > required
  const lpRemainingAfter = selectedLP ? selectedLP.current_qty - qtyNum : 0
  const lpFullyConsumed = lpRemainingAfter <= 0

  if (!material) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="consumption-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Consume Material: {material.material_name}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: LP Selection */}
        {step === 1 && (
          <div className="space-y-4">
            {/* WO Context Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Work Order Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Material: </span>
                  <span className="font-medium">{material.material_name}</span>
                  {material.product?.product_type && (
                    <Badge variant="outline" className="ml-2">
                      {material.product.product_type}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-muted-foreground">Required: </span>
                    <span className="font-mono">
                      {required.toLocaleString()} {material.uom}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Consumed: </span>
                    <span className="font-mono">
                      {currentConsumed.toLocaleString()} {material.uom} (
                      {required > 0 ? Math.round((currentConsumed / required) * 100) : 0}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining: </span>
                    <span className="font-mono">
                      {remaining.toLocaleString()} {material.uom}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Consumption Mode: </span>
                  {material.consume_whole_lp ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Lock className="h-4 w-4" />
                      Full LP Required (1:1)
                    </span>
                  ) : (
                    <span className="text-green-600">
                      Partial (can consume any qty from LP)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <hr />

            <div className="space-y-2">
              <h4 className="font-medium">Step 1 of 2: Select License Plate</h4>
              <p className="text-sm text-muted-foreground">
                Scan or type LP number to select
              </p>
            </div>

            {/* LP Search */}
            <div className="space-y-2">
              <Label htmlFor="lp-search">LP Barcode or Search *</Label>
              <LPSearchInput
                onSelect={handleLPSelect}
                availableLPs={availableLPs}
                isLoading={isLoadingLPs || isValidating}
                placeholder="Scan or type LP number..."
              />
            </div>

            {/* Validation Status */}
            {isValidating && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating LP...
              </div>
            )}

            {validationError && (
              <Alert variant="destructive" data-testid="lp-validation-error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {validationSuccess && selectedLP && (
              <Alert className="border-green-200 bg-green-50" data-testid="lp-validation-success">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">LP Validated</AlertTitle>
                <AlertDescription className="text-green-700">
                  {selectedLP.lp_number} - {selectedLP.current_qty} {material.uom} available
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex gap-2 text-blue-800 text-sm">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Quick Tips:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Scan LP barcode with scanner or camera</li>
                      <li>Type LP number (e.g., LP-2025-08877)</li>
                      <li>System will validate LP availability and product match</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available LPs Table */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Or Select from Available LPs:</h5>
              {isLoadingLPs ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : availableLPs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No available LPs found for this material
                </p>
              ) : (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">LP Number</th>
                        <th className="px-3 py-2 text-left">Batch</th>
                        <th className="px-3 py-2 text-right">Qty Available</th>
                        <th className="px-3 py-2 text-left">Expiry</th>
                        <th className="px-3 py-2 text-left">Location</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableLPs.map((lp) => (
                        <tr key={lp.id} className="border-t hover:bg-muted/50">
                          <td className="px-3 py-2 font-mono">{lp.lp_number}</td>
                          <td className="px-3 py-2">{lp.batch_number || '-'}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {lp.current_qty.toLocaleString()} {lp.uom}
                          </td>
                          <td className="px-3 py-2">
                            {lp.expiry_date
                              ? new Date(lp.expiry_date).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-3 py-2">{lp.location_name || '-'}</td>
                          <td className="px-3 py-2">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleLPSelect(lp)}
                              disabled={isValidating}
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Showing {availableLPs.length} available LPs (filtered by{' '}
                {material.product?.code || material.product_id}, status=available)
              </p>
            </div>

            {/* Cancel Button */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Quantity Confirmation */}
        {step === 2 && selectedLP && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 2 of 2: Confirm Quantity</h4>
            </div>

            {/* LP Validated Card */}
            <Card className="border-green-200 bg-green-50" data-testid="lp-details">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-800">
                  <Check className="h-4 w-4" />
                  License Plate Validated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-green-900">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-green-700">LP Number: </span>
                    <span className="font-mono font-medium">{selectedLP.lp_number}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Product: </span>
                    <span className="font-medium">
                      {material.product?.code || 'N/A'} - {material.material_name}
                    </span>
                    <Check className="inline h-3 w-3 ml-1 text-green-600" />
                  </div>
                  <div data-testid="lp-batch-number">
                    <span className="text-green-700">Batch: </span>
                    <span className="font-mono">{selectedLP.batch_number || 'N/A'}</span>
                  </div>
                  <div data-testid="lp-expiry-date">
                    <span className="text-green-700">Expiry: </span>
                    <span>
                      {selectedLP.expiry_date
                        ? new Date(selectedLP.expiry_date).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700">Location: </span>
                    <span>{selectedLP.location_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-green-700">UoM: </span>
                    <span>{selectedLP.uom}</span>
                    <Check className="inline h-3 w-3 ml-1 text-green-600" />
                  </div>
                </div>
                <div className="pt-2 border-t border-green-200">
                  <span className="text-green-700">Qty Available: </span>
                  <span className="font-mono font-semibold" data-testid="lp-available-qty">
                    {selectedLP.current_qty.toLocaleString()} {selectedLP.uom}
                  </span>
                </div>
              </CardContent>
            </Card>

            <hr />

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="consume-qty">Quantity to Consume *</Label>
              <div className="flex gap-2">
                <Input
                  id="consume-qty"
                  type="number"
                  value={consumeQty}
                  onChange={(e) => {
                    setConsumeQty(e.target.value)
                    setValidationError(null)
                  }}
                  readOnly={material.consume_whole_lp}
                  className="font-mono"
                  data-testid="consume-qty-input"
                  min={0}
                  max={selectedLP.current_qty}
                  step="0.001"
                />
                <div className="flex items-center px-3 bg-muted rounded-md text-sm">
                  {material.uom}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Max: {selectedLP.current_qty} {material.uom} (LP available qty) |
                Remaining needed: {remaining} {material.uom}
              </p>

              {material.consume_whole_lp ? (
                <Alert className="border-amber-200 bg-amber-50">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">
                    Full LP Consumption Required
                  </AlertTitle>
                  <AlertDescription className="text-amber-700">
                    This material requires full LP consumption. LP quantity is{' '}
                    {selectedLP.current_qty} {material.uom}. The quantity field is pre-filled
                    and cannot be changed.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConsumeQty(String(selectedLP.current_qty))}
                >
                  Use All Available ({selectedLP.current_qty} {material.uom})
                </Button>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive" data-testid="qty-validation-error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Over-consumption Warning */}
            {isOverConsuming && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Over-Consumption Warning</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  This consumption will exceed the required quantity. Total consumed will
                  be {newConsumed.toLocaleString()} {material.uom} (
                  {Math.round(((newConsumed - required) / required) * 100)}% over).
                </AlertDescription>
              </Alert>
            )}

            {/* Consumption Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Consumption Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <span className="text-muted-foreground">Material: </span>
                    <span className="font-medium">{material.material_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">From LP: </span>
                    <span className="font-mono">{selectedLP.lp_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Qty to Consume: </span>
                    <span className="font-mono font-semibold">
                      {qtyNum.toLocaleString()} {material.uom}
                    </span>
                  </div>
                </div>

                <hr />

                <div>
                  <p className="font-medium text-muted-foreground mb-2">
                    Material Status After Consumption:
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 ml-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Required: </span>
                      <span className="font-mono">
                        {required.toLocaleString()} {material.uom}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Consumed: </span>
                      <span className="font-mono">
                        {currentConsumed.toLocaleString()} {material.uom} &rarr;{' '}
                        <span className={isOverConsuming ? 'text-yellow-600' : 'text-green-600'}>
                          {newConsumed.toLocaleString()} {material.uom}
                        </span>{' '}
                        ({newProgress}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remaining: </span>
                      <span className="font-mono">
                        {remaining.toLocaleString()} {material.uom} &rarr;{' '}
                        <span className={newRemaining < 0 ? 'text-yellow-600' : ''}>
                          {Math.abs(newRemaining).toLocaleString()} {material.uom}
                          {newRemaining < 0 && ' over'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <hr />

                <div>
                  <p className="font-medium text-muted-foreground mb-2">
                    LP Status After Consumption:
                  </p>
                  <div className="ml-4 text-sm">
                    <span className="font-mono">{selectedLP.lp_number}: </span>
                    <span className="font-mono">
                      {selectedLP.current_qty.toLocaleString()} {material.uom} &rarr;{' '}
                      <span className={lpFullyConsumed ? 'text-amber-600' : ''}>
                        {Math.max(0, lpRemainingAfter).toLocaleString()} {material.uom}
                      </span>
                    </span>
                    {lpFullyConsumed && (
                      <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">
                        CONSUMED
                      </Badge>
                    )}
                  </div>
                  {lpFullyConsumed && (
                    <p className="text-xs text-muted-foreground ml-4 mt-1">
                      Status will change: Available &rarr; Consumed
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1)
                  setSelectedLP(null)
                  setValidationError(null)
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleConfirmConsumption}
                disabled={recordConsumption.isPending || !consumeQty}
                className="bg-green-600 hover:bg-green-700"
              >
                {recordConsumption.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirm Consumption
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
