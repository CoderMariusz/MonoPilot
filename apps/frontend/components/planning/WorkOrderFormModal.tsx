/**
 * Work Order Form Modal Component
 * Story 3.10: Work Order CRUD
 * AC-3.10.2: Create/Edit WO with product and production line selection
 * AC-3.10.3: Auto-generate WO number
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

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface Machine {
  id: string
  code: string
  name: string
}

interface WorkOrder {
  id: string
  product_id: string
  planned_quantity: number
  planned_start_date: string | null
  planned_end_date: string | null
  production_line_id: string | null
  status: string
  notes?: string | null
}

interface WorkOrderFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  workOrder?: WorkOrder | null
}

export function WorkOrderFormModal({
  open,
  onClose,
  onSuccess,
  workOrder,
}: WorkOrderFormModalProps) {
  const [formData, setFormData] = useState({
    product_id: workOrder?.product_id || '',
    planned_quantity: workOrder?.planned_quantity?.toString() || '1',
    planned_start_date: workOrder?.planned_start_date
      ? new Date(workOrder.planned_start_date).toISOString().split('T')[0]
      : '',
    planned_end_date: workOrder?.planned_end_date
      ? new Date(workOrder.planned_end_date).toISOString().split('T')[0]
      : '',
    production_line_id: workOrder?.production_line_id || '',
    status: workOrder?.status || 'draft',
    notes: workOrder?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingMachines, setLoadingMachines] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!workOrder

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?limit=1000')

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        setProducts(data.data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load products.',
          variant: 'destructive',
        })
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [open])

  // Fetch production lines (machines)
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoadingMachines(true)
        const response = await fetch('/api/settings/machines?is_active=true&limit=1000')

        if (!response.ok) {
          throw new Error('Failed to fetch production lines')
        }

        const data = await response.json()
        setMachines(data.machines || [])
      } catch (error) {
        console.error('Error fetching production lines:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load production lines.',
          variant: 'destructive',
        })
        setMachines([])
      } finally {
        setLoadingMachines(false)
      }
    }

    if (open) {
      fetchMachines()
    }
  }, [open])

  // Handle input change
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

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required'
    }

    const quantity = parseFloat(formData.planned_quantity)
    if (isNaN(quantity) || quantity <= 0) {
      newErrors.planned_quantity = 'Quantity must be greater than 0'
    }

    // Validate date range
    if (formData.planned_start_date && formData.planned_end_date) {
      const startDate = new Date(formData.planned_start_date)
      const endDate = new Date(formData.planned_end_date)

      if (endDate < startDate) {
        newErrors.planned_end_date = 'End date must be on or after start date'
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
        ? `/api/planning/work-orders/${workOrder.id}`
        : '/api/planning/work-orders'

      const method = isEditMode ? 'PUT' : 'POST'

      const payload: any = {
        planned_quantity: parseFloat(formData.planned_quantity),
        planned_start_date: formData.planned_start_date || null,
        planned_end_date: formData.planned_end_date || null,
        production_line_id: formData.production_line_id || null,
        notes: formData.notes || null,
      }

      if (isEditMode) {
        payload.status = formData.status
      } else {
        payload.product_id = formData.product_id
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} work order`)
      }

      toast({
        title: 'Success',
        description: `Work order ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error submitting work order:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit work order',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Work Order' : 'Create Work Order'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update work order details'
              : 'Create a new work order. WO number will be auto-generated.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="product_id">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => handleChange('product_id', value)}
                disabled={loadingProducts}
              >
                <SelectTrigger id="product_id">
                  <SelectValue placeholder={loadingProducts ? 'Loading...' : 'Select product'} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.code} - {product.name} ({product.uom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_id && <p className="text-sm text-red-500">{errors.product_id}</p>}
              {selectedProduct && (
                <p className="text-sm text-gray-500">UoM: {selectedProduct.uom}</p>
              )}
            </div>
          )}

          {/* Planned Quantity */}
          <div className="space-y-2">
            <Label htmlFor="planned_quantity">
              Planned Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="planned_quantity"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.planned_quantity}
              onChange={(e) => handleChange('planned_quantity', e.target.value)}
            />
            {errors.planned_quantity && (
              <p className="text-sm text-red-500">{errors.planned_quantity}</p>
            )}
          </div>

          {/* Planned Start Date */}
          <div className="space-y-2">
            <Label htmlFor="planned_start_date">Planned Start Date</Label>
            <Input
              id="planned_start_date"
              type="date"
              value={formData.planned_start_date}
              onChange={(e) => handleChange('planned_start_date', e.target.value)}
            />
          </div>

          {/* Planned End Date */}
          <div className="space-y-2">
            <Label htmlFor="planned_end_date">Planned End Date</Label>
            <Input
              id="planned_end_date"
              type="date"
              value={formData.planned_end_date}
              onChange={(e) => handleChange('planned_end_date', e.target.value)}
              min={formData.planned_start_date}
            />
            {errors.planned_end_date && (
              <p className="text-sm text-red-500">{errors.planned_end_date}</p>
            )}
          </div>

          {/* Production Line Selection */}
          <div className="space-y-2">
            <Label htmlFor="production_line_id">Production Line (Optional)</Label>
            <Select
              value={formData.production_line_id}
              onValueChange={(value) => handleChange('production_line_id', value)}
              disabled={loadingMachines}
            >
              <SelectTrigger id="production_line_id">
                <SelectValue
                  placeholder={loadingMachines ? 'Loading...' : 'Select production line'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.code} - {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status (Edit Mode Only) */}
          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
