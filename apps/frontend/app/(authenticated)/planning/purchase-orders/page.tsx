/**
 * Purchase Orders Page
 * Story 3.1: Purchase Order CRUD
 * AC-3.1.1: Display purchase orders with filters
 * AC-3.1.2: Create new purchase order
 */

'use client'

import { PurchaseOrdersTable } from '@/components/planning/PurchaseOrdersTable'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { PlanningActionButtons } from '@/components/planning/PlanningActionButtons'

export default function PurchaseOrdersPage() {
  return (
    <div>
      <PlanningHeader currentPage="po" />

      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm">Manage and track purchase orders</p>
        </div>

        <PlanningActionButtons showPO={false} showTO={false} showWO={false} />

        <PurchaseOrdersTable />
      </div>
    </div>
  )
}
