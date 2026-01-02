'use client';

/**
 * GanttLegend Component (Story 03.15)
 * Status color legend
 *
 * Features:
 * - Shows all status colors with labels
 * - Includes overdue indicator explanation
 * - Collapsible on mobile
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS_HEX_COLORS, type WOStatus } from '@/lib/types/gantt';

interface GanttLegendProps {
  className?: string;
  collapsible?: boolean;
}

const STATUS_LABELS: Record<WOStatus | 'overdue', string> = {
  draft: 'Draft',
  planned: 'Planned',
  released: 'Released',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  closed: 'Closed',
  overdue: 'Overdue',
};

// Which statuses to show in the legend
const DISPLAY_STATUSES: (WOStatus | 'overdue')[] = [
  'planned',
  'released',
  'in_progress',
  'on_hold',
  'completed',
  'overdue',
];

export function GanttLegend({ className, collapsible = true }: GanttLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)}>
      {/* Header (clickable on mobile for collapse) */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2',
          collapsible && 'cursor-pointer md:cursor-default'
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        role={collapsible ? 'button' : undefined}
        aria-expanded={isExpanded}
        aria-controls="legend-content"
      >
        <span className="text-sm font-medium text-gray-700">Legend</span>

        {/* Toggle button (mobile only) */}
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-6 w-6 p-0"
            aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Legend items */}
      <div
        id="legend-content"
        className={cn(
          'flex flex-wrap items-center gap-3 px-3 pb-2 transition-all',
          !isExpanded && 'hidden md:flex'
        )}
      >
        {DISPLAY_STATUSES.map((status) => {
          const colors = STATUS_HEX_COLORS[status];
          const label = STATUS_LABELS[status];
          const isOverdue = status === 'overdue';

          return (
            <div key={status} className="flex items-center gap-1.5">
              {/* Color swatch */}
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center',
                  status === 'draft' && 'border-dashed'
                )}
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                {isOverdue && (
                  <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                )}
              </div>

              {/* Label */}
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GanttLegend;
