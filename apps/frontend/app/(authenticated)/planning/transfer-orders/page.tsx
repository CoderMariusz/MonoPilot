/**
 * Transfer Orders Page
 * Story 3.6: Transfer Order CRUD
 * AC-3.6.1: Display transfer orders with filters
 * AC-3.6.2: Create new transfer order
 */

'use client'

import { TransferOrdersTable } from '@/components/planning/TransferOrdersTable'

export default function TransferOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <TransferOrdersTable />
    </div>
  )
}
