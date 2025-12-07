/**
 * Move LP Modal - Story 5.14
 * Move license plate to new location
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MapPin, ArrowRight } from 'lucide-react'

interface MoveLPModalProps {
  open: boolean
  lpId: string
  lpNumber: string
  currentLocationId?: string
  currentLocationCode?: string
  currentWarehouseId?: string
  onClose: () => void
  onSuccess: () => void
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

export function MoveLPModal({
  open,
  lpId,
  lpNumber,
  currentLocationId,
  currentLocationCode,
  currentWarehouseId,
  onClose,
  onSuccess,
}: MoveLPModalProps) {
  const { toast } = useToast()

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(currentWarehouseId || '')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (open) {
      fetchWarehouses()
      setSelectedLocationId('')
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

    if (!selectedLocationId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a destination location',
        variant: 'destructive',
      })
      return
    }

    if (selectedLocationId === currentLocationId) {
      toast({
        title: 'Validation Error',
        description: 'Destination location must be different from current location',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: selectedLocationId,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to move license plate')
      }

      const result = await response.json()

      toast({
        title: 'Success',
        description: `License plate moved to ${result.location?.code || 'new location'}`,
      })

      setSelectedWarehouseId('')
      setSelectedLocationId('')
      setNotes('')
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to move license plate',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move License Plate</DialogTitle>
          <DialogDescription>
            Move {lpNumber} to a new location
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {locations.length === 0 && selectedWarehouseId && !loadingData && (
              <p className="text-xs text-muted-foreground">No locations available in this warehouse</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for move, special instructions, etc."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedLocationId}>
              {loading ? 'Moving...' : 'Move License Plate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
