/**
 * By-Product Registration Dialog
 * Story 4.14: By-Product Registration
 * Sequential dialog for registering by-products after main output
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
import { Loader2, Package, SkipForward, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ByProduct {
  id: string
  productId: string
  productCode: string
  productName: string
  yieldPercent: number
  expectedQty: number
  registeredQty: number
  uom: string
}

interface ByProductRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  woNumber: string
  mainOutputId: string
  mainOutputQty: number
  requireQaStatus: boolean
  onComplete: () => void
}

export function ByProductRegistrationDialog({
  open,
  onOpenChange,
  woId,
  woNumber,
  mainOutputId,
  mainOutputQty,
  requireQaStatus,
  onComplete,
}: ByProductRegistrationDialogProps) {
  const [byProducts, setByProducts] = useState<ByProduct[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [qty, setQty] = useState('')
  const [qaStatus, setQaStatus] = useState<string>('passed')
  const [notes, setNotes] = useState('')
  const [registered, setRegistered] = useState<string[]>([])
  const { toast } = useToast()

  // Fetch by-products when dialog opens
  useEffect(() => {
    if (open) {
      fetchByProducts()
      setCurrentIndex(0)
      setRegistered([])
      resetForm()
    }
  }, [open, woId])

  const fetchByProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/by-products`)
      if (response.ok) {
        const { data } = await response.json()
        // Recalculate expected qty based on main output
        const withExpected = data.map((bp: ByProduct) => ({
          ...bp,
          expectedQty: mainOutputQty * bp.yieldPercent / 100,
        }))
        setByProducts(withExpected)
      }
    } catch (err) {
      console.error('Failed to fetch by-products:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setQty('')
    setQaStatus('passed')
    setNotes('')
  }

  const currentByProduct = byProducts[currentIndex]
  const hasMoreByProducts = currentIndex < byProducts.length - 1
  const allDone = currentIndex >= byProducts.length

  // Auto-fill expected qty
  useEffect(() => {
    if (currentByProduct && !qty) {
      setQty(currentByProduct.expectedQty.toFixed(2))
    }
  }, [currentByProduct])

  const handleRegister = async () => {
    const qtyNum = parseFloat(qty)
    if (!qtyNum || qtyNum <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/by-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          by_product_id: currentByProduct.id,
          qty: qtyNum,
          qa_status: qaStatus,
          notes: notes || undefined,
          main_output_id: mainOutputId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to register by-product',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: `${currentByProduct.productName}: ${result.data.output.lpNumber}`,
      })

      setRegistered([...registered, currentByProduct.id])
      moveToNext()
    } catch (error) {
      console.error('Register error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    moveToNext()
  }

  const handleSkipAll = () => {
    // Skip all remaining and close
    onComplete()
    onOpenChange(false)
  }

  const moveToNext = () => {
    resetForm()
    if (hasMoreByProducts) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // All processed
      onComplete()
      onOpenChange(false)
    }
  }

  // If no by-products, close dialog
  if (!loading && byProducts.length === 0) {
    if (open) {
      onComplete()
      onOpenChange(false)
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            By-Product Registration
          </DialogTitle>
          <DialogDescription>
            {woNumber} - {byProducts.length > 0 && `${currentIndex + 1} of ${byProducts.length}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : allDone ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">All by-products processed!</p>
          </div>
        ) : currentByProduct ? (
          <div className="space-y-4">
            {/* By-product info */}
            <div className="p-3 bg-amber-50 rounded-lg space-y-1 text-sm">
              <div className="font-medium text-amber-800">
                {currentByProduct.productName}
              </div>
              <div className="text-amber-600 font-mono text-xs">
                {currentByProduct.productCode}
              </div>
            </div>

            {/* Expected qty info (AC-4.14.7) */}
            <Alert>
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Expected (yield {currentByProduct.yieldPercent}%):</span>
                  <span className="font-mono font-medium">
                    {currentByProduct.expectedQty.toFixed(2)} {currentByProduct.uom}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Based on main output: {mainOutputQty} × {currentByProduct.yieldPercent}%
                </p>
              </AlertDescription>
            </Alert>

            {/* Quantity input (AC-4.14.3) */}
            <div className="space-y-2">
              <Label htmlFor="byProductQty">Actual Quantity *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="byProductQty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter actual quantity"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="font-mono"
                />
                <span className="text-gray-500 whitespace-nowrap">{currentByProduct.uom}</span>
              </div>
            </div>

            {/* QA Status */}
            {requireQaStatus && (
              <div className="space-y-2">
                <Label htmlFor="byProductQaStatus">QA Status</Label>
                <Select value={qaStatus} onValueChange={setQaStatus}>
                  <SelectTrigger id="byProductQaStatus">
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
              <Label htmlFor="byProductNotes">Notes</Label>
              <Textarea
                id="byProductNotes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Progress indicator */}
            <div className="flex gap-1">
              {byProducts.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < currentIndex
                      ? registered.includes(byProducts[i].id)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                      : i === currentIndex
                      ? 'bg-amber-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex gap-2 sm:gap-2">
          {!loading && !allDone && (
            <>
              {/* Skip All button (AC-4.14.6) */}
              <Button
                variant="ghost"
                onClick={handleSkipAll}
                disabled={submitting}
                className="text-gray-500"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip All
              </Button>

              {/* Skip This button (AC-4.14.6) */}
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={submitting}
              >
                Skip This
              </Button>

              {/* Register button */}
              <Button
                onClick={handleRegister}
                disabled={submitting || !qty}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Register
              </Button>
            </>
          )}

          {allDone && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
