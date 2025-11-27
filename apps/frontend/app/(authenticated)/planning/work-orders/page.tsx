/**
 * Work Orders Page
 * Story 3.10: Work Order CRUD
 * AC-3.10.1: Display work orders with filters
 * AC-3.10.2: Create new work order
 */

'use client'

import { WorkOrdersTable } from '@/components/planning/WorkOrdersTable'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { PlanningActionButtons } from '@/components/planning/PlanningActionButtons'

export default function WorkOrdersPage() {
  return (
    <div>
      <PlanningHeader currentPage="wo" />

      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Work Orders</h1>
          <p className="text-muted-foreground text-sm">Manage production work orders</p>
        </div>

        <PlanningActionButtons showPO={false} showTO={false} />

        <WorkOrdersTable />
      </div>
    </div>
  )
}
