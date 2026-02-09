/**
 * Quality Hold Detail Page
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.8 to AC-2.11: Hold detail view with items table and release info
 * AC-2.26: Aging alert banner for old holds
 * AC-2.31 to AC-2.32: NCR linkage display
 *
 * Route: /quality/holds/[id]
 *
 * Displays hold details including:
 * - Hold information (number, status, priority, type, reason)
 * - Held by and held at timestamps
 * - Items table with reference links
 * - Release information (if released)
 * - Related NCR (if linked)
 * - Aging alert banner
 */

'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Shield,
  Calendar,
  User,
  Clock,
  FileText,
  Pencil,
  Trash2,
  Unlock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import {
  HoldStatusBadge,
  HoldPriorityBadge,
  HoldTypeBadge,
  DispositionBadge,
  AgingAlertBanner,
  HoldItemsTable,
  ReleaseModal,
} from '@/components/quality/holds'
import type { HoldItem } from '@/components/quality/holds'
import type {
  HoldStatus,
  Priority,
  HoldType,
  Disposition,
} from '@/lib/validation/quality-hold-validation'

interface QualityHold {
  id: string
  org_id: string
  hold_number: string
  reason: string
  hold_type: HoldType
  status: HoldStatus
  priority: Priority
  held_by: { id: string; name: string; email: string }
  held_at: string
  released_by?: { id: string; name: string; email: string }
  released_at?: string
  release_notes?: string
  disposition?: Disposition
  ncr_id?: string
  created_at: string
  updated_at: string
}

interface NCRInfo {
  id: string
  ncr_number: string
  title: string
  status: string
}

interface HoldDetailResponse {
  hold: QualityHold
  items: HoldItem[]
  ncr?: NCRInfo
}

export default function HoldDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const holdId = params.id

  // Data state
  const [hold, setHold] = useState<QualityHold | null>(null)
  const [items, setItems] = useState<HoldItem[]>([])
  const [ncr, setNcr] = useState<NCRInfo | null>(null)
  const [agingHours, setAgingHours] = useState(0)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resolving, setResolving] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Fetch hold details
  const fetchHold = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/quality/holds/${holdId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Hold not found')
        }
        throw new Error('Failed to fetch hold details')
      }

      const data: HoldDetailResponse = await response.json()
      setHold(data.hold)
      setItems(data.items || [])
      setNcr(data.ncr || null)

      // Calculate aging hours
      if (data.hold.held_at) {
        const heldAt = new Date(data.hold.held_at)
        const now = new Date()
        const hours = (now.getTime() - heldAt.getTime()) / (1000 * 60 * 60)
        setAgingHours(hours)
      }
    } catch (err) {
      console.error('Error fetching hold:', err)
      setError(err instanceof Error ? err.message : 'Failed to load hold')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load hold details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [holdId, toast])

  useEffect(() => {
    fetchHold()
  }, [fetchHold])

  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle resolve
  const handleResolve = async () => {
    if (!hold) return

    setResolving(true)
    try {
      const response = await fetch(`/api/quality/holds/${holdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disposed' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resolve hold')
      }

      toast({
        title: 'Success',
        description: `Hold ${hold.hold_number} marked as resolved`,
      })

      fetchHold()
    } catch (err) {
      console.error('Error resolving hold:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to resolve hold',
        variant: 'destructive',
      })
    } finally {
      setResolving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!hold) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/quality/holds/${holdId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete hold')
      }

      toast({
        title: 'Success',
        description: `Hold ${hold.hold_number} deleted successfully`,
      })

      router.push('/quality/holds')
    } catch (err) {
      console.error('Error deleting hold:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete hold',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Handle release success
  const handleReleaseSuccess = () => {
    setReleaseModalOpen(false)
    fetchHold()
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  // Error state
  if (error || !hold) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/quality/holds')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Holds
        </Button>
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-12">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-red-800">
            {error === 'Hold not found' ? 'Hold Not Found' : 'Failed to Load Hold'}
          </h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => router.push('/quality/holds')}>
              Go Back
            </Button>
            {error !== 'Hold not found' && (
              <Button onClick={() => fetchHold()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const hasLPs = items.some((item) => item.reference_type === 'lp')
  const canRelease = hold.status === 'active'
  const canDelete = hold.status === 'active'
  const canEdit = hold.status === 'active'

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/quality/holds')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-yellow-600" />
            <h1 className="text-2xl font-bold font-mono">{hold.hold_number}</h1>
          </div>
          <HoldStatusBadge status={hold.status} />
        </div>
        <div className="flex items-center gap-2">
          {canRelease && (
            <>
              <Button onClick={() => setReleaseModalOpen(true)}>
                <Unlock className="mr-2 h-4 w-4" />
                Release Hold
              </Button>
              <Button variant="outline" onClick={handleResolve} disabled={resolving}>
                {resolving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve
                  </>
                )}
              </Button>
            </>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/quality/holds/${holdId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Aging Alert Banner */}
      {hold.status === 'active' && (
        <AgingAlertBanner agingHours={agingHours} priority={hold.priority} />
      )}

      {/* Hold Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hold Details */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Hold Information
          </h2>
          <Separator />
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600">Hold Number:</dt>
              <dd className="font-mono font-medium">{hold.hold_number}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-600">Status:</dt>
              <dd>
                <HoldStatusBadge status={hold.status} />
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-600">Priority:</dt>
              <dd>
                <HoldPriorityBadge priority={hold.priority} />
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-600">Type:</dt>
              <dd>
                <HoldTypeBadge holdType={hold.hold_type} />
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 mb-1">Reason:</dt>
              <dd className="text-sm bg-gray-50 p-3 rounded">{hold.reason}</dd>
            </div>
          </dl>
        </div>

        {/* Hold Tracking */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tracking Information
          </h2>
          <Separator />
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600 flex items-center gap-1">
                <User className="h-4 w-4" />
                Held By:
              </dt>
              <dd className="font-medium">{hold.held_by.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Held At:
              </dt>
              <dd className="text-sm">{formatDateTime(hold.held_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Created:</dt>
              <dd className="text-sm">{formatDateTime(hold.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Updated:</dt>
              <dd className="text-sm">{formatDateTime(hold.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Release Information (if released) */}
      {hold.status === 'released' && hold.released_by && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Release Information
          </h2>
          <Separator className="bg-green-200" />
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-green-700">Released By:</dt>
              <dd className="font-medium text-green-900">{hold.released_by.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-green-700">Released At:</dt>
              <dd className="text-sm text-green-900">
                {hold.released_at ? formatDateTime(hold.released_at) : '-'}
              </dd>
            </div>
            {hold.disposition && (
              <div className="flex justify-between items-center">
                <dt className="text-green-700">Disposition:</dt>
                <dd>
                  <DispositionBadge disposition={hold.disposition} />
                </dd>
              </div>
            )}
            {hold.release_notes && (
              <div>
                <dt className="text-green-700 mb-1">Release Notes:</dt>
                <dd className="text-sm bg-white p-3 rounded border border-green-200 text-green-900">
                  {hold.release_notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Items Table */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hold Items ({items.length})
          </h2>
        </div>
        <Separator />
        <HoldItemsTable items={items} />
      </div>

      {/* Related NCR Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Related NCR</h2>
        <Separator />
        {ncr ? (
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/quality/ncr/${ncr.id}`}
                className="font-mono font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {ncr.ncr_number}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <p className="text-sm text-gray-600 mt-1">{ncr.title}</p>
            </div>
            <span className="text-sm text-gray-500">{ncr.status}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between py-4">
            <p className="text-gray-500">No NCR linked to this hold</p>
            <Button variant="outline" size="sm" disabled>
              Create NCR from Hold
            </Button>
          </div>
        )}
      </div>

      {/* Release Modal */}
      <ReleaseModal
        open={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        onSuccess={handleReleaseSuccess}
        holdId={holdId}
        holdNumber={hold.hold_number}
        itemsCount={items.length}
        hasLPs={hasLPs}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quality Hold</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete hold {hold.hold_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
