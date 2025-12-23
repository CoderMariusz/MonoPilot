/**
 * MachineStatusBadge Component
 * Story: 01.10 - Machines CRUD
 *
 * Displays machine status badge with color coding
 * 4 statuses: ACTIVE=green, MAINTENANCE=yellow, OFFLINE=red, DECOMMISSIONED=gray
 */

'use client'

import { Badge } from '@/components/ui/badge'
import type { MachineStatus } from '@/lib/types/machine'
import { MACHINE_STATUS_LABELS, MACHINE_STATUS_COLORS } from '@/lib/types/machine'

interface MachineStatusBadgeProps {
  status: MachineStatus
}

export function MachineStatusBadge({ status }: MachineStatusBadgeProps) {
  const { bg, text } = MACHINE_STATUS_COLORS[status]
  const label = MACHINE_STATUS_LABELS[status]

  return (
    <Badge variant="secondary" className={`${bg} ${text} border-none font-medium`}>
      {label}
    </Badge>
  )
}
