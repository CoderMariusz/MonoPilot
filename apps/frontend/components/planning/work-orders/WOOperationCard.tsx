/**
 * WO Operation Card
 * Story 03.12: WO Operations (Routing Copy)
 *
 * Single operation card in the timeline view
 * Shows: sequence number, operation name, description, machine/line, expected duration
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Cpu, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WOOperation } from '@/lib/types/wo-operation';
import { WOOperationStatusBadge } from './WOOperationStatusBadge';

interface WOOperationCardProps {
  operation: WOOperation;
  isLast?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
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

export function WOOperationCard({
  operation,
  isLast = false,
  readOnly = true,
  onClick,
}: WOOperationCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        'relative transition-colors min-h-[48px]',
        onClick && 'cursor-pointer hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring',
        !isLast && 'mb-2'
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={`Operation ${operation.sequence} of ${operation.operation_name}, status ${operation.status}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Sequence number */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium"
              aria-hidden="true"
            >
              {operation.sequence}
            </div>

            {/* Operation details */}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-medium truncate">{operation.operation_name}</h4>
              {operation.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {operation.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {/* Machine */}
                {operation.machine_name && (
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" aria-hidden="true" />
                    <span>{operation.machine_name}</span>
                  </div>
                )}

                {/* Line */}
                {operation.line_name && (
                  <div className="flex items-center gap-1">
                    <Factory className="h-3 w-3" aria-hidden="true" />
                    <span>{operation.line_name}</span>
                  </div>
                )}

                {/* Duration */}
                {operation.expected_duration_minutes != null && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{formatDuration(operation.expected_duration_minutes)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0">
            <WOOperationStatusBadge status={operation.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WOOperationCard;
