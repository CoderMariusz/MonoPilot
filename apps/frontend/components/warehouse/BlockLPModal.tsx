/**
 * Block LP Modal Component
 * Story: 05.4 - LP Status Management
 * Modal for blocking a license plate with required reason
 *
 * States:
 * - Ready: Form ready for input with validation
 * - Submitting: Block action in progress
 * - Success: LP blocked successfully
 * - Error: Block action failed
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

const blockLPSchema = z.object({
  reason: z
    .string({ required_error: 'Reason is required' })
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

type BlockLPFormData = z.infer<typeof blockLPSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface BlockLPModalProps {
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Blocking LP...</p>
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
  reason: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-semibold">License Plate Blocked</h3>
      </div>

      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
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
            <LPStatusBadge status="blocked" size="sm" />
          </div>
        </div>
        <Separator />
        <div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reason:</span>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{reason}</p>
        </div>
        <Separator />
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>LP blocked successfully</span>
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

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>⚠️ Note:</strong> This LP cannot be used in production or moved until it is
          unblocked.
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

export function BlockLPModal({ lp, open, onOpenChange, onSuccess }: BlockLPModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReason, setSubmittedReason] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BlockLPFormData>({
    resolver: zodResolver(blockLPSchema),
  });

  const reason = watch('reason');
  const characterCount = reason?.length || 0;

  const handleClose = () => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmittedReason('');
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: BlockLPFormData) => {
    // Check if already blocked
    if (lp.status === 'blocked') {
      toast({
        title: 'LP Already Blocked',
        description: 'This license plate is already blocked.',
        variant: 'destructive',
      });
      return;
    }

    // Check if consumed (terminal state)
    if (lp.status === 'consumed') {
      toast({
        title: 'Cannot Block Consumed LP',
        description: 'Cannot block a consumed license plate.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call API endpoint to block LP
      // const response = await fetch(`/api/warehouse/license-plates/${lp.id}/block`, {
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
        title: 'LP Blocked',
        description: `${lp.lp_number} has been blocked successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Block Failed',
        description: 'Failed to block license plate. Please try again.',
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
            {isSuccess ? 'License Plate Blocked' : 'Block License Plate'}
          </DialogTitle>
          {!isSuccess && !isSubmitting && (
            <DialogDescription>
              Block {lp.lp_number} from being used in production or moved. A reason is required.
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
                    <span className="font-medium">{lp.location.full_path}</span>
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
              <Label htmlFor="reason">
                Reason for Blocking <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for blocking this license plate (e.g., 'Damaged packaging', 'Quality hold - failed moisture test', etc.)..."
                rows={4}
                maxLength={500}
                {...register('reason')}
                className={cn(errors.reason && 'border-red-500')}
              />
              <div className="flex items-center justify-between text-xs">
                {errors.reason ? (
                  <p className="text-red-500">❌ {errors.reason.message}</p>
                ) : (
                  <p className="text-gray-500">
                    ℹ️ Minimum 10 characters required
                  </p>
                )}
                <span className="text-gray-400">
                  Characters: {characterCount} / 500
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold">Blocking this LP will:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Prevent it from being used in production</li>
                    <li>Prevent it from being moved to different locations</li>
                    <li>Require manual unblocking before it can be used again</li>
                    <li>Create an audit trail entry with your reason</li>
                    <li>Send notification to the warehouse manager</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Block LP
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
