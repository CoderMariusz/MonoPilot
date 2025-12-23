/**
 * DeleteTaxCodeDialog Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Confirmation dialog for deleting tax code with reference check
 */

'use client'

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
import type { TaxCode } from '@/lib/types/tax-code'

interface DeleteTaxCodeDialogProps {
  open: boolean
  taxCode: TaxCode | null
  references?: { count: number; entities: string[] }
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteTaxCodeDialog({
  open,
  taxCode,
  references,
  onConfirm,
  onCancel,
}: DeleteTaxCodeDialogProps) {
  if (!taxCode) return null

  const hasReferences = references && references.count > 0

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tax Code</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {hasReferences ? (
                <>
                  <p className="text-destructive font-semibold">
                    Cannot delete tax code &quot;{taxCode.code}&quot;
                  </p>
                  <p>
                    This tax code is referenced by {references.count}{' '}
                    {references.entities.join(', ')}.
                  </p>
                  <p>Remove all references before deleting.</p>
                </>
              ) : (
                <>
                  <p>
                    Are you sure you want to delete tax code <strong>{taxCode.code}</strong>?
                  </p>
                  <p>This action cannot be undone.</p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {hasReferences ? (
            <AlertDialogCancel onClick={onCancel}>Close</AlertDialogCancel>
          ) : (
            <>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
