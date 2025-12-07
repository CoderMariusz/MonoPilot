/**
 * LP Form Modal Component
 * Story 5.1: LP Creation
 * AC-5.1.1: Create LP with product, warehouse, location, quantity, batch, dates
 * AC-5.1.2: Edit LP details
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
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Location {
  id: string
  code: string
  warehouse_id: string
}

interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  warehouse_id: string
  location_id: string
  quantity: number
  current_qty: number
  batch_number?: string
  supplier_batch_number?: string
  manufacturing_date?: string
  expiry_date?: string
  qa_status: string
  status: string
}

interface LPFormModalProps {
  open: boolean
  lp?: LicensePlate | null
  onClose: () => void
  onSuccess: () => void
}

export function LPFormModal({ open, lp, onClose, onSuccess }: LPFormModalProps) {
  const [formData, setFormData] = useState({
    product_id: lp?.product_id || '',
    warehouse_id: lp?.warehouse_id || '',
    location_id: lp?.location_id || '',
    quantity: lp?.quantity?.toString() || '',
    batch_number: lp?.batch_number || '',
    supplier_batch_number: lp?.supplier_batch_number || '',
    manufacturing_date: lp?.manufacturing_date || '',
    expiry_date: lp?.expiry_date || '',
    qa_status: lp?.qa_status || 'pending',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!lp

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?limit=1000&status=active')
        if (!response.ok) throw new Error('Failed to fetch products')
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        })
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [toast])

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true)
        const response = await fetch('/api/settings/warehouses?limit=1000')
        if (!response.ok) throw new Error('Failed to fetch warehouses')
        const data = await response.json()
        setWarehouses(data.warehouses || [])
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load warehouses',
          variant: 'destructive',
        })
      } finally {
        setLoadingWarehouses(false)
      }
    }
    fetchWarehouses()
  }, [toast])

  // Fetch locations when warehouse changes
  useEffect(() => {
    if (!formData.warehouse_id) {
      setLocations([])
      return
    }

    const fetchLocations = async () => {
      try {
        setLoadingLocations(true)
        const response = await fetch(`/api/settings/locations?warehouse_id=${formData.warehouse_id}&limit=1000`)
        if (!response.ok) throw new Error('Failed to fetch locations')
        const data = await response.json()
        setLocations(data.locations || [])
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load locations',
          variant: 'destructive',
        })
      } finally {
        setLoadingLocations(false)
      }
    }
    fetchLocations()
  }, [formData.warehouse_id, toast])

  // Update selected product when product_id changes
  useEffect(() => {
    if (formData.product_id) {
      const product = products.find((p) => p.id === formData.product_id)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [formData.product_id, products])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) newErrors.product_id = 'Product is required'
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required'
    if (!formData.location_id) newErrors.location_id = 'Location is required'
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setSubmitting(true)

      const body = {
        product_id: formData.product_id,
        warehouse_id: formData.warehouse_id,
        location_id: formData.location_id,
        quantity: parseFloat(formData.quantity),
        batch_number: formData.batch_number || null,
        supplier_batch_number: formData.supplier_batch_number || null,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
        qa_status: formData.qa_status,
      }

      const url = isEditMode
        ? `/api/warehouse/license-plates/${lp.id}`
        : '/api/warehouse/license-plates'

      const response = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save license plate')
      }

      toast({
        title: 'Success',
        description: `License plate ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit License Plate' : 'Create License Plate'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update license plate details' : 'Create a new license plate'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Product */}
            <div className="col-span-2">
              <Label htmlFor="product_id">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                disabled={loadingProducts || isEditMode}
              >
                <SelectTrigger id="product_id" className={errors.product_id ? 'border-red-500' : ''}>
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
              {errors.product_id && <p className="text-sm text-red-500 mt-1">{errors.product_id}</p>}
              {selectedProduct && (
                <p className="text-sm text-muted-foreground mt-1">UOM: {selectedProduct.uom}</p>
              )}
            </div>

            {/* Warehouse */}
            <div>
              <Label htmlFor="warehouse_id">
                Warehouse <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, warehouse_id: value, location_id: '' })
                }}
                disabled={loadingWarehouses || isEditMode}
              >
                <SelectTrigger id="warehouse_id" className={errors.warehouse_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse_id && <p className="text-sm text-red-500 mt-1">{errors.warehouse_id}</p>}
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location_id">
                Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                disabled={!formData.warehouse_id || loadingLocations}
              >
                <SelectTrigger id="location_id" className={errors.location_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_id && <p className="text-sm text-red-500 mt-1">{errors.location_id}</p>}
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={errors.quantity ? 'border-red-500' : ''}
                disabled={isEditMode}
              />
              {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
            </div>

            {/* QA Status */}
            <div>
              <Label htmlFor="qa_status">QA Status</Label>
              <Select
                value={formData.qa_status}
                onValueChange={(value) => setFormData({ ...formData, qa_status: value })}
              >
                <SelectTrigger id="qa_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Batch Number */}
            <div>
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              />
            </div>

            {/* Supplier Batch Number */}
            <div>
              <Label htmlFor="supplier_batch_number">Supplier Batch Number</Label>
              <Input
                id="supplier_batch_number"
                value={formData.supplier_batch_number}
                onChange={(e) => setFormData({ ...formData, supplier_batch_number: e.target.value })}
              />
            </div>

            {/* Manufacturing Date */}
            <div>
              <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
              <Input
                id="manufacturing_date"
                type="date"
                value={formData.manufacturing_date}
                onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
