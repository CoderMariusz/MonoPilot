/**
 * Transfer Order Detail Page
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays TO detail with header info and line items
 */

'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Copy,
  Printer,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  TOHeader,
  TOLinesDataTable,
  ReleaseConfirmDialog,
  CancelConfirmDialog,
} from '@/components/planning/transfer-orders'
import { TransferOrderFormModal } from '@/components/planning/TransferOrderFormModal'
import { useTransferOrder } from '@/lib/hooks/use-transfer-order'
import {
  useReleaseTransferOrder,
  useCancelTransferOrder,
} from '@/lib/hooks/use-transfer-order-mutations'
import { canEditTO, canModifyLines, canRelease, canCancel } from '@/lib/types/transfer-order'
import { useToast } from '@/hooks/use-toast'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TransferOrderDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Data hooks
  const { data: transferOrder, isLoading, isError, refetch } = useTransferOrder(id)
  const releaseMutation = useReleaseTransferOrder()
  const cancelMutation = useCancelTransferOrder()
  const { toast } = useToast()

  // Calculate permissions
  const isEditable = transferOrder ? canEditTO(transferOrder.status) : false
  const linesEditable = transferOrder ? canModifyLines(transferOrder.status) : false
  const canReleaseTO = transferOrder
    ? canRelease(transferOrder.status, transferOrder.lines?.length || 0)
    : false
  const canCancelTO = transferOrder ? canCancel(transferOrder.status) : false

  // Handle release
  const handleRelease = async () => {
    if (!transferOrder) return

    try {
      await releaseMutation.mutateAsync({ id: transferOrder.id })
      toast({ title: 'Success', description: `${transferOrder.to_number} released successfully` })
      setReleaseDialogOpen(false)
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release transfer order',
        variant: 'destructive',
      })
    }
  }

  // Handle cancel
  const handleCancel = async (reason?: string) => {
    if (!transferOrder) return

    try {
      await cancelMutation.mutateAsync({ id: transferOrder.id, reason })
      toast({ title: 'Success', description: `${transferOrder.to_number} cancelled` })
      setCancelDialogOpen(false)
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel transfer order',
        variant: 'destructive',
      })
    }
  }

  // Handle form success
  const handleFormSuccess = () => {
    setEditModalOpen(false)
    refetch()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PlanningHeader currentPage="to" />
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Back button skeleton */}
          <Skeleton className="h-9 w-24" />

          {/* Header skeleton */}
          <div className="border rounded-lg bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>

          {/* Lines skeleton */}
          <div className="border rounded-lg bg-white p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !transferOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PlanningHeader currentPage="to" />
        <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Transfer Order Not Found
            </h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              The transfer order you&apos;re looking for doesn&apos;t exist or you don&apos;t
              have permission to view it.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button asChild>
                <Link href="/planning/transfer-orders">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to List
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlanningHeader currentPage="to" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/planning/transfer-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transfer Orders
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {/* Edit button - only for draft status */}
            {transferOrder.status === 'draft' && (
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            {/* Release button - only for draft with lines */}
            {canReleaseTO && (
              <Button size="sm" onClick={() => setReleaseDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Release TO
              </Button>
            )}

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate TO
                </DropdownMenuItem>
                {canCancelTO && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setCancelDialogOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel TO
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* TO Header */}
        <TOHeader transferOrder={transferOrder} />

        {/* TO Lines */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <TOLinesDataTable
            toId={transferOrder.id}
            lines={transferOrder.lines || []}
            status={transferOrder.status}
            onRefresh={refetch}
            canEdit={linesEditable}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <TransferOrderFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleFormSuccess}
          transferOrder={transferOrder}
        />
      )}

      {/* Release Confirmation Dialog */}
      <ReleaseConfirmDialog
        open={releaseDialogOpen}
        onClose={() => setReleaseDialogOpen(false)}
        toNumber={transferOrder.to_number}
        linesCount={transferOrder.lines?.length || 0}
        onConfirm={handleRelease}
        isLoading={releaseMutation.isPending}
      />

      {/* Cancel Confirmation Dialog */}
      <CancelConfirmDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        toNumber={transferOrder.to_number}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}
