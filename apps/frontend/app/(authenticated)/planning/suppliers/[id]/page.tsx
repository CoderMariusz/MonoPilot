/**
 * Supplier Detail Page
 * Story: 03.1 - Suppliers CRUD + Master Data
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Tabs: [Products] [Purchase Orders]
 */

'use client'

import { useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Package,
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  Power,
  PowerOff,
  Download,
  Mail,
  Printer,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  SupplierCreateEditModal,
  SupplierProductsTable,
  AssignProductModal,
} from '@/components/planning/suppliers'
import {
  useSupplier,
  useDeactivateSupplier,
  useActivateSupplier,
  useDeleteSupplier,
} from '@/lib/hooks/use-suppliers'
import { useSupplierProducts } from '@/lib/hooks/use-supplier-products'
import type { Supplier } from '@/lib/types/supplier'
import type { SupplierProductWithProduct } from '@/lib/types/supplier-product'

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('products')
  const [assignProductModalOpen, setAssignProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SupplierProductWithProduct | null>(null)

  // Hooks
  const {
    data: supplier,
    isLoading: loadingSupplier,
    error: supplierError,
  } = useSupplier(id)

  const { data: products } = useSupplierProducts(id)

  const deactivate = useDeactivateSupplier()
  const activate = useActivateSupplier()
  const deleteSupplier = useDeleteSupplier()

  // Handlers
  const handleDeactivate = useCallback(async () => {
    if (!supplier) return

    try {
      await deactivate.mutateAsync({ id: supplier.id })
      toast({
        title: 'Success',
        description: `Supplier ${supplier.code} deactivated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deactivate',
        variant: 'destructive',
      })
    }
  }, [supplier, deactivate, toast])

  const handleActivate = useCallback(async () => {
    if (!supplier) return

    try {
      await activate.mutateAsync(supplier.id)
      toast({
        title: 'Success',
        description: `Supplier ${supplier.code} activated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate',
        variant: 'destructive',
      })
    }
  }, [supplier, activate, toast])

  const handleDelete = useCallback(async () => {
    if (!supplier) return

    try {
      await deleteSupplier.mutateAsync(supplier.id)
      toast({
        title: 'Success',
        description: `Supplier ${supplier.code} deleted`,
      })
      router.push('/planning/suppliers')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive',
      })
    }
  }, [supplier, deleteSupplier, toast, router])

  const handleEditSuccess = useCallback(
    (updated: Supplier) => {
      setEditModalOpen(false)
      toast({
        title: 'Success',
        description: `Supplier ${updated.code} updated`,
      })
    },
    [toast]
  )

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null)
    setAssignProductModalOpen(true)
  }, [])

  const handleEditProduct = useCallback((product: SupplierProductWithProduct) => {
    setEditingProduct(product)
    setAssignProductModalOpen(true)
  }, [])

  const handleAssignProductSuccess = useCallback(() => {
    setEditingProduct(null)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get list of already assigned product IDs for exclusion
  const excludeProductIds = products?.map((p) => p.product_id) || []

  // Loading state
  if (loadingSupplier) {
    return (
      <div>
        <PlanningHeader currentPage="suppliers" />
        <div className="container mx-auto py-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>

          {/* Info cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (supplierError || !supplier) {
    return (
      <div>
        <PlanningHeader currentPage="suppliers" />
        <div className="container mx-auto py-6">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold">Failed to Load Supplier</h2>
            <p className="text-muted-foreground mt-2">
              The supplier could not be found or you don&apos;t have permission to view it.
            </p>
            <p className="text-sm text-muted-foreground mt-1">Error: SUPPLIER_NOT_FOUND</p>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => router.push('/planning/suppliers')}>
                Go Back to Supplier List
              </Button>
              <Button variant="outline">Contact Support</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const canDelete = !supplier.has_open_pos && !supplier.products_count && !supplier.purchase_orders_count

  return (
    <div>
      <PlanningHeader currentPage="suppliers" />

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/planning/suppliers')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div data-testid="heading-supplier-detail">
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono">
                  {supplier.code}
                </Badge>
                <Badge
                  variant={supplier.is_active ? 'default' : 'secondary'}
                  className={
                    supplier.is_active
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-800'
                  }
                  role="status"
                  aria-label={supplier.is_active ? 'Active' : 'Inactive'}
                >
                  {supplier.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Supplier
                </DropdownMenuItem>

                {supplier.is_active ? (
                  <DropdownMenuItem
                    onClick={handleDeactivate}
                    disabled={supplier.has_open_pos}
                  >
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate Supplier
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleActivate}>
                    <Power className="mr-2 h-4 w-4" />
                    Activate Supplier
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleAddProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product Assignment
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={!canDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" aria-label="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Master Data Section */}
        <div data-testid="section-master-data">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Contact Person */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium mt-1">
                  {supplier.contact_name || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium mt-1">
                  {supplier.contact_email ? (
                    <a
                      href={`mailto:${supplier.contact_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {supplier.contact_email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium mt-1">
                  {supplier.contact_phone || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>

            {/* Currency */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium mt-1">{supplier.currency}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Address */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium mt-1">
                  {supplier.address || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>

            {/* City */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium mt-1">
                  {supplier.city || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>

            {/* Country */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium mt-1">
                  {supplier.country || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>

            {/* Postal Code */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Postal Code</p>
                <p className="font-medium mt-1">
                  {supplier.postal_code || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Payment Terms */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium mt-1">{supplier.payment_terms}</p>
              </CardContent>
            </Card>

            {/* Tax Code */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Tax Code</p>
                <p className="font-medium mt-1">
                  {supplier.tax_code?.code || supplier.tax_code_id || <span className="text-muted-foreground">-</span>}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {supplier.notes && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="purchase-orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Purchase Orders
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" data-testid="section-products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Products ({products?.length || 0})</CardTitle>
                <Button size="sm" onClick={handleAddProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <SupplierProductsTable
                  supplierId={id}
                  supplierCurrency={supplier.currency}
                  onEdit={handleEditProduct}
                  onAddProduct={handleAddProduct}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="purchase-orders" data-testid="section-po-history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Purchase Orders</CardTitle>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create PO
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Purchase Orders Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    There are no purchase orders from this supplier.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Create your first PO to start ordering.
                  </p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Purchase Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
          {supplier.contact_email && (
            <Button variant="outline" asChild>
              <a href={`mailto:${supplier.contact_email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email Supplier
              </a>
            </Button>
          )}
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            View All Products
          </Button>
        </div>

        {/* Timestamps */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {formatDate(supplier.created_at)}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {formatDate(supplier.updated_at)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Supplier Modal */}
      <SupplierCreateEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        supplier={supplier}
        onSuccess={handleEditSuccess}
      />

      {/* Assign Product Modal */}
      <AssignProductModal
        supplierId={id}
        open={assignProductModalOpen}
        onOpenChange={setAssignProductModalOpen}
        onSuccess={handleAssignProductSuccess}
        excludeProductIds={excludeProductIds}
        editingProduct={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete supplier{' '}
              <strong>
                {supplier.code} ({supplier.name})
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplier.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
