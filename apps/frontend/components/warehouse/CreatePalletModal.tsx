/**
 * Create Pallet Modal Component
 * Story 5.19: Pallet Creation
 * Modal for creating new pallets
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

interface CreatePalletModalProps {
  open: boolean
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
}

export function CreatePalletModal({ open, onClose, onSuccess }: CreatePalletModalProps) {
  const { toast } = useToast()

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])

  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)

  // Fetch data
  useEffect(() => {
    if (open) {
      fetchWarehouses()
      fetchLocations()
      // Reset form
      setWarehouseId('')
      setLocationId('')
      setNotes('')
    }
  }, [open])

  // Filter locations by warehouse
  useEffect(() => {
    if (warehouseId) {
      setFilteredLocations(locations.filter((loc) => loc.warehouse_id === warehouseId))
    } else {
      setFilteredLocations([])
    }
    setLocationId('')
  }, [warehouseId, locations])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/settings/warehouses?limit=100')
      if (!response.ok) throw new Error('Failed to fetch warehouses')
      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load warehouses',
        variant: 'destructive',
      })
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/settings/locations?limit=500')
      if (!response.ok) throw new Error('Failed to fetch locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!warehouseId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a warehouse',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/warehouse/pallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          location_id: locationId || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create pallet')
      }

      const { data } = await response.json()

      toast({
        title: 'Success',
        description: `Pallet ${data.pallet_number} created successfully`,
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create pallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Pallet</DialogTitle>
          <DialogDescription>Create a new pallet for grouping license plates</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warehouse */}
          <div className="space-y-2">
            <Label htmlFor="warehouse">
              Warehouse <span className="text-red-500">*</span>
            </Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.code} - {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location (optional) */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Select value={locationId} onValueChange={setLocationId} disabled={!warehouseId}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {filteredLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.code} - {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Pallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
