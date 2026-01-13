/**
 * Purchase Order Details Page
 * Story 03.3: PO CRUD + Lines
 * Display PO header information with tabs: Lines, History, Documents, Receiving
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  POHeader,
  POLinesDataTable,
  POTotalsPanel,
  POStatusTimeline,
  POActionsBar,
  POErrorState,
  POCancelConfirmDialog,
  POLineModal,
} from '@/components/planning/purchase-orders'
import {
  usePurchaseOrder,
  usePOStatusHistory,
  useSubmitPO,
  useConfirmPO,
  useCancelPO,
  useApprovePO,
  useRejectPO,
  useAddPOLine,
  useUpdatePOLine,
  useDeletePOLine,
} from '@/lib/hooks/use-purchase-orders'
import { useTaxCodes } from '@/lib/hooks/use-tax-codes'
import { Skeleton } from '@/components/ui/skeleton'
import type { POLine, CreatePOLineInput, POStatus } from '@/lib/types/purchase-order'
import { canEditPOLines, calculatePOTotals } from '@/lib/types/purchase-order'

export default function PurchaseOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [paramsId, setParamsId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('lines')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog states
  const [cancelDialog, setCancelDialog] = useState(false)
  const [lineModal, setLineModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    line: POLine | null
  }>({
    isOpen: false,
    mode: 'add',
    line: null,
  })

  // Unwrap params
  useEffect(() => {
    params.then((p) => setParamsId(p.id))
  }, [params])

  // Fetch data
  const { data: po, isLoading, error, refetch } = usePurchaseOrder(paramsId)
  const { data: history, isLoading: historyLoading } = usePOStatusHistory(paramsId)
  const { data: taxCodesData } = useTaxCodes()
  const taxCodes = taxCodesData?.data || []

  // Mutations
  const submitPO = useSubmitPO()
  const confirmPO = useConfirmPO()
  const cancelPO = useCancelPO()
  const approvePO = useApprovePO()
  const rejectPO = useRejectPO()
  const addLine = useAddPOLine()
  const updateLine = useUpdatePOLine()
  const deleteLine = useDeletePOLine()

  // Handlers
  const handleEdit = useCallback(() => {
    // For now, just reload with edit mode
    router.push(`/planning/purchase-orders/${paramsId}?edit=true`)
  }, [router, paramsId])

  const handleSubmit = useCallback(async () => {
    if (!po) return
    setIsSubmitting(true)
    try {
      await submitPO.mutateAsync(po.id)
      toast({
        title: 'Success',
        description: 'Purchase order submitted',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [po, submitPO, toast, refetch])

  const handleApprove = useCallback(async () => {
    if (!po) return
    setIsSubmitting(true)
    try {
      await approvePO.mutateAsync({ id: po.id })
      toast({
        title: 'Success',
        description: 'Purchase order approved',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [po, approvePO, toast, refetch])

  const handleReject = useCallback(async () => {
    if (!po) return
    setIsSubmitting(true)
    try {
      await rejectPO.mutateAsync({ id: po.id, reason: 'Rejected' })
      toast({
        title: 'Success',
        description: 'Purchase order rejected',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [po, rejectPO, toast, refetch])

  const handleConfirm = useCallback(async () => {
    if (!po) return
    setIsSubmitting(true)
    try {
      await confirmPO.mutateAsync(po.id)
      toast({
        title: 'Success',
        description: 'Purchase order confirmed',
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [po, confirmPO, toast, refetch])

  const handleCancelConfirm = useCallback(
    async (reason?: string) => {
      if (!po) return
      try {
        await cancelPO.mutateAsync({ id: po.id, reason })
        toast({
          title: 'Success',
          description: 'Purchase order cancelled',
        })
        setCancelDialog(false)
        refetch()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to cancel',
          variant: 'destructive',
        })
      }
    },
    [po, cancelPO, toast, refetch]
  )

  const handleDuplicate = useCallback(() => {
    router.push(`/planning/purchase-orders/new?duplicate=${paramsId}`)
  }, [router, paramsId])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleExportPDF = useCallback(() => {
    toast({
      title: 'Coming Soon',
      description: 'PDF export is coming soon',
    })
  }, [toast])

  const handleEmailSupplier = useCallback(() => {
    toast({
      title: 'Coming Soon',
      description: 'Email supplier is coming soon',
    })
  }, [toast])

  const handleGoToReceiving = useCallback(() => {
    router.push(`/warehouse/receiving?po_id=${paramsId}`)
  }, [router, paramsId])

  // Line handlers
  const handleAddLine = useCallback(() => {
    setLineModal({ isOpen: true, mode: 'add', line: null })
  }, [])

  const handleEditLine = useCallback(
    (lineId: string) => {
      const line = po?.lines.find((l) => l.id === lineId)
      if (line) {
        setLineModal({ isOpen: true, mode: 'edit', line })
      }
    },
    [po]
  )

  const handleDeleteLine = useCallback(
    async (lineId: string) => {
      if (!po || !confirm('Delete this line?')) return
      try {
        await deleteLine.mutateAsync({ poId: po.id, lineId })
        toast({
          title: 'Success',
          description: 'Line deleted',
        })
        refetch()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete line',
          variant: 'destructive',
        })
      }
    },
    [po, deleteLine, toast, refetch]
  )

  const handleLineSubmit = useCallback(
    async (data: CreatePOLineInput) => {
      if (!po) return
      try {
        if (lineModal.mode === 'add') {
          await addLine.mutateAsync({ poId: po.id, line: data })
          toast({
            title: 'Success',
            description: 'Line added',
          })
        } else if (lineModal.line) {
          await updateLine.mutateAsync({
            poId: po.id,
            lineId: lineModal.line.id,
            data,
          })
          toast({
            title: 'Success',
            description: 'Line updated',
          })
        }
        refetch()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save line',
          variant: 'destructive',
        })
        throw error
      }
    },
    [po, lineModal, addLine, updateLine, toast, refetch]
  )

  // Loading state
  if (isLoading || !paramsId) {
    return (
      <div>
        <PlanningHeader currentPage="po" />
        <div className="px-6 py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !po) {
    return (
      <div>
        <PlanningHeader currentPage="po" />
        <div className="px-6 py-6">
          <POErrorState
            title="Failed to Load Purchase Order"
            message="The purchase order could not be found or you don't have permission to view it."
            errorCode="PO_NOT_FOUND"
            onRetry={() => refetch()}
            onContactSupport={() => router.push('/planning/purchase-orders')}
          />
        </div>
      </div>
    )
  }

  const isEditable = canEditPOLines(po.status as POStatus)
  const existingProductIds = po.lines.map((l) => l.product_id)

  // Calculate totals from lines
  const linesForCalc = po.lines.map((l) => ({
    quantity: l.quantity,
    unit_price: l.unit_price,
    discount_percent: l.discount_percent,
    tax_rate: l.tax_rate,
  }))
  const totals = calculatePOTotals(linesForCalc, po.shipping_cost)

  return (
    <div>
      <PlanningHeader currentPage="po" />

      <div className="px-6 py-6 space-y-6">
        {/* Back button and actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/planning/purchase-orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <POActionsBar
            po={po}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onApprove={handleApprove}
            onReject={handleReject}
            onConfirm={handleConfirm}
            onCancel={async () => setCancelDialog(true)}
            onDuplicate={handleDuplicate}
            onPrint={handlePrint}
            onExportPDF={handleExportPDF}
            onEmailSupplier={handleEmailSupplier}
            onGoToReceiving={handleGoToReceiving}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* PO Header */}
        <POHeader po={po} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="lines">Lines</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {(po.status === 'confirmed' ||
              po.status === 'receiving' ||
              po.status === 'closed') && (
              <TabsTrigger value="receiving">Receiving</TabsTrigger>
            )}
          </TabsList>

          {/* Lines Tab */}
          <TabsContent value="lines" className="space-y-4">
            <POLinesDataTable
              lines={po.lines}
              currency={po.currency}
              isEditable={isEditable}
              onAddLine={handleAddLine}
              onEditLine={handleEditLine}
              onDeleteLine={handleDeleteLine}
            />
            <POTotalsPanel
              subtotal={totals.subtotal}
              taxAmount={totals.tax_amount}
              taxBreakdown={totals.tax_breakdown}
              discountTotal={totals.discount_total}
              shippingCost={totals.shipping_cost}
              total={totals.total}
              currency={po.currency}
              receivedValue={po.received_value}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-4">Status History</h3>
              <POStatusTimeline
                entries={history || []}
                loading={historyLoading}
              />
            </div>
          </TabsContent>

          {/* Receiving Tab */}
          <TabsContent value="receiving">
            <div className="border rounded-lg p-6 text-center text-muted-foreground">
              <p>Receiving information will be shown here.</p>
              <Button
                className="mt-4"
                onClick={handleGoToReceiving}
              >
                Go to Receiving
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <POCancelConfirmDialog
        isOpen={cancelDialog}
        poNumber={po.po_number}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelDialog(false)}
      />

      <POLineModal
        isOpen={lineModal.isOpen}
        mode={lineModal.mode}
        initialData={lineModal.line}
        supplierId={po.supplier_id}
        taxCodeId={po.tax_code_id}
        currency={po.currency}
        taxCodes={taxCodes.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          rate: t.rate,
        }))}
        existingProductIds={existingProductIds}
        onSubmit={handleLineSubmit}
        onClose={() => setLineModal({ isOpen: false, mode: 'add', line: null })}
      />
    </div>
  )
}
