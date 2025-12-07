/**
 * LP Split Modal Component
 * Story 5.5: LP Split
 * AC-5.5.1: Split LP into multiple new LPs
 * AC-5.5.2: Validate total equals original quantity
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  product?: {
    code: string
    name: string
    uom: string
  }
  current_qty: number
  status: string
}

interface LPSplitModalProps {
  open: boolean
  lp: LicensePlate | null
  onClose: () => void
  onSuccess: (newLPs: string[]) => void
}

export function LPSplitModal({ open, lp, onClose, onSuccess }: LPSplitModalProps) {
  const [quantities, setQuantities] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  if (!lp) return null

  const handleAddQuantity = () => {
    setQuantities([...quantities, ''])
  }

  const handleRemoveQuantity = (index: number) => {
    setQuantities(quantities.filter((_, i) => i !== index))
  }

  const handleQuantityChange = (index: number, value: string) => {
    const newQuantities = [...quantities]
    newQuantities[index] = value
    setQuantities(newQuantities)
  }

  const getTotalEntered = () => {
    return quantities.reduce((sum, qty) => {
      const parsed = parseFloat(qty)
      return sum + (isNaN(parsed) ? 0 : parsed)
    }, 0)
  }

  const isValid = () => {
    if (quantities.length < 2) return false
    if (quantities.some((q) => !q || parseFloat(q) <= 0)) return false
    const total = getTotalEntered()
    return Math.abs(total - lp.current_qty) < 0.001
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid()) {
      toast({
        title: 'Validation Error',
        description: 'Please ensure all quantities are valid and sum equals original quantity',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/warehouse/license-plates/${lp.id}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantities: quantities.map((q) => parseFloat(q)),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to split license plate')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: `Split into ${data.new_lps.length} license plates`,
      })

      onSuccess(data.new_lps)
      onClose()

      // Reset form
      setQuantities([''])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setQuantities([''])
    onClose()
  }

  const total = getTotalEntered()
  const difference = total - lp.current_qty

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Split License Plate</DialogTitle>
          <DialogDescription>
            Split {lp.lp_number} into multiple license plates
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Original LP Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original LP:</span>
              <span className="font-mono font-medium">{lp.lp_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium">{lp.product?.code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Quantity:</span>
              <span className="font-bold">
                {lp.current_qty} {lp.product?.uom}
              </span>
            </div>
          </div>

          {/* Quantity Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Split Quantities</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuantity}
                disabled={submitting}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {quantities.map((qty, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder={`Quantity ${index + 1}`}
                    value={qty}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveQuantity(index)}
                  disabled={quantities.length === 1 || submitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Validation Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Entered:</span>
              <span className={total > 0 ? 'font-bold' : ''}>
                {total.toFixed(3)} {lp.product?.uom}
              </span>
            </div>
            {total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Difference:</span>
                <span
                  className={`font-bold ${
                    Math.abs(difference) < 0.001 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {difference > 0 ? '+' : ''}
                  {difference.toFixed(3)} {lp.product?.uom}
                </span>
              </div>
            )}
          </div>

          {/* Validation Warning */}
          {total > 0 && Math.abs(difference) >= 0.001 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Total must equal {lp.current_qty} {lp.product?.uom}
              </AlertDescription>
            </Alert>
          )}

          {quantities.length < 2 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Add at least 2 quantities to split</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid() || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Split LP
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
