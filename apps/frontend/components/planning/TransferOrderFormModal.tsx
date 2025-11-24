/**
 * Transfer Order Form Modal Component
 * Story 3.6: Transfer Order CRUD
 * AC-3.6.2: Create/Edit TO with warehouse selection
 * AC-3.6.3: Auto-generate TO number
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

interface Warehouse {
  id: string
  code: string
  name: string
}

interface TransferOrder {
  id: string
  from_warehouse_id: string
  to_warehouse_id: string
  planned_ship_date: string
  planned_receive_date: string
  notes?: string | null
}

interface TransferOrderFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  transferOrder?: TransferOrder | null // undefined = create, TO = edit
}

export function TransferOrderFormModal({
  open,
  onClose,
  onSuccess,
  transferOrder,
}: TransferOrderFormModalProps) {
  const [formData, setFormData] = useState({
    from_warehouse_id: transferOrder?.from_warehouse_id || '',
    to_warehouse_id: transferOrder?.to_warehouse_id || '',
    planned_ship_date: transferOrder?.planned_ship_date
      ? new Date(transferOrder.planned_ship_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    planned_receive_date: transferOrder?.planned_receive_date
      ? new Date(transferOrder.planned_receive_date).toISOString().split('T')[0]
      : '',
    notes: transferOrder?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!transferOrder

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

  // Auto-calculate planned_receive_date when planned_ship_date changes
  useEffect(() => {
    if (formData.planned_ship_date && !transferOrder) {
      const shipDate = new Date(formData.planned_ship_date)
      // Default: add 1 day for receive date
      const receiveDate = new Date(shipDate)
      receiveDate.setDate(receiveDate.getDate() + 1)

      if (!formData.planned_receive_date) {
        setFormData((prev) => ({
          ...prev,
          planned_receive_date: receiveDate.toISOString().split('T')[0],
        }))
      }
    }
  }, [formData.planned_ship_date, transferOrder])

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

    if (!formData.from_warehouse_id) {
      newErrors.from_warehouse_id = 'From warehouse is required'
    }

    if (!formData.to_warehouse_id) {
      newErrors.to_warehouse_id = 'To warehouse is required'
    }

    if (formData.from_warehouse_id && formData.to_warehouse_id) {
      if (formData.from_warehouse_id === formData.to_warehouse_id) {
        newErrors.to_warehouse_id = 'From and To warehouses must be different'
      }
    }

    if (!formData.planned_ship_date) {
      newErrors.planned_ship_date = 'Planned ship date is required'
    }

    if (!formData.planned_receive_date) {
      newErrors.planned_receive_date = 'Planned receive date is required'
    }

    // Validate receive date >= ship date
    if (formData.planned_ship_date && formData.planned_receive_date) {
      const shipDate = new Date(formData.planned_ship_date)
      const receiveDate = new Date(formData.planned_receive_date)

      if (receiveDate < shipDate) {
        newErrors.planned_receive_date = 'Receive date must be on or after ship date'
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
        ? `/api/planning/transfer-orders/${transferOrder.id}`
        : '/api/planning/transfer-orders'

      const method = isEditMode ? 'PUT' : 'POST'

      // Prepare payload
      const payload: any = {
        planned_ship_date: formData.planned_ship_date,
        planned_receive_date: formData.planned_receive_date,
        notes: formData.notes || null,
      }

      // Only include warehouse IDs for create
      if (!isEditMode) {
        payload.from_warehouse_id = formData.from_warehouse_id
        payload.to_warehouse_id = formData.to_warehouse_id
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} transfer order`)
      }

      toast({
        title: 'Success',
        description: `Transfer order ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error submitting transfer order:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit transfer order',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Transfer Order' : 'Create Transfer Order'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update transfer order details'
              : 'Create a new transfer order. TO number will be auto-generated.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="from_warehouse_id">
              From Warehouse <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.from_warehouse_id}
              onValueChange={(value) => handleChange('from_warehouse_id', value)}
              disabled={isEditMode || loadingWarehouses}
            >
              <SelectTrigger id="from_warehouse_id">
                <SelectValue
                  placeholder={loadingWarehouses ? 'Loading...' : 'Select from warehouse'}
                />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.from_warehouse_id && (
              <p className="text-sm text-red-500">{errors.from_warehouse_id}</p>
            )}
          </div>

          {/* To Warehouse Selection */}
          <div className="space-y-2">
            <Label htmlFor="to_warehouse_id">
              To Warehouse <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.to_warehouse_id}
              onValueChange={(value) => handleChange('to_warehouse_id', value)}
              disabled={isEditMode || loadingWarehouses}
            >
              <SelectTrigger id="to_warehouse_id">
                <SelectValue
                  placeholder={loadingWarehouses ? 'Loading...' : 'Select to warehouse'}
                />
              </SelectTrigger>
              <SelectContent>
                {warehouses
                  .filter((wh) => wh.id !== formData.from_warehouse_id)
                  .map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} - {warehouse.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.to_warehouse_id && (
              <p className="text-sm text-red-500">{errors.to_warehouse_id}</p>
            )}
          </div>

          {/* Planned Ship Date */}
          <div className="space-y-2">
            <Label htmlFor="planned_ship_date">
              Planned Ship Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="planned_ship_date"
              type="date"
              value={formData.planned_ship_date}
              onChange={(e) => handleChange('planned_ship_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.planned_ship_date && (
              <p className="text-sm text-red-500">{errors.planned_ship_date}</p>
            )}
          </div>

          {/* Planned Receive Date */}
          <div className="space-y-2">
            <Label htmlFor="planned_receive_date">
              Planned Receive Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="planned_receive_date"
              type="date"
              value={formData.planned_receive_date}
              onChange={(e) => handleChange('planned_receive_date', e.target.value)}
              min={formData.planned_ship_date}
            />
            {errors.planned_receive_date && (
              <p className="text-sm text-red-500">{errors.planned_receive_date}</p>
            )}
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
