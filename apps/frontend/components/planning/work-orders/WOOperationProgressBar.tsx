/**
 * WO Operation Progress Bar
 * Story 03.12: WO Operations (Routing Copy)
 *
 * Visual progress indicator showing completed/total operations
 * Displays: "X/Y (Z%)" with a progress bar
 */

'use client';

import { Progress } from '@/components/ui/progress';
import type { WOOperation } from '@/lib/types/wo-operation';

interface WOOperationProgressBarProps {
  operations: WOOperation[];
  className?: string;
}

export function WOOperationProgressBar({ operations, className }: WOOperationProgressBarProps) {
  const completed = operations.filter(
    op => op.status === 'completed' || op.status === 'skipped'
  ).length;
  const total = operations.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className={className}
      role="status"
      aria-label={`${completed} of ${total} operations completed, ${percent} percent`}
    >
      <div className="flex items-center gap-3">
        <Progress value={percent} className="w-24 h-2" aria-hidden="true" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completed}/{total} ({percent}%)
        </span>
      </div>
    </div>
  );
}

export default WOOperationProgressBar;
