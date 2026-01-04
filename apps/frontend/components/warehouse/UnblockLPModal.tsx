/**
 * Unblock LP Modal Component
 * Story: 05.4 - LP Status Management
 * Modal for unblocking a license plate (confirmation)
 *
 * States:
 * - Ready: Confirmation dialog ready
 * - Submitting: Unblock action in progress
 * - Success: LP unblocked successfully
 * - Error: Unblock action failed
 *
 * Per wireframe WH-004.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LPStatusBadge } from './LPStatusBadge';
import { LPQAStatusBadge } from './LPQAStatusBadge';
import type { LicensePlate } from '@/lib/types/license-plate';

// ============================================================================
// SCHEMAS
// ============================================================================

const unblockLPSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
});

type UnblockLPFormData = z.infer<typeof unblockLPSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface UnblockLPModalProps {
  lp: LicensePlate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState({ lpNumber }: { lpNumber: string }) {
  return (
    <div className="space-y-4 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Unblocking LP...</p>
          <p className="text-sm text-gray-500">{lpNumber}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessState({
  lp,
  reason,
  onClose,
}: {
  lp: LicensePlate;
  reason?: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold">License Plate Unblocked</h3>
      </div>

      <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">LP Number:</span>
            <span className="font-medium">{lp.lp_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Product:</span>
            <span className="font-medium">
              {lp.product?.name} ({lp.product?.code})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">New Status:</span>
            <LPStatusBadge status="available" size="sm" />
          </div>
        </div>
        {reason && (
          <>
            <Separator />
            <div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reason:</span>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{reason}</p>
            </div>
          </>
        )}
        <Separator />
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>LP unblocked successfully</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Status changed to Available</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Audit trail entry created</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Warehouse manager notified</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>✓ Note:</strong> This LP is now available for use in production and can be moved
          to different locations.
        </p>
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

export function UnblockLPModal({ lp, open, onOpenChange, onSuccess }: UnblockLPModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReason, setSubmittedReason] = useState<string | undefined>();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<UnblockLPFormData>({
    resolver: zodResolver(unblockLPSchema),
  });

  const reason = watch('reason');
  const characterCount = reason?.length || 0;

  const handleClose = () => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmittedReason(undefined);
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: UnblockLPFormData) => {
    // Check if not blocked
    if (lp.status !== 'blocked') {
      toast({
        title: 'LP Not Blocked',
        description: 'This license plate is not currently blocked.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call API endpoint to unblock LP
      // const response = await fetch(`/api/warehouse/license-plates/${lp.id}/unblock`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     reason: data.reason,
      //   }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmittedReason(data.reason);
      setIsSuccess(true);
      onSuccess();

      toast({
        title: 'LP Unblocked',
        description: `${lp.lp_number} has been unblocked and is now available.`,
      });
    } catch (error) {
      toast({
        title: 'Unblock Failed',
        description: 'Failed to unblock license plate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? 'License Plate Unblocked' : 'Unblock License Plate'}
          </DialogTitle>
          {!isSuccess && !isSubmitting && (
            <DialogDescription>
              Unblock {lp.lp_number} to make it available for use in production. This will change
              the status to Available.
            </DialogDescription>
          )}
        </DialogHeader>

        {isSubmitting ? (
          <LoadingState lpNumber={lp.lp_number} />
        ) : isSuccess ? (
          <SuccessState lp={lp} reason={submittedReason} onClose={handleClose} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <LPStatusBadge status={lp.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current QA:</span>
                <LPQAStatusBadge qaStatus={lp.qa_status} size="sm" />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Unblocking (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for unblocking this license plate (e.g., 'Issue resolved', 'QA retest passed', etc.)..."
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
                    ℹ️ Optional - will be logged in audit trail if provided
                  </p>
                )}
                <span className="text-gray-400">
                  Characters: {characterCount} / 500
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold">Unblocking this LP will:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Change status from Blocked → Available</li>
                    <li>Allow it to be used in production</li>
                    <li>Allow it to be moved to different locations</li>
                    <li>Create an audit trail entry</li>
                    <li>Send notification to the warehouse manager</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Unblock LP
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
