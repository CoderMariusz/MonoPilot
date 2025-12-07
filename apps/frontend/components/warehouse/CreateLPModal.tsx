/**
 * Create License Plate Modal
 * Stories 5.1-5.4: LP Core UI
 * For manual LP creation (adjustments)
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'

interface CreateLPModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

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
  name: string
  warehouse_id: string
}

export function CreateLPModal({ open, onClose, onSuccess }: CreateLPModalProps) {
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [uom, setUom] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')

  const [loading, setLoading] = useState(false)

  // Fetch data
  useEffect(() => {
    if (open) {
      fetchProducts()
      fetchWarehouses()
      fetchLocations()
    }
  }, [open])

  // Filter locations by warehouse
  useEffect(() => {
    if (warehouseId) {
      setFilteredLocations(locations.filter(loc => loc.warehouse_id === warehouseId))
    } else {
      setFilteredLocations([])
    }
    setLocationId('')
  }, [warehouseId, locations])

  // Set UoM from product
  useEffect(() => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setUom(product.uom)
    }
  }, [productId, products])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/technical/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      // Silent fail
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/settings/warehouses?limit=100')
      if (response.ok) {
        const data = await response.json()
        setWarehouses(data.warehouses || [])
      }
    } catch (error) {
      // Silent fail
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/settings/locations?limit=500')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      // Silent fail
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId || !quantity || !warehouseId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/warehouse/license-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: parseFloat(quantity),
          uom,
          warehouse_id: warehouseId,
          location_id: locationId || undefined,
          batch_number: batchNumber || undefined,
          expiry_date: expiryDate || undefined,
          manufacturing_date: manufacturingDate || undefined,
          status: 'available',
          qa_status: 'pending',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create LP')
      }

      toast({
        title: 'Success',
        description: 'License plate created successfully',
      })

      // Reset form
      setProductId('')
      setQuantity('')
      setUom('')
      setWarehouseId('')
      setLocationId('')
      setBatchNumber('')
      setExpiryDate('')
      setManufacturingDate('')

      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create license plate',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create License Plate</DialogTitle>
          <DialogDescription>
            Create a new license plate for manual inventory adjustments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={productId} onValueChange={setProductId} required>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  required
                  className="flex-1"
                />
                <Input
                  value={uom}
                  disabled
                  className="w-20"
                  placeholder="UoM"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId} required>
                <SelectTrigger id="warehouse">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={locationId}
                onValueChange={setLocationId}
                disabled={!warehouseId}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch">Batch Number</Label>
            <Input
              id="batch"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="Optional batch number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturing">Manufacturing Date</Label>
              <Input
                id="manufacturing"
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create License Plate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
