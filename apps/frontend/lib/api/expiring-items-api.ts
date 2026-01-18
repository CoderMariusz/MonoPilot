/**
 * API Client: Expiring Items
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Client-side API functions for expiring inventory operations
 */

import type {
  ExpiringPaginatedResponse,
  ExpiryTier,
  BulkExpiryAction,
} from '@/lib/validation/expiry-alert-schema'

export interface ExpiryFilters {
  warehouse_id?: string
  location_id?: string
  product_id?: string
}

/**
 * Fetch expiring items with pagination and filters
 */
export async function fetchExpiringItems(
  days: number,
  tier: ExpiryTier | 'all',
  filters: ExpiryFilters,
  page: number,
  limit: number
): Promise<ExpiringPaginatedResponse> {
  const params = new URLSearchParams({
    days: String(days),
    tier,
    page: String(page),
    limit: String(limit),
  })

  if (filters.warehouse_id) {
    params.append('warehouse_id', filters.warehouse_id)
  }
  if (filters.location_id) {
    params.append('location_id', filters.location_id)
  }
  if (filters.product_id) {
    params.append('product_id', filters.product_id)
  }

  const response = await fetch(`/api/warehouse/inventory/expiring?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch expiring items' }))
    throw new Error(error.error || 'Failed to fetch expiring items')
  }

  return response.json()
}

/**
 * Execute bulk action on selected LPs
 */
export async function executeBulkAction(
  action: BulkExpiryAction['action'],
  lpIds: string[]
): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/warehouse/inventory/expiring/bulk-actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, lp_ids: lpIds }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Bulk action failed' }))
    throw new Error(error.error || 'Bulk action failed')
  }

  return response.json()
}

/**
 * Export expiring items to CSV
 */
export async function exportExpiringToCSV(days: number): Promise<void> {
  const response = await fetch(`/api/warehouse/inventory/expiring/export?days=${days}`)

  if (!response.ok) {
    throw new Error('Export failed')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expiring-inventory-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
