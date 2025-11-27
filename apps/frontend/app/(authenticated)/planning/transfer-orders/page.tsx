/**
 * Transfer Orders Page
 * Story 3.6: Transfer Order CRUD
 * AC-3.6.1: Display transfer orders with filters
 * AC-3.6.2: Create new transfer order
 */

'use client'

import { TransferOrdersTable } from '@/components/planning/TransferOrdersTable'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { PlanningActionButtons } from '@/components/planning/PlanningActionButtons'

export default function TransferOrdersPage() {
  return (
    <div>
      <PlanningHeader currentPage="to" />

      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Transfer Orders</h1>
          <p className="text-muted-foreground text-sm">Manage inter-warehouse transfers</p>
        </div>

        <PlanningActionButtons showPO={false} showWO={false} />

        <TransferOrdersTable />
      </div>
    </div>
  )
}
