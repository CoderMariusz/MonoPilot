/**
 * Suppliers Page
 * Story 3.17: Supplier Management
 * AC-3.17.1: Display suppliers with filters
 * AC-3.17.2: Create new supplier
 */

'use client'

import { SuppliersTable } from '@/components/planning/SuppliersTable'
import { PlanningHeader } from '@/components/planning/PlanningHeader'

export default function SuppliersPage() {
  return (
    <div>
      <PlanningHeader currentPage="suppliers" />

      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground text-sm">Manage supplier information and product assignments</p>
        </div>

        <SuppliersTable />
      </div>
    </div>
  )
}
