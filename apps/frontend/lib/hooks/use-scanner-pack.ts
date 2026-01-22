/**
 * Scanner Pack Hooks (Story 07.12)
 * Purpose: React Query hooks for scanner packing operations
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// =============================================================================
// Types
// =============================================================================

export interface PendingShipment {
  id: string
  shipmentNumber: string
  soNumber: string
  customerName: string
  status: string
  promisedShipDate: string
  linesTotal: number
  linesPacked: number
  boxesCount: number
  allergenAlert: boolean
  allergenRestrictions?: string[]
}

export interface ShipmentBox {
  id: string
  shipmentId: string
  boxNumber: number
  status: 'open' | 'closed'
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  itemCount?: number
  weightEst?: number
}

export interface BoxContent {
  id: string
  boxId: string
  licensePlateId: string
  soLineId: string
  productId: string
  productName: string
  quantity: number
  lotNumber: string
  lpNumber: string
  uom: string
}

export interface LPLookupResult {
  id: string
  lpNumber: string
  productId: string
  productName: string
  lotNumber: string
  availableQty: number
  uom: string
  allocated: boolean
  soLineId: string | null
  allergens: string[]
}

export interface PackItemResult {
  boxContent: {
    id: string
    quantity: number
    productName: string
    lotNumber: string
  }
  boxSummary: {
    itemCount: number
    totalWeightEst: number
    items: Array<{
      productName: string
      quantity: number
      uom: string
    }>
  }
  soLineStatus: {
    packedQty: number
    remainingQty: number
    status: 'partial' | 'complete'
  }
  allergenWarning?: {
    customerRestrictions: string[]
    productAllergens: string[]
    matches: string[]
  }
}

export interface BoxDetails {
  box: ShipmentBox
  contents: BoxContent[]
  summary: {
    itemCount: number
    totalWeightEst: number
  }
}

// =============================================================================
// Get Pending Shipments Hook
// =============================================================================

interface GetPendingShipmentsParams {
  warehouseId?: string
}

export function usePendingShipments(params: GetPendingShipmentsParams = {}) {
  const { warehouseId } = params

  return useQuery<PendingShipment[], Error>({
    queryKey: ['pendingShipments', warehouseId],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (warehouseId) {
        searchParams.set('warehouse_id', warehouseId)
      }

      const url = `/api/shipping/scanner/pack/shipments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to load shipments')
      }

      const data = await response.json()
      return data.data || []
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// =============================================================================
// Lookup Shipment Hook
// =============================================================================

interface LookupShipmentParams {
  barcode: string
}

export function useLookupShipment() {
  return useMutation<PendingShipment | null, Error, LookupShipmentParams>({
    mutationFn: async ({ barcode }) => {
      const response = await fetch(
        `/api/shipping/scanner/pack/lookup/${encodeURIComponent(barcode)}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const data = await response.json()
        throw new Error(data.error?.message || 'Shipment not found')
      }

      const data = await response.json()
      return data.data
    },
  })
}

// =============================================================================
// Lookup LP Hook
// =============================================================================

interface LookupLPParams {
  barcode: string
  shipmentId: string
}

export function useLookupLP() {
  return useMutation<LPLookupResult | null, Error, LookupLPParams>({
    mutationFn: async ({ barcode, shipmentId }) => {
      const response = await fetch(
        `/api/shipping/scanner/pack/lookup/${encodeURIComponent(barcode)}?shipment_id=${shipmentId}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const data = await response.json()
        throw new Error(data.error?.message || 'LP not found')
      }

      const data = await response.json()
      return data.data
    },
  })
}

// =============================================================================
// Create Box Hook
// =============================================================================

interface CreateBoxParams {
  shipmentId: string
}

export function useCreateBox() {
  const queryClient = useQueryClient()

  return useMutation<ShipmentBox, Error, CreateBoxParams>({
    mutationFn: async ({ shipmentId }) => {
      const response = await fetch('/api/shipping/scanner/pack/box/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: shipmentId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to create box')
      }

      const data = await response.json()
      return data.data
    },
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['shipmentBoxes', shipmentId] })
    },
  })
}

// =============================================================================
// Close Box Hook
// =============================================================================

interface CloseBoxParams {
  boxId: string
  weight?: number
  length?: number
  width?: number
  height?: number
}

export function useCloseBox() {
  const queryClient = useQueryClient()

  return useMutation<ShipmentBox, Error, CloseBoxParams>({
    mutationFn: async ({ boxId, weight, length, width, height }) => {
      const response = await fetch('/api/shipping/scanner/pack/box/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_id: boxId,
          weight,
          length,
          width,
          height,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to close box')
      }

      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipmentBoxes'] })
      queryClient.invalidateQueries({ queryKey: ['boxDetails'] })
    },
  })
}

// =============================================================================
// Add Item to Box Hook
// =============================================================================

interface AddItemParams {
  shipmentId: string
  boxId: string
  licensePlateId: string
  soLineId: string
  quantity: number
  notes?: string
}

export function useAddItemToBox() {
  const queryClient = useQueryClient()

  return useMutation<PackItemResult, Error, AddItemParams>({
    mutationFn: async ({ shipmentId, boxId, licensePlateId, soLineId, quantity, notes }) => {
      const response = await fetch('/api/shipping/scanner/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: shipmentId,
          box_id: boxId,
          license_plate_id: licensePlateId,
          so_line_id: soLineId,
          quantity,
          notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to add item')
      }

      const data = await response.json()
      return data.data
    },
    onSuccess: (_, { shipmentId, boxId }) => {
      queryClient.invalidateQueries({ queryKey: ['shipmentBoxes', shipmentId] })
      queryClient.invalidateQueries({ queryKey: ['boxDetails', boxId] })
      queryClient.invalidateQueries({ queryKey: ['pendingShipments'] })
    },
  })
}

// =============================================================================
// Remove Item from Box Hook
// =============================================================================

interface RemoveItemParams {
  boxId: string
  boxContentId: string
}

export function useRemoveItemFromBox() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, RemoveItemParams>({
    mutationFn: async ({ boxId, boxContentId }) => {
      const response = await fetch(
        `/api/shipping/scanner/pack/box/${boxId}/item/${boxContentId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to remove item')
      }
    },
    onSuccess: (_, { boxId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxDetails', boxId] })
      queryClient.invalidateQueries({ queryKey: ['shipmentBoxes'] })
    },
  })
}

// =============================================================================
// Get Box Details Hook
// =============================================================================

export function useBoxDetails(boxId: string | null) {
  return useQuery<BoxDetails | null, Error>({
    queryKey: ['boxDetails', boxId],
    queryFn: async () => {
      if (!boxId) return null

      const response = await fetch(`/api/shipping/scanner/pack/box/${boxId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to load box details')
      }

      const data = await response.json()
      return data.data
    },
    enabled: !!boxId,
    staleTime: 10 * 1000, // 10 seconds
  })
}

// =============================================================================
// Get Shipment Boxes Hook
// =============================================================================

export function useShipmentBoxes(shipmentId: string | null) {
  return useQuery<ShipmentBox[], Error>({
    queryKey: ['shipmentBoxes', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return []

      const response = await fetch(
        `/api/shipping/scanner/pack/shipments/${shipmentId}/boxes`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to load boxes')
      }

      const data = await response.json()
      return data.data || []
    },
    enabled: !!shipmentId,
    staleTime: 10 * 1000,
  })
}

export default {
  usePendingShipments,
  useLookupShipment,
  useLookupLP,
  useCreateBox,
  useCloseBox,
  useAddItemToBox,
  useRemoveItemFromBox,
  useBoxDetails,
  useShipmentBoxes,
}
