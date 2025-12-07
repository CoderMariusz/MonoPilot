/**
 * Partial Move LP Modal - Story 5.16
 * Move partial quantity to new location (creates new LP at destination)
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { MapPin, ArrowRight, Info, Split } from 'lucide-react'

interface PartialMoveLPModalProps {
  open: boolean
  lpId: string
  lpNumber: string
  currentQty: number
  uom: string
  currentLocationId?: string
  currentLocationCode?: string
  currentWarehouseId?: string
  onClose: () => void
  onSuccess: (newLpNumber: string) => void
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Location {
  id: string
  code: string
  name: string
  warehouse_id: string
  type: string
}

export function PartialMoveLPModal({
  open,
  lpId,
  lpNumber,
  currentQty,
  uom,
  currentLocationId,
  currentLocationCode,
  currentWarehouseId,
  onClose,
  onSuccess,
}: PartialMoveLPModalProps) {
  const { toast } = useToast()

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(currentWarehouseId || '')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (open) {
      fetchWarehouses()
      setSelectedLocationId('')
      setQuantity('')
      setNotes('')
    }
  }, [open])

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchLocations(selectedWarehouseId)
    } else {
      setLocations([])
      setSelectedLocationId('')
    }
  }, [selectedWarehouseId])

  const fetchWarehouses = async () => {
    try {
      setLoadingData(true)
      const response = await fetch('/api/settings/warehouses')
      if (!response.ok) throw new Error('Failed to fetch warehouses')
      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load warehouses',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const fetchLocations = async (warehouseId: string) => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/settings/locations?warehouse_id=${warehouseId}`)
      if (!response.ok) throw new Error('Failed to fetch locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const qtyNum = parseFloat(quantity)

    if (!quantity || isNaN(qtyNum) || qtyNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      })
      return
    }

    if (qtyNum >= currentQty) {
      toast({
        title: 'Validation Error',
        description: 'Quantity must be less than current quantity. Use full move instead.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedLocationId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a destination location',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/partial-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: qtyNum,
          location_id: selectedLocationId,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to move partial quantity')
      }

      const result = await response.json()

      toast({
        title: 'Success',
        description: `New license plate ${result.new_lp_number} created at destination`,
      })

      setSelectedWarehouseId('')
      setSelectedLocationId('')
      setQuantity('')
      setNotes('')
      onSuccess(result.new_lp_number)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to move partial quantity',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const qtyNum = parseFloat(quantity)
  const remainingQty = currentQty - (isNaN(qtyNum) ? 0 : qtyNum)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Partial Move License Plate
          </DialogTitle>
          <DialogDescription>
            Move part of {lpNumber} to a new location
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will create a new license plate at the destination with the specified quantity.
              The original LP will remain at the current location with the remaining quantity.
            </AlertDescription>
          </Alert>

          {/* Current Location */}
          {currentLocationCode && (
            <div className="space-y-2">
              <Label>Current Location</Label>
              <div className="flex items-center gap-2 text-sm bg-muted rounded-md px-3 py-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{currentLocationCode}</span>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Move *</Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0.001"
                max={currentQty - 0.001}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                required
              />
              <div className="flex items-center px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">{uom}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Available: {currentQty} {uom}</div>
              {!isNaN(qtyNum) && qtyNum > 0 && qtyNum < currentQty && (
                <div className="font-medium text-foreground">
                  Remaining at current location: {remainingQty.toFixed(3)} {uom}
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="warehouse">Destination Warehouse *</Label>
            <Select
              value={selectedWarehouseId}
              onValueChange={setSelectedWarehouseId}
              required
              disabled={loadingData}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="location">Destination Location *</Label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              required
              disabled={!selectedWarehouseId || loadingData}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder={selectedWarehouseId ? "Select location" : "Select warehouse first"} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.code} - {location.name} ({location.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for partial move, special instructions, etc."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedLocationId || !quantity}>
              {loading ? 'Moving...' : 'Move Partial Quantity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
