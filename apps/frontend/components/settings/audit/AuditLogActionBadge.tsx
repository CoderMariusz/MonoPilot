/**
 * AuditLogActionBadge Component
 * Story: 01.17 - Audit Trail
 *
 * Displays audit log action type with color-coded badge
 * CREATE=green, UPDATE=blue, DELETE=red, LOGIN=gray
 */

'use client'

import { Badge } from '@/components/ui/badge'
import {
  AuditLogAction,
  AUDIT_LOG_ACTION_LABELS,
  AUDIT_LOG_ACTION_COLORS,
} from '@/lib/types/audit-log'

interface AuditLogActionBadgeProps {
  action: AuditLogAction
}

export function AuditLogActionBadge({ action }: AuditLogActionBadgeProps) {
  const label = AUDIT_LOG_ACTION_LABELS[action]
  const colors = AUDIT_LOG_ACTION_COLORS[action]

  return (
    <Badge
      className={`${colors.bg} ${colors.text} border-none`}
      variant="outline"
      data-testid={`audit-action-badge-${action.toLowerCase()}`}
    >
      {label}
    </Badge>
  )
}
