/**
 * License Plate Detail Page
 * Story 05.6: LP Detail Page with Tabs
 *
 * Displays LP detail with tabs: Overview, Genealogy, History (placeholder)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Scissors, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLicensePlate } from '@/lib/hooks/use-license-plates'
import { GenealogyTreePanel } from '@/components/warehouse/GenealogyTreePanel'
import {
  LPStatusBadge,
  LPIdentityCard,
  LPProductCard,
  LPLocationCard,
  LPTrackingCard,
  LPBlockModal,
  LPUnblockModal,
} from '@/components/warehouse/license-plates/detail'
import { SplitLPModal } from '@/components/warehouse/license-plates/SplitLPModal'
import { PrintLabelButton } from '@/components/warehouse/license-plates/PrintLabelButton'

interface PageProps {
  params: {
    id: string
  }
}

export default function LicensePlateDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { data: lp, isLoading, error, refetch } = useLicensePlate(params.id)
  const [activeTab, setActiveTab] = useState('overview')
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [unblockModalOpen, setUnblockModalOpen] = useState(false)
  const [splitModalOpen, setSplitModalOpen] = useState(false)

  // Loading state handled by loading.tsx
  if (isLoading) {
    return null
  }

  // Error state handled by error.tsx
  if (error) {
    throw error
  }

  // Not found state handled by not-found.tsx
  if (!lp) {
    throw new Error('License plate not found')
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="lp-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/warehouse/license-plates')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to License Plates
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* LP Number & Status */}
      <div className="border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">License Plate</div>
            <h1 className="text-3xl font-bold">{lp.lp_number}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LPStatusBadge status={lp.status} type="lp" />
            <LPStatusBadge status={lp.qa_status} type="qa" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {lp.status !== 'blocked' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBlockModalOpen(true)}
          >
            Block LP
          </Button>
        )}
        {lp.status === 'blocked' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setUnblockModalOpen(true)}
          >
            Unblock LP
          </Button>
        )}
        {/* Split LP Button - only available for 'available' status */}
        {lp.status === 'available' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSplitModalOpen(true)}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Split LP
          </Button>
        )}
        <PrintLabelButton
          lpId={params.id}
          lpNumber={lp.lp_number}
          onPrintComplete={() => refetch()}
        />
        <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
          View History
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="genealogy">Genealogy</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <LPIdentityCard
              lpNumber={lp.lp_number}
              status={lp.status}
              qaStatus={lp.qa_status}
              source={lp.source}
              createdAt={lp.created_at}
              updatedAt={lp.updated_at}
            />

            <LPProductCard
              product={
                lp.product || {
                  id: lp.product_id,
                  name: 'Unknown Product',
                  code: 'N/A',
                }
              }
              quantity={lp.quantity}
              uom={lp.uom}
              catchWeightKg={lp.catch_weight_kg}
            />

            <LPLocationCard
              warehouse={
                lp.warehouse || {
                  id: lp.warehouse_id,
                  name: 'Unknown Warehouse',
                  code: 'N/A',
                }
              }
              location={
                lp.location || {
                  id: lp.location_id,
                  full_path: 'Unknown Location',
                }
              }
            />

            <LPTrackingCard
              batchNumber={lp.batch_number}
              supplierBatchNumber={lp.supplier_batch_number}
              expiryDate={lp.expiry_date}
              manufactureDate={lp.manufacture_date}
            />

            {/* References Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500">Source Type</div>
                  <div className="font-medium capitalize">{lp.source}</div>
                </div>
                {lp.grn_id && (
                  <div>
                    <div className="text-gray-500">GRN ID</div>
                    <div className="font-medium">{lp.grn_id}</div>
                  </div>
                )}
                {lp.po_number && (
                  <div>
                    <div className="text-gray-500">PO Number</div>
                    <div className="font-medium">{lp.po_number}</div>
                  </div>
                )}
                {lp.wo_id && (
                  <div>
                    <div className="text-gray-500">Work Order</div>
                    <div className="font-medium">{lp.wo_id}</div>
                  </div>
                )}
                {lp.parent_lp_id && (
                  <div>
                    <div className="text-gray-500">Parent LP</div>
                    <div className="font-medium">{lp.parent_lp_id}</div>
                  </div>
                )}
                {lp.consumed_by_wo_id && (
                  <div>
                    <div className="text-gray-500">Consumed by WO</div>
                    <div className="font-medium">{lp.consumed_by_wo_id}</div>
                  </div>
                )}
                {lp.pallet_id && (
                  <div>
                    <div className="text-gray-500">Pallet</div>
                    <div className="font-medium">{lp.pallet_id}</div>
                  </div>
                )}
              </div>
            </div>

            {/* GS1 Card (Placeholder) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 opacity-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                GS1 Identifiers (Phase 3)
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500">GTIN</div>
                  <div className="font-medium">{lp.gtin || 'Not configured'}</div>
                </div>
                <div>
                  <div className="text-gray-500">SSCC</div>
                  <div className="font-medium">{lp.sscc || 'Not configured'}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  GS1 barcode generation available in Phase 3
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Genealogy Tab */}
        <TabsContent value="genealogy" className="mt-6">
          <GenealogyTreePanel lpId={params.id} lpNumber={lp.lp_number} />
        </TabsContent>

        {/* History Tab (Placeholder) */}
        <TabsContent value="history" className="mt-6">
          <div className="border rounded-lg p-12 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Movement History</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Movement history tracking will be available in Phase 2 of the Warehouse module.
              </p>
            </div>
            <div className="max-w-sm mx-auto border rounded-lg p-4 space-y-2 text-sm">
              <div className="font-semibold">Phase 2 Features:</div>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Stock movement tracking</li>
                <li>• Transfer history</li>
                <li>• Receipt and putaway logs</li>
                <li>• Audit trail with timestamps</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {blockModalOpen && (
        <LPBlockModal
          lpId={params.id}
          lpNumber={lp.lp_number}
          isOpen={blockModalOpen}
          onClose={() => setBlockModalOpen(false)}
          onSuccess={() => {
            setBlockModalOpen(false)
            refetch()
          }}
        />
      )}

      {unblockModalOpen && (
        <LPUnblockModal
          lpId={params.id}
          lpNumber={lp.lp_number}
          blockReason={lp.block_reason}
          isOpen={unblockModalOpen}
          onClose={() => setUnblockModalOpen(false)}
          onSuccess={() => {
            setUnblockModalOpen(false)
            refetch()
          }}
        />
      )}

      {/* Split LP Modal */}
      <SplitLPModal
        open={splitModalOpen}
        lp={lp}
        onClose={() => setSplitModalOpen(false)}
        onSuccess={() => {
          setSplitModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
