'use client';

/**
 * GanttTodayIndicator Component (Story 03.15)
 * Vertical "today" line that shows current date/time
 *
 * Features:
 * - Red dashed vertical line at current date/time
 * - Auto-updates every 60 seconds
 * - Only visible if today is within date range
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { GanttDateRange, ZoomLevel } from '@/lib/types/gantt';

interface GanttTodayIndicatorProps {
  dateRange: GanttDateRange;
  containerWidth: number;
  zoomLevel: ZoomLevel;
}

export function GanttTodayIndicator({
  dateRange,
  containerWidth,
  zoomLevel,
}: GanttTodayIndicatorProps) {
  const [now, setNow] = useState(new Date());

  // Update every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate if today is within range
  const isVisible = useMemo(() => {
    const fromDate = new Date(dateRange.from_date);
    const toDate = new Date(dateRange.to_date);
    const today = new Date(now.toISOString().split('T')[0]);

    return today >= fromDate && today <= toDate;
  }, [dateRange, now]);

  // Calculate position as percentage of container width
  const position = useMemo(() => {
    if (!isVisible) return 0;

    const fromDate = new Date(dateRange.from_date);
    const toDate = new Date(dateRange.to_date);

    // Calculate total range in milliseconds
    const totalRange = toDate.getTime() - fromDate.getTime();
    if (totalRange <= 0) return 0;

    // Calculate position within range (including time of day for day/week zoom)
    const nowTime = now.getTime();
    const todayStart = new Date(now.toISOString().split('T')[0]).getTime();

    let position: number;

    if (zoomLevel === 'day') {
      // For day zoom, include time within the day
      const currentDayProgress = (nowTime - todayStart) / (24 * 60 * 60 * 1000);
      const daysSinceStart =
        (todayStart - fromDate.getTime()) / (24 * 60 * 60 * 1000);
      const totalDays =
        (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000) + 1;
      position = ((daysSinceStart + currentDayProgress) / totalDays) * 100;
    } else {
      // For week/month zoom, just show day position
      const elapsed = todayStart - fromDate.getTime();
      position = (elapsed / totalRange) * 100;
    }

    return Math.max(0, Math.min(100, position));
  }, [dateRange, now, isVisible, zoomLevel]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      data-testid="today-indicator"
      role="separator"
      aria-label="Current date and time indicator"
      className="absolute top-0 bottom-0 z-20 pointer-events-none"
      style={{
        left: `${position}%`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Red dashed vertical line */}
      <div
        className="h-full border-l-2 border-dashed"
        style={{ borderColor: '#EF4444' }}
      />

      {/* "Today" label at top */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
        Now
      </div>
    </div>
  );
}

export default GanttTodayIndicator;
