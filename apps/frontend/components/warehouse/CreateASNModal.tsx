/**
 * Create ASN Modal Component
 * Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
 * AC-5.8.2: Create ASN from PO with auto-filled items
 */

'use client'

import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface PurchaseOrder {
  id: string
  po_number: string
  suppliers: {
    code: string
    name: string
  }
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface POLine {
  id: string
  product_id: string
  quantity: number
  uom: string
  products: {
    code: string
    name: string
  }
}

interface ASNItemData {
  po_line_id: string
  product_id: string
  product_code: string
  product_name: string
  expected_qty: number
  uom: string
  supplier_batch_number: string
  manufacture_date: string
  expiry_date: string
}

interface CreateASNModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  preSelectedPOId?: string
}

export function CreateASNModal({ open, onClose, onSuccess, preSelectedPOId }: CreateASNModalProps) {
  const [formData, setFormData] = useState({
    po_id: preSelectedPOId || '',
    warehouse_id: '',
    expected_arrival_date: new Date().toISOString().split('T')[0],
    carrier: '',
    tracking_number: '',
    notes: '',
  })
  const [items, setItems] = useState<ASNItemData[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingPOs, setLoadingPOs] = useState(true)
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const { toast } = useToast()

  // Fetch confirmed+ POs
  useEffect(() => {
    const fetchPOs = async () => {
      try {
        setLoadingPOs(true)
        const response = await fetch('/api/planning/purchase-orders?status=confirmed,approved,partially_received')

        if (!response.ok) {
          throw new Error('Failed to fetch purchase orders')
        }

        const data = await response.json()
        setPurchaseOrders(data.purchase_orders || [])
      } catch (error) {
        console.error('Error fetching POs:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load purchase orders',
          variant: 'destructive',
        })
      } finally {
        setLoadingPOs(false)
      }
    }

    if (open) {
      fetchPOs()
    }
  }, [open])

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true)
        const response = await fetch('/api/settings/warehouses?is_active=true')

        if (!response.ok) {
          throw new Error('Failed to fetch warehouses')
        }

        const data = await response.json()
        setWarehouses(data.warehouses || [])
      } catch (error) {
        console.error('Error fetching warehouses:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load warehouses',
          variant: 'destructive',
        })
      } finally {
        setLoadingWarehouses(false)
      }
    }

    if (open) {
      fetchWarehouses()
    }
  }, [open])

  // Fetch PO lines when PO selected
  useEffect(() => {
    const fetchPOLines = async () => {
      if (!formData.po_id) {
        setItems([])
        return
      }

      try {
        setLoadingItems(true)
        const response = await fetch(`/api/planning/purchase-orders/${formData.po_id}/lines`)

        if (!response.ok) {
          throw new Error('Failed to fetch PO lines')
        }

        const data = await response.json()
        const lines: POLine[] = data.lines || []

        // Map to ASN items
        const asnItems: ASNItemData[] = lines.map((line) => ({
          po_line_id: line.id,
          product_id: line.product_id,
          product_code: line.products.code,
          product_name: line.products.name,
          expected_qty: line.quantity,
          uom: line.uom,
          supplier_batch_number: '',
          manufacture_date: '',
          expiry_date: '',
        }))

        setItems(asnItems)
      } catch (error) {
        console.error('Error fetching PO lines:', error)
        toast({
          title: 'Error',
          description: 'Failed to load PO lines',
          variant: 'destructive',
        })
      } finally {
        setLoadingItems(false)
      }
    }

    fetchPOLines()
  }, [formData.po_id])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleItemChange = (index: number, field: keyof ASNItemData, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.po_id) {
      newErrors.po_id = 'Purchase Order is required'
    }

    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Warehouse is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        po_id: formData.po_id,
        warehouse_id: formData.warehouse_id,
        expected_arrival_date: formData.expected_arrival_date || null,
        carrier: formData.carrier || null,
        tracking_number: formData.tracking_number || null,
        notes: formData.notes || null,
        items: items.map((item) => ({
          po_line_id: item.po_line_id,
          product_id: item.product_id,
          expected_qty: item.expected_qty,
          uom: item.uom,
          supplier_batch_number: item.supplier_batch_number || null,
          manufacture_date: item.manufacture_date || null,
          expiry_date: item.expiry_date || null,
        })),
      }

      const response = await fetch('/api/warehouse/asns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ASN')
      }

      toast({
        title: 'Success',
        description: 'ASN created successfully',
      })

      onSuccess()
    } catch (error) {
      console.error('Error creating ASN:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ASN',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPO = purchaseOrders.find((po) => po.id === formData.po_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Advance Shipping Notice</DialogTitle>
          <DialogDescription>
            Create a new ASN from a confirmed purchase order. ASN number will be auto-generated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PO Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po_id">
                Purchase Order <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.po_id}
                onValueChange={(value) => handleChange('po_id', value)}
                disabled={loadingPOs || !!preSelectedPOId}
              >
                <SelectTrigger id="po_id">
                  <SelectValue placeholder={loadingPOs ? 'Loading...' : 'Select PO'} />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.po_number} - {po.suppliers.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.po_id && <p className="text-sm text-red-500">{errors.po_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_id">
                Warehouse <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => handleChange('warehouse_id', value)}
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
              {errors.warehouse_id && <p className="text-sm text-red-500">{errors.warehouse_id}</p>}
            </div>
          </div>

          {/* Shipment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_arrival_date">Expected Arrival Date</Label>
              <Input
                id="expected_arrival_date"
                type="date"
                value={formData.expected_arrival_date}
                onChange={(e) => handleChange('expected_arrival_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                value={formData.carrier}
                onChange={(e) => handleChange('carrier', e.target.value)}
                placeholder="e.g., UPS, FedEx"
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking_number">Tracking Number</Label>
            <Input
              id="tracking_number"
              value={formData.tracking_number}
              onChange={(e) => handleChange('tracking_number', e.target.value)}
              placeholder="Tracking number"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              maxLength={1000}
            />
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Expected Items</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-20">UoM</TableHead>
                        <TableHead className="w-32">Batch #</TableHead>
                        <TableHead className="w-32">Mfg Date</TableHead>
                        <TableHead className="w-32">Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.po_line_id}>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{item.product_code}</div>
                              <div className="text-muted-foreground">{item.product_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.001"
                              value={item.expected_qty}
                              onChange={(e) =>
                                handleItemChange(index, 'expected_qty', parseFloat(e.target.value))
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>{item.uom}</TableCell>
                          <TableCell>
                            <Input
                              value={item.supplier_batch_number}
                              onChange={(e) =>
                                handleItemChange(index, 'supplier_batch_number', e.target.value)
                              }
                              placeholder="Batch"
                              maxLength={100}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={item.manufacture_date}
                              onChange={(e) =>
                                handleItemChange(index, 'manufacture_date', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={item.expiry_date}
                              onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {loadingItems && (
            <div className="text-center py-4 text-muted-foreground">Loading items...</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || loadingItems}>
              {submitting ? 'Creating...' : 'Create ASN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
