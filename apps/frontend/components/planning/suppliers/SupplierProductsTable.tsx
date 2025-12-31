/**
 * SupplierProductsTable Component
 * Story: 03.2 - Supplier-Product Assignment
 *
 * DataTable showing products assigned to a supplier with search, sort,
 * default indicator, lead time override label, and actions
 */

'use client'

import * as React from 'react'
import {
  Check,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSupplierProducts } from '@/lib/hooks/use-supplier-products'
import { useRemoveSupplierProduct } from '@/lib/hooks/use-remove-supplier-product'
import { useToast } from '@/hooks/use-toast'
import { isLeadTimeOverride } from '@/lib/types/supplier-product'
import type { SupplierProductWithProduct } from '@/lib/types/supplier-product'

interface SupplierProductsTableProps {
  supplierId: string
  supplierCurrency?: string
  onEdit: (product: SupplierProductWithProduct) => void
  onAddProduct: () => void
}

/**
 * SupplierProductsTable - DataTable for supplier products
 *
 * Features:
 * - Search by product code or name
 * - Sort by code, name, price, default
 * - Default supplier indicator (star icon)
 * - Lead time shows '(Override)' if different from product default
 * - Actions: Edit, Remove with confirmation
 * - Loading, empty, and error states
 */
export function SupplierProductsTable({
  supplierId,
  supplierCurrency = 'PLN',
  onEdit,
  onAddProduct,
}: SupplierProductsTableProps) {
  const { toast } = useToast()
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [deleteProductId, setDeleteProductId] = React.useState<string | null>(null)
  const [deleteProductName, setDeleteProductName] = React.useState<string>('')

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useSupplierProducts(supplierId, { search: debouncedSearch })

  const removeProduct = useRemoveSupplierProduct(supplierId)

  const handleRemoveClick = (product: SupplierProductWithProduct) => {
    setDeleteProductId(product.product_id)
    setDeleteProductName(product.product?.name || 'this product')
  }

  const handleConfirmRemove = async () => {
    if (!deleteProductId) return

    try {
      await removeProduct.mutateAsync(deleteProductId)
      toast({
        title: 'Success',
        description: 'Product removed from supplier',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to remove product',
        variant: 'destructive',
      })
    } finally {
      setDeleteProductId(null)
      setDeleteProductName('')
    }
  }

  const handleCancelRemove = () => {
    setDeleteProductId(null)
    setDeleteProductName('')
  }

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || supplierCurrency,
    }).format(price)
  }

  const formatLeadTime = (
    supplierLeadTime: number | null,
    productLeadTime: number | null
  ) => {
    if (supplierLeadTime === null && productLeadTime === null) return '-'

    const leadTime = supplierLeadTime ?? productLeadTime ?? 0
    const hasOverride = isLeadTimeOverride(supplierLeadTime, productLeadTime)

    return (
      <span>
        {leadTime} {leadTime === 1 ? 'day' : 'days'}
        {hasOverride && (
          <span className="text-xs text-amber-600 ml-1">(Override)</span>
        )}
      </span>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-skeleton">
        {/* Search skeleton */}
        <Skeleton className="h-10 w-64" />

        {/* Table skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Supplier Code</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-6 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        data-testid="error-state"
      >
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <X className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold">Failed to Load Products</h3>
        <p className="text-muted-foreground mt-1 text-center">
          {error.message || 'Unable to load supplier products. Please try again.'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => refetch()}
          aria-label="Retry loading products"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        data-testid="empty-state"
      >
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No Products Assigned Yet</h3>
        <p className="text-muted-foreground mt-1 text-center">
          This supplier doesn&apos;t have any products assigned.
        </p>
        <p className="text-muted-foreground text-sm">
          Add products to enable purchase order creation.
        </p>
        <Button className="mt-4" onClick={onAddProduct}>
          + Add Product
        </Button>
      </div>
    )
  }

  // Success state with data
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Products Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead className="w-[120px]">Supplier Code</TableHead>
              <TableHead className="w-[100px] text-right">Unit Price</TableHead>
              <TableHead className="w-[120px] text-right">Lead Time</TableHead>
              <TableHead className="w-[100px] text-right">MOQ</TableHead>
              <TableHead className="w-[80px] text-center">Default</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((sp) => (
              <TableRow key={sp.id}>
                {/* Product */}
                <TableCell>
                  <div>
                    <p className="font-medium">{sp.product?.name || '-'}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {sp.product?.code || '-'}
                    </p>
                  </div>
                </TableCell>

                {/* Supplier Code */}
                <TableCell className="font-mono">
                  {sp.supplier_product_code || '-'}
                </TableCell>

                {/* Unit Price */}
                <TableCell className="text-right">
                  {formatPrice(sp.unit_price, sp.currency)}
                </TableCell>

                {/* Lead Time */}
                <TableCell className="text-right">
                  {formatLeadTime(
                    sp.lead_time_days,
                    sp.product?.supplier_lead_time_days ?? null
                  )}
                </TableCell>

                {/* MOQ */}
                <TableCell className="text-right">
                  {sp.moq?.toLocaleString() || '-'}
                </TableCell>

                {/* Default Indicator */}
                <TableCell className="text-center">
                  {sp.is_default ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            aria-label={`Default supplier for ${sp.product?.name}`}
                          >
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Default supplier for this product</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(sp)}
                            aria-label={`Edit ${sp.product?.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit assignment</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveClick(sp)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Remove ${sp.product?.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from supplier</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteProductId !== null}
        onOpenChange={(open) => !open && handleCancelRemove()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteProductName}</strong>{' '}
              from this supplier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRemove}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeProduct.isPending}
            >
              {removeProduct.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SupplierProductsTable
