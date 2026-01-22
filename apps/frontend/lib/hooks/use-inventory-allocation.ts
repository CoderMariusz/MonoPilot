/**
 * Inventory Allocation Hooks
 * Story 07.7: Inventory Allocation
 *
 * React Query hooks for inventory allocation operations:
 * - useAllocationData - Fetch allocation data for an SO
 * - useAllocateSalesOrder - Allocate inventory to SO
 * - useReleaseAllocation - Release allocated inventory
 * - useAllocationFreshness - Track data freshness
 * - useAllocationModal - Modal UI state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { salesOrderKeys } from './use-sales-orders'

// =============================================================================
// Types
// =============================================================================

export type AllocationStrategy = 'FIFO' | 'FEFO'
export type AllocationLineStatus = 'full' | 'partial' | 'none'

export interface AvailableLicensePlate {
  license_plate_id: string
  lp_number: string
  location_code: string
  on_hand_quantity: number
  allocated_quantity: number
  available_quantity: number
  manufacturing_date: string | null
  receipt_date: string
  best_before_date: string | null
  expiry_days_remaining: number | null
  lot_number: string | null
  batch_number: string | null
  suggested_allocation_qty: number
  is_suggested: boolean
  is_fefo_warning: boolean
  reason: string
}

export interface AllocationLine {
  line_id: string
  line_number: number
  product_id: string
  product_name: string
  product_size: string
  quantity_ordered: number
  quantity_currently_allocated: number
  available_license_plates: AvailableLicensePlate[]
  allocation_status: AllocationLineStatus
  total_available: number
  qty_short: number
}

export interface AllocationSummary {
  total_lines: number
  fully_allocated_lines: number
  partially_allocated_lines: number
  not_allocated_lines: number
  total_qty_required: number
  total_qty_allocated: number
  total_qty_available: number
  total_lps_selected: number
  coverage_percentage: number
  allocation_complete: boolean
  total_shortfall: number
}

export interface AllocationData {
  sales_order_id: string
  order_number: string
  last_updated: string
  lines: AllocationLine[]
  allocation_summary: AllocationSummary
  fefo_warning_threshold_days: number
  strategy: AllocationStrategy
  timestamp: string
}

export interface AllocateRequest {
  strategy: AllocationStrategy
  allocations: Array<{
    line_id: string
    lp_allocations: Array<{
      license_plate_id: string
      quantity: number
    }>
  }>
}

export interface AllocationResult {
  success: boolean
  sales_order_id: string
  order_number: string
  allocated_at: string
  undo_until: string
  allocation_summary: AllocationSummary
  message: string
}

export interface ReleaseResult {
  success: boolean
  sales_order_id: string
  released_allocations: number
  message: string
}

// =============================================================================
// Query Keys
// =============================================================================

export const allocationKeys = {
  all: ['allocation'] as const,
  data: (soId: string) => [...allocationKeys.all, 'data', soId] as const,
  available: (soId: string) => [...allocationKeys.all, 'available', soId] as const,
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchAllocationData(soId: string): Promise<AllocationData> {
  const response = await fetch(`/api/shipping/sales-orders/${soId}/allocation-data`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch allocation data')
  }
  return response.json()
}

async function allocateSalesOrder(
  soId: string,
  request: AllocateRequest
): Promise<AllocationResult> {
  const response = await fetch(`/api/shipping/sales-orders/${soId}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to allocate inventory')
  }

  return response.json()
}

async function releaseAllocation(
  soId: string,
  reason?: string
): Promise<ReleaseResult> {
  const response = await fetch(`/api/shipping/sales-orders/${soId}/release-allocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to release allocation')
  }

  return response.json()
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch allocation data for a sales order
 */
export function useAllocationData(
  soId: string | null
): UseQueryResult<AllocationData> {
  return useQuery({
    queryKey: allocationKeys.data(soId || ''),
    queryFn: () => fetchAllocationData(soId!),
    enabled: !!soId,
    staleTime: 60 * 1000, // 1 minute TTL
    refetchOnWindowFocus: true,
  })
}

/**
 * Allocate inventory to a sales order
 */
export function useAllocateSalesOrder(): UseMutationResult<
  AllocationResult,
  Error,
  { soId: string; request: AllocateRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ soId, request }) => allocateSalesOrder(soId, request),
    onSuccess: (_, { soId }) => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.data(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
    },
  })
}

/**
 * Release allocation from a sales order
 */
export function useReleaseAllocation(): UseMutationResult<
  ReleaseResult,
  Error,
  { soId: string; reason?: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ soId, reason }) => releaseAllocation(soId, reason),
    onSuccess: (_, { soId }) => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.data(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
    },
  })
}

/**
 * Track allocation data freshness
 */
export function useAllocationFreshness(lastUpdated: string | null) {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    if (!lastUpdated) return

    const updateSecondsAgo = () => {
      const updated = new Date(lastUpdated).getTime()
      const now = Date.now()
      setSecondsAgo(Math.floor((now - updated) / 1000))
    }

    updateSecondsAgo()
    const interval = setInterval(updateSecondsAgo, 1000)

    return () => clearInterval(interval)
  }, [lastUpdated])

  const isStale = secondsAgo > 5 * 60 // 5 minutes

  return {
    lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    secondsAgo,
    isStale,
    formattedTime: formatSecondsAgo(secondsAgo),
  }
}

/**
 * Format seconds ago into human-readable string
 */
function formatSecondsAgo(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds ago`
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
}

// =============================================================================
// Modal State Hook
// =============================================================================

export interface SelectedAllocation {
  lpId: string
  quantity: number
  checked: boolean
}

export interface AllocationModalState {
  isOpen: boolean
  strategy: AllocationStrategy
  selectedAllocations: Map<string, Map<string, SelectedAllocation>>
  isAutoAllocated: boolean
}

export function useAllocationModal(allocationData: AllocationData | null) {
  const [isOpen, setIsOpen] = useState(false)
  const [strategy, setStrategy] = useState<AllocationStrategy>('FIFO')
  const [isAutoAllocated, setIsAutoAllocated] = useState(false)

  // Map<lineId, Map<lpId, SelectedAllocation>>
  const [selectedAllocations, setSelectedAllocations] = useState<
    Map<string, Map<string, SelectedAllocation>>
  >(new Map())

  // Reset state when modal opens/closes or data changes
  useEffect(() => {
    if (allocationData) {
      setStrategy(allocationData.strategy)
      // Initialize with empty selections
      const initialSelections = new Map<string, Map<string, SelectedAllocation>>()
      allocationData.lines.forEach((line) => {
        const lpMap = new Map<string, SelectedAllocation>()
        line.available_license_plates.forEach((lp) => {
          lpMap.set(lp.license_plate_id, {
            lpId: lp.license_plate_id,
            quantity: 0,
            checked: false,
          })
        })
        initialSelections.set(line.line_id, lpMap)
      })
      setSelectedAllocations(initialSelections)
      setIsAutoAllocated(false)
    }
  }, [allocationData])

  // Toggle LP checkbox
  const toggleLpCheckbox = useCallback((lineId: string, lpId: string) => {
    setSelectedAllocations((prev) => {
      const newMap = new Map(prev)
      const lineMap = new Map(newMap.get(lineId) || new Map())
      const current = lineMap.get(lpId)
      if (current) {
        lineMap.set(lpId, { ...current, checked: !current.checked })
      }
      newMap.set(lineId, lineMap)
      return newMap
    })
  }, [])

  // Set LP quantity
  const setLpQuantity = useCallback(
    (lineId: string, lpId: string, quantity: number) => {
      setSelectedAllocations((prev) => {
        const newMap = new Map(prev)
        const lineMap = new Map(newMap.get(lineId) || new Map())
        const current = lineMap.get(lpId)
        if (current) {
          lineMap.set(lpId, { ...current, quantity, checked: quantity > 0 })
        }
        newMap.set(lineId, lineMap)
        return newMap
      })
    },
    []
  )

  // Auto-allocate based on suggestions
  const autoAllocate = useCallback(() => {
    if (!allocationData) return

    setSelectedAllocations((prev) => {
      const newMap = new Map(prev)

      allocationData.lines.forEach((line) => {
        const lineMap = new Map<string, SelectedAllocation>()
        let remainingQty = line.quantity_ordered - line.quantity_currently_allocated

        // Sort LPs by strategy
        const sortedLPs = [...line.available_license_plates].sort((a, b) => {
          if (strategy === 'FIFO') {
            return (
              new Date(a.receipt_date).getTime() -
              new Date(b.receipt_date).getTime()
            )
          } else {
            // FEFO - sort by expiry date (nulls last)
            if (!a.best_before_date) return 1
            if (!b.best_before_date) return -1
            return (
              new Date(a.best_before_date).getTime() -
              new Date(b.best_before_date).getTime()
            )
          }
        })

        sortedLPs.forEach((lp) => {
          if (remainingQty <= 0) {
            lineMap.set(lp.license_plate_id, {
              lpId: lp.license_plate_id,
              quantity: 0,
              checked: false,
            })
            return
          }

          const allocQty = Math.min(lp.available_quantity, remainingQty)
          lineMap.set(lp.license_plate_id, {
            lpId: lp.license_plate_id,
            quantity: allocQty,
            checked: allocQty > 0,
          })
          remainingQty -= allocQty
        })

        newMap.set(line.line_id, lineMap)
      })

      return newMap
    })

    setIsAutoAllocated(true)
  }, [allocationData, strategy])

  // Clear all selections
  const clearSelections = useCallback(() => {
    if (!allocationData) return

    const clearedSelections = new Map<string, Map<string, SelectedAllocation>>()
    allocationData.lines.forEach((line) => {
      const lpMap = new Map<string, SelectedAllocation>()
      line.available_license_plates.forEach((lp) => {
        lpMap.set(lp.license_plate_id, {
          lpId: lp.license_plate_id,
          quantity: 0,
          checked: false,
        })
      })
      clearedSelections.set(line.line_id, lpMap)
    })
    setSelectedAllocations(clearedSelections)
    setIsAutoAllocated(false)
  }, [allocationData])

  // Calculate summary based on current selections
  const calculatedSummary = useMemo((): AllocationSummary | null => {
    if (!allocationData) return null

    let totalQtyAllocated = 0
    let totalQtyRequired = 0
    let fullyAllocatedLines = 0
    let partiallyAllocatedLines = 0
    let notAllocatedLines = 0
    let totalLpsSelected = 0

    allocationData.lines.forEach((line) => {
      const lineSelections = selectedAllocations.get(line.line_id)
      let lineAllocated = line.quantity_currently_allocated

      if (lineSelections) {
        lineSelections.forEach((sel) => {
          if (sel.checked && sel.quantity > 0) {
            lineAllocated += sel.quantity
            totalLpsSelected++
          }
        })
      }

      totalQtyAllocated += lineAllocated
      totalQtyRequired += line.quantity_ordered

      if (lineAllocated >= line.quantity_ordered) {
        fullyAllocatedLines++
      } else if (lineAllocated > 0) {
        partiallyAllocatedLines++
      } else {
        notAllocatedLines++
      }
    })

    const coveragePercentage =
      totalQtyRequired > 0 ? (totalQtyAllocated / totalQtyRequired) * 100 : 0

    return {
      total_lines: allocationData.lines.length,
      fully_allocated_lines: fullyAllocatedLines,
      partially_allocated_lines: partiallyAllocatedLines,
      not_allocated_lines: notAllocatedLines,
      total_qty_required: totalQtyRequired,
      total_qty_allocated: totalQtyAllocated,
      total_qty_available: allocationData.allocation_summary.total_qty_available,
      total_lps_selected: totalLpsSelected,
      coverage_percentage: coveragePercentage,
      allocation_complete: coveragePercentage >= 100,
      total_shortfall: Math.max(0, totalQtyRequired - totalQtyAllocated),
    }
  }, [allocationData, selectedAllocations])

  // Build allocate request from current selections
  const buildAllocateRequest = useCallback((): AllocateRequest => {
    const allocations: AllocateRequest['allocations'] = []

    selectedAllocations.forEach((lineMap, lineId) => {
      const lpAllocations: Array<{ license_plate_id: string; quantity: number }> =
        []

      lineMap.forEach((sel) => {
        if (sel.checked && sel.quantity > 0) {
          lpAllocations.push({
            license_plate_id: sel.lpId,
            quantity: sel.quantity,
          })
        }
      })

      if (lpAllocations.length > 0) {
        allocations.push({
          line_id: lineId,
          lp_allocations: lpAllocations,
        })
      }
    })

    return {
      strategy,
      allocations,
    }
  }, [selectedAllocations, strategy])

  // Check if there are any selections
  const hasSelections = useMemo(() => {
    let count = 0
    selectedAllocations.forEach((lineMap) => {
      lineMap.forEach((sel) => {
        if (sel.checked && sel.quantity > 0) {
          count++
        }
      })
    })
    return count > 0
  }, [selectedAllocations])

  return {
    // State
    isOpen,
    strategy,
    selectedAllocations,
    isAutoAllocated,
    calculatedSummary,
    hasSelections,

    // Actions
    setIsOpen,
    setStrategy,
    toggleLpCheckbox,
    setLpQuantity,
    autoAllocate,
    clearSelections,
    buildAllocateRequest,
  }
}

export default useAllocationData
