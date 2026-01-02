/**
 * React Hook: useGanttDragDrop
 * Story 03.15: WO Gantt Chart View - Drag-Drop Logic
 *
 * Manages drag-and-drop state for rescheduling work orders
 */

import { useState, useCallback, useRef } from 'react';
import type { GanttWorkOrder, DragPosition, ZoomLevel } from '@/lib/types/gantt';

interface DragState {
  isDragging: boolean;
  draggingWO: GanttWorkOrder | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  targetSwimlaneId: string | null;
  isValidDrop: boolean | null;
}

interface UseGanttDragDropOptions {
  zoomLevel: ZoomLevel;
  onDragStart?: (wo: GanttWorkOrder) => void;
  onDragEnd?: (wo: GanttWorkOrder, newPosition: DragPosition) => void;
  onDragCancel?: () => void;
}

/**
 * Hook to manage Gantt chart drag-and-drop interactions
 */
export function useGanttDragDrop(options: UseGanttDragDropOptions) {
  const { zoomLevel, onDragStart, onDragEnd, onDragCancel } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggingWO: null,
    startPosition: null,
    currentPosition: null,
    targetSwimlaneId: null,
    isValidDrop: null,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Start dragging a work order
   */
  const handleDragStart = useCallback(
    (wo: GanttWorkOrder, event: React.DragEvent | React.MouseEvent) => {
      // Don't allow dragging completed/closed WOs
      if (['completed', 'closed', 'cancelled'].includes(wo.status)) {
        return;
      }

      const position = {
        x: 'clientX' in event ? event.clientX : 0,
        y: 'clientY' in event ? event.clientY : 0,
      };

      setDragState({
        isDragging: true,
        draggingWO: wo,
        startPosition: position,
        currentPosition: position,
        targetSwimlaneId: null,
        isValidDrop: null,
      });

      onDragStart?.(wo);
    },
    [onDragStart]
  );

  /**
   * Update position during drag
   */
  const handleDragMove = useCallback(
    (event: React.DragEvent | React.MouseEvent) => {
      if (!dragState.isDragging) return;

      const position = {
        x: 'clientX' in event ? event.clientX : 0,
        y: 'clientY' in event ? event.clientY : 0,
      };

      setDragState((prev) => ({
        ...prev,
        currentPosition: position,
      }));
    },
    [dragState.isDragging]
  );

  /**
   * End drag and calculate new position
   */
  const handleDragEnd = useCallback(
    (event: React.DragEvent | React.MouseEvent) => {
      if (!dragState.isDragging || !dragState.draggingWO) {
        return;
      }

      const wo = dragState.draggingWO;
      const startPos = dragState.startPosition;
      const endPos = {
        x: 'clientX' in event ? event.clientX : 0,
        y: 'clientY' in event ? event.clientY : 0,
      };

      // Calculate time offset based on horizontal movement
      // This is a simplified calculation - real implementation would
      // need to account for container width and zoom level
      const xOffset = endPos.x - (startPos?.x || 0);
      const hoursOffset = calculateHoursOffset(xOffset, zoomLevel);

      // Parse current times
      const [startHour, startMin] = wo.scheduled_start_time.split(':').map(Number);
      const [endHour, endMin] = wo.scheduled_end_time.split(':').map(Number);

      // Calculate new times
      let newStartHour = startHour + Math.floor(hoursOffset);
      let newStartMin = startMin + Math.round((hoursOffset % 1) * 60);
      let newEndHour = endHour + Math.floor(hoursOffset);
      let newEndMin = endMin + Math.round((hoursOffset % 1) * 60);

      // Normalize minutes
      if (newStartMin >= 60) {
        newStartHour += 1;
        newStartMin -= 60;
      }
      if (newEndMin >= 60) {
        newEndHour += 1;
        newEndMin -= 60;
      }

      // Calculate date offset (if hours overflow)
      let dateOffset = 0;
      if (newStartHour >= 24) {
        dateOffset = Math.floor(newStartHour / 24);
        newStartHour = newStartHour % 24;
        newEndHour = newEndHour % 24;
      } else if (newStartHour < 0) {
        dateOffset = Math.floor(newStartHour / 24);
        newStartHour = ((newStartHour % 24) + 24) % 24;
        newEndHour = ((newEndHour % 24) + 24) % 24;
      }

      // Calculate new date
      const currentDate = new Date(wo.scheduled_date);
      currentDate.setDate(currentDate.getDate() + dateOffset);
      const newDate = currentDate.toISOString().split('T')[0];

      const newPosition: DragPosition = {
        date: newDate,
        startTime: `${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}`,
        endTime: `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`,
        swimlaneId: dragState.targetSwimlaneId || undefined,
      };

      // Reset state
      setDragState({
        isDragging: false,
        draggingWO: null,
        startPosition: null,
        currentPosition: null,
        targetSwimlaneId: null,
        isValidDrop: null,
      });

      onDragEnd?.(wo, newPosition);
    },
    [dragState, zoomLevel, onDragEnd]
  );

  /**
   * Cancel drag operation
   */
  const handleDragCancel = useCallback(() => {
    setDragState({
      isDragging: false,
      draggingWO: null,
      startPosition: null,
      currentPosition: null,
      targetSwimlaneId: null,
      isValidDrop: null,
    });

    onDragCancel?.();
  }, [onDragCancel]);

  /**
   * Update target swimlane during drag (for vertical movement)
   */
  const setTargetSwimlane = useCallback((swimlaneId: string | null) => {
    setDragState((prev) => ({
      ...prev,
      targetSwimlaneId: swimlaneId,
    }));
  }, []);

  /**
   * Update drop validity status
   */
  const setDropValidity = useCallback((isValid: boolean) => {
    setDragState((prev) => ({
      ...prev,
      isValidDrop: isValid,
    }));
  }, []);

  return {
    dragState,
    containerRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    setTargetSwimlane,
    setDropValidity,
  };
}

/**
 * Calculate hours offset based on pixel movement and zoom level
 */
function calculateHoursOffset(pixelOffset: number, zoomLevel: ZoomLevel): number {
  // Pixels per hour varies by zoom level
  const pixelsPerHour = {
    day: 40, // More detail at day zoom
    week: 10, // Medium detail
    month: 3, // Less detail
  };

  return pixelOffset / pixelsPerHour[zoomLevel];
}

export default useGanttDragDrop;
