/**
 * Purchase Orders List Page
 * Story 03.3: PO CRUD + Lines
 * Story 03.6: PO Bulk Operations
 * AC-01-1: View purchase orders list
 * AC-01-2: Search POs by number or supplier
 * AC-01-3: Filter by status
 * AC-03: Import wizard
 * AC-04: Export to Excel
 * AC-05: Bulk status updates
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  POKPICards,
  POFilters,
  PODataTable,
  POEmptyState,
  POErrorState,
  POCancelConfirmDialog,
  PODeleteConfirmDialog,
  ImportWizard,
  POExportDialog,
  POBulkActionsBar,
} from '@/components/planning/purchase-orders'
import { usePurchaseOrders, useSubmitPO, useCancelPO, useDeletePO } from '@/lib/hooks/use-purchase-orders'
import { useSuppliers } from '@/lib/hooks/use-suppliers'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { usePOSelection } from '@/lib/hooks/use-po-selection'
import type { POListItem, POFilterParams, POStatus } from '@/lib/types/purchase-order'
import type { BulkCreatePOResult } from '@/lib/types/po-bulk'

// Pagination component
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Filters state
  const [filters, setFilters] = useState<POFilterParams>({
    status: [],
    supplier_id: null,
    warehouse_id: null,
    date_range: null,
    from_date: null,
    to_date: null,
    search: '',
  })
  const [page, setPage] = useState(1)
  const limit = 20

  // Cancel/Delete dialogs
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; po: POListItem | null }>({
    isOpen: false,
    po: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; po: POListItem | null }>({
    isOpen: false,
    po: null,
  })

  // Story 03.6: Import/Export dialogs
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // Fetch data
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers({})
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses({})
  const { data: posData, isLoading, error, refetch } = usePurchaseOrders({
    search: filters.search || undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    supplier_id: filters.supplier_id || undefined,
    warehouse_id: filters.warehouse_id || undefined,
    from_date: filters.from_date || undefined,
    to_date: filters.to_date || undefined,
    page,
    limit,
    sort: 'created_at',
    order: 'desc',
  })

  const pos = posData?.data || []
  const totalPages = posData?.meta?.pages || 1
  const totalCount = posData?.meta?.total || 0

  // Story 03.6: Selection state for bulk operations
  const {
    selectedIds,
    selectedStatuses,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
  } = usePOSelection(pos)

  // Mutations
  const submitPO = useSubmitPO()
  const cancelPO = useCancelPO()
  const deletePO = useDeletePO()

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<POFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page on filter change
    clearSelection() // Clear selection on filter change
  }, [clearSelection])

  const handleKPICardClick = useCallback(
    ({ type }: { type: 'open' | 'pending_approval' | 'overdue' | 'this_month' }) => {
      switch (type) {
        case 'open':
          setFilters((prev) => ({
            ...prev,
            status: ['draft', 'submitted', 'pending_approval', 'approved', 'confirmed', 'receiving'],
          }))
          break
        case 'pending_approval':
          setFilters((prev) => ({ ...prev, status: ['pending_approval'] }))
          break
        case 'overdue':
          // Would need to implement overdue filter logic
          break
        case 'this_month':
          setFilters((prev) => ({ ...prev, date_range: 'this_month' }))
          break
      }
      setPage(1)
      clearSelection()
    },
    [clearSelection]
  )

  const handleRowClick = useCallback(
    (po: POListItem) => {
      router.push(`/planning/purchase-orders/${po.id}`)
    },
    [router]
  )

  const handleEdit = useCallback(
    (po: POListItem) => {
      router.push(`/planning/purchase-orders/${po.id}?edit=true`)
    },
    [router]
  )

  const handleSubmit = useCallback(
    async (po: POListItem) => {
      try {
        await submitPO.mutateAsync(po.id)
        toast({
          title: 'Success',
          description: `${po.po_number} has been submitted`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to submit PO',
          variant: 'destructive',
        })
      }
    },
    [submitPO, toast]
  )

  const handleCancelClick = useCallback((po: POListItem) => {
    setCancelDialog({ isOpen: true, po })
  }, [])

  const handleCancelConfirm = useCallback(
    async (reason?: string) => {
      if (!cancelDialog.po) return
      try {
        await cancelPO.mutateAsync({ id: cancelDialog.po.id, reason })
        toast({
          title: 'Success',
          description: `${cancelDialog.po.po_number} has been cancelled`,
        })
        setCancelDialog({ isOpen: false, po: null })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to cancel PO',
          variant: 'destructive',
        })
      }
    },
    [cancelDialog.po, cancelPO, toast]
  )

  const handleDeleteClick = useCallback((po: POListItem) => {
    setDeleteDialog({ isOpen: true, po })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.po) return
    try {
      await deletePO.mutateAsync(deleteDialog.po.id)
      toast({
        title: 'Success',
        description: `${deleteDialog.po.po_number} has been deleted`,
      })
      setDeleteDialog({ isOpen: false, po: null })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete PO',
        variant: 'destructive',
      })
    }
  }, [deleteDialog.po, deletePO, toast])

  const handleDuplicate = useCallback(
    (po: POListItem) => {
      // Navigate to create with source PO
      router.push(`/planning/purchase-orders/new?duplicate=${po.id}`)
    },
    [router]
  )

  const handlePrint = useCallback((po: POListItem) => {
    window.print() // Basic print for now
  }, [])

  const handleCreate = useCallback(() => {
    router.push('/planning/purchase-orders/new')
  }, [router])

  // Story 03.6: Import/Export handlers
  const handleImport = useCallback(() => {
    setIsImportWizardOpen(true)
  }, [])

  const handleImportComplete = useCallback(
    (result: BulkCreatePOResult) => {
      toast({
        title: 'Import Complete',
        description: `${result.pos_created.length} PO(s) created successfully`,
      })
      refetch()
    },
    [toast, refetch]
  )

  const handleExport = useCallback(() => {
    setIsExportDialogOpen(true)
  }, [])

  const handleGoToSuppliers = useCallback(() => {
    router.push('/planning/suppliers')
  }, [router])

  // Story 03.6: Row selection handler
  const handleRowSelect = useCallback(
    (po: POListItem, checked: boolean) => {
      toggleSelection(po.id, po.status)
    },
    [toggleSelection]
  )

  const handleSelectAll = useCallback(() => {
    toggleAll(pos)
  }, [toggleAll, pos])

  // Render states
  if (error) {
    return (
      <div>
        <PlanningHeader currentPage="po" />
        <div className="px-6 py-6">
          <POErrorState
            onRetry={() => refetch()}
            onContactSupport={() => window.open('/support', '_blank')}
          />
        </div>
      </div>
    )
  }

  const isEmpty = !isLoading && pos.length === 0 && !filters.search && filters.status.length === 0

  return (
    <div>
      <PlanningHeader currentPage="po" />

      <div className="px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground text-sm">
              Manage and track purchase orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleImport} className="gap-2">
              <Upload className="h-4 w-4" />
              Import POs
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <POKPICards onCardClick={handleKPICardClick} />

        {/* Filters */}
        <POFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          suppliers={suppliers?.data || []}
          isLoadingSuppliers={isLoadingSuppliers}
        />

        {/* Story 03.6: Bulk Actions Bar */}
        {selectedCount > 0 && (
          <POBulkActionsBar
            selectedIds={selectedIds}
            selectedStatuses={selectedStatuses}
            onExport={handleExport}
            onClearSelection={clearSelection}
          />
        )}

        {/* Content */}
        {isEmpty ? (
          <POEmptyState
            onCreateClick={handleCreate}
            onImportClick={handleImport}
            onSuppliersClick={handleGoToSuppliers}
          />
        ) : (
          <>
            <PODataTable
              data={pos}
              isLoading={isLoading}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onSubmit={handleSubmit}
              onCancel={handleCancelClick}
              onDuplicate={handleDuplicate}
              onPrint={handlePrint}
              // Story 03.6: Selection props
              selectable={true}
              selectedIds={selectedIds}
              onRowSelect={handleRowSelect}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Dialogs */}
      <POCancelConfirmDialog
        isOpen={cancelDialog.isOpen}
        poNumber={cancelDialog.po?.po_number || ''}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelDialog({ isOpen: false, po: null })}
      />
      <PODeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        poNumber={deleteDialog.po?.po_number || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, po: null })}
      />

      {/* Story 03.6: Import Wizard */}
      <ImportWizard
        open={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
        onComplete={handleImportComplete}
      />

      {/* Story 03.6: Export Dialog */}
      <POExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        selectedPoIds={selectedIds}
        totalPoCount={totalCount}
        filters={{
          status: filters.status.length > 0 ? filters.status : undefined,
          supplier_id: filters.supplier_id || undefined,
          date_from: filters.from_date || undefined,
          date_to: filters.to_date || undefined,
        }}
      />
    </div>
  )
}
