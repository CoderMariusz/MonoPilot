/**
 * AssignProductModal Component
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Modal dialog to assign a product to a supplier or edit an existing assignment
 */

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { SupplierProductForm } from './SupplierProductForm'
import { useAssignProduct } from '@/lib/hooks/use-assign-product'
import { useUpdateSupplierProduct } from '@/lib/hooks/use-update-supplier-product'
import type { SupplierProductWithProduct, AssignProductInput, UpdateSupplierProductInput } from '@/lib/types/supplier-product'

interface AssignProductModalProps {
  supplierId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  excludeProductIds?: string[]
  editingProduct?: SupplierProductWithProduct | null
}

/**
 * AssignProductModal - Modal for assigning/editing supplier products
 *
 * Features:
 * - Product selector combobox (searchable)
 * - Form fields for overrides (all optional)
 * - Default supplier toggle
 * - Validation feedback
 * - Loading state during submit
 */
export function AssignProductModal({
  supplierId,
  open,
  onOpenChange,
  onSuccess,
  excludeProductIds = [],
  editingProduct = null,
}: AssignProductModalProps) {
  const { toast } = useToast()
  const assignProduct = useAssignProduct(supplierId)
  const updateProduct = useUpdateSupplierProduct(supplierId)

  const isEdit = !!editingProduct
  const isLoading = assignProduct.isPending || updateProduct.isPending

  const handleSubmit = async (data: AssignProductInput | UpdateSupplierProductInput) => {
    try {
      if (isEdit && editingProduct) {
        await updateProduct.mutateAsync({
          productId: editingProduct.product_id,
          data: data as UpdateSupplierProductInput,
        })
        toast({
          title: 'Success',
          description: 'Product assignment updated successfully',
        })
      } else {
        await assignProduct.mutateAsync(data as AssignProductInput)
        toast({
          title: 'Success',
          description: 'Product assigned to supplier successfully',
        })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save product assignment',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        aria-labelledby="assign-product-title"
        aria-describedby="assign-product-description"
      >
        <DialogHeader>
          <DialogTitle id="assign-product-title">
            {isEdit ? 'Edit Product Assignment' : 'Assign Product to Supplier'}
          </DialogTitle>
          <DialogDescription id="assign-product-description">
            {isEdit
              ? 'Update the supplier-specific details for this product.'
              : 'Select a product and configure supplier-specific pricing, lead times, and other details.'}
          </DialogDescription>
        </DialogHeader>

        <SupplierProductForm
          initialData={editingProduct}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          showProductSelector={!isEdit}
          excludeProductIds={excludeProductIds}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}

export default AssignProductModal
