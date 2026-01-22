/**
 * RMA List Page
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * Main RMA list page with:
 * - DataTable with search, filters, sorting
 * - Create/Edit modal
 * - Approval workflow
 * - Delete confirmation
 * - All 4 states: loading, error, empty, success
 * - Keyboard navigation
 *
 * Wireframe: RMA-001
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, WifiOff, PackageX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  RMADataTable,
  type RMAListItem,
} from '@/components/shipping/rma/RMADataTable'
import {
  RMAModal,
  type RMAFormData,
  type Customer,
  type Product,
  type SalesOrder,
} from '@/components/shipping/rma/RMAModal'
import {
  useRMAs,
  useCreateRMA,
  useUpdateRMA,
  useDeleteRMA,
  useApproveRMA,
  type RMADetail,
} from '@/lib/hooks/use-rma'
import { useCustomers } from '@/lib/hooks/use-customers'
import { usePermissions } from '@/lib/hooks/use-permissions'
import type { RMAListParams, RMAStatus } from '@/lib/validation/rma-schemas'
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

export default function RMAPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [params, setParams] = useState<RMAListParams>({
    page: Number(searchParams.get('page')) || 1,
    limit: 25,
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as RMAStatus) || undefined,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  })
  const [showModal, setShowModal] = useState(false)
  const [editingRMA, setEditingRMA] = useState<RMADetail | null>(null)
  const [deleteRMAId, setDeleteRMAId] = useState<string | null>(null)
  const [approveRMAId, setApproveRMAId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Queries and mutations
  const { data, isLoading, error, refetch } = useRMAs(params)
  const { data: customersData } = useCustomers({ limit: 100 })
  const createMutation = useCreateRMA()
  const updateMutation = useUpdateRMA()
  const deleteMutation = useDeleteRMA()
  const approveMutation = useApproveRMA()

  // Permissions
  const { can } = usePermissions()
  const canCreate = can('shipping', 'C')
  const canEdit = can('shipping', 'U')
  const canDelete = can('shipping', 'D')
  // Approve requires at least update permission (Manager+ roles)
  const canApprove = can('shipping', 'U')

  const rmas: RMAListItem[] = data?.rmas || []
  const customers: Customer[] = (customersData?.data || []).map(
    (c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
    })
  )

  // Mock products and sales orders for now - would come from API
  const products: Product[] = []
  const salesOrders: SalesOrder[] = []

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync URL with filters
  useEffect(() => {
    const urlParams = new URLSearchParams()
    if (params.search) urlParams.set('search', params.search)
    if (params.status) urlParams.set('status', params.status)
    if (params.page && params.page > 1)
      urlParams.set('page', params.page.toString())
    if (params.sort_by && params.sort_by !== 'created_at')
      urlParams.set('sort_by', params.sort_by)
    if (params.sort_order && params.sort_order !== 'desc')
      urlParams.set('sort_order', params.sort_order)

    const newUrl = urlParams.toString()
      ? `?${urlParams.toString()}`
      : '/shipping/rma'
    router.replace(newUrl, { scroll: false })
  }, [params, router])

  // Handlers
  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setParams((prev) => ({ ...prev, sort_by: field, sort_order: order }))
  }, [])

  const handleView = useCallback(
    (id: string) => {
      router.push(`/shipping/rma/${id}`)
    },
    [router]
  )

  const handleEdit = useCallback(
    (id: string) => {
      const rma = rmas.find((r) => r.id === id)
      if (rma && rma.status === 'pending') {
        // For now, just open modal - would fetch full detail in real app
        setEditingRMA(null)
        setShowModal(true)
      }
    },
    [rmas]
  )

  const handleCreate = useCallback(() => {
    setEditingRMA(null)
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingRMA(null)
  }, [])

  const handleSubmit = useCallback(
    async (formData: RMAFormData) => {
      if (editingRMA) {
        await updateMutation.mutateAsync({
          id: editingRMA.id,
          data: {
            reason_code: formData.reason_code,
            disposition: formData.disposition,
            notes: formData.notes,
          },
        })
        toast({
          title: 'Success',
          description: 'RMA updated successfully',
        })
      } else {
        await createMutation.mutateAsync(formData)
        toast({
          title: 'Success',
          description: 'RMA created successfully',
        })
      }
    },
    [editingRMA, createMutation, updateMutation, toast]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteRMAId) return

    try {
      await deleteMutation.mutateAsync(deleteRMAId)
      toast({
        title: 'Success',
        description: 'RMA deleted successfully',
      })
      setDeleteRMAId(null)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete RMA'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [deleteRMAId, deleteMutation, toast])

  const handleApprove = useCallback(async () => {
    if (!approveRMAId) return

    try {
      await approveMutation.mutateAsync(approveRMAId)
      toast({
        title: 'Success',
        description: 'RMA approved successfully',
      })
      setApproveRMAId(null)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve RMA'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [approveRMAId, approveMutation, toast])

  // Keyboard navigation for page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to create new RMA
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleCreate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCreate])

  // Offline state
  if (isOffline) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Returns (RMA)</h1>
            <p className="text-muted-foreground">
              Manage customer return requests
            </p>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center py-16 border rounded-lg"
          data-testid="error-offline"
        >
          <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No Internet Connection</h2>
          <p className="text-muted-foreground mt-2">
            Please check your connection and try again.
          </p>
          <Button
            className="mt-6"
            onClick={() => refetch()}
            data-testid="button-retry"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Returns (RMA)</h1>
            <p className="text-muted-foreground">
              Manage customer return requests
            </p>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center py-16 border rounded-lg"
          data-testid="error-state"
        >
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <PackageX className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold">Failed to Load RMAs</h2>
          <p className="text-muted-foreground mt-2">
            Unable to retrieve RMA data. Please try again.
          </p>
          <div className="flex gap-4 mt-6">
            <Button onClick={() => refetch()} data-testid="button-retry">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Returns (RMA)</h1>
          <p className="text-muted-foreground">
            Manage customer return requests and approvals
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} data-testid="button-create-rma">
            <Plus className="h-4 w-4 mr-2" />
            Create RMA
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{data.stats.pending_count}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">{data.stats.approved_count}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{data.stats.total_count}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <RMADataTable
        data={rmas}
        loading={isLoading}
        error={error ? 'Failed to load RMAs' : null}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteRMAId(id)}
        onApprove={(id) => setApproveRMAId(id)}
        onSort={handleSort}
        onCreate={handleCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canApprove={canApprove}
        sortBy={params.sort_by}
        sortOrder={params.sort_order}
      />

      {/* Create/Edit Modal */}
      <RMAModal
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        mode={editingRMA ? 'edit' : 'create'}
        initialData={
          editingRMA
            ? {
                customer_id: editingRMA.customer_id,
                sales_order_id: editingRMA.sales_order_id,
                reason_code: editingRMA.reason_code,
                disposition: editingRMA.disposition,
                notes: editingRMA.notes,
                lines: editingRMA.lines.map((l) => ({
                  product_id: l.product_id,
                  quantity_expected: l.quantity_expected,
                  lot_number: l.lot_number,
                  reason_notes: l.reason_notes,
                  disposition: l.disposition,
                })),
              }
            : undefined
        }
        customers={customers}
        products={products}
        salesOrders={salesOrders}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteRMAId}
        onOpenChange={() => setDeleteRMAId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RMA?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the RMA
              and all associated line items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation */}
      <AlertDialog
        open={!!approveRMAId}
        onOpenChange={() => setApproveRMAId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve RMA?</AlertDialogTitle>
            <AlertDialogDescription>
              Approving this RMA will enable the receiving workflow. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
