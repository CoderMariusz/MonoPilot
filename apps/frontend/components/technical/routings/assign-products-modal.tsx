/**
 * Assign Products Modal
 * Story: 2.17 Routing-Product Assignment
 * AC-017.1: Assign products to routing (from routing side)
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  code: string
  name: string
  type: string
  status: string
}

interface AssignProductsModalProps {
  routingId: string
  routingCode: string
  routingName: string
  isReusable: boolean
  currentProductIds: string[]
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AssignProductsModal({
  routingId,
  routingCode,
  routingName,
  isReusable,
  currentProductIds,
  open,
  onClose,
  onSuccess,
}: AssignProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [defaultProductId, setDefaultProductId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/technical/products?status=active')

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        setProducts(data.data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        // Products might not exist yet (Batch 2A)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchProducts()
      setSelectedProductIds(currentProductIds)
    }
  }, [open, currentProductIds])

  // Filter products by search
  const filteredProducts = products.filter((product) =>
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle product selection
  const handleProductToggle = (productId: string) => {
    if (!isReusable) {
      // Non-reusable: only allow single selection (AC-017.2)
      if (selectedProductIds.includes(productId)) {
        setSelectedProductIds([])
        setDefaultProductId(null)
      } else {
        setSelectedProductIds([productId])
        setDefaultProductId(productId)
      }
    } else {
      // Reusable: allow multiple selection
      if (selectedProductIds.includes(productId)) {
        const newSelected = selectedProductIds.filter((id) => id !== productId)
        setSelectedProductIds(newSelected)
        // Remove default if product is unselected
        if (defaultProductId === productId) {
          setDefaultProductId(null)
        }
      } else {
        setSelectedProductIds([...selectedProductIds, productId])
      }
    }
  }

  // Handle submit
  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      const response = await fetch(`/api/technical/routings/${routingId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: selectedProductIds,
          default_product_id: defaultProductId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign products')
      }

      toast({
        title: 'Success',
        description: 'Products assigned successfully',
      })

      onSuccess()
    } catch (error) {
      console.error('Error assigning products:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign products',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Products to Routing</DialogTitle>
          <DialogDescription>
            Select products that will use this routing for production.
          </DialogDescription>
        </DialogHeader>

        {/* Routing Info Card */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{routingCode}</span>
            <span className="text-muted-foreground">-</span>
            <span>{routingName}</span>
          </div>
          <div className="flex items-center gap-2">
            {isReusable ? (
              <Badge variant="outline">Reusable</Badge>
            ) : (
              <Badge variant="secondary">Non-Reusable</Badge>
            )}
          </div>
        </div>

        {/* Warning for non-reusable */}
        {!isReusable && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This routing is not reusable and can only be assigned to one product.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Products List */}
        <ScrollArea className="h-[300px] border rounded-md p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {products.length === 0
                ? 'No products available. Create products in the Products module first.'
                : 'No products match your search.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-accent ${
                    selectedProductIds.includes(product.id) ? 'border-primary bg-accent/50' : ''
                  }`}
                  onClick={() => handleProductToggle(product.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={() => handleProductToggle(product.id)}
                    />
                    <div>
                      <div className="font-mono font-semibold">{product.code}</div>
                      <div className="text-sm text-muted-foreground">{product.name}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{product.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Default Selection (only if multiple products selected) */}
        {selectedProductIds.length > 1 && (
          <div className="space-y-3">
            <Label>Set as default for product (optional):</Label>
            <RadioGroup
              value={defaultProductId || ''}
              onValueChange={setDefaultProductId}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="no-default" />
                <Label htmlFor="no-default" className="text-muted-foreground">
                  None
                </Label>
              </div>
              {selectedProductIds.map((productId) => {
                const product = products.find((p) => p.id === productId)
                return (
                  <div key={productId} className="flex items-center space-x-2">
                    <RadioGroupItem value={productId} id={productId} />
                    <Label htmlFor={productId}>
                      {product?.code} - {product?.name}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              The default routing will be auto-selected when creating work orders for that product.
            </p>
          </div>
        )}

        {/* Selected count */}
        <div className="text-sm text-muted-foreground">
          {selectedProductIds.length} product(s) selected
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Assignments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
