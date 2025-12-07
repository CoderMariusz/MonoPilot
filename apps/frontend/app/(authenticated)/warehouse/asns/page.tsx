/**
 * ASN List Page
 * Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
 * AC-5.8.1: Display ASN list with filters
 */

'use client'

import { ASNsTable } from '@/components/warehouse/ASNsTable'

export default function ASNsPage() {
  return (
    <div>
      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Advance Shipping Notices</h1>
          <p className="text-muted-foreground text-sm">Manage incoming shipments from suppliers</p>
        </div>

        <ASNsTable />
      </div>
    </div>
  )
}
