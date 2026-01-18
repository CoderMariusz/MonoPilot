/**
 * AgingReportEmptyState Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Empty state for aging report when no data is available.
 */

'use client'

import { Button } from '@/components/ui/button'
import { BarChart3, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AgingReportEmptyStateProps {
  mode: 'fifo' | 'fefo'
}

export function AgingReportEmptyState({ mode }: AgingReportEmptyStateProps) {
  const router = useRouter()

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="aging-report-empty-state"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <BarChart3
          className="h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <h3 className="text-lg font-semibold mb-2">No Aging Data Available</h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {mode === 'fifo'
          ? 'Start receiving inventory to see aging analysis. License Plates are created when you receive goods via Goods Receipt Notes (GRN).'
          : 'No items with expiry dates found. Products with expiry tracking will appear here once received into inventory.'
        }
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => router.push('/warehouse/receiving')}>
          Go to Receiving (GRN)
          <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
        </Button>
        <Button variant="outline" onClick={() => router.push('/planning/purchase-orders')}>
          View Purchase Orders
        </Button>
      </div>

      <div className="mt-8 text-sm text-muted-foreground max-w-md">
        <p className="font-medium mb-2">About Aging Reports:</p>
        <ul className="text-left space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-medium">FIFO</span>
            <span>- First-In-First-Out aging by receipt date</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">FEFO</span>
            <span>- First-Expired-First-Out by expiry date</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
