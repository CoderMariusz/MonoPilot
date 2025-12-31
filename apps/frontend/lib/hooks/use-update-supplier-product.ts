/**
 * React Hook: useUpdateSupplierProduct
 * Story: 03.2 - Supplier-Product Assignment
 *
 * React Query mutation for updating supplier-product assignment
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSupplierProduct } from '@/lib/services/supplier-product-service'
import { supplierProductsKeys } from './use-supplier-products'
import type { SupplierProduct, UpdateSupplierProductInput } from '@/lib/types/supplier-product'

interface UpdateSupplierProductParams {
  productId: string
  data: UpdateSupplierProductInput
}

/**
 * Hook to update a supplier-product assignment
 *
 * @param supplierId - The supplier ID
 * @returns Mutation result for updating supplier products
 */
export function useUpdateSupplierProduct(supplierId: string) {
  const queryClient = useQueryClient()

  return useMutation<SupplierProduct, Error, UpdateSupplierProductParams>({
    mutationFn: ({ productId, data }: UpdateSupplierProductParams) =>
      updateSupplierProduct(supplierId, productId, data),
    onSuccess: () => {
      // Invalidate supplier products list
      queryClient.invalidateQueries({
        queryKey: supplierProductsKeys.list(supplierId),
      })
      // Also invalidate default supplier queries if is_default was changed
      queryClient.invalidateQueries({
        queryKey: ['default-supplier'],
      })
    },
  })
}
