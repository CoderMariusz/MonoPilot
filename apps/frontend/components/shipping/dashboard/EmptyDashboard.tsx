/**
 * Empty Dashboard Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Empty state for when no data exists in the date range
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PackageX, Calendar, Plus } from 'lucide-react'
import type { DateRange } from '@/lib/types/shipping-dashboard'

export interface EmptyDashboardProps {
  dateRange: DateRange
  onChangeDateRange: () => void
}

export function EmptyDashboard({ dateRange, onChangeDateRange }: EmptyDashboardProps) {
  const router = useRouter()

  const handleCreateSalesOrder = () => {
    router.push('/shipping/sales-orders/new')
  }

  return (
    <div
      className="text-center py-16"
      role="region"
      aria-label="Empty dashboard"
      data-testid="empty-dashboard"
    >
      <PackageX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No data available
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        There are no orders, shipments, or activity for the selected date range.
        Try changing the date range or create a new sales order.
      </p>
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onChangeDateRange}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Change date range
        </Button>
        <Button onClick={handleCreateSalesOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Create sales order
        </Button>
      </div>
    </div>
  )
}

export default EmptyDashboard
