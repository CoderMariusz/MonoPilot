'use client';

/**
 * GanttChart Component (Story 03.15)
 * Main Gantt chart container component
 *
 * Features:
 * - Renders timeline header and swimlanes
 * - Manages zoom level state
 * - Handles horizontal/vertical scrolling
 * - Renders today indicator
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { GanttDataResponse, GanttWorkOrder, ZoomLevel, DragPosition } from '@/lib/types/gantt';
import { GanttTimeline } from './GanttTimeline';
import { GanttSwimlane } from './GanttSwimlane';
import { GanttTodayIndicator } from './GanttTodayIndicator';
import { GanttZoomControls } from './GanttZoomControls';
import { GanttQuickView } from './GanttQuickView';
import { GanttRescheduleDialog } from './GanttRescheduleDialog';

interface GanttChartProps {
  data: GanttDataResponse;
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  onReschedule?: (wo: GanttWorkOrder, newPosition: DragPosition) => Promise<void>;
  className?: string;
}

export function GanttChart({
  data,
  zoomLevel,
  onZoomChange,
  onReschedule,
  className,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick view state
  const [selectedWO, setSelectedWO] = useState<GanttWorkOrder | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [pendingReschedule, setPendingReschedule] = useState<{
    workOrder: GanttWorkOrder;
    newPosition: DragPosition;
  } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleWarnings, setRescheduleWarnings] = useState<string[]>([]);

  // Dragging state
  const [draggingWO, setDraggingWO] = useState<GanttWorkOrder | null>(null);

  // Calculate container width for today indicator
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle WO click - open quick view
  const handleWOClick = useCallback((wo: GanttWorkOrder) => {
    setSelectedWO(wo);
    setQuickViewOpen(true);
  }, []);

  // Handle drag start
  const handleWODragStart = useCallback((wo: GanttWorkOrder) => {
    setDraggingWO(wo);
  }, []);

  // Handle drag end - calculate new position and show confirmation
  const handleWODragEnd = useCallback(
    (wo: GanttWorkOrder, endPosition: { x: number; y: number }) => {
      setDraggingWO(null);

      if (!containerRef.current) return;

      // Calculate new time based on x position
      // This is a simplified calculation - real implementation would be more precise
      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = endPosition.x - containerRect.left;
      const percentX = (relativeX / containerRect.width) * 100;

      // Convert percentage to time offset
      const from = new Date(data.date_range.from_date);
      const to = new Date(data.date_range.to_date);
      const totalMs = to.getTime() - from.getTime() + (24 * 60 * 60 * 1000);

      const newTimeMs = from.getTime() + (percentX / 100) * totalMs;
      const newDate = new Date(newTimeMs);

      // Calculate new start and end times
      const newStartHour = newDate.getHours();
      const newStartMin = newDate.getMinutes();
      const duration = wo.duration_hours;

      const endDate = new Date(newDate.getTime() + duration * 60 * 60 * 1000);
      const newEndHour = endDate.getHours();
      const newEndMin = endDate.getMinutes();

      const newPosition: DragPosition = {
        date: newDate.toISOString().split('T')[0],
        startTime: `${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}`,
        endTime: `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`,
      };

      // Check if anything actually changed
      if (
        newPosition.date === wo.scheduled_date &&
        newPosition.startTime === wo.scheduled_start_time &&
        newPosition.endTime === wo.scheduled_end_time
      ) {
        return; // No change
      }

      // Show confirmation dialog
      setPendingReschedule({ workOrder: wo, newPosition });
      setRescheduleDialogOpen(true);
    },
    [data.date_range]
  );

  // Handle reschedule confirmation
  const handleConfirmReschedule = useCallback(async () => {
    if (!pendingReschedule || !onReschedule) return;

    try {
      setIsRescheduling(true);
      await onReschedule(pendingReschedule.workOrder, pendingReschedule.newPosition);
      setRescheduleDialogOpen(false);
      setPendingReschedule(null);
      setRescheduleWarnings([]);
    } catch (error) {
      // Error is handled by the mutation hook (toast)
    } finally {
      setIsRescheduling(false);
    }
  }, [pendingReschedule, onReschedule]);

  // Handle reschedule cancel
  const handleCancelReschedule = useCallback(() => {
    setRescheduleDialogOpen(false);
    setPendingReschedule(null);
    setRescheduleWarnings([]);
  }, []);

  // Close quick view
  const handleCloseQuickView = useCallback(() => {
    setQuickViewOpen(false);
    setSelectedWO(null);
  }, []);

  // Handle reschedule from quick view
  const handleRescheduleFromQuickView = useCallback((wo: GanttWorkOrder) => {
    setQuickViewOpen(false);
    // Could open a reschedule modal here with date/time pickers
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (quickViewOpen) {
            handleCloseQuickView();
          } else if (rescheduleDialogOpen) {
            handleCancelReschedule();
          }
          break;
        case 'Home':
          // Scroll to first WO
          containerRef.current?.scrollTo({ left: 0 });
          break;
        case 'End':
          // Scroll to end
          if (containerRef.current) {
            containerRef.current.scrollTo({
              left: containerRef.current.scrollWidth,
            });
          }
          break;
        case 'PageUp':
          // Scroll left by one day
          containerRef.current?.scrollBy({ left: -200 });
          break;
        case 'PageDown':
          // Scroll right by one day
          containerRef.current?.scrollBy({ left: 200 });
          break;
      }
    },
    [quickViewOpen, rescheduleDialogOpen, handleCloseQuickView, handleCancelReschedule]
  );

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      role="application"
      aria-label="Work Order Schedule Gantt Chart"
      onKeyDown={handleKeyDown}
    >
      {/* Zoom controls */}
      <div className="flex items-center justify-end px-4 py-2 bg-gray-50 border-b">
        <GanttZoomControls zoomLevel={zoomLevel} onChange={onZoomChange} />
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        data-testid="gantt-chart"
        className="flex-1 overflow-auto relative"
        tabIndex={0}
      >
        {/* Today indicator (vertical line) */}
        <GanttTodayIndicator
          dateRange={data.date_range}
          containerWidth={containerWidth}
          zoomLevel={zoomLevel}
        />

        {/* Timeline header */}
        <GanttTimeline
          dateRange={data.date_range}
          zoomLevel={zoomLevel}
        />

        {/* Swimlanes */}
        <div className="relative">
          {data.swimlanes.map((swimlane) => (
            <GanttSwimlane
              key={swimlane.id}
              swimlane={swimlane}
              dateRange={data.date_range}
              zoomLevel={zoomLevel}
              onWOClick={handleWOClick}
              onWODragStart={handleWODragStart}
              onWODragEnd={handleWODragEnd}
            />
          ))}
        </div>
      </div>

      {/* Quick view panel */}
      <GanttQuickView
        workOrder={quickViewOpen ? selectedWO : null}
        onClose={handleCloseQuickView}
        onReschedule={handleRescheduleFromQuickView}
      />

      {/* Reschedule confirmation dialog */}
      <GanttRescheduleDialog
        open={rescheduleDialogOpen}
        workOrder={pendingReschedule?.workOrder || null}
        newSchedule={pendingReschedule?.newPosition || null}
        onConfirm={handleConfirmReschedule}
        onCancel={handleCancelReschedule}
        warnings={rescheduleWarnings}
        isLoading={isRescheduling}
      />
    </div>
  );
}

export default GanttChart;
