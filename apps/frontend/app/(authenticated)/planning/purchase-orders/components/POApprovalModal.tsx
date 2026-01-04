/**
 * PO Approval Modal Component
 * Story: 03.5b - PO Approval Workflow
 * Modal for approving or rejecting purchase orders
 *
 * States:
 * - Loading: Shows skeleton placeholders during data fetch
 * - Ready: Form ready for input
 * - Submitting: Action in progress
 * - Success: Action completed
 * - Error: Action failed with error message
 *
 * Per wireframe PLAN-008.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePOApproval } from '@/lib/hooks/use-po-approval';
import { usePlanningSettings } from '@/lib/hooks/use-planning-settings';
import type { PurchaseOrderWithLines, Currency } from '@/lib/types/purchase-order';

// ============================================================================
// SCHEMAS
// ============================================================================

const approveSchema = z.object({
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

const rejectSchema = z.object({
  rejection_reason: z
    .string({ required_error: 'Rejection reason is required' })
    .min(1, 'Rejection reason is required')
    .refine((val) => val.length >= 10, {
      message: 'Reason must be at least 10 characters',
    })
    .refine((val) => val.length <= 1000, {
      message: 'Reason cannot exceed 1000 characters',
    }),
});

type ApproveFormData = z.infer<typeof approveSchema>;
type RejectFormData = z.infer<typeof rejectSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface POApprovalModalProps {
  po: PurchaseOrderWithLines;
  mode: 'approve' | 'reject';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency?: Currency | string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function POSummarySection({
  po,
}: {
  po: PurchaseOrderWithLines;
}) {
  // Handle both created_by and created_by_user patterns (created_by is from API, created_by_user is from DB join)
  const requestorName = (po as any).created_by?.name || po.created_by_user?.name || 'Unknown';

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4 dark:bg-gray-900/50">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Summary
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Supplier:</span>
          <p className="font-medium">
            {po.supplier?.name || 'Unknown'}
            {po.supplier?.code && (
              <span className="ml-1 text-gray-500">({po.supplier.code})</span>
            )}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Warehouse:</span>
          <p className="font-medium">{po.warehouse?.name || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-gray-500">Expected Delivery:</span>
          <p className="font-medium">{formatDate(po.expected_delivery_date)}</p>
        </div>
        <div>
          <span className="text-gray-500">Requestor:</span>
          <p className="font-medium">{requestorName}</p>
        </div>
      </div>
    </div>
  );
}

function POLinesSection({
  po,
}: {
  po: PurchaseOrderWithLines;
}) {
  // Handle both lines and po_lines patterns (po_lines from API, lines from type)
  const lines = po.lines || (po as any).po_lines || [];

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4 dark:bg-gray-900/50">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Lines ({lines.length} items)
      </h3>
      <div className="max-h-40 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line: any) => (
              <tr key={line.id} className="border-b last:border-0">
                <td className="py-2">{line.product_name || line.product?.name || 'Unknown'}</td>
                <td className="py-2 text-right tabular-nums">
                  {line.quantity} {line.uom}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(line.unit_price, po.currency)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(line.line_total, po.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function POTotalsSummary({
  po,
}: {
  po: PurchaseOrderWithLines;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-gray-50/50 p-4 dark:bg-gray-900/50">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Subtotal:</span>
        <span className="tabular-nums">{formatCurrency(po.subtotal, po.currency)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Tax:</span>
        <span className="tabular-nums">{formatCurrency(po.tax_amount, po.currency)}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total:</span>
        <span className="tabular-nums">{formatCurrency(po.total, po.currency)}</span>
      </div>
    </div>
  );
}

function ThresholdIndicator({
  total,
  threshold,
  currency,
}: {
  total: number;
  threshold?: number | null;
  currency: Currency;
}) {
  const formattedTotal = formatCurrency(total, currency);
  const formattedThreshold = threshold ? formatCurrency(threshold, currency) : null;

  if (!threshold) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
        <Clock className="h-4 w-4" />
        <span>Approval required for all POs. Manual threshold review.</span>
      </div>
    );
  }

  if (total >= threshold) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
        <AlertCircle className="h-4 w-4" />
        <span>
          PO total ({formattedTotal}) exceeds the approval threshold ({formattedThreshold}).
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
      <Clock className="h-4 w-4" />
      <span>
        PO total ({formattedTotal}) is below the threshold ({formattedThreshold}). Manually submitted.
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading totals">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <p className="text-center text-sm text-gray-500">Loading purchase order details...</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8" role="alert">
      <XCircle className="h-12 w-12 text-destructive" />
      <p className="text-center font-medium text-destructive">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function POApprovalModal({
  po,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: POApprovalModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { approvePO, rejectPO, isApproving, isRejecting } = usePOApproval();
  const { data: planningSettings, isLoading: isLoadingSettings } = usePlanningSettings();

  const isApproveMode = mode === 'approve';
  const isSubmitting = isApproving || isRejecting;

  // Form setup based on mode
  const approveForm = useForm<ApproveFormData>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      notes: '',
    },
  });

  const rejectForm = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      rejection_reason: '',
    },
  });

  const form = isApproveMode ? approveForm : rejectForm;

  const handleApprove = async (data: ApproveFormData) => {
    setError(null);
    try {
      await approvePO.mutateAsync({
        poId: po.id,
        notes: data.notes,
      });
      toast({
        title: 'Success',
        description: 'Purchase order approved successfully',
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approval failed';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (data: RejectFormData) => {
    setError(null);
    try {
      await rejectPO.mutateAsync({
        poId: po.id,
        rejectionReason: data.rejection_reason,
      });
      toast({
        title: 'Success',
        description: 'Purchase order rejected. Creator has been notified.',
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rejection failed';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const onSubmit = isApproveMode
    ? approveForm.handleSubmit(handleApprove)
    : rejectForm.handleSubmit(handleReject);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-xl md:max-w-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle asChild>
            <h1 className="text-lg font-semibold">
              {isApproveMode ? 'Approve' : 'Reject'} Purchase Order
            </h1>
          </DialogTitle>
        </DialogHeader>

        {/* PO Header */}
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <div>
            <p className="font-mono text-lg font-semibold">{po.po_number}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'bg-yellow-100 text-yellow-800',
              po.approval_status === 'pending' && 'animate-pulse'
            )}
          >
            {po.status === 'pending_approval' ? 'Pending Approval' : po.status}
          </Badge>
        </div>

        {/* Summary Sections */}
        <POSummarySection po={po} />
        <POLinesSection po={po} />
        <POTotalsSummary po={po} />

        {/* Threshold Indicator */}
        {!isLoadingSettings && (
          <ThresholdIndicator
            total={po.total}
            threshold={planningSettings?.po_approval_threshold || null}
            currency={po.currency}
          />
        )}

        {/* Error Display */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Processing indicator */}
        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
            <span>Processing...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {isApproveMode ? (
            <div className="space-y-2">
              <Label htmlFor="notes">Approval Notes (optional)</Label>
              <Textarea
                id="notes"
                {...approveForm.register('notes')}
                placeholder="Optional notes about this approval..."
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              {approveForm.formState.errors.notes && (
                <p className="text-sm text-destructive">
                  {approveForm.formState.errors.notes.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection_reason"
                {...rejectForm.register('rejection_reason')}
                placeholder="Provide rejection reason (minimum 10 characters)..."
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
                aria-required="true"
              />
              {rejectForm.formState.errors.rejection_reason && (
                <p className="text-sm text-destructive" role="alert">
                  {rejectForm.formState.errors.rejection_reason.message}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isApproveMode ? 'default' : 'destructive'}
              disabled={isSubmitting}
              className="min-w-[120px]"
              aria-label={isApproveMode ? 'Approve PO' : 'Reject PO'}
            >
              {isApproveMode ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve PO
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject PO
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default POApprovalModal;
