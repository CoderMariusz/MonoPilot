/**
 * Consumption Hooks (Story 04.6a)
 *
 * React Query hooks for material consumption:
 * - useConsumptionMaterials: Fetch WO materials with progress
 * - useConsumptionHistory: Fetch paginated consumption history
 * - useAvailableLPs: Search available LPs for consumption
 * - useRecordConsumption: Mutation to record consumption
 * - useReverseConsumption: Mutation to reverse consumption
 *
 * @module lib/hooks/use-consumption
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWOMaterials,
  getConsumptionHistory,
  getAvailableLPs,
  recordConsumption,
  reverseConsumption,
  type ConsumptionMaterial,
  type Consumption,
  type AvailableLP,
  type ConsumptionResult,
} from '@/lib/services/consumption-service'
import type {
  ConsumeRequest,
  ConsumptionFilter,
  ReversalRequest,
} from '@/lib/validation/consumption-schemas'
import { woMaterialsKeys } from './use-wo-materials'

/**
 * Query key factory for consumption
 */
export const consumptionKeys = {
  all: ['consumption'] as const,
  materials: (woId: string) => [...consumptionKeys.all, 'materials', woId] as const,
  history: (woId: string) => [...consumptionKeys.all, 'history', woId] as const,
  availableLPs: (woId: string, productId: string, uom: string) =>
    [...consumptionKeys.all, 'available-lps', woId, productId, uom] as const,
}

/**
 * Hook to fetch WO materials with consumption progress
 */
export function useConsumptionMaterials(woId: string, options?: { enabled?: boolean }) {
  return useQuery<{ materials: ConsumptionMaterial[]; total: number }, Error>({
    queryKey: consumptionKeys.materials(woId),
    queryFn: () => getWOMaterials(woId),
    enabled: options?.enabled !== false && !!woId,
    staleTime: 10 * 1000, // 10 seconds - refresh frequently during active consumption
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to fetch consumption history with pagination
 */
export function useConsumptionHistory(
  woId: string,
  filter?: ConsumptionFilter,
  options?: { enabled?: boolean }
) {
  return useQuery<{ consumptions: Consumption[]; total: number }, Error>({
    queryKey: [...consumptionKeys.history(woId), filter],
    queryFn: () => getConsumptionHistory(woId, filter),
    enabled: options?.enabled !== false && !!woId,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to search available LPs for a material
 */
export function useAvailableLPs(
  woId: string,
  productId: string,
  uom: string,
  search?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<AvailableLP[], Error>({
    queryKey: [...consumptionKeys.availableLPs(woId, productId, uom), search],
    queryFn: () => getAvailableLPs(woId, productId, uom, search),
    enabled: options?.enabled !== false && !!woId && !!productId && !!uom,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to record material consumption
 */
export function useRecordConsumption() {
  const queryClient = useQueryClient()

  return useMutation<
    ConsumptionResult,
    Error,
    { woId: string; request: ConsumeRequest }
  >({
    mutationFn: ({ woId, request }) => recordConsumption(woId, request),
    onSuccess: (_, { woId }) => {
      // Invalidate materials and history queries
      queryClient.invalidateQueries({ queryKey: consumptionKeys.materials(woId) })
      queryClient.invalidateQueries({ queryKey: consumptionKeys.history(woId) })
      queryClient.invalidateQueries({ queryKey: woMaterialsKeys.list(woId) })
      // Also invalidate available LPs
      queryClient.invalidateQueries({
        queryKey: [...consumptionKeys.all, 'available-lps', woId],
      })
    },
  })
}

/**
 * Hook to reverse a consumption record
 */
export function useReverseConsumption() {
  const queryClient = useQueryClient()

  return useMutation<
    { success: boolean; message: string },
    Error,
    { woId: string; request: ReversalRequest }
  >({
    mutationFn: ({ woId, request }) => reverseConsumption(woId, request),
    onSuccess: (_, { woId }) => {
      // Invalidate materials and history queries
      queryClient.invalidateQueries({ queryKey: consumptionKeys.materials(woId) })
      queryClient.invalidateQueries({ queryKey: consumptionKeys.history(woId) })
      queryClient.invalidateQueries({ queryKey: woMaterialsKeys.list(woId) })
      // Also invalidate available LPs
      queryClient.invalidateQueries({
        queryKey: [...consumptionKeys.all, 'available-lps', woId],
      })
    },
  })
}
