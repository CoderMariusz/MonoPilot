/**
 * Receive from TO Modal - Story 5.33
 * Modal for receiving goods from Transfer Order
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
import { PackageCheck, ArrowRight, MapPin } from 'lucide-react'
import type { SourceDocument, ReceiveFromTOResult } from '@/lib/types/receiving'

interface ReceiveFromTOModalProps {
  open: boolean
  to: SourceDocument | null
  onClose: () => void
  onSuccess: (result: ReceiveFromTOResult) => void
}

interface Location {
  id: string
  code: string
  name: string
  type: string
}

export function ReceiveFromTOModal({
  open,
  to,
  onClose,
  onSuccess,
}: ReceiveFromTOModalProps) {
  const { toast } = useToast()

  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(false)

  useEffect(() => {
    if (open && to) {
      fetchLocations()
      setSelectedLocationId('')
      setNotes('')
    }
  }, [open, to])

  const fetchLocations = async () => {
    if (!to) return

    try {
      setLoadingLocations(true)
      const response = await fetch(`/api/settings/locations?warehouse_id=${to.warehouse_id}`)
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
      setLoadingLocations(false)
    }
  }

  const handleReceive = async () => {
    if (!to || !selectedLocationId) return

    try {
      setLoading(true)

      const response = await fetch('/api/warehouse/receiving/from-to', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_id: to.id,
          location_id: selectedLocationId,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive Transfer Order')
      }

      toast({
        title: 'Success',
        description: `Transfer Order ${to.doc_number} received successfully. ${data.lp_count} license plates moved.`,
      })

      onSuccess(data)
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to receive Transfer Order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!to) return null

  const totalItems = to.lines.length
  const totalLPs = to.lines.reduce((sum, line) => sum + line.expected_qty, 0)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Receive from Transfer Order
          </DialogTitle>
          <DialogDescription>
            Receive goods from TO {to.doc_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* TO Info */}
          <div className="grid grid-cols-2 gap-4 rounded-md border p-4 bg-muted/30">
            <div>
              <p className="text-sm text-muted-foreground">From Warehouse</p>
              <p className="font-medium">{to.from_warehouse_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">To Warehouse</p>
              <p className="font-medium">{to.warehouse_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="font-medium">{totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{to.status}</p>
            </div>
          </div>

          {/* Items to be moved */}
          <div>
            <h4 className="font-medium mb-2">Items to Receive</h4>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Product</th>
                    <th className="text-right p-2 font-medium">Qty</th>
                    <th className="text-left p-2 font-medium">UOM</th>
                  </tr>
                </thead>
                <tbody>
                  {to.lines.map((line) => (
                    <tr key={line.id} className="border-t">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{line.product_code}</p>
                          <p className="text-xs text-muted-foreground">{line.product_name}</p>
                        </div>
                      </td>
                      <td className="text-right p-2">{line.expected_qty}</td>
                      <td className="p-2">{line.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: License plates already exist - this operation will update their location
            </p>
          </div>

          {/* Destination Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Destination Location <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              disabled={loadingLocations}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder={loadingLocations ? 'Loading...' : 'Select location'} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {location.code} - {location.name}
                      </span>
                      <span className="text-xs text-muted-foreground">({location.type})</span>
                    </div>
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
              placeholder="Add notes about this receipt..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReceive} disabled={loading || !selectedLocationId}>
            {loading ? 'Receiving...' : `Receive ${totalLPs} License Plates`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
