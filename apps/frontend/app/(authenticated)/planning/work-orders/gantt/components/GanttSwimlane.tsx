'use client';

/**
 * GanttSwimlane Component (Story 03.15)
 * Individual swimlane row (production line or machine)
 *
 * Features:
 * - Renders swimlane header (line/machine name)
 * - Renders WO bars within swimlane
 * - Handles drag-drop events for WOs
 */

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { GanttSwimlane as GanttSwimlaneType, GanttWorkOrder, GanttDateRange, ZoomLevel } from '@/lib/types/gantt';
import { GanttWOBar } from './GanttWOBar';

interface GanttSwimlaneProps {
  swimlane: GanttSwimlaneType;
  dateRange: GanttDateRange;
  zoomLevel: ZoomLevel;
  onWOClick: (wo: GanttWorkOrder) => void;
  onWODragStart?: (wo: GanttWorkOrder) => void;
  onWODragEnd?: (wo: GanttWorkOrder, newPosition: { x: number; y: number }) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, swimlaneId: string) => void;
  className?: string;
}

export function GanttSwimlane({
  swimlane,
  dateRange,
  zoomLevel,
  onWOClick,
  onWODragStart,
  onWODragEnd,
  onDragOver,
  onDrop,
  className,
}: GanttSwimlaneProps) {
  // Calculate position for each WO based on time
  const positionedWOs = useMemo(() => {
    const fromDate = new Date(dateRange.from_date);
    const toDate = new Date(dateRange.to_date);
    const totalMs = toDate.getTime() - fromDate.getTime() + (24 * 60 * 60 * 1000);

    return swimlane.work_orders.map((wo) => {
      const woDate = new Date(wo.scheduled_date);

      // Parse start time
      const [startHour, startMin] = wo.scheduled_start_time.split(':').map(Number);
      const startMs = woDate.getTime() + (startHour * 60 + startMin) * 60 * 1000;

      // Calculate left position as percentage
      const left = ((startMs - fromDate.getTime()) / totalMs) * 100;

      // Calculate width based on duration
      const durationMs = wo.duration_hours * 60 * 60 * 1000;
      const width = (durationMs / totalMs) * 100;

      return {
        wo,
        left: Math.max(0, Math.min(100 - width, left)),
        width: Math.max(2, Math.min(100, width)), // Min 2% width for visibility
      };
    });
  }, [swimlane.work_orders, dateRange]);

  // Handle drag over to allow dropping
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver?.(e);
    },
    [onDragOver]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDrop?.(e, swimlane.id);
    },
    [onDrop, swimlane.id]
  );

  return (
    <div
      data-testid="swimlane"
      data-swimlane-id={swimlane.id}
      role="rowgroup"
      aria-label={`${swimlane.type === 'line' ? 'Production line' : 'Machine'}: ${swimlane.name}, ${swimlane.work_orders.length} work orders`}
      className={cn(
        'flex border-b border-gray-200 min-h-[60px]',
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Swimlane header / name */}
      <div
        className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 px-3 py-2 flex flex-col justify-center"
        data-testid="swimlane-name"
      >
        <span className="font-medium text-gray-900 truncate">
          {swimlane.name}
        </span>
        <span className="text-xs text-gray-500">
          {swimlane.work_orders.length} WO
          {swimlane.work_orders.length !== 1 ? 's' : ''}
          {swimlane.capacity_hours_per_day && (
            <span className="ml-2">
              ({swimlane.capacity_hours_per_day}h/day)
            </span>
          )}
        </span>
      </div>

      {/* WO bars area */}
      <div className="flex-1 relative py-2 px-1">
        {positionedWOs.map(({ wo, left, width }) => (
          <div
            key={wo.id}
            className="absolute top-2 bottom-2"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              minWidth: zoomLevel === 'month' ? '30px' : '60px',
            }}
            data-position={`left:${left},width:${width}`}
          >
            <GanttWOBar
              workOrder={wo}
              zoomLevel={zoomLevel}
              onClick={() => onWOClick(wo)}
              onDragStart={() => onWODragStart?.(wo)}
              onDragEnd={(pos) => onWODragEnd?.(wo, pos || { x: 0, y: 0 })}
            />
          </div>
        ))}

        {/* Empty state for swimlane with no WOs */}
        {swimlane.work_orders.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">
            No work orders scheduled
          </div>
        )}
      </div>
    </div>
  );
}

export default GanttSwimlane;
