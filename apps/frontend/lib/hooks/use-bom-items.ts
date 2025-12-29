/**
 * BOM Items Hooks - Story 02.5a
 *
 * React Query hooks for BOM items management:
 * - useBOMItems: Fetch items for a BOM
 * - useCreateBOMItem: Create mutation
 * - useUpdateBOMItem: Update mutation
 * - useDeleteBOMItem: Delete mutation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBOMItems,
  createBOMItem,
  updateBOMItem,
  deleteBOMItem,
  getNextSequence,
} from '@/lib/services/bom-items-service'
import type {
  BOMItemsListResponse,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  BOMItemResponse,
  DeleteBOMItemResponse,
} from '@/lib/types/bom-items'

/**
 * Query key factory for BOM items
 */
export const bomItemsKeys = {
  all: ['bom-items'] as const,
  list: (bomId: string) => [...bomItemsKeys.all, 'list', bomId] as const,
  nextSequence: (bomId: string) => [...bomItemsKeys.all, 'next-sequence', bomId] as const,
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
