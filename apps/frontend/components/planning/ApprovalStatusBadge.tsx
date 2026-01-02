/**
 * Approval Status Badge Component
 * Story: 03.5b - PO Approval Workflow
 * Reusable badge for displaying approval status
 */

'use client';

import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { POApprovalStatus } from '@/lib/types/po-approval';

// ============================================================================
// TYPES
// ============================================================================

interface ApprovalStatusBadgeProps {
  status: POApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusConfig(status: POApprovalStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending Approval',
        icon: Clock,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        animate: true,
      };
    case 'approved':
      return {
        label: 'Approved',
        icon: CheckCircle2,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-800 dark:text-green-300',
        animate: false,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        icon: XCircle,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-800 dark:text-red-300',
        animate: false,
      };
    default:
      return {
        label: 'N/A',
        icon: null,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
        animate: false,
      };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ApprovalStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: ApprovalStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        'font-medium border-0 inline-flex items-center gap-1',
        config.animate && 'animate-pulse',
        className
      )}
      role="status"
      aria-label={`Approval status: ${config.label}`}
    >
      {showIcon && Icon && (
        <Icon className={iconSizes[size]} aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

export default ApprovalStatusBadge;
