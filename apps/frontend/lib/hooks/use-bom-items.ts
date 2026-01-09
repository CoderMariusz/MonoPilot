/**
 * BOM Items Hooks - Story 02.5a + 02.5b Phase 1B
 *
 * React Query hooks for BOM items management:
 * - useBOMItems: Fetch items for a BOM
 * - useCreateBOMItem: Create mutation
 * - useUpdateBOMItem: Update mutation
 * - useDeleteBOMItem: Delete mutation
 * - useBulkCreateBOMItems: Bulk import mutation (Phase 1B)
 * - useByproducts: Fetch byproducts for a BOM (Phase 1B)
 * - useProductionLines: Fetch production lines (Phase 1B)
 * - useConditionalFlags: Fetch conditional flags (Phase 1B)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBOMItems,
  createBOMItem,
  updateBOMItem,
  deleteBOMItem,
  getNextSequence,
  bulkCreateBOMItems,
  getByproducts,
  getProductionLines,
  getConditionalFlags,
} from '@/lib/services/bom-items-service'
import type {
  BOMItemsListResponse,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  BOMItemResponse,
  DeleteBOMItemResponse,
  BulkImportResponse,
  BOMItem,
  ProductionLine,
  ConditionalFlag,
} from '@/lib/types/bom-items'

/**
 * Query key factory for BOM items
 */
export const bomItemsKeys = {
  all: ['bom-items'] as const,
  list: (bomId: string) => [...bomItemsKeys.all, 'list', bomId] as const,
  nextSequence: (bomId: string) => [...bomItemsKeys.all, 'next-sequence', bomId] as const,
  byproducts: (bomId: string) => [...bomItemsKeys.all, 'byproducts', bomId] as const,
  productionLines: () => ['production-lines'] as const,
  conditionalFlags: () => ['conditional-flags'] as const,
}

/**
 * Hook to fetch BOM items
 * @param bomId - UUID of the BOM
 * @param options - React Query options
 */
export function useBOMItems(bomId: string, options?: { enabled?: boolean }) {
  return useQuery<BOMItemsListResponse, Error>({
    queryKey: bomItemsKeys.list(bomId),
    queryFn: () => getBOMItems(bomId),
    enabled: options?.enabled !== false && !!bomId,
  })
}

/**
 * Hook to get next sequence number
 * @param bomId - UUID of the BOM
 */
export function useNextSequence(bomId: string) {
  return useQuery<number, Error>({
    queryKey: bomItemsKeys.nextSequence(bomId),
    queryFn: () => getNextSequence(bomId),
    enabled: !!bomId,
  })
}

/**
 * Hook to create a BOM item
 * @returns Mutation for creating BOM items
 */
export function useCreateBOMItem() {
  const queryClient = useQueryClient()

  return useMutation<
    BOMItemResponse,
    Error,
    { bomId: string; data: CreateBOMItemRequest }
  >({
    mutationFn: ({ bomId, data }) => createBOMItem(bomId, data),
    onSuccess: (_, variables) => {
      // Invalidate the items list and next sequence
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.list(variables.bomId) })
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.nextSequence(variables.bomId) })
    },
  })
}

/**
 * Hook to update a BOM item
 * @returns Mutation for updating BOM items
 */
export function useUpdateBOMItem() {
  const queryClient = useQueryClient()

  return useMutation<
    BOMItemResponse,
    Error,
    { bomId: string; itemId: string; data: UpdateBOMItemRequest }
  >({
    mutationFn: ({ bomId, itemId, data }) => updateBOMItem(bomId, itemId, data),
    onSuccess: (_, variables) => {
      // Invalidate the items list
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.list(variables.bomId) })
    },
  })
}

/**
 * Hook to delete a BOM item
 * @returns Mutation for deleting BOM items
 */
export function useDeleteBOMItem() {
  const queryClient = useQueryClient()

  return useMutation<
    DeleteBOMItemResponse,
    Error,
    { bomId: string; itemId: string }
  >({
    mutationFn: ({ bomId, itemId }) => deleteBOMItem(bomId, itemId),
    onSuccess: (_, variables) => {
      // Invalidate the items list and next sequence
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.list(variables.bomId) })
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.nextSequence(variables.bomId) })
    },
  })
}

// ============================================
// Phase 1B Hooks (Story 02.5b)
// ============================================

/**
 * Hook to bulk create BOM items
 * @returns Mutation for bulk importing BOM items
 */
export function useBulkCreateBOMItems() {
  const queryClient = useQueryClient()

  return useMutation<
    BulkImportResponse,
    Error,
    { bomId: string; items: CreateBOMItemRequest[] }
  >({
    mutationFn: ({ bomId, items }) => bulkCreateBOMItems(bomId, items),
    onSuccess: (_, variables) => {
      // Invalidate the items list, next sequence, and byproducts
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.list(variables.bomId) })
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.nextSequence(variables.bomId) })
      queryClient.invalidateQueries({ queryKey: bomItemsKeys.byproducts(variables.bomId) })
    },
  })
}

/**
 * Hook to fetch byproducts for a BOM
 * @param bomId - UUID of the BOM
 * @param options - React Query options
 */
export function useByproducts(bomId: string, options?: { enabled?: boolean }) {
  return useQuery<BOMItem[], Error>({
    queryKey: bomItemsKeys.byproducts(bomId),
    queryFn: () => getByproducts(bomId),
    enabled: options?.enabled !== false && !!bomId,
  })
}

/**
 * Hook to fetch production lines for dropdown
 * @param orgId - Organization ID (optional)
 */
export function useProductionLines(orgId?: string) {
  return useQuery<ProductionLine[], Error>({
    queryKey: bomItemsKeys.productionLines(),
    queryFn: () => getProductionLines(orgId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Hook to fetch conditional flags for multi-select
 */
export function useConditionalFlags() {
  return useQuery<ConditionalFlag[], Error>({
    queryKey: bomItemsKeys.conditionalFlags(),
    queryFn: () => getConditionalFlags(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })
}
