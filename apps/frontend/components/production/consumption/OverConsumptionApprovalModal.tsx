/**
 * Over-Consumption Approval Modal Component (Story 04.6e)
 * Modal for over-consumption approval workflow
 *
 * Supports two views:
 * - Operator view: Request approval / View pending status
 * - Manager view: Approve / Reject with reason
 *
 * Wireframe: PROD-003 - Over-Consumption Modal
 */

'use client'

import { useState, useCallback, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface OverConsumptionData {
  wo_id: string
  wo_number: string
  wo_material_id: string
  product_code: string
  product_name: string
  lp_id: string
  lp_number: string
  required_qty: number
  current_consumed_qty: number
  requested_qty: number
  total_after_qty: number
  over_consumption_qty: number
  variance_percent: number
  uom: string
}

export interface PendingRequest {
  request_id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requested_by: string
  requested_by_name: string
  requested_at: string
  decided_by?: string
  decided_by_name?: string
  decided_at?: string
  approval_reason?: string
  rejection_reason?: string
}

export interface ApprovalData {
  request_id: string
  reason?: string
}

export interface RejectionData {
  request_id: string
  reason: string
}

export interface OverConsumptionApprovalModalProps {
  overConsumptionData: OverConsumptionData
  open: boolean
  onOpenChange: (open: boolean) => void
  onApproved: (data: ApprovalData) => Promise<void> | void
  onRejected: (data: RejectionData) => Promise<void> | void
  onRequestSubmitted: (data: OverConsumptionData) => Promise<void> | void
  isManager: boolean
  pendingRequest?: PendingRequest
}

export function OverConsumptionApprovalModal({
  overConsumptionData,
  open,
  onOpenChange,
  onApproved,
  onRejected,
  onRequestSubmitted,
  isManager,
  pendingRequest,
}: OverConsumptionApprovalModalProps) {
  const titleId = useId()
  const [approvalReason, setApprovalReason] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format quantity
  const formatQty = (qty: number, uom: string) =>
    `${qty.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${uom}`

  // Handle close
  const handleClose = useCallback(() => {
    setApprovalReason('')
    setRejectionReason('')
    setShowRejectForm(false)
    setError(null)
    setValidationError(null)
    onOpenChange(false)
  }, [onOpenChange])

  // Handle request submission (Operator)
  const handleRequestApproval = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      await onRequestSubmitted(overConsumptionData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle approval (Manager)
  const handleApprove = async () => {
    if (!pendingRequest) return

    try {
      setIsSubmitting(true)
      setError(null)
      await onApproved({
        request_id: pendingRequest.request_id,
        reason: approvalReason || undefined,
      })
      handleClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle rejection (Manager)
  const handleReject = async () => {
    if (!pendingRequest) return

    // Validate reason
    if (!rejectionReason.trim()) {
      setValidationError('Rejection reason is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setValidationError(null)
      await onRejected({
        request_id: pendingRequest.request_id,
        reason: rejectionReason,
      })
      handleClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine view mode
  const isPending = pendingRequest?.status === 'pending'
  const isRejected = pendingRequest?.status === 'rejected'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        aria-labelledby={titleId}
        data-testid="modal-backdrop"
      >
        <DialogHeader>
          <DialogTitle id={titleId} className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" data-testid="warning-icon" />
            Over-Consumption Approval Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Material and WO Info */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Material: </span>
                <span className="font-medium">
                  {overConsumptionData.product_code} - {overConsumptionData.product_name}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">WO Number: </span>
                <span className="font-mono">{overConsumptionData.wo_number}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">LP: </span>
                <span className="font-mono">{overConsumptionData.lp_number}</span>
              </div>

              {/* Show requester info for manager view */}
              {isManager && pendingRequest && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Requested by: </span>
                  <span className="font-medium">{pendingRequest.requested_by_name}</span>
                </div>
              )}

              <Separator />

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div data-testid="bom-requirement">
                  <span className="text-muted-foreground">BOM Requirement: </span>
                  <span className="font-mono">
                    {formatQty(overConsumptionData.required_qty, overConsumptionData.uom)}
                  </span>
                </div>
                <div data-testid="already-consumed">
                  <span className="text-muted-foreground">Already Consumed: </span>
                  <span className="font-mono">
                    {formatQty(overConsumptionData.current_consumed_qty, overConsumptionData.uom)}
                  </span>
                </div>
                <div data-testid="attempting">
                  <span className="text-muted-foreground">Attempting: </span>
                  <span className="font-mono text-amber-600">
                    +{formatQty(overConsumptionData.requested_qty, overConsumptionData.uom)}
                  </span>
                </div>
                <div data-testid="total-after">
                  <span className="text-muted-foreground">Total After: </span>
                  <span className="font-mono">
                    {formatQty(overConsumptionData.total_after_qty, overConsumptionData.uom)}
                  </span>
                </div>
              </div>

              {/* Over-consumption summary */}
              <div className="text-sm bg-amber-50 p-2 rounded">
                <span className="text-muted-foreground">Over-consumption: </span>
                <span className="font-mono font-medium text-amber-700">
                  +{formatQty(overConsumptionData.over_consumption_qty, overConsumptionData.uom)} (+
                  {overConsumptionData.variance_percent}%)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Rejected Status (for Operator) */}
          {isRejected && !isManager && pendingRequest && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Request Rejected</div>
                  <div>{pendingRequest.rejection_reason}</div>
                  <div className="text-sm text-muted-foreground">
                    Rejected by: {pendingRequest.decided_by_name}
                    {pendingRequest.decided_at && (
                      <> on {formatDate(pendingRequest.decided_at)}</>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Status (for Operator) */}
          {isPending && !isManager && pendingRequest && (
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" data-testid="clock-icon" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-2">
                    Awaiting Manager Approval
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Requested by: </span>
                    {pendingRequest.requested_by_name}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Request ID: </span>
                    <span className="font-mono">{pendingRequest.request_id}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Manager Approval Form */}
          {isManager && isPending && !showRejectForm && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="approval-reason">
                  Reason for Approval <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="approval-reason"
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  placeholder="Enter reason for approval..."
                  rows={2}
                  className="resize-none"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Manager Rejection Form */}
          {isManager && showRejectForm && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason" className="required">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value)
                    setValidationError(null)
                  }}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                  className={cn('resize-none', validationError && 'border-red-500')}
                  maxLength={500}
                />
                {validationError && (
                  <p className="text-sm text-red-500">{validationError}</p>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info for non-pending operator */}
          {!isManager && !isPending && !isRejected && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                This over-consumption requires manager approval. Submit a request and wait for
                approval before proceeding.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          {/* Operator View - No Pending Request */}
          {!isManager && !isPending && !isRejected && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={handleRequestApproval}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Request Approval
              </Button>
            </>
          )}

          {/* Operator View - Pending Request */}
          {!isManager && isPending && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button variant="outline" className="text-red-600">
                Cancel Request
              </Button>
            </>
          )}

          {/* Operator View - Rejected */}
          {!isManager && isRejected && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}

          {/* Manager View - Not in Reject Mode */}
          {isManager && isPending && !showRejectForm && (
            <>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                aria-label="Reject over-consumption"
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
                aria-label="Approve over-consumption"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}

          {/* Manager View - Reject Mode */}
          {isManager && showRejectForm && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectionReason('')
                  setValidationError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Reject
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
