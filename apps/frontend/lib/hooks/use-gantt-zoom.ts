/**
 * React Hook: useGanttZoom
 * Story 03.15: WO Gantt Chart View - Zoom Level State
 *
 * Manages zoom level state with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import type { ZoomLevel } from '@/lib/types/gantt';

const STORAGE_KEY = 'gantt-zoom-level';

/**
 * Hook to manage Gantt chart zoom level
 *
 * @param defaultZoom - Default zoom level (defaults to 'week')
 * @returns Zoom level state and setter
 */
export function useGanttZoom(defaultZoom: ZoomLevel = 'week') {
  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>(defaultZoom);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['day', 'week', 'month'].includes(stored)) {
        setZoomLevelState(stored as ZoomLevel);
      }
    }
  }, []);

  // Persist to localStorage on change
  const setZoomLevel = useCallback((level: ZoomLevel) => {
    setZoomLevelState(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, level);
    }
  }, []);

  // Zoom in/out helpers
  const zoomIn = useCallback(() => {
    setZoomLevel(
      zoomLevel === 'month' ? 'week' : zoomLevel === 'week' ? 'day' : 'day'
    );
  }, [zoomLevel, setZoomLevel]);

  const zoomOut = useCallback(() => {
    setZoomLevel(
      zoomLevel === 'day' ? 'week' : zoomLevel === 'week' ? 'month' : 'month'
    );
  }, [zoomLevel, setZoomLevel]);

  return {
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    canZoomIn: zoomLevel !== 'day',
    canZoomOut: zoomLevel !== 'month',
  };
}

export default useGanttZoom;
