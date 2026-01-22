/**
 * Packing Shipments Hooks (Story 07.11)
 * React Query hooks for shipment packing operations:
 * - useShipments - List shipments with filters
 * - useShipment - Single shipment detail with boxes
 * - useAvailableLPs - Get picked LPs for packing
 * - useCreateShipment - Create shipment from SO
 * - useAddBox - Add box to shipment
 * - useUpdateBox - Update box weight/dimensions
 * - useAddContent - Add LP to box
 * - useCompletePacking - Complete packing workflow
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// =============================================================================
// Types
// =============================================================================

export type ShipmentStatus =
  | 'pending'
  | 'packing'
  | 'packed'
  | 'manifested'
  | 'shipped'
  | 'delivered'
  | 'exception'

export interface Shipment {
  id: string
  shipment_number: string
  status: ShipmentStatus
  sales_order_id: string
  customer_id: string
  customer?: {
    id: string
    name: string
  }
  sales_order?: {
    id: string
    order_number: string
  }
  shipping_address_id: string
  carrier: string | null
  service_level: string | null
  tracking_number: string | null
  sscc: string | null
  total_weight: number | null
  total_boxes: number
  dock_door_id: string | null
  staged_location_id: string | null
  packed_at: string | null
  packed_by: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  created_by: string
}

export interface ShipmentBox {
  id: string
  shipment_id: string
  box_number: number
  sscc: string | null
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  tracking_number: string | null
  created_at: string
}

export interface BoxContent {
  id: string
  shipment_box_id: string
  sales_order_line_id: string
  product_id: string
  product?: {
    id: string
    name: string
    code: string
  }
  license_plate_id: string
  lp_number?: string
  lot_number: string
  quantity: number
  created_at: string
}

export interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  product_name: string
  lot_number: string
  quantity_available: number
  location_id: string
  location_name: string
  expiry_date: string | null
  allergens?: string[]
}

export interface ShipmentDetail extends Shipment {
  boxes: ShipmentBox[]
  contents: BoxContent[]
  available_lps: AvailableLP[]
  pack_progress: {
    total_count: number
    packed_count: number
    remaining_count: number
    percentage: number
  }
}

export interface ShipmentListParams {
  page?: number
  limit?: number
  status?: ShipmentStatus | ShipmentStatus[]
  customer_id?: string
  date_from?: string
  date_to?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateShipmentRequest {
  sales_order_id: string
}

export interface UpdateBoxRequest {
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
}

export interface AddContentRequest {
  license_plate_id: string
  sales_order_line_id: string
  quantity: number
}

// =============================================================================
// Query Keys
// =============================================================================

export const shipmentKeys = {
  all: ['shipments'] as const,
  lists: () => [...shipmentKeys.all, 'list'] as const,
  list: (params: ShipmentListParams) =>
    [...shipmentKeys.lists(), params] as const,
  details: () => [...shipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...shipmentKeys.details(), id] as const,
  boxes: (shipmentId: string) =>
    [...shipmentKeys.all, 'boxes', shipmentId] as const,
  availableLPs: (shipmentId: string) =>
    [...shipmentKeys.all, 'available-lps', shipmentId] as const,
}

// =============================================================================
// API Functions
// =============================================================================

function buildQueryString(params: ShipmentListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.status) {
    if (Array.isArray(params.status)) {
      searchParams.set('status', params.status.join(','))
    } else {
      searchParams.set('status', params.status)
    }
  }
  if (params.customer_id) searchParams.set('customer_id', params.customer_id)
  if (params.date_from) searchParams.set('date_from', params.date_from)
  if (params.date_to) searchParams.set('date_to', params.date_to)
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.order) searchParams.set('order', params.order)

  return searchParams.toString()
}

async function fetchShipments(
  params: ShipmentListParams
): Promise<PaginatedResult<Shipment>> {
  const queryString = buildQueryString(params)
  const url = `/api/shipping/shipments${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch shipments')
  }

  return response.json()
}

async function fetchShipment(id: string): Promise<ShipmentDetail> {
  const response = await fetch(`/api/shipping/shipments/${id}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch shipment')
  }

  return response.json()
}

async function fetchAvailableLPs(shipmentId: string): Promise<AvailableLP[]> {
  const response = await fetch(
    `/api/shipping/shipments/${shipmentId}/available-lps`
  )
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch available LPs')
  }

  const data = await response.json()
  return data.license_plates || []
}

async function createShipment(
  data: CreateShipmentRequest
): Promise<{ shipment_id: string; shipment_number: string }> {
  const response = await fetch('/api/shipping/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to create shipment')
  }

  return response.json()
}

async function addBox(
  shipmentId: string
): Promise<{ box_id: string; box_number: number }> {
  const response = await fetch(`/api/shipping/shipments/${shipmentId}/boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to add box')
  }

  return response.json()
}

async function updateBox(
  shipmentId: string,
  boxId: string,
  data: UpdateBoxRequest
): Promise<{ success: boolean }> {
  const response = await fetch(
    `/api/shipping/shipments/${shipmentId}/boxes/${boxId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to update box')
  }

  return response.json()
}

async function addContent(
  shipmentId: string,
  boxId: string,
  data: AddContentRequest
): Promise<{ content_id: string; lot_number: string }> {
  const response = await fetch(
    `/api/shipping/shipments/${shipmentId}/boxes/${boxId}/contents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to add content')
  }

  return response.json()
}

async function completePacking(
  shipmentId: string
): Promise<{
  success: boolean
  status: string
  total_weight: number
  total_boxes: number
  packed_at: string
}> {
  const response = await fetch(
    `/api/shipping/shipments/${shipmentId}/complete-packing`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to complete packing')
  }

  return response.json()
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch shipments list with filters
 */
export function useShipments(
  params: ShipmentListParams = {}
): UseQueryResult<PaginatedResult<Shipment>> {
  return useQuery({
    queryKey: shipmentKeys.list(params),
    queryFn: () => fetchShipments(params),
  })
}

/**
 * Hook to fetch single shipment detail with boxes and contents
 */
export function useShipment(
  id: string,
  options?: { enabled?: boolean }
): UseQueryResult<ShipmentDetail> {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => fetchShipment(id),
    enabled: options?.enabled !== false && !!id,
  })
}

/**
 * Hook to fetch available LPs for packing
 */
export function useAvailableLPs(
  shipmentId: string,
  options?: { enabled?: boolean }
): UseQueryResult<AvailableLP[]> {
  return useQuery({
    queryKey: shipmentKeys.availableLPs(shipmentId),
    queryFn: () => fetchAvailableLPs(shipmentId),
    enabled: options?.enabled !== false && !!shipmentId,
  })
}

/**
 * Hook to create a new shipment from a sales order
 */
export function useCreateShipment(): UseMutationResult<
  { shipment_id: string; shipment_number: string },
  Error,
  CreateShipmentRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      // Invalidate shipments list
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
    },
  })
}

/**
 * Hook to add a box to a shipment
 */
export function useAddBox(): UseMutationResult<
  { box_id: string; box_number: number },
  Error,
  { shipmentId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipmentId }) => addBox(shipmentId),
    onSuccess: (_, { shipmentId }) => {
      // Invalidate shipment detail
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
    },
  })
}

/**
 * Hook to update box weight and dimensions
 */
export function useUpdateBox(): UseMutationResult<
  { success: boolean },
  Error,
  { shipmentId: string; boxId: string; data: UpdateBoxRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipmentId, boxId, data }) =>
      updateBox(shipmentId, boxId, data),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
    },
  })
}

/**
 * Hook to add LP content to a box
 */
export function useAddContent(): UseMutationResult<
  { content_id: string; lot_number: string },
  Error,
  { shipmentId: string; boxId: string; data: AddContentRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipmentId, boxId, data }) =>
      addContent(shipmentId, boxId, data),
    onSuccess: (_, { shipmentId }) => {
      // Invalidate shipment detail and available LPs
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
      queryClient.invalidateQueries({
        queryKey: shipmentKeys.availableLPs(shipmentId),
      })
    },
  })
}

/**
 * Hook to complete packing for a shipment
 */
export function useCompletePacking(): UseMutationResult<
  {
    success: boolean
    status: string
    total_weight: number
    total_boxes: number
    packed_at: string
  },
  Error,
  { shipmentId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipmentId }) => completePacking(shipmentId),
    onSuccess: (_, { shipmentId }) => {
      // Invalidate all shipment queries
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all })
    },
  })
}

/**
 * Combined hook for packing workflow
 * Provides all shipment and packing-related mutations and queries
 */
export function usePackingShipments(shipmentId?: string) {
  const queryClient = useQueryClient()

  // Queries
  const shipmentQuery = useShipment(shipmentId || '', {
    enabled: !!shipmentId,
  })
  const availableLPsQuery = useAvailableLPs(shipmentId || '', {
    enabled: !!shipmentId,
  })

  // Mutations
  const createShipmentMutation = useCreateShipment()
  const addBoxMutation = useAddBox()
  const updateBoxMutation = useUpdateBox()
  const addContentMutation = useAddContent()
  const completePackingMutation = useCompletePacking()

  // Refresh all data
  const refresh = () => {
    if (shipmentId) {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
      queryClient.invalidateQueries({
        queryKey: shipmentKeys.availableLPs(shipmentId),
      })
    }
  }

  return {
    // Query data
    shipment: shipmentQuery.data,
    availableLPs: availableLPsQuery.data || [],
    isLoading: shipmentQuery.isLoading || availableLPsQuery.isLoading,
    error: shipmentQuery.error || availableLPsQuery.error,

    // Mutations
    createShipment: createShipmentMutation.mutateAsync,
    addBox: addBoxMutation.mutateAsync,
    updateBox: updateBoxMutation.mutateAsync,
    addContent: addContentMutation.mutateAsync,
    completePacking: completePackingMutation.mutateAsync,

    // Mutation states
    isCreating: createShipmentMutation.isPending,
    isAddingBox: addBoxMutation.isPending,
    isUpdatingBox: updateBoxMutation.isPending,
    isAddingContent: addContentMutation.isPending,
    isCompleting: completePackingMutation.isPending,

    // Helpers
    refresh,
  }
}
