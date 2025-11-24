/**
 * Purchase Orders Page
 * Story 3.1: Purchase Order CRUD
 * AC-3.1.1: Display purchase orders with filters
 * AC-3.1.2: Create new purchase order
 */

'use client'

import { PurchaseOrdersTable } from '@/components/planning/PurchaseOrdersTable'

export default function PurchaseOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <PurchaseOrdersTable />
    </div>
  )
}
