/**
 * AddItemDialog Component (Story 07.11)
 * Dialog for adding an LP item to a shipment box
 *
 * Features:
 * - LP search and selection
 * - Quantity input with validation
 * - Lot number display for traceability
 * - Allergen warning integration
 */

'use client'

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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { Search, Package, AlertTriangle, Loader2 } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  product_name: string
  lot_number: string
  quantity_available: number
  location_name: string
  allergens?: string[]
}

export interface ShipmentBox {
  id: string
  box_number: number
}

export interface AddItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    license_plate_id: string
    box_id: string
    quantity: number
    lot_number: string
  }) => Promise<void>
  availableLPs: AvailableLP[]
  boxes: ShipmentBox[]
  activeBoxId?: string | null
  isSubmitting?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function AddItemDialog({
  isOpen,
  onClose,
  onSubmit,
  availableLPs,
  boxes,
  activeBoxId,
  isSubmitting = false,
}: AddItemDialogProps) {
  // State
  const [selectedLP, setSelectedLP] = useState<AvailableLP | null>(null)
  const [selectedBoxId, setSelectedBoxId] = useState<string>(activeBoxId || '')
  const [quantity, setQuantity] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLP(null)
      setSelectedBoxId(activeBoxId || boxes[0]?.id || '')
      setQuantity(0)
      setSearchQuery('')
      setError(null)
    }
  }, [isOpen, activeBoxId, boxes])

  // Update quantity when LP is selected
  useEffect(() => {
    if (selectedLP) {
      setQuantity(selectedLP.quantity_available)
    }
  }, [selectedLP])

  // Filter LPs by search query
  const filteredLPs = useMemo(() => {
    if (!searchQuery) return availableLPs
    const query = searchQuery.toLowerCase()
    return availableLPs.filter(
      (lp) =>
        lp.lp_number.toLowerCase().includes(query) ||
        lp.product_name.toLowerCase().includes(query) ||
        lp.lot_number.toLowerCase().includes(query)
    )
  }, [availableLPs, searchQuery])

  // Validation
  const validate = (): boolean => {
    if (!selectedLP) {
      setError('Please select an LP')
      return false
    }
    if (!selectedBoxId) {
      setError('Please select a box')
      return false
    }
    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than 0')
      return false
    }
    if (quantity > selectedLP.quantity_available) {
      setError(`Quantity cannot exceed available (${selectedLP.quantity_available})`)
      return false
    }
    setError(null)
    return true
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validate() || !selectedLP) return

    try {
      await onSubmit({
        license_plate_id: selectedLP.id,
        box_id: selectedBoxId,
        quantity,
        lot_number: selectedLP.lot_number,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  // Handle LP selection
  const handleSelectLP = (lp: AvailableLP) => {
    setSelectedLP(lp)
    setQuantity(lp.quantity_available)
    setError(null)
  }

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && selectedLP && selectedBoxId) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg"
        aria-modal="true"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Add Item to Box</DialogTitle>
          <DialogDescription>
            Select a license plate to add to the shipment box
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Box Selection */}
          <div>
            <Label htmlFor="box-select">Target Box</Label>
            <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
              <SelectTrigger id="box-select">
                <SelectValue placeholder="Select a box" />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((box) => (
                  <SelectItem key={box.id} value={box.id}>
                    Box {box.box_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* LP Search */}
          <div>
            <Label>License Plate</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search LP, product, or lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* LP List */}
          <ScrollArea className="h-48 rounded-md border">
            <div className="p-2 space-y-2">
              {filteredLPs.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No LPs available</p>
                </div>
              ) : (
                filteredLPs.map((lp) => (
                  <button
                    key={lp.id}
                    type="button"
                    onClick={() => handleSelectLP(lp)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selectedLP?.id === lp.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{lp.lp_number}</span>
                      <Badge variant="secondary">{lp.quantity_available}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lp.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lot: {lp.lot_number} | {lp.location_name}
                    </p>
                    {lp.allergens && lp.allergens.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {lp.allergens.map((allergen) => (
                          <Badge
                            key={allergen}
                            variant="outline"
                            className="text-xs"
                          >
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Selected LP Details */}
          {selectedLP && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected LP</span>
                <Badge>{selectedLP.lp_number}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Product:</span>
                  <p className="font-medium">{selectedLP.product_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lot Number:</span>
                  <p className="font-medium font-mono">
                    {selectedLP.lot_number}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={selectedLP?.quantity_available || 1}
              value={quantity || ''}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              disabled={!selectedLP}
            />
            {selectedLP && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {selectedLP.quantity_available}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedLP || !selectedBoxId || !quantity || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Box'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddItemDialog
