/**
 * Product Form Modal Component
 * Story: 2.1 Product CRUD
 * AC-2.1.3: Create Modal
 * AC-2.1.6: Edit functionality (via drawer/modal)
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
import { productCreateSchema, productUpdateSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

interface ProductType {
  id: string
  code: string
  name: string
  is_active: boolean
}

interface Product {
  id: string
  code: string
  name: string
  product_type_id: string
  description?: string
  base_uom: string
  version: number
  status: 'active' | 'inactive' | 'discontinued'
  shelf_life_days?: number
  min_stock?: number
  max_stock?: number
  cost_per_unit?: number
}

interface Allergen {
  id: string
  code: string
  name: string
}

interface Supplier {
  id: string
  code: string
  name: string
  currency: string
  is_active: boolean
}

interface SupplierProduct {
  id: string
  supplier_id: string
  product_id: string
  is_default: boolean
  suppliers: Supplier
}

interface ProductFormModalProps {
  product?: Product | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

// Common UoM options
const UOM_OPTIONS = ['kg', 'g', 'L', 'mL', 'pcs', 'pack', 'box', 'pallet', 'unit']

export function ProductFormModal({ product, open, onClose, onSuccess }: ProductFormModalProps) {
  // All hooks must be at the top level (Rules of Hooks)
  const [formData, setFormData] = useState({
    code: product?.code || '',
    name: product?.name || '',
    product_type_id: product?.product_type_id || '',
    description: product?.description || '',
    base_uom: product?.base_uom || '',
    status: product?.status || 'active',
    shelf_life_days: product?.shelf_life_days?.toString() || '',
    min_stock: product?.min_stock?.toString() || '',
    max_stock: product?.max_stock?.toString() || '',
    cost_per_unit: product?.cost_per_unit?.toString() || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [checkingCode, setCheckingCode] = useState(false)
  const [codeExists, setCodeExists] = useState(false)

  // Product types state
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loadingProductTypes, setLoadingProductTypes] = useState(true)

  // Allergen state
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [containsAllergens, setContainsAllergens] = useState<string[]>([])
  const [mayContainAllergens, setMayContainAllergens] = useState<string[]>([])
  const [loadingAllergens, setLoadingAllergens] = useState(true)

  // Supplier state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [originalSupplierId, setOriginalSupplierId] = useState<string>('')
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)

  const { toast } = useToast()
  const isEditMode = !!product

  // Fetch product types on mount
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        setLoadingProductTypes(true)
        const response = await fetch('/api/technical/product-types')
        if (response.ok) {
          const data = await response.json()
          setProductTypes(data.data || [])
          // Set default product type if not in edit mode and no type selected
          if (!product && data.data?.length > 0 && !formData.product_type_id) {
            const rmType = data.data.find((t: ProductType) => t.code === 'RM')
            if (rmType) {
              setFormData(prev => ({ ...prev, product_type_id: rmType.id }))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product types:', error)
      } finally {
        setLoadingProductTypes(false)
      }
    }
    fetchProductTypes()
  }, [])

  // Fetch allergens on mount
  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        setLoadingAllergens(true)
        const response = await fetch('/api/v1/settings/allergens')
        if (response.ok) {
          const data = await response.json()
          setAllergens(data.allergens || [])
        }
      } catch (error) {
        console.error('Error fetching allergens:', error)
      } finally {
        setLoadingAllergens(false)
      }
    }
    fetchAllergens()
  }, [])

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true)
        const response = await fetch('/api/planning/suppliers?is_active=true')
        if (response.ok) {
          const data = await response.json()
          setSuppliers(data.suppliers || [])
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error)
      } finally {
        setLoadingSuppliers(false)
      }
    }
    fetchSuppliers()
  }, [])

  // Fetch default supplier for product in edit mode
  useEffect(() => {
    if (isEditMode && product?.id) {
      const fetchProductSupplier = async () => {
        try {
          const response = await fetch(
            `/api/planning/suppliers/products?product_id=${product.id}&is_default=true`
          )
          if (response.ok) {
            const data = await response.json()
            const defaultAssignment = data.assignments?.[0] as SupplierProduct | undefined
            if (defaultAssignment) {
              setSelectedSupplierId(defaultAssignment.supplier_id)
              setOriginalSupplierId(defaultAssignment.supplier_id)
            }
          }
        } catch (error) {
          console.error('Error fetching product supplier:', error)
        }
      }
      fetchProductSupplier()
    }
  }, [isEditMode, product?.id])

  // Fetch product allergens in edit mode
  useEffect(() => {
    if (isEditMode && product?.id) {
      const fetchProductAllergens = async () => {
        try {
          const response = await fetch(`/api/technical/products/${product.id}/allergens`)
          if (response.ok) {
            const data = await response.json()
            setContainsAllergens(data.allergens?.contains?.map((a: Allergen) => a.id) || [])
            setMayContainAllergens(data.allergens?.may_contain?.map((a: Allergen) => a.id) || [])
          }
        } catch (error) {
          console.error('Error fetching product allergens:', error)
        }
      }
      fetchProductAllergens()
    }
  }, [isEditMode, product?.id])

  // Early return after all hooks (Rules of Hooks)
  if (!open) return null

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

  // Check code uniqueness (AC-2.1.3)
  const checkCodeUniqueness = async (code: string) => {
    if (!code || code.length < 2 || isEditMode) return

    setCheckingCode(true)
    try {
      const response = await fetch(`/api/technical/products?search=${encodeURIComponent(code)}&limit=1`)
      if (response.ok) {
        const data = await response.json()
        const exists = data.data?.some((p: Product) => p.code.toLowerCase() === code.toLowerCase())
        setCodeExists(exists)
        if (exists) {
          setErrors((prev) => ({ ...prev, code: 'This product code already exists' }))
        }
      }
    } catch (error) {
      console.error('Error checking code:', error)
    } finally {
      setCheckingCode(false)
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      const schema = isEditMode ? productUpdateSchema : productCreateSchema

      const dataToValidate: Record<string, unknown> = {
        name: formData.name,
        product_type_id: formData.product_type_id,
        base_uom: formData.base_uom,
        status: formData.status,
      }

      if (!isEditMode) {
        dataToValidate.code = formData.code
      }

      if (formData.description) dataToValidate.description = formData.description
      if (formData.shelf_life_days) dataToValidate.shelf_life_days = parseInt(formData.shelf_life_days)
      if (formData.min_stock) dataToValidate.min_stock = parseFloat(formData.min_stock)
      if (formData.max_stock) dataToValidate.max_stock = parseFloat(formData.max_stock)
      if (formData.cost_per_unit) dataToValidate.cost_per_unit = parseFloat(formData.cost_per_unit)

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

    if (codeExists && !isEditMode) {
      toast({
        title: 'Validation Error',
        description: 'Product code already exists',
        variant: 'destructive',
      })
      return
    }

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
      // Build payload with correct database column names
      const payload: Record<string, unknown> = {
        name: formData.name,
        product_type_id: formData.product_type_id,
        base_uom: formData.base_uom,
        status: formData.status,
      }

      if (!isEditMode) {
        payload.code = formData.code
      }

      if (formData.description) payload.description = formData.description
      if (formData.shelf_life_days) payload.shelf_life_days = parseInt(formData.shelf_life_days)
      if (formData.min_stock) payload.min_stock = parseFloat(formData.min_stock)
      if (formData.max_stock) payload.max_stock = parseFloat(formData.max_stock)
      if (formData.cost_per_unit) payload.cost_per_unit = parseFloat(formData.cost_per_unit)

      // API call for product
      const url = isEditMode ? `/api/technical/products/${product.id}` : '/api/technical/products'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.code === 'PRODUCT_CODE_EXISTS') {
          setErrors((prev) => ({ ...prev, code: 'This product code already exists' }))
          return
        }
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} product`)
      }

      const data = await response.json()
      const productId = isEditMode ? product.id : data.id

      // Update allergens if any selected
      if (containsAllergens.length > 0 || mayContainAllergens.length > 0) {
        await fetch(`/api/technical/products/${productId}/allergens`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contains: containsAllergens,
            may_contain: mayContainAllergens,
          }),
        })
      }

      // Update default supplier
      // If supplier changed or was removed, handle the update
      if (selectedSupplierId !== originalSupplierId) {
        // Remove old default supplier if there was one
        if (originalSupplierId) {
          await fetch(
            `/api/planning/suppliers/products?supplier_id=${originalSupplierId}&product_id=${productId}`,
            { method: 'DELETE' }
          )
        }

        // Add new default supplier if selected (ignore 'none' - it means no supplier)
        if (selectedSupplierId && selectedSupplierId !== 'none') {
          await fetch('/api/planning/suppliers/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplier_id: selectedSupplierId,
              product_id: productId,
              is_default: true,
            }),
          })
        }
      }

      toast({
        title: 'Success',
        description: `Product ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} product`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle allergen selection
  const toggleAllergen = (allergenId: string, type: 'contains' | 'may_contain') => {
    if (type === 'contains') {
      setContainsAllergens((prev) =>
        prev.includes(allergenId) ? prev.filter((id) => id !== allergenId) : [...prev, allergenId]
      )
      // Remove from may_contain if added to contains
      setMayContainAllergens((prev) => prev.filter((id) => id !== allergenId))
    } else {
      setMayContainAllergens((prev) =>
        prev.includes(allergenId) ? prev.filter((id) => id !== allergenId) : [...prev, allergenId]
      )
      // Remove from contains if added to may_contain
      setContainsAllergens((prev) => prev.filter((id) => id !== allergenId))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">
            {isEditMode ? `Edit Product: ${product.code}` : 'Create New Product'}
          </h2>
          {isEditMode && (
            <p className="text-sm text-gray-500 mt-1">
              Version {product.version.toFixed(1)} - Changes will increment the version
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6 overflow-y-auto flex-grow">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  Product Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  onBlur={(e) => checkCodeUniqueness(e.target.value)}
                  placeholder="e.g., RM-FLOUR-001"
                  disabled={isEditMode}
                  className={`${errors.code ? 'border-red-500' : ''} ${isEditMode ? 'bg-gray-100' : ''}`}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                {checkingCode && <p className="text-sm text-gray-500">Checking availability...</p>}
                {!isEditMode && (
                  <p className="text-xs text-gray-500">
                    Alphanumeric with hyphens/underscores. Cannot be changed after creation.
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Wheat Flour"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Product Type */}
              <div className="space-y-2">
                <Label htmlFor="product_type_id">
                  Type <span className="text-red-500">*</span>
                </Label>
                {loadingProductTypes ? (
                  <p className="text-sm text-gray-500 py-2">Loading types...</p>
                ) : (
                  <Select value={formData.product_type_id} onValueChange={(v) => handleChange('product_type_id', v)}>
                    <SelectTrigger className={errors.product_type_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.filter(t => t.is_active).map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.product_type_id && <p className="text-sm text-red-500">{errors.product_type_id}</p>}
              </div>

              {/* UoM */}
              <div className="space-y-2">
                <Label htmlFor="base_uom">
                  Unit of Measure <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.base_uom} onValueChange={(v) => handleChange('base_uom', v)}>
                  <SelectTrigger className={errors.base_uom ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select UoM" />
                  </SelectTrigger>
                  <SelectContent>
                    {UOM_OPTIONS.map((uom) => (
                      <SelectItem key={uom} value={uom}>
                        {uom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.base_uom && <p className="text-sm text-red-500">{errors.base_uom}</p>}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category - TODO: Enable when categories table is created
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Dry Goods, Dairy"
                />
              </div>
              */}

              {/* Shelf Life */}
              <div className="space-y-2">
                <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
                <Input
                  id="shelf_life_days"
                  type="number"
                  min="1"
                  value={formData.shelf_life_days}
                  onChange={(e) => handleChange('shelf_life_days', e.target.value)}
                  placeholder="e.g., 365"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Inventory Settings</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_stock">Min Stock</Label>
                <Input
                  id="min_stock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => handleChange('min_stock', e.target.value)}
                  placeholder="0"
                  className={errors.min_stock ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_stock">Max Stock</Label>
                <Input
                  id="max_stock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_stock}
                  onChange={(e) => handleChange('max_stock', e.target.value)}
                  placeholder="0"
                  className={errors.max_stock ? 'border-red-500' : ''}
                />
                {errors.max_stock && <p className="text-sm text-red-500">{errors.max_stock}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_unit">Cost per Unit</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) => handleChange('cost_per_unit', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Default Supplier Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Default Supplier</h3>

            {loadingSuppliers ? (
              <p className="text-sm text-gray-500">Loading suppliers...</p>
            ) : suppliers.length === 0 ? (
              <p className="text-sm text-gray-500">
                No active suppliers configured. Configure suppliers in Planning → Suppliers.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Select Default Supplier</Label>
                  <Select
                    value={selectedSupplierId}
                    onValueChange={setSelectedSupplierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No supplier (clear selection)</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <span className="font-medium">{supplier.code}</span>
                          <span className="text-gray-500 ml-2">- {supplier.name}</span>
                          <span className="text-gray-400 ml-2">({supplier.currency})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500">
                  Optional: Set a default supplier for this product. You can add more suppliers with specific
                  prices and lead times in the Planning → Suppliers section.
                </p>
              </div>
            )}
          </div>

          {/* Allergens Section (Story 2.4) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Allergens</h3>

            {loadingAllergens ? (
              <p className="text-sm text-gray-500">Loading allergens...</p>
            ) : allergens.length === 0 ? (
              <p className="text-sm text-gray-500">No allergens configured. Configure allergens in Settings.</p>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Contains */}
                <div className="space-y-2">
                  <Label className="text-red-600">Contains (definite allergens)</Label>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                    {allergens.map((allergen) => (
                      <label key={allergen.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={containsAllergens.includes(allergen.id)}
                          onChange={() => toggleAllergen(allergen.id, 'contains')}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{allergen.name} ({allergen.code})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* May Contain */}
                <div className="space-y-2">
                  <Label className="text-orange-600">May Contain (cross-contamination risk)</Label>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                    {allergens.map((allergen) => (
                      <label key={allergen.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mayContainAllergens.includes(allergen.id)}
                          onChange={() => toggleAllergen(allergen.id, 'may_contain')}
                          className="rounded border-gray-300"
                          disabled={containsAllergens.includes(allergen.id)}
                        />
                        <span className={`text-sm ${containsAllergens.includes(allergen.id) ? 'text-gray-400' : ''}`}>
                          {allergen.name} ({allergen.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={submitting || (codeExists && !isEditMode)}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>
    </div>
  )
}
