/**
 * React Hook: useRemoveSupplierProduct
 * Story: 03.2 - Supplier-Product Assignment
 *
 * React Query mutation for removing supplier-product assignment
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeSupplierProduct } from '@/lib/services/supplier-product-service'
import { supplierProductsKeys } from './use-supplier-products'

/**
 * Hook to remove a product from a supplier
 *
 * @param supplierId - The supplier ID
 * @returns Mutation result for removing supplier products
 */
export function useRemoveSupplierProduct(supplierId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (productId: string) =>
      removeSupplierProduct(supplierId, productId),
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
