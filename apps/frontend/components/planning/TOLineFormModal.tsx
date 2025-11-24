/**
 * TO Line Form Modal Component
 * Story 3.7: TO Line Management
 * AC-3.7.1: Create/Edit TO line with product selection
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface TOLine {
  id: string
  product_id: string
  quantity: number
  notes?: string
}

interface TOLineFormModalProps {
  open: boolean
  transferOrderId: string
  onClose: () => void
  onSuccess: () => void
  line?: TOLine | null
}

export function TOLineFormModal({
  open,
  transferOrderId,
  onClose,
  onSuccess,
  line,
}: TOLineFormModalProps) {
  const [formData, setFormData] = useState({
    product_id: line?.product_id || '',
    quantity: line?.quantity?.toString() || '1',
    notes: line?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!line

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?limit=1000')

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load products.',
          variant: 'destructive',
        })
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [open])

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

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required'
    }

    const quantity = parseFloat(formData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
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
        ? `/api/planning/transfer-orders/${transferOrderId}/lines/${line.id}`
        : `/api/planning/transfer-orders/${transferOrderId}/lines`

      const method = isEditMode ? 'PUT' : 'POST'

      const payload: any = {
        quantity: parseFloat(formData.quantity),
        notes: formData.notes || null,
      }

      if (!isEditMode) {
        payload.product_id = formData.product_id
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'add'} TO line`)
      }

      toast({
        title: 'Success',
        description: `TO line ${isEditMode ? 'updated' : 'added'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error submitting TO line:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit TO line',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit TO Line' : 'Add TO Line'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update TO line details' : 'Add a new line to the transfer order'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection - AC-3.7.2: Searchable dropdown */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="product_id">
                Product <span className="text-red-500">*</span>
              </Label>
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchOpen}
                    className="w-full justify-between"
                    disabled={loadingProducts}
                  >
                    {loadingProducts
                      ? 'Loading products...'
                      : formData.product_id
                      ? (() => {
                          const product = products.find((p) => p.id === formData.product_id)
                          return product ? `${product.code} - ${product.name}` : 'Select product'
                        })()
                      : 'Select product...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search products by code or name..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.code} ${product.name}`}
                            onSelect={() => {
                              handleChange('product_id', product.id)
                              setProductSearchOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.product_id === product.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {product.code} - {product.name} ({product.uom})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.product_id && <p className="text-sm text-red-500">{errors.product_id}</p>}
              {selectedProduct && (
                <p className="text-sm text-gray-500">UoM: {selectedProduct.uom}</p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
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
              {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
