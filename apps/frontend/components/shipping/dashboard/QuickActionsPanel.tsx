/**
 * Quick Actions Panel Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Panel with quick action buttons
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, ClipboardList, AlertTriangle } from 'lucide-react'
import type { UserRole } from '@/lib/types/shipping-dashboard'

export interface QuickActionsPanelProps {
  userRole: UserRole
}

export function QuickActionsPanel({ userRole }: QuickActionsPanelProps) {
  const router = useRouter()

  const canCreateSO = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'OPERATOR'
  const canCreatePickList = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'OPERATOR'

  const ActionButton = ({
    label,
    icon,
    onClick,
    disabled,
    disabledReason,
  }: {
    label: string
    icon: React.ReactNode
    onClick: () => void
    disabled?: boolean
    disabledReason?: string
  }) => {
    const button = (
      <Button
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className="justify-start gap-2 focus-visible:ring-2"
      >
        {icon}
        {label}
      </Button>
    )

    if (disabled && disabledReason) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <p>{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }

  return (
    <Card
      role="region"
      aria-label="Quick Actions"
      data-testid="quick-actions"
      className="h-fit"
    >
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <ActionButton
            label="Create sales order"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/shipping/sales-orders/new')}
            disabled={!canCreateSO}
            disabledReason="You don't have permission to create sales orders"
          />

          <ActionButton
            label="Create pick list"
            icon={<ClipboardList className="h-4 w-4" />}
            onClick={() => router.push('/shipping/pick-lists/new')}
            disabled={!canCreatePickList}
            disabledReason="You don't have permission to create pick lists"
          />

          <ActionButton
            label="View shipments"
            icon={<ClipboardList className="h-4 w-4" />}
            onClick={() => router.push('/shipping/shipments')}
          />

          <ActionButton
            label="View backorders"
            icon={<AlertTriangle className="h-4 w-4" />}
            onClick={() => router.push('/shipping/sales-orders?filter=backorder')}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActionsPanel
