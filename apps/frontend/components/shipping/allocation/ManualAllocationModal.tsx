/**
 * Manual Allocation Modal Component
 * Story 07.7: Inventory Allocation
 *
 * Modal for editing allocation quantity for a specific LP.
 * Used when user needs to specify a custom quantity different
 * from the full LP availability.
 *
 * Features:
 * - Quantity input with validation
 * - Shows available quantity limit
 * - Shows current line allocation progress
 * - Keyboard accessible
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
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Package, AlertTriangle } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface ManualAllocationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (quantity: number) => void
  lpNumber: string
  lpId: string
  availableQuantity: number
  currentQuantity: number
  lineProductName: string
  lineRequiredQty: number
  lineAllocatedQty: number
}

// =============================================================================
// Component
// =============================================================================

export function ManualAllocationModal({
  open,
  onClose,
  onConfirm,
  lpNumber,
  lpId,
  availableQuantity,
  currentQuantity,
  lineProductName,
  lineRequiredQty,
  lineAllocatedQty,
}: ManualAllocationModalProps) {
  const [quantity, setQuantity] = useState(currentQuantity.toString())
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setQuantity(currentQuantity.toString())
      setError(null)
    }
  }, [open, currentQuantity])

  // Calculate remaining needed for line
  const remainingNeeded = lineRequiredQty - lineAllocatedQty

  // Validate quantity
  const validateQuantity = (value: string): boolean => {
    const numValue = parseInt(value, 10)

    if (isNaN(numValue)) {
      setError('Please enter a valid number')
      return false
    }

    if (numValue <= 0) {
      setError('Quantity must be greater than 0')
      return false
    }

    if (numValue > availableQuantity) {
      setError(`Cannot exceed available quantity (${availableQuantity})`)
      return false
    }

    setError(null)
    return true
  }

  const handleQuantityChange = (value: string) => {
    setQuantity(value)
    if (value) {
      validateQuantity(value)
    } else {
      setError(null)
    }
  }

  const handleConfirm = () => {
    if (!validateQuantity(quantity)) return

    const numValue = parseInt(quantity, 10)
    onConfirm(numValue)
    onClose()
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  // Progress calculation
  const numQuantity = parseInt(quantity, 10) || 0
  const projectedTotal = lineAllocatedQty - currentQuantity + numQuantity
  const progressPct = Math.min(100, (projectedTotal / lineRequiredQty) * 100)

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md" aria-modal="true">
        <DialogHeader>
          <DialogTitle>Edit Allocation Quantity</DialogTitle>
          <DialogDescription>
            Set the quantity to allocate from {lpNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* LP Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Package className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-sm">{lpNumber}</p>
              <p className="text-xs text-gray-500">
                Available: {availableQuantity} units
              </p>
            </div>
          </div>

          {/* Line Info */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{lineProductName}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Allocated: {projectedTotal} / {lineRequiredQty}
              </span>
              <span>{progressPct.toFixed(0)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="allocation-qty">Quantity to Allocate</Label>
            <Input
              id="allocation-qty"
              type="number"
              min={1}
              max={availableQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Enter a value between 1 and {availableQuantity}
            </p>
          </div>

          {/* Shortcut hint */}
          <p className="text-xs text-gray-400">
            Press Enter to confirm
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!!error || !quantity}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManualAllocationModal
