/**
 * Add/Edit Line Modal Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Modal for adding or editing TO line items
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAddTOLine, useUpdateTOLine } from '@/lib/hooks/use-transfer-order-mutations'
import { useToast } from '@/hooks/use-toast'

// Form validation schema
const lineFormSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .positive('Quantity must be greater than 0'),
  notes: z.string().max(500).optional(),
})

type LineFormData = z.infer<typeof lineFormSchema>

interface Product {
  id: string
  code: string
  name: string
  uom?: string
  base_uom?: string
}

interface TOLine {
  id: string
  product_id: string
  quantity: number
  uom: string
  notes: string | null
  product?: {
    id: string
    code: string
    name: string
    uom?: string
    base_uom?: string
  }
}

interface AddLineModalProps {
  open: boolean
  onClose: () => void
  toId: string
  existingProductIds?: string[]
  line?: TOLine | null
  onSuccess?: () => void
}

export function AddLineModal({
  open,
  onClose,
  toId,
  existingProductIds = [],
  line,
  onSuccess,
}: AddLineModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const isEditMode = !!line
  const addLineMutation = useAddTOLine()
  const updateLineMutation = useUpdateTOLine()
  const { toast } = useToast()

  const form = useForm<LineFormData>({
    resolver: zodResolver(lineFormSchema),
    defaultValues: {
      product_id: line?.product_id || '',
      quantity: line?.quantity || 1,
      notes: line?.notes || '',
    },
  })

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?is_active=true&limit=1000')
        if (response.ok) {
          const data = await response.json()
          const productList = data.products || data.data || []
          setProducts(productList)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' })
      } finally {
        setLoadingProducts(false)
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [open])

  // Reset form when modal opens/closes or line changes
  useEffect(() => {
    if (open) {
      form.reset({
        product_id: line?.product_id || '',
        quantity: line?.quantity || 1,
        notes: line?.notes || '',
      })
      setSelectedProduct(line?.product || null)
    }
  }, [open, line, form])

  // Update selected product when product_id changes
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setSelectedProduct(product || null)
    form.setValue('product_id', productId)
  }

  // Filter out already-added products (except current line's product in edit mode)
  const availableProducts = products.filter((p) => {
    if (isEditMode && p.id === line?.product_id) return true
    return !existingProductIds.includes(p.id)
  })

  const handleSubmit = async (data: LineFormData) => {
    try {
      if (isEditMode && line) {
        await updateLineMutation.mutateAsync({
          toId,
          lineId: line.id,
          data: {
            quantity: data.quantity,
            notes: data.notes || undefined,
          },
        })
        toast({ title: 'Success', description: 'Line updated successfully' })
      } else {
        await addLineMutation.mutateAsync({
          toId,
          data: {
            product_id: data.product_id,
            quantity: data.quantity,
            notes: data.notes || undefined,
          },
        })
        toast({ title: 'Success', description: 'Line added successfully' })
      }
      onSuccess?.()
      handleClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'add'} line`,
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    setSelectedProduct(null)
    onClose()
  }

  const isSubmitting = addLineMutation.isPending || updateLineMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the quantity or notes for this line item.'
              : 'Add a product to this transfer order.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Product <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleProductChange}
                    disabled={isEditMode || loadingProducts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingProducts ? 'Loading products...' : 'Select a product'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {availableProducts.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-gray-500">
                          {existingProductIds.length > 0
                            ? 'All products already added to this TO'
                            : 'No products available'}
                        </div>
                      ) : (
                        availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-gray-500">
                                {product.code} - {product.uom || product.base_uom}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* UoM Display (readonly) */}
            {selectedProduct && (
              <div>
                <FormLabel className="text-gray-500">Unit of Measure</FormLabel>
                <p className="text-sm font-medium mt-1">{selectedProduct.uom || selectedProduct.base_uom}</p>
              </div>
            )}

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantity <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter quantity"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes for this line..."
                      rows={2}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Line' : 'Add Line'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddLineModal
