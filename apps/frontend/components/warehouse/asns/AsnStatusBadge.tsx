/**
 * ASN Status Badge Component
 * Story 05.8: ASN Management
 */

import { Badge } from '@/components/ui/badge'
import type { ASNStatus } from '@/lib/types/asn'
import { ASN_STATUS_COLORS, ASN_STATUS_LABELS } from '@/lib/types/asn'

interface AsnStatusBadgeProps {
  status: ASNStatus
}

export function AsnStatusBadge({ status }: AsnStatusBadgeProps) {
  const colors = ASN_STATUS_COLORS[status]
  const label = ASN_STATUS_LABELS[status]

  return (
    <Badge
      className={`${colors.bg} ${colors.text} border-0`}
      data-status-badge
      data-status={status}
    >
      {label}
    </Badge>
  )
}
