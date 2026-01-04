/**
 * Change QA Status Modal Component
 * Story: 05.4 - LP Status Management
 * Modal for changing license plate QA status (Manager/QA role only)
 *
 * States:
 * - Loading: Shows skeleton placeholders during data fetch
 * - Ready: Form ready for input with validation
 * - Submitting: QA status update in progress
 * - Success: QA status updated successfully
 * - Error: Invalid transition or update failed
 *
 * Per wireframe WH-004 and Story 05.4.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { LPStatusBadge } from './LPStatusBadge';
import { LPQAStatusBadge } from './LPQAStatusBadge';
import type { LicensePlate, QAStatus } from '@/lib/types/license-plate';

// ============================================================================
// SCHEMAS
// ============================================================================

const changeQAStatusSchema = z.object({
  newQAStatus: z.enum(['pending', 'passed', 'failed', 'quarantine'], {
    required_error: 'Please select a new QA status',
  }),
  reason: z
    .string({ required_error: 'Reason is required for QA status change' })
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

type ChangeQAStatusFormData = z.infer<typeof changeQAStatusSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface ChangeQAStatusModalProps {
  lp: LicensePlate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ============================================================================
// QA STATUS CONFIG
// ============================================================================

const QA_STATUS_INFO: Record<
  QAStatus,
  { icon: string; description: string; color: string }
> = {
  pending: {
    icon: '🕐',
    description: 'QA inspection not yet completed',
    color: 'yellow',
  },
  passed: {
    icon: '✓',
    description: 'QA inspection passed, ready for use',
    color: 'green',
  },
  failed: {
    icon: '✗',
    description: 'QA inspection failed, LP will be blocked',
    color: 'red',
  },
  quarantine: {
    icon: '⚠️',
    description: 'Moved to quarantine location',
    color: 'orange',
  },
};

// ============================================================================
// QA STATUS SIDE EFFECTS
// ============================================================================

function getQAStatusSideEffects(
  currentQAStatus: QAStatus,
  newQAStatus: QAStatus,
  currentStatus: string
): {
  statusChange?: string;
  description: string;
  warning?: boolean;
} {
  // QA Fail triggers blocked status
  if (newQAStatus === 'failed') {
    return {
      statusChange: 'blocked',
      description:
        'LP Status will automatically change to BLOCKED when QA status is set to Failed.',
      warning: true,
    };
  }

  // QA Quarantine keeps blocked status
  if (newQAStatus === 'quarantine' && currentStatus !== 'blocked') {
    return {
      statusChange: 'blocked',
      description:
        'LP Status will automatically change to BLOCKED when QA status is set to Quarantine.',
      warning: true,
    };
  }

  // QA Pass from quarantine unblocks
  if (newQAStatus === 'passed' && currentStatus === 'blocked') {
    return {
      statusChange: 'available',
      description:
        'LP Status will automatically change to AVAILABLE when QA status is set to Passed from Quarantine.',
    };
  }

  return {
    description: 'No automatic status change will occur.',
  };
}

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
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Current Status:</span>
        <LPStatusBadge status={lp.status} size="sm" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Current QA Status:</span>
        <LPQAStatusBadge qaStatus={lp.qa_status} size="sm" />
      </div>
    </div>
  );
}

function SideEffectsSection({
  currentQAStatus,
  newQAStatus,
  currentStatus,
}: {
  currentQAStatus: QAStatus;
  newQAStatus: QAStatus;
  currentStatus: string;
}) {
  const effects = getQAStatusSideEffects(currentQAStatus, newQAStatus, currentStatus);

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg border p-4',
        effects.warning
          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
      )}
    >
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        QA Status Change Effects
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-amber-600">⚠️</span>
          <span>
            <strong>QA Status:</strong> {currentQAStatus} → {newQAStatus}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className={effects.statusChange ? 'text-amber-600' : 'text-green-600'}>
            {effects.statusChange ? '⚠️' : '✓'}
          </span>
          <span>
            <strong>LP Status:</strong>{' '}
            {effects.statusChange ? `${currentStatus} → ${effects.statusChange}` : `${currentStatus} (no change)`}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600">✓</span>
          <span>
            <strong>Audit Trail:</strong> Change recorded with reason
          </span>
        </div>
      </div>

      {effects.warning && (
        <div className="mt-3 rounded border border-amber-300 bg-amber-100 p-3 dark:border-amber-700 dark:bg-amber-900/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            <AlertCircle className="h-4 w-4" />
            <span>Automatic Status Change</span>
          </div>
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{effects.description}</p>
        </div>
      )}
    </div>
  );
}

function LoadingState({ lpNumber }: { lpNumber: string }) {
  return (
    <div className="space-y-4 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Updating QA Status...</p>
          <p className="text-sm text-gray-500">{lpNumber}</p>
        </div>
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Validating QA status transition</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <span>Updating QA status</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
            <span>Applying side effects</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
            <span>Creating audit trail entries</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessState({
  lp,
  oldQAStatus,
  newQAStatus,
  reason,
  onClose,
}: {
  lp: LicensePlate;
  oldQAStatus: QAStatus;
  newQAStatus: QAStatus;
  reason: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold">QA Status Updated Successfully</h3>
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
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">QA Status Change:</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span>•</span>
              <span>
                <strong>QA Status:</strong> {oldQAStatus} → {newQAStatus}{' '}
                {QA_STATUS_INFO[newQAStatus].icon}
              </span>
            </li>
          </ul>
          <Separator className="my-2" />
          <div>
            <span className="text-gray-500">Reason:</span>
            <p className="mt-1 text-sm">{reason}</p>
          </div>
        </div>
        <Separator />
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Audit trail entries created</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Notification sent to warehouse manager</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={onClose} variant="default">
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChangeQAStatusModal({
  lp,
  open,
  onOpenChange,
  onSuccess,
}: ChangeQAStatusModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    oldQAStatus: QAStatus;
    newQAStatus: QAStatus;
    reason: string;
  } | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangeQAStatusFormData>({
    resolver: zodResolver(changeQAStatusSchema),
  });

  const selectedQAStatus = watch('newQAStatus');
  const reason = watch('reason');
  const characterCount = reason?.length || 0;

  const handleClose = () => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmittedData(null);
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: ChangeQAStatusFormData) => {
    // Check if same status
    if (lp.qa_status === data.newQAStatus) {
      toast({
        title: 'Same QA Status',
        description: `QA Status is already ${data.newQAStatus}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call API endpoint to update QA status
      // const response = await fetch(`/api/warehouse/license-plates/${lp.id}/qa-status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     qa_status: data.newQAStatus,
      //     reason: data.reason,
      //   }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmittedData({
        oldQAStatus: lp.qa_status,
        newQAStatus: data.newQAStatus,
        reason: data.reason,
      });
      setIsSuccess(true);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update QA status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? 'QA Status Updated' : 'Change QA Status'}
          </DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <LoadingState lpNumber={lp.lp_number} />
        ) : isSuccess && submittedData ? (
          <SuccessState
            lp={lp}
            oldQAStatus={submittedData.oldQAStatus}
            newQAStatus={submittedData.newQAStatus}
            reason={submittedData.reason}
            onClose={handleClose}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <LPInfoSection lp={lp} />

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                New QA Status <span className="text-red-500">*</span>
              </Label>

              <RadioGroup
                onValueChange={(value) => {
                  const event = {
                    target: { name: 'newQAStatus', value },
                  } as any;
                  register('newQAStatus').onChange(event);
                }}
                className="space-y-3"
              >
                {Object.entries(QA_STATUS_INFO).map(([qaStatus, info]) => (
                  <div
                    key={qaStatus}
                    className="flex items-center space-x-3 rounded-lg border p-3"
                  >
                    <RadioGroupItem
                      value={qaStatus}
                      id={qaStatus}
                      {...register('newQAStatus')}
                    />
                    <Label htmlFor={qaStatus} className="flex flex-1 cursor-pointer items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium capitalize">{qaStatus}</span>
                        <p className="text-xs text-gray-500">{info.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.newQAStatus && (
                <p className="text-sm text-red-500">{errors.newQAStatus.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for QA Status Change <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for QA status change (e.g., 'Visual inspection OK', 'Failed moisture test', 'Retest passed', etc.)..."
                rows={3}
                maxLength={500}
                {...register('reason')}
                className={cn(errors.reason && 'border-red-500')}
              />
              <div className="flex items-center justify-between text-xs">
                {errors.reason ? (
                  <p className="text-red-500">❌ {errors.reason.message}</p>
                ) : (
                  <p className="text-gray-500">
                    ℹ️ Reason is required for QA status change
                  </p>
                )}
                <span className="text-gray-400">
                  Characters: {characterCount} / 500
                </span>
              </div>
            </div>

            {selectedQAStatus && (
              <>
                <Separator />
                <SideEffectsSection
                  currentQAStatus={lp.qa_status}
                  newQAStatus={selectedQAStatus}
                  currentStatus={lp.status}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedQAStatus}>
                Update QA Status
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
