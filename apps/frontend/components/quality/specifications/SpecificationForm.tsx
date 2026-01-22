'use client'

/**
 * SpecificationForm Component
 * Story: 06.3 - Product Specifications
 *
 * Form for creating or editing quality specifications.
 * Features:
 * - Product selection (searchable dropdown)
 * - All required and optional fields
 * - Date validation (expiry > effective)
 * - Draft saving
 * - Keyboard navigation
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ArrowLeft, Save, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import type { QualitySpecification, CreateSpecificationInput } from '@/lib/types/quality'

// Form schema
const specificationFormSchema = z.object({
  product_id: z.string().uuid('Please select a product'),
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name must not exceed 200 characters'),
  description: z.string().max(2000).optional().nullable(),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('')),
  review_frequency_days: z.coerce.number().int().min(1).max(3650),
  notes: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => {
    if (!data.expiry_date || data.expiry_date === '') return true
    return data.expiry_date > data.effective_date
  },
  { message: 'Expiry date must be after effective date', path: ['expiry_date'] }
)

type SpecificationFormValues = z.infer<typeof specificationFormSchema>

interface Product {
  id: string
  code: string
  name: string
  product_type?: { code: string }
}

export interface SpecificationFormProps {
  /** Existing specification for editing (null for create) */
  specification?: QualitySpecification | null
  /** Whether the form is in loading state */
  loading?: boolean
  /** Error message */
  error?: string | null
  /** Whether save is in progress */
  saving?: boolean
  /** Callback when form is submitted */
  onSubmit: (data: CreateSpecificationInput) => void
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether this is edit mode */
  isEdit?: boolean
}

export function SpecificationForm({
  specification,
  loading = false,
  error = null,
  saving = false,
  onSubmit,
  onCancel,
  isEdit = false,
}: SpecificationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Initialize form
  const form = useForm<SpecificationFormValues>({
    resolver: zodResolver(specificationFormSchema),
    defaultValues: {
      product_id: specification?.product_id || '',
      name: specification?.name || '',
      description: specification?.description || '',
      effective_date: specification?.effective_date || new Date().toISOString().split('T')[0],
      expiry_date: specification?.expiry_date || '',
      review_frequency_days: specification?.review_frequency_days || 365,
      notes: specification?.notes || '',
    },
  })

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?limit=1000&status=active')
        if (response.ok) {
          const data = await response.json()
          const productList = data.data || data.products || []
          setProducts(productList)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        toast({
          title: 'Warning',
          description: 'Failed to load products list',
          variant: 'destructive',
        })
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [toast])

  // Update form when specification changes
  useEffect(() => {
    if (specification) {
      form.reset({
        product_id: specification.product_id,
        name: specification.name,
        description: specification.description || '',
        effective_date: specification.effective_date,
        expiry_date: specification.expiry_date || '',
        review_frequency_days: specification.review_frequency_days,
        notes: specification.notes || '',
      })
    }
  }, [specification, form])

  // Handle form submission
  const handleSubmit = (values: SpecificationFormValues) => {
    const submitData: CreateSpecificationInput = {
      product_id: values.product_id,
      name: values.name,
      description: values.description || null,
      effective_date: values.effective_date,
      expiry_date: values.expiry_date && values.expiry_date !== '' ? values.expiry_date : null,
      review_frequency_days: values.review_frequency_days,
      notes: values.notes || null,
    }
    onSubmit(submitData)
  }

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push('/quality/specifications')
    }
  }

  // Get selected product
  const selectedProductId = form.watch('product_id')
  const selectedProduct = products.find(p => p.id === selectedProductId)

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEdit ? 'Edit Specification' : 'New Specification'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isEdit ? 'Edit Specification' : 'New Specification'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit || loadingProducts}
                  >
                    <FormControl>
                      <SelectTrigger className={!field.value ? 'text-muted-foreground' : ''}>
                        <SelectValue placeholder={loadingProducts ? 'Loading products...' : 'Select a product...'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {product.product_type?.code || 'N/A'}
                            </Badge>
                            <span className="font-mono">{product.code}</span>
                            <span className="text-muted-foreground">- {product.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isEdit ? 'Product cannot be changed after creation' : 'Select the product this specification applies to'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Selected: </span>
                  <span className="font-mono">{selectedProduct.code}</span> -{' '}
                  {selectedProduct.name}
                </p>
              </div>
            )}

            {/* Specification Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specification Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Quality Standard for Product XYZ"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this specification (3-200 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Detailed description of the specification requirements..."
                      rows={3}
                      maxLength={2000}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional detailed description (max 2000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Effective Date */}
              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormDescription>
                      Date this specification becomes effective
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry Date */}
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional expiry date (leave blank for no expiry)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Review Frequency */}
            <FormField
              control={form.control}
              name="review_frequency_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Frequency (days)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={3650}
                    />
                  </FormControl>
                  <FormDescription>
                    How often this specification should be reviewed (1-3650 days, default: 365)
                  </FormDescription>
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
                      {...field}
                      value={field.value || ''}
                      placeholder="Additional notes or comments..."
                      rows={2}
                      maxLength={2000}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional internal notes (max 2000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Save Changes' : 'Create Draft'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default SpecificationForm
