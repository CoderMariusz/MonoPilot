/**
 * Supplier Detail Page
 * Story 3.17: Supplier Management
 * Story 3.18: Supplier-Product Assignments
 *
 * Tabs: [Overview] [Products]
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Building2,
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Star,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Supplier {
  id: string
  code: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  currency: string
  tax_code_id: string
  payment_terms: string
  lead_time_days: number
  moq: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  tax_codes?: { code: string; rate: number }
}

interface TaxCode {
  id: string
  code: string
  rate: number
  description: string
}

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface SupplierProduct {
  id: string
  product_id: string
  is_default: boolean
  supplier_product_code: string | null
  unit_price: number | null
  lead_time_days: number | null
  moq: number | null
  products?: Product
}

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paramsId, setParamsId] = useState<string>('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<SupplierProduct | null>(null)
  const [productForm, setProductForm] = useState({
    product_id: '',
    is_default: false,
    supplier_product_code: '',
    unit_price: '',
    lead_time_days: '',
    moq: '',
  })
  const router = useRouter()
  const { toast } = useToast()

  // Unwrap params
  useEffect(() => {
    params.then((p) => setParamsId(p.id))
  }, [params])

  // Fetch supplier
  const fetchSupplier = useCallback(async () => {
    if (!paramsId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/planning/suppliers/${paramsId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch supplier')
      }

      const data = await response.json()
      setSupplier(data.supplier)
    } catch (error) {
      console.error('Error fetching supplier:', error)
      toast({
        title: 'Error',
        description: 'Failed to load supplier details',
        variant: 'destructive',
      })
      router.push('/planning/suppliers')
    } finally {
      setLoading(false)
    }
  }, [paramsId, toast, router])

  // Fetch supplier products
  const fetchSupplierProducts = useCallback(async () => {
    if (!paramsId) return

    try {
      const response = await fetch(`/api/planning/suppliers/${paramsId}/products`)

      if (!response.ok) {
        throw new Error('Failed to fetch supplier products')
      }

      const data = await response.json()
      setSupplierProducts(data.supplier_products || [])
    } catch (error) {
      console.error('Error fetching supplier products:', error)
    }
  }, [paramsId])

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products?status=active&limit=1000')

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [])

  // Fetch tax codes
  const fetchTaxCodes = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/tax-codes')

      if (!response.ok) {
        throw new Error('Failed to fetch tax codes')
      }

      const data = await response.json()
      setTaxCodes(data.taxCodes || [])
    } catch (error) {
      console.error('Error fetching tax codes:', error)
    }
  }, [])

  useEffect(() => {
    fetchSupplier()
    fetchSupplierProducts()
    fetchProducts()
    fetchTaxCodes()
  }, [fetchSupplier, fetchSupplierProducts, fetchProducts, fetchTaxCodes])

  // Open assign modal
  const openAssignModal = () => {
    setEditingProduct(null)
    setProductForm({
      product_id: '',
      is_default: false,
      supplier_product_code: '',
      unit_price: '',
      lead_time_days: '',
      moq: '',
    })
    setAssignModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (sp: SupplierProduct) => {
    setEditingProduct(sp)
    setProductForm({
      product_id: sp.product_id,
      is_default: sp.is_default,
      supplier_product_code: sp.supplier_product_code || '',
      unit_price: sp.unit_price?.toString() || '',
      lead_time_days: sp.lead_time_days?.toString() || '',
      moq: sp.moq?.toString() || '',
    })
    setAssignModalOpen(true)
  }

  // Handle product assignment submit
  const handleProductSubmit = async () => {
    if (!paramsId || !productForm.product_id) return

    setSaving(true)
    try {
      const payload = {
        product_id: productForm.product_id,
        is_default: productForm.is_default,
        supplier_product_code: productForm.supplier_product_code || null,
        unit_price: productForm.unit_price ? parseFloat(productForm.unit_price) : null,
        lead_time_days: productForm.lead_time_days
          ? parseInt(productForm.lead_time_days)
          : null,
        moq: productForm.moq ? parseFloat(productForm.moq) : null,
      }

      const response = await fetch(`/api/planning/suppliers/${paramsId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign product')
      }

      toast({
        title: 'Success',
        description: editingProduct ? 'Product updated' : 'Product assigned',
      })

      setAssignModalOpen(false)
      fetchSupplierProducts()
    } catch (error) {
      console.error('Error assigning product:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign product',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (sp: SupplierProduct) => {
    setDeletingProduct(sp)
    setDeleteDialogOpen(true)
  }

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!paramsId || !deletingProduct) return

    try {
      const response = await fetch(
        `/api/planning/suppliers/${paramsId}/products?product_id=${deletingProduct.product_id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove product')
      }

      toast({
        title: 'Success',
        description: 'Product removed from supplier',
      })

      fetchSupplierProducts()
    } catch (error) {
      console.error('Error removing product:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove product',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingProduct(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get available products (not already assigned)
  const availableProducts = products.filter(
    (p: Product) => !supplierProducts.some((sp: SupplierProduct) => sp.product_id === p.id)
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Supplier not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/planning/suppliers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{supplier.name}</h1>
        <Badge variant="outline" className="font-mono">
          {supplier.code}
        </Badge>
        {supplier.is_active ? (
          <Badge className="bg-green-100 text-green-800">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Products ({supplierProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Supplier Information</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Code:</dt>
                  <dd className="font-mono font-medium">{supplier.code}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Name:</dt>
                  <dd className="font-medium">{supplier.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Currency:</dt>
                  <dd className="font-medium">{supplier.currency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Tax Code:</dt>
                  <dd className="font-medium">
                    {supplier.tax_codes?.code} ({supplier.tax_codes?.rate}%)
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Payment Terms:</dt>
                  <dd className="font-medium">{supplier.payment_terms}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Lead Time:</dt>
                  <dd className="font-medium">{supplier.lead_time_days} days</dd>
                </div>
                {supplier.moq && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">MOQ:</dt>
                    <dd className="font-medium">{supplier.moq}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Contact Info */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <dl className="space-y-3">
                {supplier.contact_person && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Contact:</dt>
                    <dd className="font-medium">{supplier.contact_person}</dd>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium">
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.email}
                      </a>
                    </dd>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Phone:</dt>
                    <dd className="font-medium">{supplier.phone}</dd>
                  </div>
                )}
                {supplier.address && (
                  <div>
                    <dt className="text-gray-600 mb-1">Address:</dt>
                    <dd className="text-sm bg-gray-50 p-2 rounded">
                      {supplier.address}
                      {supplier.city && `, ${supplier.city}`}
                      {supplier.postal_code && ` ${supplier.postal_code}`}
                      {supplier.country && `, ${supplier.country}`}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border rounded-lg p-6">
            <dl className="flex gap-8 text-sm text-gray-500">
              <div>
                <dt className="inline">Created:</dt>
                <dd className="inline ml-2">{formatDate(supplier.created_at)}</dd>
              </div>
              <div>
                <dt className="inline">Updated:</dt>
                <dd className="inline ml-2">{formatDate(supplier.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Product Assignments</h2>
            <Button onClick={openAssignModal} disabled={availableProducts.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Product
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Supplier SKU</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No products assigned to this supplier
                    </TableCell>
                  </TableRow>
                ) : (
                  supplierProducts.map((sp: SupplierProduct) => (
                    <TableRow key={sp.id}>
                      <TableCell>
                        <div className="font-mono text-sm">{sp.products?.code}</div>
                        <div className="text-sm text-gray-500">{sp.products?.name}</div>
                      </TableCell>
                      <TableCell>
                        {sp.is_default ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {sp.supplier_product_code || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {sp.unit_price
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: supplier.currency,
                            }).format(sp.unit_price)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {sp.lead_time_days ? `${sp.lead_time_days} days` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {sp.moq ? sp.moq.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(sp)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(sp)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign/Edit Product Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product Assignment' : 'Assign Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product assignment details'
                : 'Assign a product to this supplier with optional pricing and lead time'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={productForm.product_id}
                onValueChange={(value) =>
                  setProductForm((prev: typeof productForm) => ({ ...prev, product_id: value }))
                }
                disabled={!!editingProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {(editingProduct
                    ? products.filter((p) => p.id === editingProduct.product_id)
                    : availableProducts
                  ).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is-default">Default Supplier for this Product</Label>
              <Switch
                id="is-default"
                checked={productForm.is_default}
                onCheckedChange={(checked) =>
                  setProductForm((prev) => ({ ...prev, is_default: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-sku">Supplier SKU</Label>
              <Input
                id="supplier-sku"
                value={productForm.supplier_product_code}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    supplier_product_code: e.target.value,
                  }))
                }
                placeholder="e.g., SKU-001"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-price">Unit Price ({supplier.currency})</Label>
                <Input
                  id="unit-price"
                  type="number"
                  value={productForm.unit_price}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, unit_price: e.target.value }))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-time">Lead Time (days)</Label>
                <Input
                  id="lead-time"
                  type="number"
                  value={productForm.lead_time_days}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      lead_time_days: e.target.value,
                    }))
                  }
                  placeholder="7"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moq">MOQ</Label>
                <Input
                  id="moq"
                  type="number"
                  value={productForm.moq}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, moq: e.target.value }))
                  }
                  placeholder="100"
                  min="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProductSubmit} disabled={saving || !productForm.product_id}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{deletingProduct?.products?.name}&quot; from
              this supplier? The product will no longer be associated with this supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProduct(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
