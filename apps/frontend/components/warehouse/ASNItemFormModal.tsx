/**
 * ASN Item Form Modal Component
 * Epic 5 Batch 5A-3 - Story 5.9: ASN Item Management
 * AC-5.9.1: Add/edit ASN items with product selection
 * AC-5.9.2: Validate quantity > 0, dates logical
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface POLine {
  id: string
  product_id: string
  quantity: number
  products: {
    code: string
    name: string
    uom: string
  }
}

interface ASNItem {
  id: string
  po_line_id: string
  product_id: string
  expected_qty: number
  uom: string
  supplier_batch_number: string | null
  manufacture_date: string | null
  expiry_date: string | null
}

interface ASNItemFormModalProps {
  open: boolean
  asnId: string
  poId: string
  onClose: () => void
  onSuccess: () => void
  item?: ASNItem | null // undefined = create, ASNItem = edit
}

export function ASNItemFormModal({
  open,
  asnId,
  poId,
  onClose,
  onSuccess,
  item,
}: ASNItemFormModalProps) {
  const [formData, setFormData] = useState({
    po_line_id: item?.po_line_id || '',
    product_id: item?.product_id || '',
    expected_qty: item?.expected_qty?.toString() || '1',
    uom: item?.uom || '',
    supplier_batch_number: item?.supplier_batch_number || '',
    manufacture_date: item?.manufacture_date || '',
    expiry_date: item?.expiry_date || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [poLines, setPOLines] = useState<POLine[]>([])
  const [loadingPOLines, setLoadingPOLines] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!item

  // Fetch PO lines
  useEffect(() => {
    const fetchPOLines = async () => {
      if (!poId) return

      try {
        setLoadingPOLines(true)
        const response = await fetch(`/api/planning/purchase-orders/${poId}/lines`)

        if (!response.ok) {
          throw new Error('Failed to fetch PO lines')
        }

        const data = await response.json()
        setPOLines(data.lines || [])
      } catch (error) {
        console.error('Error fetching PO lines:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load PO lines',
          variant: 'destructive',
        })
        setPOLines([])
      } finally {
        setLoadingPOLines(false)
      }
    }

    if (open) {
      fetchPOLines()
    }
  }, [open, poId])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && item) {
      setFormData({
        po_line_id: item.po_line_id,
        product_id: item.product_id,
        expected_qty: item.expected_qty.toString(),
        uom: item.uom,
        supplier_batch_number: item.supplier_batch_number || '',
        manufacture_date: item.manufacture_date || '',
        expiry_date: item.expiry_date || '',
      })
    } else if (!open) {
      setFormData({
        po_line_id: '',
        product_id: '',
        expected_qty: '1',
        uom: '',
        supplier_batch_number: '',
        manufacture_date: '',
        expiry_date: '',
      })
      setErrors({})
    }
  }, [open, item])

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

  // Handle PO Line selection - auto-fill product and UoM
  const handlePOLineChange = (poLineId: string) => {
    const selectedLine = poLines.find((l) => l.id === poLineId)
    if (selectedLine) {
      setFormData((prev) => ({
        ...prev,
        po_line_id: poLineId,
        product_id: selectedLine.product_id,
        uom: selectedLine.products.uom,
      }))
    } else {
      setFormData((prev) => ({ ...prev, po_line_id: poLineId }))
    }

    if (errors.po_line_id) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.po_line_id
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.po_line_id) {
      newErrors.po_line_id = 'PO Line is required'
    }

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required'
    }

    const quantity = parseFloat(formData.expected_qty)
    if (isNaN(quantity) || quantity <= 0) {
      newErrors.expected_qty = 'Quantity must be greater than 0'
    }

    if (!formData.uom) {
      newErrors.uom = 'Unit of measure is required'
    }

    // Date validation: manufacture_date < expiry_date
    if (formData.manufacture_date && formData.expiry_date) {
      const mfgDate = new Date(formData.manufacture_date)
      const expDate = new Date(formData.expiry_date)
      if (mfgDate >= expDate) {
        newErrors.expiry_date = 'Expiry date must be after manufacture date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        items: [
          {
            id: item?.id, // Include for edit mode
            po_line_id: formData.po_line_id,
            product_id: formData.product_id,
            expected_qty: parseFloat(formData.expected_qty),
            uom: formData.uom,
            supplier_batch_number: formData.supplier_batch_number || null,
            manufacture_date: formData.manufacture_date || null,
            expiry_date: formData.expiry_date || null,
          },
        ],
      }

      const response = await fetch(`/api/warehouse/asns/${asnId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save item')
      }

      toast({
        title: 'Success',
        description: `ASN item ${isEditMode ? 'updated' : 'added'} successfully`,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving ASN item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save item',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Get selected PO line
  const selectedPOLine = poLines.find((l) => l.id === formData.po_line_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit ASN Item' : 'Add ASN Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update item details' : 'Add a new item to this ASN'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* PO Line Selection */}
          <div className="space-y-2">
            <Label htmlFor="po_line_id">
              PO Line <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.po_line_id}
              onValueChange={handlePOLineChange}
              disabled={loadingPOLines || isEditMode}
            >
              <SelectTrigger id="po_line_id" className={errors.po_line_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select PO line..." />
              </SelectTrigger>
              <SelectContent>
                {poLines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.products.code} - {line.products.name} ({line.quantity} {line.products.uom})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.po_line_id && <p className="text-sm text-red-500">{errors.po_line_id}</p>}
          </div>

          {/* Product Display (read-only) */}
          {selectedPOLine && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Code</Label>
                <Input value={selectedPOLine.products.code} disabled />
              </div>
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={selectedPOLine.products.name} disabled />
              </div>
            </div>
          )}

          {/* Expected Quantity & UoM */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_qty">
                Expected Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expected_qty"
                type="number"
                step="0.001"
                value={formData.expected_qty}
                onChange={(e) => handleChange('expected_qty', e.target.value)}
                className={errors.expected_qty ? 'border-red-500' : ''}
              />
              {errors.expected_qty && <p className="text-sm text-red-500">{errors.expected_qty}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">
                Unit of Measure <span className="text-red-500">*</span>
              </Label>
              <Input id="uom" value={formData.uom} disabled />
            </div>
          </div>

          {/* Supplier Batch Number */}
          <div className="space-y-2">
            <Label htmlFor="supplier_batch_number">Supplier Batch Number</Label>
            <Input
              id="supplier_batch_number"
              value={formData.supplier_batch_number}
              onChange={(e) => handleChange('supplier_batch_number', e.target.value)}
              placeholder="e.g., LOT-2024-001"
              maxLength={100}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacture_date">Manufacture Date</Label>
              <Input
                id="manufacture_date"
                type="date"
                value={formData.manufacture_date}
                onChange={(e) => handleChange('manufacture_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
                className={errors.expiry_date ? 'border-red-500' : ''}
              />
              {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingPOLines}>
            {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
