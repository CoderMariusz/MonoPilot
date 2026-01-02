'use client';

/**
 * GanttZoomControls Component (Story 03.15)
 * Day/Week/Month zoom level buttons
 *
 * Features:
 * - Three zoom level buttons
 * - Visual indicator for active level
 * - Keyboard accessible
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ZoomLevel } from '@/lib/types/gantt';

interface GanttZoomControlsProps {
  zoomLevel: ZoomLevel;
  onChange: (level: ZoomLevel) => void;
  className?: string;
}

const ZOOM_OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function GanttZoomControls({
  zoomLevel,
  onChange,
  className,
}: GanttZoomControlsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1',
        className
      )}
      role="group"
      aria-label="Zoom level"
    >
      {ZOOM_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={zoomLevel === option.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(option.value)}
          data-testid={`zoom-${option.value}`}
          aria-pressed={zoomLevel === option.value}
          className={cn(
            'px-3 py-1 text-sm',
            zoomLevel === option.value
              ? 'bg-white shadow-sm'
              : 'hover:bg-gray-200'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export default GanttZoomControls;
