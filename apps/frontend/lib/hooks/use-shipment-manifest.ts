/**
 * Shipment Manifest Hooks (Story 07.14)
 * React Query hooks for shipment manifest, ship, deliver, and tracking operations:
 * - useShipmentManifest - Combined hook for all manifest operations
 * - useManifestShipment - Manifest shipment (validate SSCC)
 * - useShipShipment - Ship shipment (consume LPs, update SO)
 * - useMarkDelivered - Mark as delivered (Manager+ only)
 * - useTrackingInfo - Get tracking info with timeline
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { shipmentKeys, type ShipmentDetail, type ShipmentStatus } from './use-packing-shipments'

// =============================================================================
// Types
// =============================================================================

export interface TrackingTimeline {
  packed_at: string | null
  packed_by: string | null
  manifested_at: string | null
  manifested_by: string | null
  shipped_at: string | null
  shipped_by: string | null
  delivered_at: string | null
  delivered_by: string | null
}

export interface TrackingInfo {
  shipment_id: string
  shipment_number: string
  sales_order_number: string
  carrier: string | null
  tracking_number: string | null
  status: ShipmentStatus
  timeline: TrackingTimeline
  external_url: string | null
}

export interface ManifestResult {
  success: boolean
  data: {
    id: string
    status: 'manifested'
    manifested_at: string
    boxes?: Array<{
      id: string
      box_number: number
      sscc: string
      validated: boolean
    }>
  }
}

export interface ShipResult {
  success: boolean
  data: {
    id: string
    status: 'shipped'
    shipped_at: string
    shipped_by: string
    license_plates_consumed: number
    sales_order: {
      id: string
      status: 'shipped'
      shipped_at: string
    }
    sales_order_lines_updated: number
  }
}

export interface DeliveredResult {
  success: boolean
  data: {
    id: string
    status: 'delivered'
    delivered_at: string
    delivered_by: {
      id: string
      name: string
    }
    sales_order: {
      id: string
      status: 'delivered'
    }
  }
}

export interface ManifestError {
  code: string
  message: string
  missing_boxes?: Array<{
    id: string
    box_number: number
  }>
  current_status?: string
}

// =============================================================================
// Query Keys
// =============================================================================

export const shipmentManifestKeys = {
  all: ['shipment-manifest'] as const,
  tracking: (id: string) => [...shipmentManifestKeys.all, 'tracking', id] as const,
}

// =============================================================================
// API Functions
// =============================================================================

async function manifestShipment(shipmentId: string): Promise<ManifestResult> {
  const response = await fetch(`/api/shipping/shipments/${shipmentId}/manifest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const err = new Error(error.message || 'Failed to manifest shipment') as Error & {
      code?: string
      missing_boxes?: Array<{ id: string; box_number: number }>
    }
    err.code = error.code
    err.missing_boxes = error.missing_boxes
    throw err
  }

  return response.json()
}

async function shipShipment(
  shipmentId: string,
  confirm: boolean = true
): Promise<ShipResult> {
  const response = await fetch(`/api/shipping/shipments/${shipmentId}/ship`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to ship shipment')
  }

  return response.json()
}

async function markDelivered(shipmentId: string): Promise<DeliveredResult> {
  const response = await fetch(`/api/shipping/shipments/${shipmentId}/mark-delivered`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to mark shipment as delivered')
  }

  return response.json()
}

async function fetchTrackingInfo(shipmentId: string): Promise<TrackingInfo> {
  const response = await fetch(`/api/shipping/shipments/${shipmentId}/tracking`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch tracking information')
  }

  const data = await response.json()
  return data.data || data
}

// =============================================================================
// Individual Hooks
// =============================================================================

/**
 * Hook to manifest a shipment (validate SSCC on all boxes)
 */
export function useManifestShipment(): UseMutationResult<ManifestResult, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: manifestShipment,
    onSuccess: (_, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
    },
  })
}

/**
 * Hook to ship a shipment (consume LPs, update SO)
 */
export function useShipShipment(): UseMutationResult<
  ShipResult,
  Error,
  { shipmentId: string; confirm?: boolean }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipmentId, confirm }) => shipShipment(shipmentId, confirm),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentManifestKeys.tracking(shipmentId) })
    },
  })
}

/**
 * Hook to mark a shipment as delivered (Manager+ only)
 */
export function useMarkDelivered(): UseMutationResult<DeliveredResult, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markDelivered,
    onSuccess: (_, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentManifestKeys.tracking(shipmentId) })
    },
  })
}

/**
 * Hook to fetch tracking information
 */
export function useTrackingInfo(
  shipmentId: string,
  options?: { enabled?: boolean }
): UseQueryResult<TrackingInfo> {
  return useQuery({
    queryKey: shipmentManifestKeys.tracking(shipmentId),
    queryFn: () => fetchTrackingInfo(shipmentId),
    enabled: options?.enabled !== false && !!shipmentId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// =============================================================================
// Combined Hook
// =============================================================================

export interface UseShipmentManifestOptions {
  enabled?: boolean
}

export interface UseShipmentManifestReturn {
  // Tracking
  trackingInfo: TrackingInfo | undefined
  isLoadingTracking: boolean
  trackingError: Error | null
  fetchTracking: () => void
  refetchTracking: () => void

  // Manifest
  manifest: (shipmentId: string) => Promise<ManifestResult>
  isManifesting: boolean
  manifestError: Error | null

  // Ship
  ship: (shipmentId: string, confirm?: boolean) => Promise<ShipResult>
  isShipping: boolean
  shipError: Error | null

  // Deliver
  markDelivered: (shipmentId: string) => Promise<DeliveredResult>
  isMarkingDelivered: boolean
  deliverError: Error | null

  // Helpers
  isLoading: boolean
  reset: () => void
}

/**
 * Combined hook for all shipment manifest operations
 * Provides manifest, ship, deliver mutations and tracking query
 */
export function useShipmentManifest(
  shipmentId: string,
  options: UseShipmentManifestOptions = {}
): UseShipmentManifestReturn {
  const queryClient = useQueryClient()

  // Tracking query - disabled by default, enable manually
  const trackingQuery = useTrackingInfo(shipmentId, {
    enabled: options.enabled,
  })

  // Mutations
  const manifestMutation = useManifestShipment()
  const shipMutation = useShipShipment()
  const deliverMutation = useMarkDelivered()

  // Manual fetch trigger for tracking
  const fetchTracking = useCallback(() => {
    if (shipmentId) {
      queryClient.prefetchQuery({
        queryKey: shipmentManifestKeys.tracking(shipmentId),
        queryFn: () => fetchTrackingInfo(shipmentId),
      })
    }
  }, [shipmentId, queryClient])

  const refetchTracking = useCallback(() => {
    if (shipmentId) {
      queryClient.invalidateQueries({
        queryKey: shipmentManifestKeys.tracking(shipmentId),
      })
    }
  }, [shipmentId, queryClient])

  // Wrapper functions
  const manifest = useCallback(
    (id: string) => manifestMutation.mutateAsync(id),
    [manifestMutation]
  )

  const ship = useCallback(
    (id: string, confirm: boolean = true) =>
      shipMutation.mutateAsync({ shipmentId: id, confirm }),
    [shipMutation]
  )

  const markDeliveredFn = useCallback(
    (id: string) => deliverMutation.mutateAsync(id),
    [deliverMutation]
  )

  // Reset all mutation states
  const reset = useCallback(() => {
    manifestMutation.reset()
    shipMutation.reset()
    deliverMutation.reset()
  }, [manifestMutation, shipMutation, deliverMutation])

  return {
    // Tracking
    trackingInfo: trackingQuery.data,
    isLoadingTracking: trackingQuery.isLoading,
    trackingError: trackingQuery.error,
    fetchTracking,
    refetchTracking,

    // Manifest
    manifest,
    isManifesting: manifestMutation.isPending,
    manifestError: manifestMutation.error,

    // Ship
    ship,
    isShipping: shipMutation.isPending,
    shipError: shipMutation.error,

    // Deliver
    markDelivered: markDeliveredFn,
    isMarkingDelivered: deliverMutation.isPending,
    deliverError: deliverMutation.error,

    // Helpers
    isLoading:
      manifestMutation.isPending || shipMutation.isPending || deliverMutation.isPending,
    reset,
  }
}

export default useShipmentManifest
