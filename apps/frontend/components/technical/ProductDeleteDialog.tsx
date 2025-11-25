/**
 * Product Delete Dialog Component
 * Story: 2.1 Product CRUD
 * AC-2.1.7: Delete with confirmation and referential integrity check
 */

'use client'

import { useState } from 'react'
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

interface Product {
  id: string
  code: string
  name: string
}

interface ProductDeleteDialogProps {
  product: Product
  onClose: () => void
  onSuccess: () => void
}

export function ProductDeleteDialog({ product, onClose, onSuccess }: ProductDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/technical/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()

        // Handle referential integrity errors
        if (error.code === 'HAS_DEPENDENCIES' || error.code === 'PRODUCT_IN_USE') {
          toast({
            title: 'Cannot Delete Product',
            description: error.message || 'This product is used in BOMs or Work Orders and cannot be deleted.',
            variant: 'destructive',
          })
          onClose()
          return
        }

        throw new Error(error.error || 'Failed to delete product')
      }

      toast({
        title: 'Product Deleted',
        description: `Product "${product.code}" has been deleted successfully.`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{product.code}</span> ({product.name})?
            <br /><br />
            This is a soft delete - the product will be archived and can be restored by an administrator.
            However, if this product is used in BOMs or Work Orders, it cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
