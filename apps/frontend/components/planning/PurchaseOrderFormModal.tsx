/**
 * Purchase Order Form Modal Component
 * Story 3.1: Purchase Order CRUD
 * AC-3.1.2: Create/Edit PO with auto-generated PO number
 * AC-3.1.4: Currency inheritance from supplier
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
import { useToast } from '@/hooks/use-toast'
import { ZodError } from 'zod'

interface Supplier {
  id: string
  code: string
  name: string
  currency: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface PurchaseOrder {
  id: string
  supplier_id: string
  warehouse_id: string
  expected_delivery_date: string
  payment_terms?: string
  shipping_method?: string
  notes?: string
}

interface PurchaseOrderFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  purchaseOrder?: PurchaseOrder | null // undefined = create, PO = edit
}

export function PurchaseOrderFormModal({
  open,
  onClose,
  onSuccess,
  purchaseOrder,
}: PurchaseOrderFormModalProps) {
  const [formData, setFormData] = useState({
    supplier_id: purchaseOrder?.supplier_id || '',
    warehouse_id: purchaseOrder?.warehouse_id || '',
    expected_delivery_date: purchaseOrder?.expected_delivery_date
      ? new Date(purchaseOrder.expected_delivery_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    payment_terms: purchaseOrder?.payment_terms || '',
    shipping_method: purchaseOrder?.shipping_method || '',
    notes: purchaseOrder?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!purchaseOrder

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true)
        const response = await fetch('/api/planning/suppliers?is_active=true')

        if (!response.ok) {
          throw new Error('Failed to fetch suppliers')
        }

        const data = await response.json()
        setSuppliers(data.suppliers || [])
      } catch (error) {
        console.error('Error fetching suppliers:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load suppliers. Supplier selection will be unavailable.',
          variant: 'destructive',
        })
        setSuppliers([])
      } finally {
        setLoadingSuppliers(false)
      }
    }

    if (open) {
      fetchSuppliers()
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
          description: 'Failed to load warehouses. Warehouse selection will be unavailable.',
          variant: 'destructive',
        })
        setWarehouses([])
      } finally {
        setLoadingWarehouses(false)
      }
    }

    if (open) {
      fetchWarehouses()
    }
  }, [open])

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required'
    }

    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Warehouse is required'
    }

    if (!formData.expected_delivery_date) {
      newErrors.expected_delivery_date = 'Expected delivery date is required'
    } else {
      const selectedDate = new Date(formData.expected_delivery_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        newErrors.expected_delivery_date = 'Expected delivery date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/planning/purchase-orders/${purchaseOrder.id}`
        : '/api/planning/purchase-orders'

      const method = isEditMode ? 'PUT' : 'POST'

      // Prepare payload
      const payload: any = {
        expected_delivery_date: formData.expected_delivery_date,
        payment_terms: formData.payment_terms || null,
        shipping_method: formData.shipping_method || null,
        notes: formData.notes || null,
      }

      // Only include supplier_id and warehouse_id for create
      if (!isEditMode) {
        payload.supplier_id = formData.supplier_id
        payload.warehouse_id = formData.warehouse_id
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
      }

      toast({
        title: 'Success',
        description: `Purchase order ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error submitting purchase order:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit purchase order',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Get selected supplier details
  const selectedSupplier = suppliers.find((s) => s.id === formData.supplier_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update purchase order details'
              : 'Create a new purchase order. PO number will be auto-generated.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">
              Supplier <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => handleChange('supplier_id', value)}
              disabled={isEditMode || loadingSuppliers}
            >
              <SelectTrigger id="supplier_id">
                <SelectValue placeholder={loadingSuppliers ? 'Loading...' : 'Select supplier'} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.code} - {supplier.name} ({supplier.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier_id && (
              <p className="text-sm text-red-500">{errors.supplier_id}</p>
            )}
            {selectedSupplier && (
              <p className="text-sm text-gray-500">
                Currency: {selectedSupplier.currency}
              </p>
            )}
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="warehouse_id">
              Warehouse <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => handleChange('warehouse_id', value)}
              disabled={isEditMode || loadingWarehouses}
            >
              <SelectTrigger id="warehouse_id">
                <SelectValue placeholder={loadingWarehouses ? 'Loading...' : 'Select warehouse'} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse_id && (
              <p className="text-sm text-red-500">{errors.warehouse_id}</p>
            )}
          </div>

          {/* Expected Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="expected_delivery_date">
              Expected Delivery Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expected_delivery_date"
              type="date"
              value={formData.expected_delivery_date}
              onChange={(e) => handleChange('expected_delivery_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.expected_delivery_date && (
              <p className="text-sm text-red-500">{errors.expected_delivery_date}</p>
            )}
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => handleChange('payment_terms', e.target.value)}
              placeholder="e.g., Net 30"
              maxLength={100}
            />
          </div>

          {/* Shipping Method */}
          <div className="space-y-2">
            <Label htmlFor="shipping_method">Shipping Method</Label>
            <Input
              id="shipping_method"
              value={formData.shipping_method}
              onChange={(e) => handleChange('shipping_method', e.target.value)}
              placeholder="e.g., Ground, Express"
              maxLength={100}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
