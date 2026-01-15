/**
 * Create LP Modal Component
 * Story 05.1: License Plates UI
 */

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateLP, useGenerateLPNumber } from '@/lib/hooks/use-license-plates'
import type { CreateLPInput } from '@/lib/types/license-plate'
import { useToast } from '@/hooks/use-toast'

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Product {
  id: string
  code: string
  name: string
  base_uom?: string
}

interface Location {
  id: string
  code: string
  name: string
  full_path: string
}

interface CreateLPModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouses?: Warehouse[]
  products?: Product[]
  onSuccess?: () => void
}

export function CreateLPModal({ open, onOpenChange, warehouses: propWarehouses, products: propProducts, onSuccess }: CreateLPModalProps) {
  const { toast } = useToast()
  const createLP = useCreateLP()
  const generateNumber = useGenerateLPNumber()

  // Internal state for data fetching
  const [warehouses, setWarehouses] = useState<Warehouse[]>(propWarehouses || [])
  const [products, setProducts] = useState<Product[]>(propProducts || [])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(!propWarehouses || !propProducts)

  const [formData, setFormData] = useState<Partial<CreateLPInput>>({
    source: 'manual',
  })

  // Fetch warehouses and products if not provided
  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch warehouses if not provided
        if (!propWarehouses) {
          const whRes = await fetch('/api/v1/settings/warehouses')
          if (whRes.ok) {
            const whData = await whRes.json()
            setWarehouses(whData.warehouses || whData.data || [])
          }
        }

        // Fetch products if not provided
        if (!propProducts) {
          const prodRes = await fetch('/api/technical/products?limit=500')
          if (prodRes.ok) {
            const prodData = await prodRes.json()
            setProducts(prodData.data || prodData.products || [])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, propWarehouses, propProducts])

  // Fetch locations when warehouse changes
  useEffect(() => {
    if (!formData.warehouse_id) {
      setLocations([])
      return
    }

    const fetchLocations = async () => {
      try {
        // Use flat view for dropdown (simpler list)
        const res = await fetch(`/api/v1/settings/warehouses/${formData.warehouse_id}/locations?view=flat`)
        if (res.ok) {
          const data = await res.json()
          // API returns { locations: [...], total_count: N }
          setLocations(data.locations || [])
        } else {
          console.error('Failed to fetch locations:', res.status)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }

    fetchLocations()
  }, [formData.warehouse_id])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({ source: 'manual' })
      setLocations([])
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.quantity || !formData.uom || !formData.warehouse_id || !formData.location_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await createLP.mutateAsync(formData as CreateLPInput)
      toast({
        title: 'Success',
        description: 'License Plate created successfully',
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create license plate',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateNumber = async () => {
    try {
      const result = await generateNumber.mutateAsync()
      setFormData((prev) => ({ ...prev, lp_number: result.lp_number }))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate LP number',
        variant: 'destructive',
      })
    }
  }

  // Set UoM when product changes
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      uom: product?.base_uom || prev.uom,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-lp-modal">
        <DialogHeader>
          <DialogTitle>Create License Plate</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new license plate for inventory tracking
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* LP Number */}
            <div>
              <Label>LP Number (Optional - auto-generated if blank)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.lp_number || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lp_number: e.target.value }))}
                  placeholder="LP00000001"
                />
                <Button type="button" variant="outline" onClick={handleGenerateNumber}>
                  Generate
                </Button>
              </div>
            </div>

            {/* Product */}
            <div>
              <Label>Product *</Label>
              <Select
                value={formData.product_id || ''}
                onValueChange={handleProductChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity & UoM */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  placeholder="100"
                  step="0.0001"
                />
              </div>
              <div>
                <Label>UoM *</Label>
                <Input
                  value={formData.uom || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, uom: e.target.value }))}
                  placeholder="kg"
                />
              </div>
            </div>

            {/* Warehouse */}
            <div>
              <Label>Warehouse *</Label>
              <Select
                value={formData.warehouse_id || ''}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, warehouse_id: value, location_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label>Location *</Label>
              <Select
                value={formData.location_id || ''}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location_id: value }))}
                disabled={!formData.warehouse_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.warehouse_id ? "Select location..." : "Select warehouse first"} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.full_path || location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch & Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch Number</Label>
                <Input
                  value={formData.batch_number || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, batch_number: e.target.value }))}
                  placeholder="BATCH-001"
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLP.isPending}>
                {createLP.isPending ? 'Creating...' : 'Create License Plate'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
