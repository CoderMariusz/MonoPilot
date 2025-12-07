/**
 * Create GRN Modal Component
 * Epic 5 Batch 5A-3 - Story 5.11: GRN with LP Creation
 * AC-5.11.2: Create GRN from ASN
 */

'use client'

import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface ASN {
  id: string
  asn_number: string
  expected_arrival_date: string
  purchase_orders: {
    po_number: string
  }
  suppliers: {
    name: string
  }
  asn_items: { count: number }[]
}

interface Warehouse {
  id: string
  code: string
  name: string
  default_receiving_location_id: string | null
}

interface Location {
  id: string
  code: string
  name: string | null
}

interface CreateGRNModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateGRNModal({ open, onClose, onSuccess }: CreateGRNModalProps) {
  const [formData, setFormData] = useState({
    asn_id: '',
    warehouse_id: '',
    receiving_location_id: '',
    notes: '',
  })
  const [asns, setASNs] = useState<ASN[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingASNs, setLoadingASNs] = useState(true)
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch ASNs with submitted status
  useEffect(() => {
    if (!open) return

    const fetchASNs = async () => {
      try {
        setLoadingASNs(true)
        const response = await fetch('/api/warehouse/asns?status=submitted')
        if (response.ok) {
          const data = await response.json()
          setASNs(data.asns || [])
        }
      } catch (error) {
        console.error('Error fetching ASNs:', error)
      } finally {
        setLoadingASNs(false)
      }
    }
    fetchASNs()
  }, [open])

  // Fetch warehouses
  useEffect(() => {
    if (!open) return

    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true)
        const response = await fetch('/api/settings/warehouses?is_active=true')
        if (response.ok) {
          const data = await response.json()
          setWarehouses(data.warehouses || [])
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error)
      } finally {
        setLoadingWarehouses(false)
      }
    }
    fetchWarehouses()
  }, [open])

  // Fetch locations when warehouse is selected
  useEffect(() => {
    if (!formData.warehouse_id) {
      setLocations([])
      return
    }

    const fetchLocations = async () => {
      try {
        setLoadingLocations(true)
        const response = await fetch(
          `/api/settings/locations?warehouse_id=${formData.warehouse_id}&type=receiving&is_active=true`
        )
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations || [])

          // Auto-select default receiving location if available
          const warehouse = warehouses.find(w => w.id === formData.warehouse_id)
          if (warehouse?.default_receiving_location_id) {
            setFormData(prev => ({
              ...prev,
              receiving_location_id: warehouse.default_receiving_location_id || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setLoadingLocations(false)
      }
    }
    fetchLocations()
  }, [formData.warehouse_id, warehouses])

  // When ASN is selected, auto-fill warehouse
  const handleASNChange = (asnId: string) => {
    const asn = asns.find(a => a.id === asnId)
    setSelectedASN(asn || null)
    setFormData(prev => ({
      ...prev,
      asn_id: asnId,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.asn_id || !formData.warehouse_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select ASN and warehouse',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/warehouse/grns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create GRN')
      }

      toast({
        title: 'Success',
        description: `GRN ${data.grn.grn_number} created successfully`,
      })

      // Navigate to GRN detail page
      router.push(`/warehouse/receiving/${data.grn.id}`)
      onSuccess()
    } catch (error) {
      console.error('Error creating GRN:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create GRN',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      asn_id: '',
      warehouse_id: '',
      receiving_location_id: '',
      notes: '',
    })
    setSelectedASN(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Goods Receipt Note</DialogTitle>
          <DialogDescription>
            Create a GRN from a submitted ASN to receive goods
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ASN Selection */}
          <div className="space-y-2">
            <Label htmlFor="asn_id">Select ASN *</Label>
            <Select
              value={formData.asn_id}
              onValueChange={handleASNChange}
              disabled={loadingASNs}
            >
              <SelectTrigger id="asn_id">
                <SelectValue placeholder={loadingASNs ? 'Loading ASNs...' : 'Select ASN'} />
              </SelectTrigger>
              <SelectContent>
                {asns.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No submitted ASNs available
                  </div>
                ) : (
                  asns.map((asn) => (
                    <SelectItem key={asn.id} value={asn.id}>
                      {asn.asn_number} - {asn.purchase_orders.po_number} - {asn.suppliers.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* ASN Details Card */}
          {selectedASN && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ASN Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">PO Number:</div>
                  <div className="font-medium">{selectedASN.purchase_orders.po_number}</div>

                  <div className="text-muted-foreground">Supplier:</div>
                  <div>{selectedASN.suppliers.name}</div>

                  <div className="text-muted-foreground">Expected Arrival:</div>
                  <div>
                    {selectedASN.expected_arrival_date
                      ? format(new Date(selectedASN.expected_arrival_date), 'MMM dd, yyyy')
                      : '-'}
                  </div>

                  <div className="text-muted-foreground">Items:</div>
                  <div>{selectedASN.asn_items?.[0]?.count || 0}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="warehouse_id">Warehouse *</Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
              disabled={loadingWarehouses}
            >
              <SelectTrigger id="warehouse_id">
                <SelectValue placeholder={loadingWarehouses ? 'Loading...' : 'Select warehouse'} />
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

          {/* Receiving Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="receiving_location_id">Receiving Location (Optional)</Label>
            <Select
              value={formData.receiving_location_id}
              onValueChange={(value) => setFormData({ ...formData, receiving_location_id: value })}
              disabled={!formData.warehouse_id || loadingLocations}
            >
              <SelectTrigger id="receiving_location_id">
                <SelectValue
                  placeholder={
                    !formData.warehouse_id
                      ? 'Select warehouse first'
                      : loadingLocations
                      ? 'Loading locations...'
                      : 'Select receiving location'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.code} {loc.name ? `- ${loc.name}` : ''}
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes for this GRN..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !formData.asn_id || !formData.warehouse_id}>
              {submitting ? 'Creating...' : 'Create GRN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
