/**
 * Work Orders Page
 * Story 3.10: Work Order CRUD
 * AC-3.10.1: Display work orders with filters
 * AC-3.10.2: Create new work order
 */

'use client'

import { WorkOrdersTable } from '@/components/planning/WorkOrdersTable'

export default function WorkOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <WorkOrdersTable />
    </div>
  )
}
