/**
 * WO Operation Status Badge
 * Story 03.12: WO Operations (Routing Copy)
 *
 * Displays operation status with appropriate color coding:
 * - pending: gray
 * - in_progress: yellow
 * - completed: green
 * - skipped: red with line-through
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WOOperationStatus } from '@/lib/types/wo-operation';

interface WOOperationStatusBadgeProps {
  status: WOOperationStatus;
  className?: string;
}

const statusConfig: Record<WOOperationStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-red-100 text-red-800 line-through hover:bg-red-100',
  },
};

export function WOOperationStatusBadge({ status, className }: WOOperationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge
      variant="secondary"
      className={cn(config.className, className)}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}

export default WOOperationStatusBadge;
