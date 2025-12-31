/**
 * React Hook: useSupplierProducts
 * Story: 03.2 - Supplier-Product Assignment
 *
 * React Query hook for fetching supplier products
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupplierProducts } from '@/lib/services/supplier-product-service'
import type { SupplierProductWithProduct } from '@/lib/types/supplier-product'

/**
 * Query key factory for supplier products
 */
export const supplierProductsKeys = {
  all: ['supplier-products'] as const,
  list: (supplierId: string, search?: string) =>
    [...supplierProductsKeys.all, supplierId, { search }] as const,
  detail: (supplierId: string, productId: string) =>
    [...supplierProductsKeys.all, supplierId, productId] as const,
}

interface UseSupplierProductsOptions {
  search?: string
  enabled?: boolean
}

/**
 * Hook to fetch products assigned to a supplier
 *
 * @param supplierId - The supplier ID
 * @param options - Optional search and enabled flag
 * @returns Query result with supplier products
 */
export function useSupplierProducts(
  supplierId: string,
  options?: UseSupplierProductsOptions
) {
  return useQuery<SupplierProductWithProduct[], Error>({
    queryKey: supplierProductsKeys.list(supplierId, options?.search),
    queryFn: () => getSupplierProducts(supplierId, { search: options?.search }),
    enabled: options?.enabled !== false && !!supplierId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
