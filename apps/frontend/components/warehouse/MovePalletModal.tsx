/**
 * Move Pallet Modal Component
 * Story 5.21: Pallet Move
 * Modal for moving pallet to a new location
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle } from 'lucide-react'

interface MovePalletModalProps {
  open: boolean
  palletId: string
  currentLocationId?: string
  warehouseId: string
  lpCount: number
  onClose: () => void
  onSuccess: () => void
}

interface Location {
  id: string
  code: string
  name: string
  warehouse_id: string
}

export function MovePalletModal({
  open,
  palletId,
  currentLocationId,
  warehouseId,
  lpCount,
  onClose,
  onSuccess,
}: MovePalletModalProps) {
  const { toast } = useToast()

  const [locations, setLocations] = useState<Location[]>([])
  const [locationId, setLocationId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && warehouseId) {
      fetchLocations()
      setLocationId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, warehouseId])

  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/settings/locations?warehouse_id=${warehouseId}&limit=500`)
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

    if (!locationId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a location',
        variant: 'destructive',
      })
      return
    }

    if (locationId === currentLocationId) {
      toast({
        title: 'Validation Error',
        description: 'Pallet is already at this location',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/warehouse/pallets/${palletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to move pallet')
      }

      toast({
        title: 'Success',
        description: 'Pallet moved successfully',
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move pallet',
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
          <DialogTitle>Move Pallet</DialogTitle>
          <DialogDescription>Select a new location for this pallet</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning */}
          {lpCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  This will move {lpCount} license plate{lpCount !== 1 ? 's' : ''}
                </p>
                <p className="text-yellow-700">All LPs on this pallet will be moved together</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              New Location <span className="text-red-500">*</span>
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((loc) => loc.id !== currentLocationId)
                  .map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Moving...' : 'Move Pallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
