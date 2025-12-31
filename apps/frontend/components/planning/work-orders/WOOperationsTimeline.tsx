/**
 * WO Operations Timeline
 * Story 03.12: WO Operations (Routing Copy)
 *
 * Main operations timeline component displayed on WO detail page
 * Shows operations in a card-based layout with:
 * - Progress bar showing completion
 * - Cards for each operation (clickable to view details)
 * - All 4 states: loading, error, empty, success
 */

'use client';

import { useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useWOOperations } from '@/lib/hooks/use-wo-operations';
import { WOOperationCard } from './WOOperationCard';
import { WOOperationsEmptyState } from './WOOperationsEmptyState';
import { WOOperationProgressBar } from './WOOperationProgressBar';
import { WOOperationDetailPanel } from './WOOperationDetailPanel';

interface WOOperationsTimelineProps {
  woId: string;
  readOnly?: boolean;
}

export function WOOperationsTimeline({ woId, readOnly = true }: WOOperationsTimelineProps) {
  const { data: operations, isLoading, error, refetch } = useWOOperations(woId);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  const handleOperationClick = useCallback((operationId: string) => {
    setSelectedOperationId(operationId);
    setDetailPanelOpen(true);
  }, []);

  const handleDetailPanelClose = useCallback((open: boolean) => {
    setDetailPanelOpen(open);
    if (!open) {
      setSelectedOperationId(null);
    }
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-label="Loading operations"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <span className="sr-only">Loading operations...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-4 p-6 bg-red-50 rounded-lg"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">Failed to load operations</span>
        </div>
        <p className="text-sm text-red-600 text-center">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (!operations || operations.length === 0) {
    return <WOOperationsEmptyState />;
  }

  // Success state
  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">
          Operations
          <span className="sr-only"> timeline</span>
        </h3>
        <WOOperationProgressBar operations={operations} />
      </div>

      {/* Operations list */}
      <div
        className="space-y-2"
        role="list"
        aria-label={`${operations.length} operations`}
      >
        {operations.map((operation, index) => (
          <div key={operation.id} role="listitem">
            <WOOperationCard
              operation={operation}
              isLast={index === operations.length - 1}
              readOnly={readOnly}
              onClick={() => handleOperationClick(operation.id)}
            />
          </div>
        ))}
      </div>

      {/* Read-only note */}
      {readOnly && (
        <p className="text-sm text-muted-foreground italic">
          Operations are executed by production operators in the Production module.
        </p>
      )}

      {/* Detail panel */}
      {selectedOperationId && (
        <WOOperationDetailPanel
          woId={woId}
          operationId={selectedOperationId}
          open={detailPanelOpen}
          onOpenChange={handleDetailPanelClose}
        />
      )}
    </div>
  );
}

export default WOOperationsTimeline;
