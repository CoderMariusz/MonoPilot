/**
 * GRN List Page
 * Epic 5 Batch 5A-3 - Story 5.11: GRN with LP Creation
 * AC-5.11.1: Display GRN list with filters
 */

'use client'

import { GRNsTable } from '@/components/warehouse/GRNsTable'

export default function GRNsPage() {
  return (
    <div>
      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Goods Receipt Notes</h1>
          <p className="text-muted-foreground text-sm">Receive goods from ASN and create license plates</p>
        </div>

        <GRNsTable />
      </div>
    </div>
  )
}
