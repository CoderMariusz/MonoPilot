/**
 * TO Line LP Assignments Component
 * Story 03.9b: TO License Plate Pre-selection
 * Displays LP assignments for a TO line with expand/collapse and remove actions
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { ChevronDown, ChevronUp, X, Package } from 'lucide-react'
import { LPAssignmentBadge } from './LPAssignmentBadge'

export interface LPAssignment {
  id: string
  lp_id: string
  lp_number: string
  quantity: number
  lot_number: string | null
  expiry_date: string | null
  location: string | null
}

interface TOLineLPAssignmentsProps {
  toId: string
  toLineId: string
  assignments: LPAssignment[]
  totalRequired: number
  uom: string
  canEdit: boolean
  onRemove?: (lpId: string) => Promise<void>
  onOpenPicker?: () => void
}

/**
 * TOLineLPAssignments - expandable row showing LP assignments for a TO line
 *
 * States:
 * - Loading: When removing an LP
 * - Empty: No assignments (shows prompt to assign)
 * - Success: Displays table of assigned LPs
 */
export function TOLineLPAssignments({
  toId,
  toLineId,
  assignments,
  totalRequired,
  uom,
  canEdit,
  onRemove,
  onOpenPicker,
}: TOLineLPAssignmentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [removingLP, setRemovingLP] = useState<LPAssignment | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const totalAssigned = assignments.reduce((sum, a) => sum + a.quantity, 0)
  const lpCount = assignments.length

  const formatNumber = (num: number) =>
    num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleRemoveConfirm = async () => {
    if (!removingLP || !onRemove) return

    try {
      setIsRemoving(true)
      await onRemove(removingLP.lp_id)
      setRemovingLP(null)
    } catch (error) {
      console.error('Failed to remove LP:', error)
    } finally {
      setIsRemoving(false)
    }
  }

  // No assignments - show assign button
  if (lpCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <LPAssignmentBadge
          assignedQty={0}
          requiredQty={totalRequired}
          lpCount={0}
          uom={uom}
        />
        {canEdit && onOpenPicker && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPicker}
            className="h-7 text-xs"
          >
            Assign LPs
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2">
          <LPAssignmentBadge
            assignedQty={totalAssigned}
            requiredQty={totalRequired}
            lpCount={lpCount}
            uom={uom}
          />
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              aria-label={isOpen ? 'Hide LP assignments' : 'View LP assignments'}
            >
              {isOpen ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          {canEdit && onOpenPicker && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPicker}
              className="h-7 text-xs"
            >
              Assign More
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg bg-gray-50">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-xs py-2">LP Number</TableHead>
                  <TableHead className="text-xs py-2">Lot</TableHead>
                  <TableHead className="text-xs py-2">Expiry</TableHead>
                  <TableHead className="text-xs py-2">Location</TableHead>
                  <TableHead className="text-xs py-2 text-right">Qty</TableHead>
                  {canEdit && <TableHead className="text-xs py-2 w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} className="bg-white">
                    <TableCell className="py-2 font-mono text-sm">
                      {assignment.lp_number}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-gray-600">
                      {assignment.lot_number || '-'}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-gray-600">
                      {formatDate(assignment.expiry_date)}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-gray-600">
                      {assignment.location || '-'}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-right font-medium">
                      {formatNumber(assignment.quantity)} {uom}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRemovingLP(assignment)}
                          aria-label={`Remove ${assignment.lp_number}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={4} className="py-2 text-sm text-right">
                    Total Assigned:
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right">
                    {formatNumber(totalAssigned)} / {formatNumber(totalRequired)} {uom}
                  </TableCell>
                  {canEdit && <TableCell></TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removingLP} onOpenChange={(open) => !open && setRemovingLP(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove LP Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removingLP?.lp_number}</strong> from
              this Transfer Order line?
              <br />
              <br />
              This will unassign {formatNumber(removingLP?.quantity || 0)} {uom} from the line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TOLineLPAssignments
