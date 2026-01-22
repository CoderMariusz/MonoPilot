'use client'

/**
 * SpecificationDetail Component
 * Story: 06.3 - Product Specifications
 *
 * Read-only display of specification details.
 * Shows all fields, version history, and action buttons based on status/permissions.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Copy,
  ClipboardCheck,
  Trash2,
  FileText,
  Calendar,
  User,
  Package,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { SpecificationStatusBadge } from './SpecificationStatusBadge'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import { VersionHistory } from './VersionHistory'
import { ApproveModal } from './ApproveModal'
import { CloneVersionDialog } from './CloneVersionDialog'
import { CompleteReviewDialog } from './CompleteReviewDialog'
import { ParameterEditor } from './parameters'
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
import type { QualitySpecification, VersionHistoryEntry } from '@/lib/types/quality'

export interface SpecificationDetailProps {
  /** Specification data */
  specification: QualitySpecification | null
  /** Version history */
  versionHistory: VersionHistoryEntry[]
  /** Parameters count */
  parametersCount?: number
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string | null
  /** Whether user can edit (draft only + permissions) */
  canEdit?: boolean
  /** Whether user can approve (QA_MANAGER only) */
  canApprove?: boolean
  /** Whether user can delete (draft only + permissions) */
  canDelete?: boolean
  /** Approving state */
  approving?: boolean
  /** Cloning state */
  cloning?: boolean
  /** Completing review state */
  completingReview?: boolean
  /** Deleting state */
  deleting?: boolean
  /** Callback for approve action */
  onApprove?: (notes?: string) => void
  /** Callback for clone action */
  onClone?: () => void
  /** Callback for complete review action */
  onCompleteReview?: (notes?: string) => void
  /** Callback for delete action */
  onDelete?: () => void
}

export function SpecificationDetail({
  specification,
  versionHistory,
  parametersCount = 0,
  loading = false,
  error = null,
  canEdit = false,
  canApprove = false,
  canDelete = false,
  approving = false,
  cloning = false,
  completingReview = false,
  deleting = false,
  onApprove,
  onClone,
  onCompleteReview,
  onDelete,
}: SpecificationDetailProps) {
  const router = useRouter()
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Format date for display
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  // Format datetime for display
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Version history skeleton */}
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Error Loading Specification
              </h2>
              <p className="mt-2 text-red-600">{error}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/quality/specifications')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!specification) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <FileText className="w-12 h-12 text-slate-300" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Specification Not Found
              </h2>
              <p className="mt-2 text-slate-600">
                The requested specification could not be found.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/quality/specifications')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isDraft = specification.status === 'draft'
  const isActive = specification.status === 'active'

  return (
    <div className="space-y-6">
      {/* Main Details Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <div>
                <h1 className="text-2xl font-bold">{specification.spec_number}</h1>
                <p className="text-muted-foreground">{specification.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                v{specification.version}
              </Badge>
              <SpecificationStatusBadge status={specification.status} size="lg" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/quality/specifications')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>

            {isDraft && canEdit && (
              <Button
                variant="outline"
                onClick={() => router.push(`/quality/specifications/${specification.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}

            {isDraft && canApprove && onApprove && (
              <Button
                onClick={() => setApproveModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}

            {!isDraft && onClone && (
              <Button variant="outline" onClick={() => setCloneDialogOpen(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Clone as New Version
              </Button>
            )}

            {isActive && onCompleteReview && (
              <Button variant="outline" onClick={() => setReviewDialogOpen(true)}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Complete Review
              </Button>
            )}

            {isDraft && canDelete && onDelete && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Product */}
              <div>
                <Label icon={Package}>Product</Label>
                <div className="mt-1">
                  <span className="font-mono font-medium">{specification.product_code}</span>
                  {specification.product_name && (
                    <span className="text-muted-foreground ml-2">
                      - {specification.product_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {specification.description && (
                <div>
                  <Label icon={FileText}>Description</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {specification.description}
                  </p>
                </div>
              )}

              {/* Effective Date */}
              <div>
                <Label icon={Calendar}>Effective Date</Label>
                <p className="mt-1">{formatDate(specification.effective_date)}</p>
              </div>

              {/* Expiry Date */}
              <div>
                <Label icon={Calendar}>Expiry Date</Label>
                <p className="mt-1">{formatDate(specification.expiry_date) || 'No expiry'}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Review Information */}
              <div>
                <Label icon={Clock}>Review Frequency</Label>
                <p className="mt-1">{specification.review_frequency_days} days</p>
              </div>

              {isActive && (
                <>
                  <div>
                    <Label icon={Calendar}>Next Review Date</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span>{formatDate(specification.next_review_date)}</span>
                      {specification.next_review_date && (
                        <ReviewStatusBadge
                          status={specification.review_status}
                          daysUntilReview={specification.days_until_review}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>

                  {specification.last_review_date && (
                    <div>
                      <Label icon={Calendar}>Last Review Date</Label>
                      <p className="mt-1">{formatDate(specification.last_review_date)}</p>
                    </div>
                  )}
                </>
              )}

              {/* Approval Information */}
              {specification.approved_by && (
                <div>
                  <Label icon={User}>Approved By</Label>
                  <div className="mt-1">
                    <span>{specification.approved_by_name || specification.approved_by}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      on {formatDateTime(specification.approved_at)}
                    </span>
                  </div>
                </div>
              )}

              {/* Superseded Information */}
              {specification.status === 'superseded' && specification.superseded_by && (
                <div>
                  <Label icon={ExternalLink}>Superseded By</Label>
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-1"
                    onClick={() => router.push(`/quality/specifications/${specification.superseded_by}`)}
                  >
                    View newer version
                  </Button>
                </div>
              )}

              {/* Notes */}
              {specification.notes && (
                <div>
                  <Label icon={FileText}>Notes</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {specification.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDateTime(specification.created_at)}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{' '}
              {formatDateTime(specification.updated_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Parameters (Story 06.4) */}
      <ParameterEditor
        specId={specification.id}
        specStatus={specification.status}
      />

      {/* Version History */}
      <VersionHistory
        currentId={specification.id}
        versions={versionHistory}
      />

      {/* Modals */}
      <ApproveModal
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        specName={specification.name}
        specNumber={specification.spec_number}
        productName={specification.product_name || specification.product_code || 'Unknown'}
        approving={approving}
        onConfirm={(notes) => {
          onApprove?.(notes)
          setApproveModalOpen(false)
        }}
      />

      <CloneVersionDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        specNumber={specification.spec_number}
        currentVersion={specification.version}
        cloning={cloning}
        onConfirm={() => {
          onClone?.()
          setCloneDialogOpen(false)
        }}
      />

      <CompleteReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        specName={specification.name}
        nextReviewDate={specification.next_review_date}
        reviewFrequencyDays={specification.review_frequency_days}
        completing={completingReview}
        onConfirm={(notes) => {
          onCompleteReview?.(notes)
          setReviewDialogOpen(false)
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specification?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete specification{' '}
              <span className="font-semibold">{specification.spec_number}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.()
                setDeleteDialogOpen(false)
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper component for labels
function Label({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
      <Icon className="h-4 w-4" />
      {children}
    </div>
  )
}

export default SpecificationDetail
