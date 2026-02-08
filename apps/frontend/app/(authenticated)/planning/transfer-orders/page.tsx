/**
 * Transfer Orders List Page
 * Story 03.8: Transfer Orders CRUD + Lines
 * AC-3.6.1: Display transfer orders with filters
 * AC-3.6.2: Create new transfer order
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  TOKPICards,
  TransferOrdersDataTable,
  ReleaseConfirmDialog,
  CancelConfirmDialog,
} from '@/components/planning/transfer-orders'
import { TransferOrderFormModal } from '@/components/planning/TransferOrderFormModal'
import { useTOSummary } from '@/lib/hooks/use-transfer-orders'
import {
  useReleaseTransferOrder,
  useCancelTransferOrder,
} from '@/lib/hooks/use-transfer-order-mutations'
import type { TransferOrderWithWarehouses, TOStatus, TOListParams } from '@/lib/types/transfer-order'
import { useToast } from '@/hooks/use-toast'

export default function TransferOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingTO, setEditingTO] = useState<TransferOrderWithWarehouses | null>(null)
  const [releaseTO, setReleaseTO] = useState<TransferOrderWithWarehouses | null>(null)
  const [cancelTO, setCancelTO] = useState<TransferOrderWithWarehouses | null>(null)

  // Data hooks
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useTOSummary()
  const releaseMutation = useReleaseTransferOrder()
  const cancelMutation = useCancelTransferOrder()
  const { toast } = useToast()

  // Get initial filters from URL
  const getInitialFilters = (): Partial<TOListParams> => {
    const filters: Partial<TOListParams> = {}
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    if (status) filters.status = status as TOStatus
    if (priority) filters.priority = priority as any
    if (search) filters.search = search

    return filters
  }

  // Handle KPI card click to filter
  const handleKPICardClick = useCallback(
    (filter: 'open' | 'in_transit' | 'overdue' | 'this_week') => {
      const params = new URLSearchParams()
      switch (filter) {
        case 'open':
          // Open = not closed and not cancelled
          // Will need to filter in component
          break
        case 'in_transit':
          params.set('status', 'shipped')
          break
        case 'overdue':
          // Overdue = past ship date + draft/planned
          params.set('status', 'draft')
          break
        case 'this_week':
          // This week = created this week
          break
      }
      // Update URL with filter
      const queryString = params.toString()
      router.push(`/planning/transfer-orders${queryString ? `?${queryString}` : ''}`)
    },
    [router]
  )

  // Handle action=create query parameter to open create form
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingTO(null)
      setFormModalOpen(true)
      // Clean up URL by removing action param
      const params = new URLSearchParams(searchParams)
      params.delete('action')
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  // Handle create click
  const handleCreateClick = useCallback(() => {
    setEditingTO(null)
    setFormModalOpen(true)
  }, [])

  // Handle edit click
  const handleEditClick = useCallback((to: TransferOrderWithWarehouses) => {
    setEditingTO(to)
    setFormModalOpen(true)
  }, [])

  // Handle release click
  const handleReleaseClick = useCallback((to: TransferOrderWithWarehouses) => {
    setReleaseTO(to)
  }, [])

  // Handle cancel click
  const handleCancelClick = useCallback((to: TransferOrderWithWarehouses) => {
    setCancelTO(to)
  }, [])

  // Handle release confirm
  const handleReleaseConfirm = async () => {
    if (!releaseTO) return

    try {
      await releaseMutation.mutateAsync({ id: releaseTO.id })
      toast({ title: 'Success', description: `${releaseTO.to_number} released successfully` })
      setReleaseTO(null)
      refetchSummary()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release transfer order',
        variant: 'destructive',
      })
    }
  }

  // Handle cancel confirm
  const handleCancelConfirm = async (reason?: string) => {
    if (!cancelTO) return

    try {
      await cancelMutation.mutateAsync({ id: cancelTO.id, reason })
      toast({ title: 'Success', description: `${cancelTO.to_number} cancelled` })
      setCancelTO(null)
      refetchSummary()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel transfer order',
        variant: 'destructive',
      })
    }
  }

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    setFormModalOpen(false)
    setEditingTO(null)
    refetchSummary()
    // Navigate to detail page for new TOs
    if (!editingTO) {
      // Could navigate to the new TO, but for now just close the modal
    }
  }, [editingTO, refetchSummary])

  return (
    <div className="min-h-screen bg-gray-50" data-testid="transfer-orders-page">
      <PlanningHeader currentPage="to" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="transfer-orders-header">Transfer Orders</h1>
            <p className="text-gray-500 text-sm">
              Manage warehouse transfer orders
            </p>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <TOKPICards
          summary={summary}
          loading={summaryLoading}
          onCardClick={handleKPICardClick}
        />

        {/* Data Table */}
        <div className="bg-white rounded-lg border p-4 sm:p-6" data-testid="transfer-orders-table">
          <TransferOrdersDataTable
            initialFilters={getInitialFilters()}
            onCreateClick={handleCreateClick}
            onEditClick={handleEditClick}
            onReleaseClick={handleReleaseClick}
            onCancelClick={handleCancelClick}
            canCreate={true}
            canEdit={true}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {formModalOpen && (
        <TransferOrderFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setEditingTO(null)
          }}
          onSuccess={handleFormSuccess}
          transferOrder={editingTO}
        />
      )}

      {/* Release Confirmation Dialog */}
      {releaseTO && (
        <ReleaseConfirmDialog
          open={!!releaseTO}
          onClose={() => setReleaseTO(null)}
          toNumber={releaseTO.to_number}
          linesCount={releaseTO.lines_count || 0}
          onConfirm={handleReleaseConfirm}
          isLoading={releaseMutation.isPending}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTO && (
        <CancelConfirmDialog
          open={!!cancelTO}
          onClose={() => setCancelTO(null)}
          toNumber={cancelTO.to_number}
          onConfirm={handleCancelConfirm}
          isLoading={cancelMutation.isPending}
        />
      )}
    </div>
  )
}
