/**
 * Alerts Section Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Section showing 4 alert badges:
 * - Backorders
 * - Delayed Shipments
 * - Pending Picks Overdue
 * - Allergen Conflicts
 */

'use client'

import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBadge } from './AlertBadge'
import {
  AlertTriangle,
  Clock,
  ClipboardList,
  Wheat,
  CheckCircle,
} from 'lucide-react'
import type { DashboardAlerts } from '@/lib/types/shipping-dashboard'

export interface AlertsSectionProps {
  alerts: DashboardAlerts | null
  isLoading: boolean
}

export function AlertsSection({ alerts, isLoading }: AlertsSectionProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <Card
        role="region"
        aria-label="Alerts"
        data-testid="alerts-section"
      >
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            data-testid="alerts-skeleton"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if there are any alerts
  const totalAlerts =
    (alerts?.backorders.count || 0) +
    (alerts?.delayed_shipments.count || 0) +
    (alerts?.pending_picks_overdue.count || 0) +
    (alerts?.allergen_conflicts.count || 0)

  if (totalAlerts === 0) {
    return (
      <Card
        role="region"
        aria-label="Alerts"
        data-testid="alerts-section"
      >
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-6 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>No alerts - all systems operational</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      role="region"
      aria-label="Alerts"
      data-testid="alerts-section"
    >
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AlertBadge
            title="Backorders"
            count={alerts?.backorders.count || 0}
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" />}
            onClick={() => router.push('/shipping/sales-orders?filter=backorder')}
          />

          <AlertBadge
            title="Delayed Shipments"
            count={alerts?.delayed_shipments.count || 0}
            severity="critical"
            icon={<Clock className="h-5 w-5" />}
            onClick={() => router.push('/shipping/sales-orders?filter=delayed')}
          />

          <AlertBadge
            title="Overdue Picks"
            count={alerts?.pending_picks_overdue.count || 0}
            severity="warning"
            icon={<ClipboardList className="h-5 w-5" />}
            onClick={() => router.push('/shipping/pick-lists?filter=overdue')}
          />

          <AlertBadge
            title="Allergen Conflicts"
            count={alerts?.allergen_conflicts.count || 0}
            severity="warning"
            icon={<Wheat className="h-5 w-5" />}
            onClick={() => router.push('/shipping/sales-orders?filter=allergen_conflict')}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default AlertsSection
