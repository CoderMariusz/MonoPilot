/**
 * React Hook: useDefaultSupplier
 * Story: 03.2 - Supplier-Product Assignment
 *
 * React Query hook for fetching default supplier for a product
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getDefaultSupplierForProduct } from '@/lib/services/supplier-product-service'
import type { SupplierProductWithSupplier } from '@/lib/types/supplier-product'

/**
 * Query key factory for default supplier
 */
export const defaultSupplierKeys = {
  all: ['default-supplier'] as const,
  byProduct: (productId: string) =>
    [...defaultSupplierKeys.all, productId] as const,
}

interface UseDefaultSupplierOptions {
  enabled?: boolean
}

/**
 * Hook to fetch the default supplier for a product
 *
 * @param productId - The product ID
 * @param options - Optional enabled flag
 * @returns Query result with default supplier product or null
 */
export function useDefaultSupplier(
  productId: string,
  options?: UseDefaultSupplierOptions
) {
  return useQuery<SupplierProductWithSupplier | null, Error>({
    queryKey: defaultSupplierKeys.byProduct(productId),
    queryFn: () => getDefaultSupplierForProduct(productId),
    enabled: options?.enabled !== false && !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
