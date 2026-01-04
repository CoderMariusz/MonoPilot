/**
 * Change LP Status Modal Component
 * Story: 05.4 - LP Status Management
 * Modal for changing license plate status with validation
 *
 * States:
 * - Loading: Shows skeleton placeholders during data fetch
 * - Ready: Form ready for input with validation
 * - Submitting: Status update in progress
 * - Success: Status updated successfully
 * - Error: Invalid transition or update failed
 *
 * Per wireframe WH-004.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { LPStatusBadge } from './LPStatusBadge';
import { LPQAStatusBadge } from './LPQAStatusBadge';
import type { LicensePlate, LPStatus } from '@/lib/types/license-plate';

// ============================================================================
// SCHEMAS
// ============================================================================

const changeStatusSchema = z.object({
  newStatus: z.enum(['available', 'reserved', 'consumed', 'blocked'], {
    required_error: 'Please select a new status',
  }),
  reason: z.string().optional(),
  sendNotification: z.boolean().default(false),
}).refine((data) => {
  // Reason required for consumed and blocked
  if ((data.newStatus === 'consumed' || data.newStatus === 'blocked') && !data.reason?.trim()) {
    return false;
  }
  // Reason must be at least 10 chars if provided for consumed/blocked
  if ((data.newStatus === 'consumed' || data.newStatus === 'blocked') && data.reason && data.reason.trim().length < 10) {
    return false;
  }
  return true;
}, {
  message: 'Reason is required and must be at least 10 characters for Consumed or Blocked status',
  path: ['reason'],
});

type ChangeStatusFormData = z.infer<typeof changeStatusSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface ChangeLPStatusModalProps {
  lp: LicensePlate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ============================================================================
// STATUS TRANSITION VALIDATION
// ============================================================================

const VALID_TRANSITIONS: Record<LPStatus, LPStatus[]> = {
  available: ['reserved', 'consumed', 'blocked'],
  reserved: ['available', 'consumed'],
  consumed: [], // Terminal state
  blocked: ['available'],
};

function getTransitionError(currentStatus: LPStatus, newStatus: LPStatus): string | null {
  if (currentStatus === newStatus) {
    return `Status is already ${currentStatus}`;
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    if (currentStatus === 'consumed') {
      return `Cannot change status from 'Consumed' to any other status. 'Consumed' is a terminal status and cannot be changed.`;
    }
    return `Invalid status transition: ${currentStatus} → ${newStatus}`;
  }

  return null;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_INFO: Record<LPStatus, { icon: string; description: string }> = {
  available: { icon: '✓', description: 'Ready for use in production' },
  reserved: { icon: '🔒', description: 'Allocated to work order or transfer' },
  consumed: { icon: '📦', description: 'Fully consumed in production (terminal)' },
  blocked: { icon: '🚫', description: 'Cannot be used (quality hold, damage, etc)' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LPInfoSection({ lp }: { lp: LicensePlate }) {
  return (
    <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4 dark:bg-gray-900/50">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        License Plate Information
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">LP Number:</span>
          <span className="font-medium">{lp.lp_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Product:</span>
          <span className="font-medium">
            {lp.product?.name || 'Unknown'} ({lp.product?.code || 'N/A'})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Quantity:</span>
          <span className="font-medium">
            {lp.quantity} {lp.uom}
          </span>
        </div>
        {lp.batch_number && (
          <div className="flex justify-between">
            <span className="text-gray-500">Batch:</span>
            <span className="font-medium">{lp.batch_number}</span>
          </div>
        )}
        {lp.location && (
          <div className="flex justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="font-medium">{lp.location.name}</span>
          </div>
        )}
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Current Status:</span>
        <LPStatusBadge status={lp.status} size="md" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Current QA:</span>
        <LPQAStatusBadge qaStatus={lp.qa_status} size="md" />
      </div>
    </div>
  );
}

function StatusEffectsSection({
  currentStatus,
  currentQAStatus,
  newStatus,
}: {
  currentStatus: LPStatus;
  currentQAStatus: string;
  newStatus: LPStatus;
}) {
  const isConsumed = newStatus === 'consumed';
  const isReserved = newStatus === 'reserved';

  return (
    <div className="space-y-3 rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-950/30">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Status Change Effects
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-amber-600">⚠️</span>
          <span>
            <strong>LP Status:</strong> {currentStatus} → {newStatus}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600">✓</span>
          <span>
            <strong>QA Status:</strong> {currentQAStatus} (no change)
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className={isConsumed ? 'text-red-600' : 'text-amber-600'}>
            {isConsumed ? '❌' : '⚠️'}
          </span>
          <span>
            <strong>Consumption:</strong>{' '}
            {isConsumed
              ? 'Allowed → BLOCKED PERMANENTLY'
              : isReserved
              ? 'Allowed → Restricted (reserved LPs only)'
              : 'No change'}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className={isConsumed ? 'text-red-600' : 'text-green-600'}>
            {isConsumed ? '❌' : '✓'}
          </span>
          <span>
            <strong>Movement:</strong>{' '}
            {isConsumed ? 'Allowed → BLOCKED PERMANENTLY' : 'Allowed'}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600">✓</span>
          <span>
            <strong>Audit Trail:</strong> Change recorded with reason
          </span>
        </div>
      </div>

      {isConsumed && (
        <div className="mt-3 space-y-2 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
            <span>⚠️</span>
            <span>WARNING: CONSUMED is a TERMINAL STATUS</span>
          </div>
          <ul className="ml-6 list-disc space-y-1 text-xs text-amber-800 dark:text-amber-200">
            <li>Once marked as consumed, this LP cannot be used in production again</li>
            <li>LP cannot be moved to different locations</li>
            <li>LP cannot be split or merged with other LPs</li>
            <li>Status cannot be changed (except reversals in future phases)</li>
          </ul>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ❗ This action should normally be performed automatically by the production module.
            Manual status change to &apos;Consumed&apos; should only be used for corrections or special cases.
          </p>
        </div>
      )}

      {isReserved && (
        <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <span className="flex items-center gap-1">
            <span>ℹ️</span>
            <strong>Note:</strong>
          </span>
          <p className="ml-4 mt-1">
            Reserved LPs can only be consumed by the work order or transfer order that reserved them.
          </p>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Updating LP Status...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Validating status transition</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Checking QA status compatibility</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <span>Updating LP status</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
            <span>Creating audit trail entry</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
            <span>Sending notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessState({
  lp,
  oldStatus,
  newStatus,
  reason,
  onClose,
  onViewDetails,
  onViewHistory,
}: {
  lp: LicensePlate;
  oldStatus: LPStatus;
  newStatus: LPStatus;
  reason?: string;
  onClose: () => void;
  onViewDetails: () => void;
  onViewHistory: () => void;
}) {
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold">LP Status Updated Successfully</h3>
      </div>

      <div className="space-y-3 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">LP Number:</span>
            <span className="font-medium">{lp.lp_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Product:</span>
            <span className="font-medium">
              {lp.product?.name} ({lp.product?.code})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity:</span>
            <span className="font-medium">
              {lp.quantity} {lp.uom}
            </span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Status Changes:</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span>•</span>
              <span>
                <strong>LP Status:</strong> {oldStatus} → {newStatus}{' '}
                {STATUS_INFO[newStatus].icon}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span>•</span>
              <span>
                <strong>QA Status:</strong> {lp.qa_status} (unchanged)
              </span>
            </li>
          </ul>
          {reason && (
            <>
              <Separator className="my-2" />
              <div>
                <span className="text-gray-500">Reason:</span>
                <p className="mt-1 text-sm">{reason}</p>
              </div>
            </>
          )}
        </div>
        <Separator />
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Audit trail entry created</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Notification sent to warehouse manager</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">What would you like to do next?</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onViewDetails} variant="outline" size="sm">
            View LP Details
          </Button>
          <Button onClick={onViewHistory} variant="outline" size="sm">
            View Status History
          </Button>
          <Button onClick={onClose} variant="default" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChangeLPStatusModal({
  lp,
  open,
  onOpenChange,
  onSuccess,
}: ChangeLPStatusModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    oldStatus: LPStatus;
    newStatus: LPStatus;
    reason?: string;
  } | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangeStatusFormData>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: {
      sendNotification: false,
    },
  });

  const selectedStatus = watch('newStatus');
  const reason = watch('reason');
  const needsReason = selectedStatus === 'consumed' || selectedStatus === 'blocked';
  const characterCount = reason?.length || 0;

  const handleClose = () => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmittedData(null);
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: ChangeStatusFormData) => {
    // Validate transition
    const transitionError = getTransitionError(lp.status, data.newStatus);
    if (transitionError) {
      toast({
        title: 'Invalid Status Transition',
        description: transitionError,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call API endpoint to update status
      // const response = await fetch(`/api/warehouse/license-plates/${lp.id}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     status: data.newStatus,
      //     reason: data.reason,
      //     send_notification: data.sendNotification,
      //   }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmittedData({
        oldStatus: lp.status,
        newStatus: data.newStatus,
        reason: data.reason,
      });
      setIsSuccess(true);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update LP status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Terminal state error dialog
  if (lp.status === 'consumed' && !isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cannot Change LP Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <XCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
              <div className="space-y-2">
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Invalid Status Transition
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Cannot change status from &apos;Consumed&apos; to any other status. &apos;Consumed&apos; is a terminal
                  status and cannot be changed.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700 dark:text-red-300">Current LP Status:</span>
                    <LPStatusBadge status="consumed" size="sm" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-red-700 dark:text-red-300">
                  License plates marked as &apos;Consumed&apos; have been fully used in production and cannot be
                  reactivated or modified.
                </p>
                <div className="mt-3 space-y-1 text-sm text-red-800 dark:text-red-200">
                  <div>
                    <strong>LP Number:</strong> {lp.lp_number}
                  </div>
                  <div>
                    <strong>Product:</strong> {lp.product?.name}
                  </div>
                </div>
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                  If this is an error, please contact your system administrator or create a reversal
                  transaction (future feature).
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? 'LP Status Updated' : 'Change LP Status'}
          </DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <LoadingState />
        ) : isSuccess && submittedData ? (
          <SuccessState
            lp={lp}
            oldStatus={submittedData.oldStatus}
            newStatus={submittedData.newStatus}
            reason={submittedData.reason}
            onClose={handleClose}
            onViewDetails={handleClose}
            onViewHistory={handleClose}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <LPInfoSection lp={lp} />

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Change LP Status <span className="text-red-500">*</span>
              </Label>

              <RadioGroup
                onValueChange={(value) => {
                  const event = {
                    target: { name: 'newStatus', value },
                  } as any;
                  register('newStatus').onChange(event);
                }}
                className="space-y-3"
              >
                {Object.entries(STATUS_INFO).map(([status, info]) => {
                  const disabled = !VALID_TRANSITIONS[lp.status].includes(status as LPStatus);
                  return (
                    <div
                      key={status}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg border p-3',
                        disabled && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <RadioGroupItem
                        value={status}
                        id={status}
                        disabled={disabled}
                        {...register('newStatus')}
                      />
                      <Label
                        htmlFor={status}
                        className={cn(
                          'flex flex-1 cursor-pointer items-center gap-2',
                          disabled && 'cursor-not-allowed'
                        )}
                      >
                        <span className="text-lg">{info.icon}</span>
                        <div className="flex-1">
                          <span className="font-medium capitalize">{status}</span>
                          <p className="text-xs text-gray-500">{info.description}</p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {errors.newStatus && (
                <p className="text-sm text-red-500">{errors.newStatus.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Status Change {needsReason && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  needsReason
                    ? 'Required for Consumed or Blocked status...'
                    : 'Optional reason for status change...'
                }
                rows={3}
                maxLength={500}
                {...register('reason')}
                className={cn(errors.reason && 'border-red-500')}
              />
              <div className="flex items-center justify-between text-xs">
                {errors.reason ? (
                  <p className="text-red-500">❌ {errors.reason.message}</p>
                ) : needsReason ? (
                  <p className="text-gray-500">
                    ℹ️ Reason is required when marking as {selectedStatus}
                  </p>
                ) : (
                  <p className="text-gray-500">
                    ℹ️ Optional for Available/Reserved
                  </p>
                )}
                <span className="text-gray-400">
                  Characters: {characterCount} / 500
                </span>
              </div>
            </div>

            {selectedStatus && (
              <>
                <Separator />
                <StatusEffectsSection
                  currentStatus={lp.status}
                  currentQAStatus={lp.qa_status}
                  newStatus={selectedStatus}
                />
              </>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="audit" checked disabled />
                <Label
                  htmlFor="audit"
                  className="cursor-not-allowed text-sm font-normal text-gray-500"
                >
                  Log status change in audit trail (mandatory)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="notification" {...register('sendNotification')} />
                <Label htmlFor="notification" className="cursor-pointer text-sm font-normal">
                  Send notification to warehouse manager
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedStatus}>
                Update Status
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
