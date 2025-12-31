/**
 * WO Operation Detail Panel
 * Story 03.12: WO Operations (Routing Copy)
 *
 * Sheet/modal for viewing operation details including:
 * - Description, instructions
 * - Resources (machine, line)
 * - Duration and yield with variances
 * - Timing information
 * - Skip reason, notes
 */

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWOOperationDetail } from '@/lib/hooks/use-wo-operation-detail';
import { WOOperationStatusBadge } from './WOOperationStatusBadge';

interface WOOperationDetailPanelProps {
  woId: string;
  operationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format duration in minutes to human readable string
 */
function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format variance with + sign for positive values
 */
function formatVariance(value: number | null, unit: string): string {
  if (value === null || value === undefined) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${unit}`;
}

export function WOOperationDetailPanel({
  woId,
  operationId,
  open,
  onOpenChange,
}: WOOperationDetailPanelProps) {
  const { data: operation, isLoading, error } = useWOOperationDetail(woId, operationId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Operation Details</SheetTitle>
          <SheetDescription className="sr-only">
            View details for this work order operation
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-md mt-6">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <span>Failed to load operation details</span>
          </div>
        ) : operation ? (
          <div className="space-y-6 mt-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    Step {operation.sequence}
                  </span>
                  <WOOperationStatusBadge status={operation.status} />
                </div>
                <h3 className="text-xl font-semibold">
                  {operation.operation_name}
                </h3>
              </div>
            </div>

            {/* Description */}
            {operation.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {operation.description}
                </p>
              </div>
            )}

            {/* Instructions */}
            {operation.instructions && (
              <div>
                <h4 className="text-sm font-medium mb-1">Instructions</h4>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md font-sans">
                  {operation.instructions}
                </pre>
              </div>
            )}

            <Separator />

            {/* Resources */}
            {(operation.machine || operation.line) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {operation.machine && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Machine</h4>
                      <p className="text-sm text-muted-foreground">
                        {operation.machine.name} ({operation.machine.code})
                      </p>
                    </div>
                  )}
                  {operation.line && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Production Line</h4>
                      <p className="text-sm text-muted-foreground">
                        {operation.line.name} ({operation.line.code})
                      </p>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Duration */}
            <div>
              <h4 className="text-sm font-medium mb-2">Duration</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Expected</span>
                  <p className="font-medium">
                    {formatDuration(operation.expected_duration_minutes)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block">Actual</span>
                  <p className="font-medium">
                    {formatDuration(operation.actual_duration_minutes)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block">Variance</span>
                  <p
                    className={cn(
                      'font-medium',
                      operation.duration_variance_minutes != null &&
                        operation.duration_variance_minutes > 0 &&
                        'text-red-600',
                      operation.duration_variance_minutes != null &&
                        operation.duration_variance_minutes < 0 &&
                        'text-green-600'
                    )}
                  >
                    {formatVariance(operation.duration_variance_minutes, ' min')}
                  </p>
                </div>
              </div>
            </div>

            {/* Yield */}
            {(operation.expected_yield_percent != null || operation.actual_yield_percent != null) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Yield</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Expected</span>
                      <p className="font-medium">
                        {operation.expected_yield_percent != null
                          ? `${operation.expected_yield_percent}%`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Actual</span>
                      <p className="font-medium">
                        {operation.actual_yield_percent != null
                          ? `${operation.actual_yield_percent}%`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Variance</span>
                      <p
                        className={cn(
                          'font-medium',
                          operation.yield_variance_percent != null &&
                            operation.yield_variance_percent < 0 &&
                            'text-red-600',
                          operation.yield_variance_percent != null &&
                            operation.yield_variance_percent > 0 &&
                            'text-green-600'
                        )}
                      >
                        {formatVariance(operation.yield_variance_percent, '%')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Timing */}
            {(operation.started_at || operation.completed_at) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Timing</h4>
                  <div className="space-y-2 text-sm">
                    {operation.started_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span>
                          {format(new Date(operation.started_at), 'MMM d, yyyy HH:mm')}
                          {operation.started_by_user && (
                            <span className="text-muted-foreground">
                              {' '}by {operation.started_by_user.name}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {operation.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span>
                          {format(new Date(operation.completed_at), 'MMM d, yyyy HH:mm')}
                          {operation.completed_by_user && (
                            <span className="text-muted-foreground">
                              {' '}by {operation.completed_by_user.name}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Skip reason */}
            {operation.status === 'skipped' && operation.skip_reason && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1 text-red-600">Skip Reason</h4>
                  <p className="text-sm text-red-600">{operation.skip_reason}</p>
                </div>
              </>
            )}

            {/* Notes */}
            {operation.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{operation.notes}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground mt-8">
            Operation not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default WOOperationDetailPanel;
