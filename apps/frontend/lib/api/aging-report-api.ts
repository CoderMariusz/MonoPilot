/**
 * Aging Report API Client
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Client-side API functions for aging report data fetching
 */

import type {
  AgingReportResponse,
  OldestStockItem,
} from '@/lib/services/aging-report-service'

/**
 * Aging report filters
 */
export interface AgingFilters {
  warehouse_id?: string
  product_category_id?: string
}

/**
 * Fetch aging report with FIFO or FEFO mode
 */
export async function fetchAgingReport(
  mode: 'fifo' | 'fefo',
  filters: AgingFilters,
  limit: number = 50
): Promise<AgingReportResponse> {
  const params = new URLSearchParams({
    mode,
    limit: String(limit),
  })

  if (filters.warehouse_id) {
    params.append('warehouse_id', filters.warehouse_id)
  }

  if (filters.product_category_id) {
    params.append('product_category_id', filters.product_category_id)
  }

  const response = await fetch(`/api/warehouse/inventory/aging?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to fetch aging report')
  }

  return response.json()
}

/**
 * Fetch top oldest stock items
 */
export async function fetchTopOldestStock(
  mode: 'fifo' | 'fefo',
  limit: number = 10
): Promise<OldestStockItem[]> {
  const params = new URLSearchParams({
    mode,
    limit: String(limit),
  })

  const response = await fetch(`/api/warehouse/inventory/aging/top-oldest?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to fetch top oldest stock')
  }

  return response.json()
}

/**
 * Export aging report to CSV
 */
export async function exportAgingReportCSV(
  mode: 'fifo' | 'fefo',
  filters: AgingFilters
): Promise<Blob> {
  const params = new URLSearchParams({
    mode,
    format: 'csv',
  })

  if (filters.warehouse_id) {
    params.append('warehouse_id', filters.warehouse_id)
  }

  if (filters.product_category_id) {
    params.append('product_category_id', filters.product_category_id)
  }

  const response = await fetch(`/api/warehouse/inventory/aging/export?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to export aging report')
  }

  return response.blob()
}

/**
 * Download helper function
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
