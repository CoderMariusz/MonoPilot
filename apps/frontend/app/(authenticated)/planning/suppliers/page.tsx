/**
 * Suppliers Page
 * Story 3.17: Supplier Management
 * AC-3.17.1: Display suppliers with filters
 * AC-3.17.2: Create new supplier
 */

'use client'

import { SuppliersTable } from '@/components/planning/SuppliersTable'

export default function SuppliersPage() {
  return (
    <div className="container mx-auto py-6">
      <SuppliersTable />
    </div>
  )
}
