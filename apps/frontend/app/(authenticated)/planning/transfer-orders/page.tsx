/**
 * Transfer Orders Page
 * Story 3.6: Transfer Order CRUD
 * AC-3.6.1: Display transfer orders with filters
 * AC-3.6.2: Create new transfer order
 */

'use client'

import { TransferOrdersTable } from '@/components/planning/TransferOrdersTable'
import { PlanningHeader } from '@/components/planning/PlanningHeader'

export default function TransferOrdersPage() {
  return (
    <div>
      <PlanningHeader currentPage="to" />

      <div className="px-6 py-6 space-y-6">
        <TransferOrdersTable />
      </div>
    </div>
  )
}
