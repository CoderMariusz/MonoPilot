/**
 * BOM Item Form Modal Component
 * Story: 2.7 BOM Items Management
 * Story: 2.12 Conditional BOM Items
 * Story: 2.13 By-Products
 * AC-2.7.1: Add item with quantity, UoM, scrap percent
 * AC-2.7.4: Update item
 * AC-2.12.1: Conditional flags
 * AC-2.13.1: By-product with yield
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
import { X } from 'lucide-react'

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
  product_id: string
  product: Product
  quantity: number
  uom: string
  scrap_percent: number
  sequence: number
  consume_whole_lp: boolean
  is_by_product: boolean
  yield_percent?: number
  condition_flags?: string[]
  condition_logic?: 'AND' | 'OR'
  notes?: string
}

interface BOMItemFormModalProps {
  bomId: string
  item?: BOMItem | null
  onClose: () => void
  onSuccess: () => void
}

// Common condition flags
const CONDITION_FLAG_OPTIONS = [
  'HALAL',
  'KOSHER',
  'ORGANIC',
  'VEGAN',
  'GLUTEN_FREE',
  'ALLERGEN_FREE',
  'LOW_SUGAR',
  'SEASONAL',
  'PROMOTIONAL',
]

export function BOMItemFormModal({ bomId, item, onClose, onSuccess }: BOMItemFormModalProps) {
  const [formData, setFormData] = useState({
    product_id: item?.product_id || '',
    quantity: item?.quantity?.toString() || '',
    uom: item?.uom || '',
    scrap_percent: item?.scrap_percent?.toString() || '0',
    sequence: item?.sequence?.toString() || '',
    consume_whole_lp: item?.consume_whole_lp || false,
    is_by_product: item?.is_by_product || false,
    yield_percent: item?.yield_percent?.toString() || '',
    condition_flags: item?.condition_flags || [],
    condition_logic: item?.condition_logic || 'AND',
    notes: item?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [customFlag, setCustomFlag] = useState('')
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
    if (formData.product_id && !isEditMode) {
      const selectedProduct = products.find((p) => p.id === formData.product_id)
      if (selectedProduct && !formData.uom) {
        setFormData((prev) => ({ ...prev, uom: selectedProduct.uom }))
      }
    }
  }, [formData.product_id, products, isEditMode])

  // Handle input change
  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Toggle condition flag
  const toggleFlag = (flag: string) => {
    const currentFlags = formData.condition_flags || []
    if (currentFlags.includes(flag)) {
      handleChange('condition_flags', currentFlags.filter((f) => f !== flag))
    } else {
      handleChange('condition_flags', [...currentFlags, flag])
    }
  }

  // Add custom flag
  const addCustomFlag = () => {
    if (customFlag.trim() && !formData.condition_flags.includes(customFlag.trim().toUpperCase())) {
      handleChange('condition_flags', [...formData.condition_flags, customFlag.trim().toUpperCase()])
      setCustomFlag('')
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!isEditMode && !formData.product_id) {
      newErrors.product_id = 'Product is required'
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    if (!formData.uom) {
      newErrors.uom = 'Unit of measure is required'
    }

    const scrapPercent = parseFloat(formData.scrap_percent)
    if (isNaN(scrapPercent) || scrapPercent < 0 || scrapPercent > 100) {
      newErrors.scrap_percent = 'Scrap percent must be between 0 and 100'
    }

    if (formData.is_by_product) {
      const yieldPercent = parseFloat(formData.yield_percent)
      if (isNaN(yieldPercent) || yieldPercent <= 0 || yieldPercent > 100) {
        newErrors.yield_percent = 'Yield percent must be between 0 and 100 for by-products'
      }
    }

    if (formData.condition_flags.length > 0 && !formData.condition_logic) {
      newErrors.condition_logic = 'Condition logic is required when flags are set'
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
        consume_whole_lp: formData.consume_whole_lp,
        is_by_product: formData.is_by_product,
        notes: formData.notes || null,
      }

      if (!isEditMode) {
        payload.product_id = formData.product_id
        if (formData.sequence) {
          payload.sequence = parseInt(formData.sequence)
        }
      }

      if (formData.is_by_product) {
        payload.yield_percent = parseFloat(formData.yield_percent)
      } else {
        payload.yield_percent = null
      }

      if (formData.condition_flags.length > 0) {
        payload.condition_flags = formData.condition_flags
        payload.condition_logic = formData.condition_logic
      } else {
        payload.condition_flags = null
        payload.condition_logic = null
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
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'add'} item`)
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
          {isEditMode && item?.product && (
            <p className="text-sm text-gray-500 mt-1">
              Component: {item.product.code} - {item.product.name}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Product Selection (Create only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="product_id">
                Component Product <span className="text-red-500">*</span>
              </Label>
              {loadingProducts ? (
                <div className="p-3 bg-gray-50 border rounded-md">
                  <p className="text-sm text-gray-600">Loading products...</p>
                </div>
              ) : (
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => handleChange('product_id', value)}
                >
                  <SelectTrigger className={errors.product_id ? 'border-red-500' : ''}>
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
              {errors.product_id && <p className="text-sm text-red-500">{errors.product_id}</p>}
            </div>
          )}

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
                <Label htmlFor="sequence">Sequence</Label>
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
                id="consume_whole_lp"
                checked={formData.consume_whole_lp}
                onCheckedChange={(checked) => handleChange('consume_whole_lp', checked === true)}
              />
              <Label htmlFor="consume_whole_lp" className="text-sm font-normal cursor-pointer">
                Consume Whole License Plate (LP)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_by_product"
                checked={formData.is_by_product}
                onCheckedChange={(checked) => handleChange('is_by_product', checked === true)}
              />
              <Label htmlFor="is_by_product" className="text-sm font-normal cursor-pointer">
                By-Product (Output, not input)
              </Label>
            </div>
          </div>

          {/* By-Product Yield (conditional) */}
          {formData.is_by_product && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-md">
              <Label htmlFor="yield_percent">
                Yield % <span className="text-red-500">*</span>
              </Label>
              <Input
                id="yield_percent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.yield_percent}
                onChange={(e) => handleChange('yield_percent', e.target.value)}
                placeholder="e.g., 5"
                className={errors.yield_percent ? 'border-red-500' : ''}
              />
              {errors.yield_percent && <p className="text-sm text-red-500">{errors.yield_percent}</p>}
              <p className="text-xs text-gray-500">
                Expected yield as percentage of main output
              </p>
            </div>
          )}

          {/* Conditional Flags (Story 2.12) */}
          <div className="space-y-2 pt-2">
            <Label>Condition Flags (Optional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CONDITION_FLAG_OPTIONS.map((flag) => (
                <Badge
                  key={flag}
                  variant={formData.condition_flags.includes(flag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleFlag(flag)}
                >
                  {flag}
                </Badge>
              ))}
            </div>

            {/* Custom flag input */}
            <div className="flex gap-2">
              <Input
                value={customFlag}
                onChange={(e) => setCustomFlag(e.target.value)}
                placeholder="Add custom flag..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomFlag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCustomFlag}>
                Add
              </Button>
            </div>

            {/* Selected custom flags */}
            {formData.condition_flags.filter((f) => !CONDITION_FLAG_OPTIONS.includes(f)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.condition_flags
                  .filter((f) => !CONDITION_FLAG_OPTIONS.includes(f))
                  .map((flag) => (
                    <Badge key={flag} variant="secondary" className="cursor-pointer">
                      {flag}
                      <X className="ml-1 h-3 w-3" onClick={() => toggleFlag(flag)} />
                    </Badge>
                  ))}
              </div>
            )}

            {/* Condition Logic */}
            {formData.condition_flags.length > 0 && (
              <div className="mt-3">
                <Label>Condition Logic</Label>
                <Select
                  value={formData.condition_logic}
                  onValueChange={(value) => handleChange('condition_logic', value)}
                >
                  <SelectTrigger className={errors.condition_logic ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND (all flags must match)</SelectItem>
                    <SelectItem value="OR">OR (any flag can match)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.condition_logic && (
                  <p className="text-sm text-red-500">{errors.condition_logic}</p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500">
              Item will only be included if work order matches these conditions
            </p>
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
