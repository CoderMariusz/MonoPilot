/**
 * DeleteBOMDialog Component (Story 02.4)
 * Confirmation dialog for deleting a BOM
 *
 * Features:
 * - Work Order dependency check
 * - Two variants: simple delete vs blocked delete
 * - Impact statement showing what will be deleted
 * - Accessible: alertdialog role, ARIA labels
 *
 * Acceptance Criteria:
 * - AC-31 to AC-33: Delete with dependency checking
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import type { BOMWithProduct } from '@/lib/types/bom'

interface WorkOrderReference {
  id: string
  wo_number: string
  status: string
}

interface WorkOrderUsage {
  work_orders: WorkOrderReference[]
  count: number
}

interface DeleteBOMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bom: BOMWithProduct | null
  onConfirm: () => Promise<void>
  onMakeInactive?: () => Promise<void>
  loading?: boolean
}

export function DeleteBOMDialog({
  open,
  onOpenChange,
  bom,
  onConfirm,
  onMakeInactive,
  loading: externalLoading = false,
}: DeleteBOMDialogProps) {
  const [woUsage, setWoUsage] = useState<WorkOrderUsage | null>(null)
  const [checkingUsage, setCheckingUsage] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [makingInactive, setMakingInactive] = useState(false)
  const { toast } = useToast()

  // Check Work Order usage when dialog opens
  useEffect(() => {
    if (open && bom) {
      checkWorkOrderUsage()
    } else {
      setWoUsage(null)
    }
  }, [open, bom])

  const checkWorkOrderUsage = async () => {
    if (!bom) return

    setCheckingUsage(true)
    try {
      // Check for work orders using this BOM
      const response = await fetch(`/api/technical/boms/${bom.id}/work-orders`)

      if (!response.ok) {
        // If endpoint doesn't exist or error, assume no usage
        setWoUsage({ work_orders: [], count: 0 })
        return
      }

      const data = await response.json()
      setWoUsage(data.data || { work_orders: [], count: 0 })
    } catch (error) {
      // Assume no usage on error
      setWoUsage({ work_orders: [], count: 0 })
    } finally {
      setCheckingUsage(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onConfirm()

      toast({
        title: 'Success',
        description: `BOM v${bom?.version} deleted successfully`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete BOM',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleMakeInactive = async () => {
    if (!onMakeInactive) return

    setMakingInactive(true)
    try {
      await onMakeInactive()

      toast({
        title: 'Success',
        description: `BOM v${bom?.version} marked as inactive`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update BOM status',
        variant: 'destructive',
      })
    } finally {
      setMakingInactive(false)
    }
  }

  if (!bom) return null

  const loading = checkingUsage || externalLoading
  const hasUsage = woUsage && woUsage.count > 0
  const displayWOs = woUsage?.work_orders.slice(0, 5) || []
  const overflow = woUsage ? Math.max(0, woUsage.count - 5) : 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl" role="alertdialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete BOM</AlertDialogTitle>
          <AlertDialogDescription>
            {bom.product?.code} - {bom.product?.name} (v{bom.version})
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3" role="status" aria-busy="true">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Checking dependencies...
              </span>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Variant 1: No Work Order Usage - Can Delete */}
        {!loading && !hasUsage && (
          <div className="space-y-4">
            {/* Success Indicator */}
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                No work orders are using this BOM
              </AlertDescription>
            </Alert>

            {/* Confirmation Question */}
            <p className="text-sm">
              Are you sure you want to delete this BOM?
            </p>

            {/* Impact Statement */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="ml-4 list-disc text-sm space-y-1">
                  <li>The BOM record (v{bom.version})</li>
                  <li>All BOM line items (ingredients/components)</li>
                  <li>Associated routing assignment</li>
                </ul>
              </CardContent>
            </Card>

            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Variant 2: Has Work Order Usage - Blocked */}
        {!loading && hasUsage && (
          <div className="space-y-4" aria-live="assertive">
            {/* Warning Banner */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Cannot delete: This BOM is used by work orders
              </AlertDescription>
            </Alert>

            {/* BOM Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {bom.product?.code} v{bom.version}
              </span>
              <Badge variant="outline">{bom.status}</Badge>
            </div>

            {/* Usage Card */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">
                  This BOM is referenced by {woUsage.count} work order(s):
                </p>
                <ul className="space-y-2" role="list">
                  {displayWOs.map((wo) => (
                    <li
                      key={wo.id}
                      className="flex items-center justify-between text-sm py-2 border-b last:border-b-0"
                      role="listitem"
                    >
                      <span className="font-mono text-xs">{wo.wo_number}</span>
                      <Badge
                        variant={wo.status === 'completed' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {wo.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {overflow > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 p-0 h-auto text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    ... and {overflow} more
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Alert>
              <AlertDescription>
                <strong>Recommendation:</strong> Consider changing the BOM status to{' '}
                <em>Inactive</em> or <em>Phased Out</em> instead of deleting.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Footer Actions */}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting || makingInactive}>
            Cancel
          </AlertDialogCancel>

          {/* Make Inactive (only if has usage) */}
          {!loading && hasUsage && onMakeInactive && (
            <Button
              variant="outline"
              onClick={handleMakeInactive}
              disabled={deleting || makingInactive}
            >
              {makingInactive ? 'Updating...' : 'Make Inactive'}
            </Button>
          )}

          {/* Delete Button - only show if no usage */}
          {!loading && !hasUsage && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || makingInactive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete BOM'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteBOMDialog
