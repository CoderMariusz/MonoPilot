'use client';

/**
 * GanttQuickView Component (Story 03.15)
 * WO detail slide-in panel (Quick View)
 *
 * Features:
 * - Slides in from right
 * - Shows WO details (number, product, status, schedule, quantity)
 * - Material status indicator
 * - Action buttons: View Full Details, Edit, Reschedule
 */

import React from 'react';
import { X, ExternalLink, Edit, Clock, Package, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { GanttWorkOrder } from '@/lib/types/gantt';
import { STATUS_COLORS, formatTime } from '@/lib/types/gantt';

interface GanttQuickViewProps {
  workOrder: GanttWorkOrder | null;
  onClose: () => void;
  onEdit?: (wo: GanttWorkOrder) => void;
  onReschedule?: (wo: GanttWorkOrder) => void;
}

export function GanttQuickView({
  workOrder,
  onClose,
  onEdit,
  onReschedule,
}: GanttQuickViewProps) {
  if (!workOrder) return null;

  const statusColor = STATUS_COLORS[workOrder.status] || STATUS_COLORS.draft;
  const showMaterialWarning =
    workOrder.material_status === 'low' ||
    workOrder.material_status === 'insufficient';

  const formattedDate = new Date(workOrder.scheduled_date).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <Sheet open={!!workOrder} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md"
        data-testid="quick-view-panel"
      >
        <SheetHeader className="space-y-1">
          <div className="flex items-start justify-between">
            <SheetTitle
              className="text-lg font-bold"
              data-testid="quick-view-wo-number"
            >
              {workOrder.wo_number}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="close-button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <SheetDescription className="text-left">
            {workOrder.product.name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <Badge
              variant="outline"
              className={cn(
                'capitalize',
                statusColor.bg,
                statusColor.border,
                statusColor.text
              )}
            >
              {workOrder.status.replace('_', ' ')}
            </Badge>
            {workOrder.is_overdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Schedule Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Schedule</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="text-sm text-gray-600 pl-6">
                {formatTime(workOrder.scheduled_start_time)} -{' '}
                {formatTime(workOrder.scheduled_end_time)}
                <span className="text-gray-400 ml-2">
                  ({workOrder.duration_hours}h)
                </span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Quantity</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {workOrder.quantity.toLocaleString()}
              </span>
              <span className="text-gray-500">{workOrder.uom}</span>
            </div>

            {/* Progress (if in progress) */}
            {workOrder.status === 'in_progress' && workOrder.progress_percent !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{workOrder.progress_percent}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${workOrder.progress_percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Product</h4>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{workOrder.product.code}</span>
            </div>
            <p className="text-sm text-gray-600 pl-6">{workOrder.product.name}</p>
          </div>

          {/* Material Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Materials</h4>
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg',
                workOrder.material_status === 'ok'
                  ? 'bg-green-50 text-green-700'
                  : workOrder.material_status === 'low'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'
              )}
            >
              {showMaterialWarning && (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium capitalize">
                {workOrder.material_status === 'ok'
                  ? 'All materials available'
                  : workOrder.material_status === 'low'
                    ? 'Some materials running low'
                    : 'Materials insufficient'}
              </span>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            <Badge
              variant="outline"
              className={cn(
                'capitalize',
                workOrder.priority === 'critical' && 'border-red-500 text-red-700',
                workOrder.priority === 'high' && 'border-orange-500 text-orange-700',
                workOrder.priority === 'normal' && 'border-gray-300 text-gray-600',
                workOrder.priority === 'low' && 'border-gray-200 text-gray-500'
              )}
            >
              {workOrder.priority}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t">
            <Link href={`/planning/work-orders/${workOrder.id}`} className="w-full">
              <Button
                variant="default"
                className="w-full"
                data-testid="view-full-details"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
            </Link>

            <div className="flex gap-2">
              {onEdit && !['completed', 'closed', 'cancelled'].includes(workOrder.status) && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(workOrder)}
                  data-testid="edit-wo"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              {onReschedule && !['completed', 'closed', 'cancelled'].includes(workOrder.status) && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onReschedule(workOrder)}
                  data-testid="reschedule-wo"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default GanttQuickView;
