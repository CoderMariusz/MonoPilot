/**
 * Delete Routing Dialog
 * Story: 02.7 - Routings CRUD
 * AC-2.24.8: Enhanced delete with BOM usage check
 *
 * Two variants:
 * 1. No BOM usage: Simple delete confirmation
 * 2. With BOM usage: Warning, usage list, Make Inactive alternative
 *
 * Features:
 * - BOM usage check on open
 * - Impact statement (operations deleted, BOMs unassigned)
 * - Alternative action: Make Inactive
 * - Accessibility: alertdialog role, ARIA labels
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
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
import type { Routing } from '@/lib/services/routing-service'

interface BOM {
  id: string
  code: string
  product_name: string
  is_active: boolean
}

interface BOMUsage {
  boms: BOM[]
  count: number
}

interface DeleteRoutingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routing: Routing | null
  onConfirm: () => Promise<void>
  onMakeInactive?: () => Promise<void>
  loading?: boolean
}

export function DeleteRoutingDialog({
  open,
  onOpenChange,
  routing,
  onConfirm,
  onMakeInactive,
  loading: externalLoading = false,
}: DeleteRoutingDialogProps) {
  const [bomUsage, setBomUsage] = useState<BOMUsage | null>(null)
  const [checkingUsage, setCheckingUsage] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [makingInactive, setMakingInactive] = useState(false)
  const { toast } = useToast()

  // Check BOM usage when dialog opens
  useEffect(() => {
    if (open && routing) {
      checkBOMUsage()
    } else {
      setBomUsage(null)
    }
  }, [open, routing])

  const checkBOMUsage = async () => {
    if (!routing) return

    setCheckingUsage(true)
    try {
      const response = await fetch(
        `/api/technical/routings/${routing.id}/boms`
      )

      if (!response.ok) {
        throw new Error('Failed to check BOM usage')
      }

      const data = await response.json()
      setBomUsage(data.data || { boms: [], count: 0 })
    } catch (error) {
      console.error('Error checking BOM usage:', error)
      // Assume no usage on error
      setBomUsage({ boms: [], count: 0 })
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
        description:
          bomUsage && bomUsage.count > 0
            ? `Routing deleted. ${bomUsage.count} BOM(s) unassigned.`
            : 'Routing deleted successfully',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete routing',
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
        description: 'Routing marked as inactive',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update routing status',
        variant: 'destructive',
      })
    } finally {
      setMakingInactive(false)
    }
  }

  if (!routing) return null

  const loading = checkingUsage || externalLoading
  const hasUsage = bomUsage && bomUsage.count > 0
  const displayBOMs = bomUsage?.boms.slice(0, 5) || []
  const overflow = bomUsage ? Math.max(0, bomUsage.count - 5) : 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl" role="alertdialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Routing</AlertDialogTitle>
          <AlertDialogDescription>
            {routing.name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Checking usage...
              </span>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Variant 1: No BOM Usage */}
        {!loading && !hasUsage && (
          <div className="space-y-4">
            {/* Success Indicator */}
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                No BOMs are using this routing
              </AlertDescription>
            </Alert>

            {/* Confirmation Question */}
            <p className="text-sm">
              Are you sure you want to delete this routing?
            </p>

            {/* Impact Statement */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="ml-4 list-disc text-sm space-y-1">
                  <li>The routing record</li>
                  <li>
                    All {routing.operations_count || 0} operation
                    {routing.operations_count !== 1 ? 's' : ''}
                  </li>
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

        {/* Variant 2: With BOM Usage */}
        {!loading && hasUsage && (
          <div className="space-y-4" aria-live="assertive">
            {/* Warning Banner */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Warning: This routing is currently in use
              </AlertDescription>
            </Alert>

            {/* Routing Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{routing.name}</span>
              <Badge variant="outline">
                {routing.operations_count || 0} operations
              </Badge>
            </div>

            {/* Usage Card */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">
                  This routing is used by {bomUsage.count} BOM(s):
                </p>
                <ul className="space-y-2" role="list">
                  {displayBOMs.map((bom) => (
                    <li
                      key={bom.id}
                      className="flex items-center justify-between text-sm py-2 border-b last:border-b-0"
                      role="listitem"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{bom.code}</span>
                        <span>{bom.product_name}</span>
                      </div>
                      <Badge
                        variant={bom.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {bom.is_active ? 'Active' : 'Inactive'}
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
                    ... and {overflow} more. View All BOMs
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Impact Statement */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">
                  Deleting this routing will:
                </p>
                <ul className="ml-4 list-disc text-sm space-y-1">
                  <li>
                    Permanently delete all {routing.operations_count || 0}{' '}
                    operation{routing.operations_count !== 1 ? 's' : ''}
                  </li>
                  <li>
                    Set routing_id to NULL for {bomUsage.count} BOM
                    {bomUsage.count !== 1 ? 's' : ''}
                  </li>
                  <li>Affected BOMs will lose their operation sequence</li>
                </ul>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Alert>
              <AlertDescription>
                <strong>Recommendation:</strong> Consider making the routing{' '}
                <em>Inactive</em> instead of deleting it.
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

          {/* Delete Button */}
          {!loading && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || makingInactive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Routing'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
