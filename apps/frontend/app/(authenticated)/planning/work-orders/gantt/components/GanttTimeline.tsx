'use client';

/**
 * GanttTimeline Component (Story 03.15)
 * Timeline header with date/time scale
 *
 * Features:
 * - Renders date markers based on zoom level
 * - Day zoom: 4-hour increments
 * - Week zoom: daily markers
 * - Month zoom: weekly markers
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { GanttDateRange, ZoomLevel } from '@/lib/types/gantt';

interface GanttTimelineProps {
  dateRange: GanttDateRange;
  zoomLevel: ZoomLevel;
  className?: string;
}

interface TimeMarker {
  key: string;
  label: string;
  sublabel?: string;
  width: number;
  isToday: boolean;
  isWeekend?: boolean;
}

export function GanttTimeline({
  dateRange,
  zoomLevel,
  className,
}: GanttTimelineProps) {
  const markers = useMemo(() => {
    const from = new Date(dateRange.from_date);
    const to = new Date(dateRange.to_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: TimeMarker[] = [];

    if (zoomLevel === 'day') {
      // Day zoom: show 4-hour increments
      // For each day in range, show hours
      const current = new Date(from);

      while (current <= to) {
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);

        // Hour markers (4-hour increments)
        const hours = [0, 4, 8, 12, 16, 20];
        hours.forEach((hour) => {
          const hourDate = new Date(dayStart);
          hourDate.setHours(hour);

          const isWorkingHours = hour >= 6 && hour < 22;
          const hourStr = hour === 0 ? '12am' : hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`;

          result.push({
            key: `${dayStart.toISOString()}-${hour}`,
            label: hour === 8 ? current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '',
            sublabel: hourStr,
            width: 100 / (((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24) + 1) * 6),
            isToday: dayStart.getTime() === today.getTime(),
            isWeekend: dayStart.getDay() === 0 || dayStart.getDay() === 6,
          });
        });

        current.setDate(current.getDate() + 1);
      }
    } else if (zoomLevel === 'week') {
      // Week zoom: show days
      const current = new Date(from);
      const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      while (current <= to) {
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;

        result.push({
          key: current.toISOString(),
          label: current.toLocaleDateString('en-US', { weekday: 'short' }),
          sublabel: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          width: 100 / totalDays,
          isToday: current.getTime() === today.getTime(),
          isWeekend,
        });

        current.setDate(current.getDate() + 1);
      }
    } else {
      // Month zoom: show weeks
      const current = new Date(from);
      // Start from beginning of week
      current.setDate(current.getDate() - current.getDay());

      const totalWeeks = Math.ceil((to.getTime() - current.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
      let weekNum = 1;

      while (current <= to) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        result.push({
          key: current.toISOString(),
          label: `Week ${weekNum}`,
          sublabel: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          width: 100 / totalWeeks,
          isToday: today >= current && today <= weekEnd,
        });

        current.setDate(current.getDate() + 7);
        weekNum++;
      }
    }

    return result;
  }, [dateRange, zoomLevel]);

  return (
    <div
      className={cn(
        'sticky top-0 z-10 bg-white border-b border-gray-200',
        className
      )}
      role="columnheader"
      aria-label={`Timeline: ${dateRange.from_date} to ${dateRange.to_date}`}
      data-testid="timeline"
    >
      <div className="flex">
        {/* Swimlane label column placeholder */}
        <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {/* Label based on view mode would go here */}
          </span>
        </div>

        {/* Time markers */}
        <div className="flex-1 flex overflow-x-auto">
          {markers.map((marker) => (
            <div
              key={marker.key}
              data-testid={
                zoomLevel === 'day'
                  ? 'hour-marker'
                  : zoomLevel === 'week'
                    ? 'day-marker'
                    : 'week-marker'
              }
              className={cn(
                'flex-shrink-0 border-r border-gray-100 px-1 py-2 text-center',
                marker.isToday && 'bg-red-50',
                marker.isWeekend && 'bg-gray-50'
              )}
              style={{ width: `${marker.width}%`, minWidth: zoomLevel === 'day' ? '40px' : zoomLevel === 'week' ? '80px' : '120px' }}
            >
              {marker.label && (
                <div className="text-xs font-medium text-gray-700 truncate">
                  {marker.label}
                </div>
              )}
              {marker.sublabel && (
                <div className="text-xs text-gray-500 truncate">
                  {marker.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GanttTimeline;
