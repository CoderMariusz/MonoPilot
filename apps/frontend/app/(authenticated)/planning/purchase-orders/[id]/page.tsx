/**
 * Purchase Order Details Page
 * Story 3.1 & 3.2 & 3.4: Purchase Order CRUD + PO Line Management + Approval Workflow
 * Display PO header information with tabs: Overview, Lines, Approve
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Package,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { POLinesTable } from '@/components/planning/POLinesTable'
import { PlanningHeader } from '@/components/planning/PlanningHeader'

interface Supplier {
  id: string
  code: string
  name: string
  currency: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

interface POApproval {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string
  approved_at: string
  rejection_reason: string | null
  comments: string | null
  users?: User
}

interface PlanningSettings {
  po_statuses: Array<{
    code: string
    label: string
    color: string
    is_default: boolean
    sequence: number
  }>
}

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  warehouse_id: string
  status: string
  approval_status: 'pending' | 'approved' | 'rejected' | null
  expected_delivery_date: string
  actual_delivery_date: string | null
  payment_terms: string | null
  shipping_method: string | null
  notes: string | null
  currency: string
  subtotal: number
  tax_amount: number
  total: number
  suppliers?: Supplier
  warehouses?: Warehouse
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  rejection_reason?: string | null
}

export default function PurchaseOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [po, setPO] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [paramsId, setParamsId] = useState<string>('')
  const [approvals, setApprovals] = useState<POApproval[]>([])
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [settings, setSettings] = useState<PlanningSettings | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalComments, setApprovalComments] = useState('')
  const [submittingApproval, setSubmittingApproval] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Unwrap params
  useEffect(() => {
    params.then((p) => setParamsId(p.id))
  }, [params])

  // Fetch PO details
  const fetchPO = useCallback(async () => {
    if (!paramsId) return

    try {
      setLoading(true)

      const response = await fetch(`/api/planning/purchase-orders/${paramsId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch purchase order')
      }

      const data = await response.json()
      setPO(data.purchase_order || data)
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast({
        title: 'Error',
        description: 'Failed to load purchase order details',
        variant: 'destructive',
      })
      router.push('/planning/purchase-orders')
    } finally {
      setLoading(false)
    }
  }, [paramsId, toast, router])

  // Fetch approval history
  const fetchApprovals = useCallback(async () => {
    if (!paramsId) return

    try {
      setApprovalsLoading(true)

      const response = await fetch(`/api/planning/purchase-orders/${paramsId}/approvals`)

      if (!response.ok) {
        throw new Error('Failed to fetch approvals')
      }

      const data = await response.json()
      setApprovals(data.approvals || [])
    } catch (error) {
      console.error('Error fetching approvals:', error)
    } finally {
      setApprovalsLoading(false)
    }
  }, [paramsId])

  // Fetch planning settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/planning/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }, [])

  useEffect(() => {
    fetchPO()
    fetchSettings()
  }, [fetchPO, fetchSettings])

  useEffect(() => {
    if (paramsId) {
      fetchApprovals()
    }
  }, [paramsId, fetchApprovals])

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = settings?.po_statuses?.find((s: { code: string }) => s.code === status)
    const color = statusConfig?.color || 'gray'

    const colorClasses: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
    }

    return (
      <Badge className={colorClasses[color] || colorClasses.gray}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  // Get approval badge
  const getApprovalBadge = (status: string | null) => {
    if (!status) return null

    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!po) return

    setStatusChanging(true)
    try {
      const response = await fetch(`/api/planning/purchase-orders/${po.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`,
      })

      fetchPO()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setStatusChanging(false)
    }
  }

  // Handle approve
  const handleApprove = async () => {
    if (!po) return

    setSubmittingApproval(true)
    try {
      const response = await fetch(`/api/planning/purchase-orders/${po.id}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comments: approvalComments || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve')
      }

      toast({
        title: 'Success',
        description: 'Purchase order approved',
      })

      setApproveDialogOpen(false)
      setApprovalComments('')
      fetchPO()
      fetchApprovals()
    } catch (error) {
      console.error('Error approving PO:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      })
    } finally {
      setSubmittingApproval(false)
    }
  }

  // Handle reject
  const handleReject = async () => {
    if (!po || !rejectionReason) return

    setSubmittingApproval(true)
    try {
      const response = await fetch(`/api/planning/purchase-orders/${po.id}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason,
          comments: approvalComments || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject')
      }

      toast({
        title: 'Success',
        description: 'Purchase order rejected',
      })

      setRejectDialogOpen(false)
      setRejectionReason('')
      setApprovalComments('')
      fetchPO()
      fetchApprovals()
    } catch (error) {
      console.error('Error rejecting PO:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject',
        variant: 'destructive',
      })
    } finally {
      setSubmittingApproval(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Purchase order not found</div>
      </div>
    )
  }

  return (
    <div>
      <PlanningHeader currentPage="po" />

      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/planning/purchase-orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{po.po_number}</h1>
          {getStatusBadge(po.status)}
          {getApprovalBadge(po.approval_status)}
        </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="lines" className="gap-2">
            <Package className="h-4 w-4" />
            Lines
          </TabsTrigger>
          <TabsTrigger value="approve" className="gap-2">
            <Shield className="h-4 w-4" />
            Approve
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* PO Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Purchase Order Information</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">PO Number:</dt>
                  <dd className="font-medium font-mono">{po.po_number}</dd>
                </div>
                <div className="flex justify-between items-start">
                  <dt className="text-gray-600">Status:</dt>
                  <dd>
                    {po.status === 'draft' ? (
                      <Select
                        value={po.status}
                        onValueChange={handleStatusChange}
                        disabled={statusChanging}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {settings?.po_statuses
                            ?.sort((a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence)
                            .map((s: { code: string; label: string }) => (
                              <SelectItem key={s.code} value={s.code}>
                                {s.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getStatusBadge(po.status)
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Supplier:</dt>
                  <dd className="font-medium">
                    {po.suppliers?.name}
                    <div className="text-sm text-gray-500">{po.suppliers?.code}</div>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Warehouse:</dt>
                  <dd className="font-medium">
                    {po.warehouses?.name}
                    <div className="text-sm text-gray-500">{po.warehouses?.code}</div>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Currency:</dt>
                  <dd className="font-medium">{po.currency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Expected Delivery:</dt>
                  <dd className="font-medium">{formatDate(po.expected_delivery_date)}</dd>
                </div>
                {po.actual_delivery_date && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Actual Delivery:</dt>
                    <dd className="font-medium">{formatDate(po.actual_delivery_date)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
              <dl className="space-y-3">
                {po.payment_terms && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Payment Terms:</dt>
                    <dd className="font-medium">{po.payment_terms}</dd>
                  </div>
                )}
                {po.shipping_method && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Shipping Method:</dt>
                    <dd className="font-medium">{po.shipping_method}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created:</dt>
                  <dd className="font-medium text-sm">{formatDateTime(po.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Updated:</dt>
                  <dd className="font-medium text-sm">{formatDateTime(po.updated_at)}</dd>
                </div>
                {po.notes && (
                  <div>
                    <dt className="text-gray-600 mb-1">Notes:</dt>
                    <dd className="text-sm bg-gray-50 p-2 rounded">{po.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* PO Totals Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Order Totals</h2>
            <dl className="space-y-2 max-w-md ml-auto">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal:</dt>
                <dd className="font-medium">{formatCurrency(po.subtotal, po.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Tax:</dt>
                <dd className="font-medium">{formatCurrency(po.tax_amount, po.currency)}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <dt>Total:</dt>
                <dd>{formatCurrency(po.total, po.currency)}</dd>
              </div>
            </dl>
          </div>
        </TabsContent>

        {/* Lines Tab */}
        <TabsContent value="lines">
          <POLinesTable
            poId={paramsId}
            currency={po.currency}
            onTotalsUpdate={fetchPO}
          />
        </TabsContent>

        {/* Approve Tab */}
        <TabsContent value="approve" className="space-y-6">
          {/* Approval Status Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Approval Status</h2>

            <div className="flex items-center gap-4 mb-6">
              {getApprovalBadge(po.approval_status) || (
                <Badge variant="outline">Not Required</Badge>
              )}
              {po.approval_status === 'rejected' && po.rejection_reason && (
                <div className="text-sm text-red-600">
                  <strong>Reason:</strong> {po.rejection_reason}
                </div>
              )}
            </div>

            {/* Approval Actions */}
            {po.approval_status === 'pending' && (
              <div className="flex gap-4">
                <Button
                  onClick={() => setApproveDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}

            {!po.approval_status && (
              <p className="text-gray-500">
                This purchase order does not require approval.
              </p>
            )}
          </div>

          {/* Approval History Card */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Approval History</h2>

            {approvalsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading history...
              </div>
            ) : approvals.length === 0 ? (
              <p className="text-gray-500">No approval history</p>
            ) : (
              <div className="space-y-4">
                {approvals.map((approval: POApproval) => (
                  <div
                    key={approval.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {approval.status === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : approval.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{approval.status}</span>
                        <span className="text-sm text-gray-500">
                          by {approval.users?.email || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(approval.approved_at)}
                      </div>
                      {approval.rejection_reason && (
                        <div className="mt-1 text-sm text-red-600">
                          Reason: {approval.rejection_reason}
                        </div>
                      )}
                      {approval.comments && (
                        <div className="mt-1 text-sm text-gray-600">
                          {approval.comments}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {po.po_number}? This will mark the PO as approved
              for processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="approval-comments">Comments (optional)</Label>
            <Textarea
              id="approval-comments"
              value={approvalComments}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApprovalComments(e.target.value)}
              placeholder="Add any comments..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingApproval}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleApprove}
              disabled={submittingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {submittingApproval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {po.po_number}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="reject-comments">Additional Comments (optional)</Label>
              <Textarea
                id="reject-comments"
                value={approvalComments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApprovalComments(e.target.value)}
                placeholder="Add any additional comments..."
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingApproval}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleReject}
              disabled={submittingApproval || !rejectionReason}
              variant="destructive"
            >
              {submittingApproval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  )
}
