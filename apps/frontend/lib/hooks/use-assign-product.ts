/**
 * React Hook: useAssignProduct
 * Story: 03.2 - Supplier-Product Assignment
 *
 * React Query mutation for assigning product to supplier
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignProductToSupplier } from '@/lib/services/supplier-product-service'
import { supplierProductsKeys } from './use-supplier-products'
import type { SupplierProduct, AssignProductInput } from '@/lib/types/supplier-product'

/**
 * Hook to assign a product to a supplier
 *
 * @param supplierId - The supplier ID
 * @returns Mutation result for assigning products
 */
export function useAssignProduct(supplierId: string) {
  const queryClient = useQueryClient()

  return useMutation<SupplierProduct, Error, AssignProductInput>({
    mutationFn: (data: AssignProductInput) =>
      assignProductToSupplier(supplierId, data),
    onSuccess: () => {
      // Invalidate supplier products list
      queryClient.invalidateQueries({
        queryKey: supplierProductsKeys.list(supplierId),
      })
      // Also invalidate the suppliers query to update products_count
      queryClient.invalidateQueries({
        queryKey: ['suppliers', supplierId],
      })
    },
  })
}
