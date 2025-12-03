/**
 * BOM Item Form Modal Component
 * Story: 2.26 BOM Items Operation Assignment
 * AC-2.26.4: Create item with operation_seq, component_id, is_output
 * AC-2.26.5: Update item
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  code: string
  name: string
  uom: string
  type: string
}

interface BOMItem {
  id: string
  bom_id: string
  component_id: string
  component?: Product
  operation_seq: number
  is_output: boolean
  quantity: number
  uom: string
  scrap_percent: number
  sequence: number
  line_ids?: string[] | null
  consume_whole_lp: boolean
  notes?: string | null
}

interface BOMItemFormModalProps {
  bomId: string
  item?: BOMItem | null
  onClose: () => void
  onSuccess: () => void
}

export function BOMItemFormModal({ bomId, item, onClose, onSuccess }: BOMItemFormModalProps) {
  const [formData, setFormData] = useState({
    component_id: item?.component_id || '',
    operation_seq: item?.operation_seq?.toString() || '1',
    is_output: item?.is_output || false,
    quantity: item?.quantity?.toString() || '',
    uom: item?.uom || '',
    scrap_percent: item?.scrap_percent?.toString() || '0',
    sequence: item?.sequence?.toString() || '',
    consume_whole_lp: item?.consume_whole_lp || false,
    notes: item?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!item

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?limit=1000&status=active')

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        setProducts(data.data || data.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load products',
          variant: 'destructive',
        })
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  // Auto-fill UoM when product is selected
  useEffect(() => {
    if (formData.component_id && !isEditMode) {
      const selectedProduct = products.find((p) => p.id === formData.component_id)
      if (selectedProduct && !formData.uom) {
        setFormData((prev) => ({ ...prev, uom: selectedProduct.uom }))
      }
    }
  }, [formData.component_id, products, isEditMode])

  // Handle input change
  const handleChange = (field: string, value: string | boolean) => {
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

    if (!isEditMode && !formData.component_id) {
      newErrors.component_id = 'Component is required'
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    if (!formData.uom) {
      newErrors.uom = 'Unit of measure is required'
    }

    const operationSeq = parseInt(formData.operation_seq)
    if (isNaN(operationSeq) || operationSeq < 1) {
      newErrors.operation_seq = 'Operation sequence must be a positive integer'
    }

    const scrapPercent = parseFloat(formData.scrap_percent)
    if (isNaN(scrapPercent) || scrapPercent < 0 || scrapPercent > 100) {
      newErrors.scrap_percent = 'Scrap percent must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        quantity: parseFloat(formData.quantity),
        uom: formData.uom,
        scrap_percent: parseFloat(formData.scrap_percent) || 0,
        operation_seq: parseInt(formData.operation_seq) || 1,
        is_output: formData.is_output,
        consume_whole_lp: formData.consume_whole_lp,
        notes: formData.notes || null,
      }

      if (!isEditMode) {
        payload.component_id = formData.component_id
        if (formData.sequence) {
          payload.sequence = parseInt(formData.sequence)
        }
      }

      const url = isEditMode
        ? `/api/technical/boms/${bomId}/items/${item.id}`
        : `/api/technical/boms/${bomId}/items`

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API error response:', error)
        throw new Error(error.error || error.message || `Failed to ${isEditMode ? 'update' : 'add'} item`)
      }

      toast({
        title: 'Success',
        description: `Item ${isEditMode ? 'updated' : 'added'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error saving item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save item',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit BOM Item' : 'Add BOM Item'}
          </h2>
          {isEditMode && item?.component && (
            <p className="text-sm text-gray-500 mt-1">
              Component: {item.component.code} - {item.component.name}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Component Selection (Create only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="component_id">
                Component Product <span className="text-red-500">*</span>
              </Label>
              {loadingProducts ? (
                <div className="p-3 bg-gray-50 border rounded-md">
                  <p className="text-sm text-gray-600">Loading products...</p>
                </div>
              ) : (
                <Select
                  value={formData.component_id}
                  onValueChange={(value) => handleChange('component_id', value)}
                >
                  <SelectTrigger className={errors.component_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select component product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.type}
                          </Badge>
                          <span>{product.code}</span>
                          <span className="text-gray-500">- {product.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.component_id && <p className="text-sm text-red-500">{errors.component_id}</p>}
            </div>
          )}

          {/* Operation Sequence */}
          <div className="space-y-2">
            <Label htmlFor="operation_seq">
              Operation Sequence <span className="text-red-500">*</span>
            </Label>
            <Input
              id="operation_seq"
              type="number"
              min="1"
              value={formData.operation_seq}
              onChange={(e) => handleChange('operation_seq', e.target.value)}
              placeholder="1"
              className={errors.operation_seq ? 'border-red-500' : ''}
            />
            {errors.operation_seq && <p className="text-sm text-red-500">{errors.operation_seq}</p>}
            <p className="text-xs text-gray-500">
              Routing operation this item is consumed/produced at
            </p>
          </div>

          {/* Quantity and UoM */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="e.g., 10.5"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">
                Unit of Measure <span className="text-red-500">*</span>
              </Label>
              <Input
                id="uom"
                value={formData.uom}
                onChange={(e) => handleChange('uom', e.target.value)}
                placeholder="e.g., kg, pcs, L"
                className={errors.uom ? 'border-red-500' : ''}
              />
              {errors.uom && <p className="text-sm text-red-500">{errors.uom}</p>}
            </div>
          </div>

          {/* Scrap Percent and Sequence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scrap_percent">Scrap %</Label>
              <Input
                id="scrap_percent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.scrap_percent}
                onChange={(e) => handleChange('scrap_percent', e.target.value)}
                placeholder="0"
                className={errors.scrap_percent ? 'border-red-500' : ''}
              />
              {errors.scrap_percent && <p className="text-sm text-red-500">{errors.scrap_percent}</p>}
              <p className="text-xs text-gray-500">Expected waste percentage</p>
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="sequence">Display Sequence</Label>
                <Input
                  id="sequence"
                  type="number"
                  min="1"
                  value={formData.sequence}
                  onChange={(e) => handleChange('sequence', e.target.value)}
                  placeholder="Auto-assigned"
                />
                <p className="text-xs text-gray-500">Leave blank to auto-assign</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_output"
                checked={formData.is_output}
                onCheckedChange={(checked) => handleChange('is_output', checked === true)}
              />
              <Label htmlFor="is_output" className="text-sm font-normal cursor-pointer">
                Output Item (by-product or main output)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consume_whole_lp"
                checked={formData.consume_whole_lp}
                onCheckedChange={(checked) => handleChange('consume_whole_lp', checked === true)}
              />
              <Label htmlFor="consume_whole_lp" className="text-sm font-normal cursor-pointer">
                Consume Whole License Plate (LP)
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
