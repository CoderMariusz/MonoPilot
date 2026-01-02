'use client';

/**
 * GanttRescheduleDialog Component (Story 03.15)
 * Confirmation dialog for reschedule
 *
 * Features:
 * - Shows old vs new schedule
 * - Displays warnings (material availability, dependencies)
 * - Confirm/Cancel buttons
 */

import React from 'react';
import { AlertTriangle, ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { GanttWorkOrder, DragPosition } from '@/lib/types/gantt';
import { formatTime } from '@/lib/types/gantt';

interface GanttRescheduleDialogProps {
  open: boolean;
  workOrder: GanttWorkOrder | null;
  newSchedule: DragPosition | null;
  newLineName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  warnings?: string[];
  isLoading?: boolean;
}

export function GanttRescheduleDialog({
  open,
  workOrder,
  newSchedule,
  newLineName,
  onConfirm,
  onCancel,
  warnings = [],
  isLoading,
}: GanttRescheduleDialogProps) {
  if (!workOrder || !newSchedule) return null;

  const isLineChange = !!newSchedule.swimlaneId;
  const isDateChange = newSchedule.date !== workOrder.scheduled_date;
  const isTimeChange =
    newSchedule.startTime !== workOrder.scheduled_start_time ||
    newSchedule.endTime !== workOrder.scheduled_end_time;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="reschedule-dialog"
      >
        <DialogHeader>
          <DialogTitle>Reschedule {workOrder.wo_number}?</DialogTitle>
          <DialogDescription>
            Review the schedule changes below and confirm to reschedule this work order.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Product name */}
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
            <span className="font-medium">{workOrder.product.name}</span>
            <span className="text-gray-400 ml-2">({workOrder.product.code})</span>
          </div>

          {/* Schedule comparison */}
          <div className="space-y-3">
            {/* Date change */}
            {isDateChange && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 line-through">
                    {formatDate(workOrder.scheduled_date)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600">
                    {formatDate(newSchedule.date)}
                  </span>
                </div>
              </div>
            )}

            {/* Time change */}
            {isTimeChange && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 line-through">
                    {formatTime(workOrder.scheduled_start_time)} -{' '}
                    {formatTime(workOrder.scheduled_end_time)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600">
                    {formatTime(newSchedule.startTime)} -{' '}
                    {formatTime(newSchedule.endTime)}
                  </span>
                </div>
              </div>
            )}

            {/* Line change */}
            {isLineChange && newLineName && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Reassign to:</span>
                  <span className="font-medium text-blue-600">{newLineName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <Alert
                  key={index}
                  variant="destructive"
                  className="bg-yellow-50 border-yellow-200"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {warning}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="confirm-reschedule"
          >
            {isLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GanttRescheduleDialog;
