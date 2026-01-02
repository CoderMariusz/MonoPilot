'use client';

/**
 * GanttMobileView Component (Story 03.15)
 * List-based mobile view instead of full Gantt
 *
 * Features:
 * - Collapsible swimlane sections
 * - WO cards instead of bars
 * - Long-press for action menu
 */

import React, { useState, useCallback } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { GanttDataResponse, GanttWorkOrder, GanttSwimlane } from '@/lib/types/gantt';
import { STATUS_COLORS, formatTime } from '@/lib/types/gantt';

interface GanttMobileViewProps {
  data: GanttDataResponse;
  onWOClick: (wo: GanttWorkOrder) => void;
  onWOEdit?: (wo: GanttWorkOrder) => void;
  onWOReschedule?: (wo: GanttWorkOrder) => void;
}

interface SwimlaneSection {
  swimlane: GanttSwimlane;
  isExpanded: boolean;
}

export function GanttMobileView({
  data,
  onWOClick,
  onWOEdit,
  onWOReschedule,
}: GanttMobileViewProps) {
  // Track expanded sections
  const [expandedSwimlanes, setExpandedSwimlanes] = useState<Set<string>>(
    new Set(data.swimlanes.map((s) => s.id)) // All expanded by default
  );

  const toggleSwimlane = useCallback((swimlaneId: string) => {
    setExpandedSwimlanes((prev) => {
      const next = new Set(prev);
      if (next.has(swimlaneId)) {
        next.delete(swimlaneId);
      } else {
        next.add(swimlaneId);
      }
      return next;
    });
  }, []);

  // Group WOs by date within each swimlane
  const groupByDate = (workOrders: GanttWorkOrder[]) => {
    const groups: Record<string, GanttWorkOrder[]> = {};

    workOrders.forEach((wo) => {
      const date = wo.scheduled_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(wo);
    });

    // Sort groups by date and WOs by start time
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, wos]) => ({
        date,
        workOrders: wos.sort((a, b) =>
          a.scheduled_start_time.localeCompare(b.scheduled_start_time)
        ),
      }));

    return sortedGroups;
  };

  return (
    <div className="space-y-4">
      {data.swimlanes.map((swimlane) => {
        const isExpanded = expandedSwimlanes.has(swimlane.id);
        const woGroups = groupByDate(swimlane.work_orders);

        return (
          <div
            key={swimlane.id}
            data-testid="swimlane-section"
            className="bg-white border rounded-lg overflow-hidden"
          >
            {/* Swimlane header */}
            <button
              onClick={() => toggleSwimlane(swimlane.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              data-testid="expand-swimlane"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">{swimlane.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {swimlane.work_orders.length} WOs
                </Badge>
              </div>
            </button>

            {/* WO cards */}
            {isExpanded && (
              <div className="divide-y">
                {woGroups.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No work orders scheduled
                  </div>
                ) : (
                  woGroups.map((group) => (
                    <div key={group.date}>
                      {/* Date header */}
                      <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-600">
                        {new Date(group.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {group.date === new Date().toISOString().split('T')[0] && (
                          <span className="ml-2 text-blue-600">(Today)</span>
                        )}
                      </div>

                      {/* WO cards for this date */}
                      {group.workOrders.map((wo) => (
                        <WOCard
                          key={wo.id}
                          workOrder={wo}
                          onClick={() => onWOClick(wo)}
                          onEdit={onWOEdit ? () => onWOEdit(wo) : undefined}
                          onReschedule={
                            onWOReschedule ? () => onWOReschedule(wo) : undefined
                          }
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface WOCardProps {
  workOrder: GanttWorkOrder;
  onClick: () => void;
  onEdit?: () => void;
  onReschedule?: () => void;
}

function WOCard({ workOrder, onClick, onEdit, onReschedule }: WOCardProps) {
  const statusColor = STATUS_COLORS[workOrder.status] || STATUS_COLORS.draft;
  const showMaterialWarning =
    workOrder.material_status === 'low' ||
    workOrder.material_status === 'insufficient';

  const canEdit = !['completed', 'closed', 'cancelled'].includes(workOrder.status);

  return (
    <div
      data-testid="wo-card"
      className="px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onClick}
          className="flex-1 text-left"
        >
          {/* WO info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {workOrder.wo_number}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize',
                statusColor.bg,
                statusColor.text
              )}
            >
              {workOrder.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Product */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Package className="h-3.5 w-3.5" />
            {workOrder.product.name}
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(workOrder.scheduled_start_time)} -{' '}
            {formatTime(workOrder.scheduled_end_time)}
            <span className="text-gray-400">({workOrder.duration_hours}h)</span>
          </div>

          {/* Quantity and warnings */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-medium">
              {workOrder.quantity.toLocaleString()} {workOrder.uom}
            </span>

            {showMaterialWarning && (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                Materials {workOrder.material_status}
              </span>
            )}

            {workOrder.is_overdue && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>

          {/* Progress (if in progress) */}
          {workOrder.status === 'in_progress' && workOrder.progress_percent !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{workOrder.progress_percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${workOrder.progress_percent}%` }}
                />
              </div>
            </div>
          )}
        </button>

        {/* Actions dropdown */}
        {canEdit && (onEdit || onReschedule) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>View Details</DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              )}
              {onReschedule && (
                <DropdownMenuItem onClick={onReschedule}>
                  Reschedule
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default GanttMobileView;
