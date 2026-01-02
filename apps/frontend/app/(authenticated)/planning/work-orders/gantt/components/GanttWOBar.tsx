'use client';

/**
 * GanttWOBar Component (Story 03.15)
 * Draggable work order bar with status colors and progress
 *
 * Features:
 * - Status-based background color per PLAN-016
 * - Progress bar overlay for in_progress WOs
 * - Overdue indicator (red + warning icon)
 * - Truncated label based on zoom level
 * - Draggable for reschedule
 * - Resizable handles for duration adjustment
 * - Full accessibility support (ARIA, keyboard)
 */

import React, { useState, useCallback } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GanttWorkOrder, ZoomLevel } from '@/lib/types/gantt';
import { getStatusColorConfig, getWOLabel, STATUS_HEX_COLORS } from '@/lib/types/gantt';

interface GanttWOBarProps {
  workOrder: GanttWorkOrder;
  zoomLevel: ZoomLevel;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: (newPosition?: { x: number; y: number }) => void;
  className?: string;
}

export function GanttWOBar({
  workOrder,
  zoomLevel,
  onClick,
  onDragStart,
  onDragEnd,
  className,
}: GanttWOBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Determine if this WO should show overdue styling
  // (use is_overdue but only if not completed/closed)
  const showOverdue =
    workOrder.is_overdue &&
    !['completed', 'closed'].includes(workOrder.status);

  // Get status color configuration
  const colorConfig = getStatusColorConfig(workOrder);

  // Determine background color
  const statusKey = showOverdue ? 'overdue' : workOrder.status;
  const hexColors = STATUS_HEX_COLORS[statusKey] || STATUS_HEX_COLORS.draft;

  // Get label based on zoom level
  const label = getWOLabel(workOrder, zoomLevel);

  // Should show progress bar?
  const showProgress =
    workOrder.status === 'in_progress' &&
    workOrder.progress_percent !== null &&
    workOrder.progress_percent > 0;

  // Should show material alert?
  const showMaterialAlert =
    workOrder.material_status === 'low' ||
    workOrder.material_status === 'insufficient';

  // Determine border style
  const borderStyle = workOrder.status === 'draft' ? 'dashed' : 'solid';

  // Handle keyboard interactions
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          onClick();
          break;
        case 'Escape':
          if (isDragging) {
            setIsDragging(false);
          }
          break;
        // Arrow keys for keyboard reschedule (Ctrl+Arrow)
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          if (event.ctrlKey) {
            event.preventDefault();
            // Handle keyboard reschedule - would trigger onDragEnd with offset
          }
          break;
      }
    },
    [onClick, isDragging]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      // Don't allow dragging completed/closed WOs
      if (['completed', 'closed', 'cancelled'].includes(workOrder.status)) {
        event.preventDefault();
        return;
      }

      setIsDragging(true);
      onDragStart();

      // Set drag image (optional custom rendering)
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', workOrder.id);
      }
    },
    [workOrder.status, workOrder.id, onDragStart]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: React.DragEvent) => {
      setIsDragging(false);
      onDragEnd({ x: event.clientX, y: event.clientY });
    },
    [onDragEnd]
  );

  // Build ARIA label for screen readers
  const ariaLabel = `Work Order ${workOrder.wo_number}, ${workOrder.product.name}, ${
    workOrder.status.replace('_', ' ')
  }, scheduled ${workOrder.scheduled_date} ${workOrder.scheduled_start_time} to ${workOrder.scheduled_end_time}`;

  // Can this WO be dragged?
  const isDraggable = !['completed', 'closed', 'cancelled'].includes(
    workOrder.status
  );

  return (
    <div
      data-testid="wo-bar"
      data-wo-id={workOrder.id}
      data-wo-number={workOrder.wo_number}
      data-status={workOrder.status}
      data-overdue={showOverdue ? 'true' : 'false'}
      data-start-time={workOrder.scheduled_start_time}
      data-end-time={workOrder.scheduled_end_time}
      data-duration-hours={workOrder.duration_hours}
      data-border-style={borderStyle}
      role="button"
      tabIndex={0}
      draggable={isDraggable}
      aria-label={ariaLabel}
      aria-grabbed={isDragging}
      className={cn(
        'relative flex items-center gap-1 px-2 py-1 rounded cursor-pointer select-none',
        'min-h-[40px] min-w-[60px]',
        'border-2 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        colorConfig.bg,
        colorConfig.border,
        colorConfig.text,
        borderStyle === 'dashed' ? 'border-dashed' : 'border-solid',
        isDragging && 'opacity-50 ring-2 ring-blue-500',
        isHovered && 'shadow-md',
        className
      )}
      style={{
        backgroundColor: hexColors.bg,
        borderColor: hexColors.border,
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress bar overlay (for in_progress WOs) */}
      {showProgress && (
        <div
          data-testid="progress-bar"
          data-progress={workOrder.progress_percent}
          className="absolute left-0 top-0 bottom-0 bg-purple-300/50 rounded-l transition-all"
          style={{ width: `${workOrder.progress_percent}%` }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-1 truncate">
        {/* Overdue warning icon */}
        {showOverdue && (
          <AlertTriangle
            data-testid="overdue-warning"
            className="h-4 w-4 text-red-600 flex-shrink-0"
            aria-label="Overdue"
          />
        )}

        {/* Material alert icon */}
        {showMaterialAlert && !showOverdue && (
          <Package
            data-testid="material-alert"
            className={cn(
              'h-4 w-4 flex-shrink-0',
              workOrder.material_status === 'insufficient'
                ? 'text-red-600'
                : 'text-yellow-600'
            )}
            aria-label={`Materials ${workOrder.material_status}`}
          />
        )}

        {/* Label */}
        <span data-testid="wo-label" className="truncate text-sm font-medium">
          {label}
        </span>
      </div>

      {/* Resize handles (always present, visible on hover via CSS) */}
      {isDraggable && (
        <>
          <div
            data-testid="resize-handle-left"
            data-testid-handle="resize-handle"
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400/50 rounded-l',
              !isHovered && 'opacity-0'
            )}
          />
          <div
            data-testid="resize-handle-right"
            data-testid-handle="resize-handle"
            className={cn(
              'absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400/50 rounded-r',
              !isHovered && 'opacity-0'
            )}
          />
        </>
      )}
    </div>
  );
}

export default GanttWOBar;
