/**
 * PO Approval History Component
 * Story: 03.5b - PO Approval Workflow
 * Timeline display of approval history
 *
 * States:
 * - Loading: Shows skeleton timeline
 * - Error: Shows error message with retry
 * - Empty: Shows empty state message
 * - Success: Shows approval timeline
 */

'use client';

import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePOApprovalHistory } from '@/lib/hooks/use-po-approval-history';
import type { POApprovalHistoryEntry, POApprovalAction } from '@/lib/types/po-approval';

// ============================================================================
// TYPES
// ============================================================================

interface POApprovalHistoryProps {
  poId: string;
  maxItems?: number;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getActionConfig(action: POApprovalAction) {
  switch (action) {
    case 'submitted':
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Submitted for Approval',
      };
    case 'approved':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Approved',
      };
    case 'rejected':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Rejected',
      };
    default:
      return {
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: action,
      };
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading approval history">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-6 text-center"
      role="alert"
      aria-label="Error loading approval history"
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{error}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-2 py-6 text-center"
      aria-label="No approval history"
    >
      <Clock className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No approval history yet</p>
    </div>
  );
}

function TimelineEntry({
  entry,
  isLast,
}: {
  entry: POApprovalHistoryEntry;
  isLast: boolean;
}) {
  const config = getActionConfig(entry.action);
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Icon and Connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            config.bgColor
          )}
        >
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', config.color)}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          by {entry.user_name}
          {entry.user_role && (
            <span className="text-gray-400"> ({entry.user_role})</span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          {formatDateTime(entry.created_at)}
        </p>
        {entry.notes && (
          <div className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {entry.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function POApprovalHistory({
  poId,
  maxItems = 10,
  className,
}: POApprovalHistoryProps) {
  const { data, isLoading, error, refetch } = usePOApprovalHistory(poId);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border p-4', className)}>
        <h3 className="mb-4 text-sm font-medium">Approval History</h3>
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-lg border p-4', className)}>
        <h3 className="mb-4 text-sm font-medium">Approval History</h3>
        <ErrorState
          error={error.message || 'Failed to load approval history'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={cn('rounded-lg border p-4', className)}>
        <h3 className="mb-4 text-sm font-medium">Approval History</h3>
        <EmptyState />
      </div>
    );
  }

  // Success state - show timeline
  const entries = data.slice(0, maxItems);
  const hasMore = data.length > maxItems;

  return (
    <div
      className={cn('rounded-lg border p-4', className)}
      role="region"
      aria-label="Approval history timeline"
    >
      <h3 className="mb-4 text-sm font-medium">Approval History</h3>
      <div className="space-y-0">
        {entries.map((entry, index) => (
          <TimelineEntry
            key={entry.id}
            entry={entry}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>
      {hasMore && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          +{data.length - maxItems} more entries
        </p>
      )}
    </div>
  );
}

export default POApprovalHistory;
