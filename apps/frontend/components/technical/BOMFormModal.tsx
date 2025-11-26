/**
 * BOM Form Modal Component
 * Story: 2.6 BOM CRUD
 * AC-2.6.2: Create BOM with auto-versioning
 * AC-2.6.3: Version auto-assignment
 * AC-2.6.4: Update BOM
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
import { useToast } from '@/hooks/use-toast'
import type { BOMWithProduct } from '@/lib/validation/bom-schemas'
import { CreateBOMSchema, UpdateBOMSchema } from '@/lib/validation/bom-schemas'
import { ZodError } from 'zod'

interface Product {
  id: string
  code: string
  name: string
  uom: string
  type: string
}

interface BOMFormModalProps {
  bom?: BOMWithProduct | null // undefined = create, BOM = edit
  onClose: () => void
  onSuccess: () => void
}

export function BOMFormModal({ bom, onClose, onSuccess }: BOMFormModalProps) {
  const [formData, setFormData] = useState({
    product_id: bom?.product_id || '',
    effective_from: bom?.effective_from
      ? typeof bom.effective_from === 'string'
        ? bom.effective_from.split('T')[0]
        : new Date(bom.effective_from).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    effective_to: bom?.effective_to
      ? typeof bom.effective_to === 'string'
        ? bom.effective_to.split('T')[0]
        : new Date(bom.effective_to).toISOString().split('T')[0]
      : '',
    status: bom?.status || 'Draft',
    output_qty: bom?.output_qty?.toString() || '1',
    output_uom: bom?.output_uom || '',
    notes: bom?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!bom

  // Fetch products on mount (AC-2.6.2: Select product)
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
          description: 'Failed to load products. Product selection will be unavailable.',
          variant: 'destructive',
        })
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  // When product is selected, auto-fill output_uom
  useEffect(() => {
    if (formData.product_id && !isEditMode) {
      const selectedProduct = products.find((p) => p.id === formData.product_id)
      if (selectedProduct && !formData.output_uom) {
        setFormData((prev) => ({ ...prev, output_uom: selectedProduct.uom }))
      }
    }
  }, [formData.product_id, products, isEditMode])

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
    try {
      const schema = isEditMode ? UpdateBOMSchema : CreateBOMSchema

      // Prepare data for validation
      const dataToValidate: any = {
        effective_from: formData.effective_from,
        status: formData.status,
        output_qty: parseFloat(formData.output_qty),
        output_uom: formData.output_uom,
        notes: formData.notes || null,
      }

      if (!isEditMode) {
        dataToValidate.product_id = formData.product_id
      }

      if (formData.effective_to) {
        dataToValidate.effective_to = formData.effective_to
      }

      schema.parse(dataToValidate)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as string
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
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
      // Prepare payload
      const payload: any = {
        effective_from: formData.effective_from,
        status: formData.status,
        output_qty: parseFloat(formData.output_qty),
        output_uom: formData.output_uom,
        notes: formData.notes || null,
      }

      if (!isEditMode) {
        payload.product_id = formData.product_id
      }

      if (formData.effective_to) {
        payload.effective_to = formData.effective_to
      }

      // Call API
      const url = isEditMode ? `/api/technical/boms/${bom.id}` : '/api/technical/boms'

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-2.6.2: Handle date overlap error (Story 2.8)
        if (error.error === 'BOM_DATE_OVERLAP') {
          toast({
            title: 'Date Overlap',
            description: error.message || 'Date range overlaps with existing BOM',
            variant: 'destructive',
          })
          return
        }

        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} BOM`)
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description:
          data.message || `BOM ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} BOM:`, error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? 'update' : 'create'} BOM`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode ? `Edit BOM v${bom.version}` : 'Create BOM'}
          </h2>
          {isEditMode && (
            <p className="text-sm text-gray-500 mt-1">
              Product: {bom.product.code} - {bom.product.name}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Product Selection (Create only) (AC-2.6.2) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="product_id">
                Product <span className="text-red-500">*</span>
              </Label>
              {loadingProducts ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-600">Loading products...</p>
                </div>
              ) : (
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => handleChange('product_id', value)}
                >
                  <SelectTrigger className={errors.product_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.product_id && <p className="text-sm text-red-500">{errors.product_id}</p>}
              <p className="text-sm text-gray-500">
                Select the finished product this BOM produces. Version will be auto-assigned.
              </p>
            </div>
          )}

          {/* Date Range (AC-2.6.2) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_from">
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effective_from"
                type="date"
                value={formData.effective_from}
                onChange={(e) => handleChange('effective_from', e.target.value)}
                className={errors.effective_from ? 'border-red-500' : ''}
              />
              {errors.effective_from && (
                <p className="text-sm text-red-500">{errors.effective_from}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_to">Effective To</Label>
              <Input
                id="effective_to"
                type="date"
                value={formData.effective_to}
                onChange={(e) => handleChange('effective_to', e.target.value)}
                className={errors.effective_to ? 'border-red-500' : ''}
              />
              {errors.effective_to && (
                <p className="text-sm text-red-500">{errors.effective_to}</p>
              )}
              <p className="text-sm text-gray-500">Optional. Leave blank for no end date.</p>
            </div>
          </div>

          {/* Status (AC-2.6.2) */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Phased Out">Phased Out</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            <p className="text-sm text-gray-500">
              Draft: In development | Active: In use | Phased Out: Being replaced | Inactive:
              Obsolete
            </p>
          </div>

          {/* Output Quantity and UOM (AC-2.6.2) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="output_qty">
                Output Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="output_qty"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.output_qty}
                onChange={(e) => handleChange('output_qty', e.target.value)}
                placeholder="e.g., 1.0"
                className={errors.output_qty ? 'border-red-500' : ''}
              />
              {errors.output_qty && <p className="text-sm text-red-500">{errors.output_qty}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="output_uom">
                Output Unit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="output_uom"
                value={formData.output_uom}
                onChange={(e) => handleChange('output_uom', e.target.value)}
                placeholder="e.g., kg, pcs, L"
                className={errors.output_uom ? 'border-red-500' : ''}
              />
              {errors.output_uom && <p className="text-sm text-red-500">{errors.output_uom}</p>}
              <p className="text-sm text-gray-500">
                Quantity and unit this BOM produces (e.g., 1 kg, 10 pcs)
              </p>
            </div>
          </div>

          {/* Notes (AC-2.6.2) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Optional notes about this BOM version..."
              rows={3}
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
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
              {submitting
                ? 'Saving...'
                : isEditMode
                  ? 'Update BOM'
                  : 'Create BOM (Version Auto-Assigned)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
