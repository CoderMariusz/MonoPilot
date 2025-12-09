/**
 * Warehouse Receiving Page
 * Story 5.32: Receive from PO (Desktop)
 *
 * Lists Purchase Orders ready for receiving and allows receiving goods
 */

'use client'

import { POListForReceiving } from '@/components/warehouse/POListForReceiving'

export default function ReceivingPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goods Receiving</h1>
        <p className="text-muted-foreground text-sm">
          Receive goods from purchase orders and transfer orders
        </p>
      </div>

      <POListForReceiving />
    </div>
  )
}
