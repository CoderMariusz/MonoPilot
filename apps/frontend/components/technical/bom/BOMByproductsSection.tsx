'use client'

/**
 * BOMByproductsSection Component (Story 02.5b)
 *
 * Displays byproducts in a separate section below main BOM items:
 * - Table with product code, name, quantity, UoM, yield%
 * - Total yield percentage in footer
 * - Add/Edit/Delete actions (when canEdit=true)
 * - Empty state when no byproducts
 */

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreVertical, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface BOMItem {
  id: string
  product_code: string
  product_name: string
  quantity: number
  uom: string
  yield_percent?: number | null
  is_by_product: boolean
  notes?: string | null
}

interface BOMByproductsSectionProps {
  byproducts: BOMItem[]
  bomOutputQty: number
  bomOutputUom: string
  canEdit: boolean
  onAddByproduct?: () => void
  onEditByproduct?: (id: string) => void
  onDeleteByproduct?: (id: string) => Promise<void>
  isLoading?: boolean
}

export function BOMByproductsSection({
  byproducts,
  bomOutputQty,
  bomOutputUom,
  canEdit,
  onAddByproduct,
  onEditByproduct,
  onDeleteByproduct,
  isLoading = false,
}: BOMByproductsSectionProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate total yield
  const totalYield = byproducts.reduce(
    (sum, bp) => sum + (bp.yield_percent || 0),
    0
  )

  // Calculate total byproduct quantity
  const totalByproductQty = byproducts.reduce((sum, bp) => sum + bp.quantity, 0)

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!deleteId || !onDeleteByproduct) return
    setIsDeleting(true)
    try {
      await onDeleteByproduct(deleteId)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Byproducts (Optional Outputs)</h3>
        {canEdit && (
          <Button
            onClick={onAddByproduct}
            size="sm"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Byproduct
          </Button>
        )}
      </div>

      {/* Empty State */}
      {byproducts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          <p className="font-medium">No byproducts defined</p>
          <p className="text-sm mt-1">
            Byproducts are secondary outputs from production.
          </p>
          {canEdit && onAddByproduct && (
            <Button
              onClick={onAddByproduct}
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Byproduct
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-24 text-right">Qty</TableHead>
                  <TableHead className="w-20">UoM</TableHead>
                  <TableHead className="w-24 text-right">Yield%</TableHead>
                  <TableHead className="max-w-xs">Notes</TableHead>
                  {canEdit && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {byproducts.map((bp, index) => (
                  <TableRow key={bp.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{bp.product_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {bp.product_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {bp.quantity.toFixed(3)}
                    </TableCell>
                    <TableCell>{bp.uom}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {bp.yield_percent?.toFixed(1) || '0.0'}%
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {bp.notes || '-'}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading || isDeleting}
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onEditByproduct?.(bp.id)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(bp.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">
                    Total Byproduct Yield
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {totalByproductQty.toFixed(3)}
                  </TableCell>
                  <TableCell>{byproducts[0]?.uom || bomOutputUom}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {totalYield.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell colSpan={canEdit ? 2 : 1}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Summary */}
          <p className="text-sm text-muted-foreground">
            Byproduct yield: {totalYield.toFixed(1)}% of main output (
            {totalByproductQty.toFixed(3)} {byproducts[0]?.uom || bomOutputUom}{' '}
            from {bomOutputQty} {bomOutputUom} batch)
          </p>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Byproduct</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this byproduct? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
