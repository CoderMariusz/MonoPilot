/**
 * React Query Hook: useTransferOrder
 * Story 03.8: Transfer Orders CRUD + Lines
 *
 * Fetches single transfer order with lines
 */

import { useQuery } from '@tanstack/react-query'
import type { TransferOrderWithLines } from '@/lib/types/transfer-order'
import { transferOrderKeys } from './use-transfer-orders'

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch single transfer order with lines
 */
async function fetchTransferOrder(id: string): Promise<TransferOrderWithLines> {
  const response = await fetch(`/api/planning/transfer-orders/${id}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 404) {
      throw new Error('Transfer Order not found')
    }
    throw new Error(error.error || 'Failed to fetch transfer order')
  }

  const data = await response.json()
  const to = data.transfer_order || data.data || data

  // Transform lines if needed
  const lines = (to.lines || []).map((line: any) => ({
    id: line.id,
    to_id: line.transfer_order_id || line.to_id,
    line_number: line.line_number || 0,
    product_id: line.product_id,
    quantity: line.quantity,
    uom: line.uom,
    shipped_qty: line.shipped_qty || 0,
    received_qty: line.received_qty || 0,
    notes: line.notes,
    created_at: line.created_at,
    updated_at: line.updated_at,
    product: line.product || {
      id: line.product_id,
      code: '',
      name: 'Unknown',
      base_uom: line.uom,
    },
  }))

  return {
    id: to.id,
    org_id: to.org_id,
    to_number: to.to_number,
    from_warehouse_id: to.from_warehouse_id,
    to_warehouse_id: to.to_warehouse_id,
    planned_ship_date: to.planned_ship_date,
    planned_receive_date: to.planned_receive_date,
    actual_ship_date: to.actual_ship_date,
    actual_receive_date: to.actual_receive_date,
    status: to.status,
    priority: to.priority || 'normal',
    notes: to.notes,
    shipped_by: to.shipped_by,
    received_by: to.received_by,
    created_at: to.created_at,
    updated_at: to.updated_at,
    created_by: to.created_by,
    updated_by: to.updated_by,
    from_warehouse: to.from_warehouse || {
      id: to.from_warehouse_id,
      code: '',
      name: 'Unknown',
    },
    to_warehouse: to.to_warehouse || {
      id: to.to_warehouse_id,
      code: '',
      name: 'Unknown',
    },
    lines,
    created_by_user: to.created_by_user,
    shipped_by_user: to.shipped_by_user,
    received_by_user: to.received_by_user,
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch single transfer order with lines
 */
export function useTransferOrder(id: string | undefined) {
  return useQuery({
    queryKey: transferOrderKeys.detail(id || ''),
    queryFn: () => fetchTransferOrder(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export default useTransferOrder
