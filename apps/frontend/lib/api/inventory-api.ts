/**
 * Inventory API Client
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 */

import type {
  InventoryGroupBy,
  InventoryFilters,
  InventoryOverviewResponse,
  InventoryByProduct,
  InventoryByLocation,
  InventoryByWarehouse,
} from '@/lib/types/inventory-overview'

// =============================================================================
// Fetch Inventory Overview
// =============================================================================

export async function fetchInventoryOverview<T extends InventoryByProduct | InventoryByLocation | InventoryByWarehouse>(
  groupBy: InventoryGroupBy,
  filters: InventoryFilters,
  page: number,
  limit: number
): Promise<InventoryOverviewResponse<T>> {
  const params = new URLSearchParams({
    groupBy,
    page: String(page),
    limit: String(limit),
    status: filters.status || 'available',
  })

  // Add optional filters
  if (filters.warehouse_id) {
    params.append('warehouse_id', filters.warehouse_id)
  }
  if (filters.location_id) {
    params.append('location_id', filters.location_id)
  }
  if (filters.product_id) {
    params.append('product_id', filters.product_id)
  }
  if (filters.search) {
    params.append('search', filters.search)
  }
  if (filters.date_from) {
    params.append('date_from', filters.date_from)
  }
  if (filters.date_to) {
    params.append('date_to', filters.date_to)
  }

  const response = await fetch(`/api/warehouse/inventory?${params}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch inventory overview')
  }

  return response.json()
}

// =============================================================================
// Export Functions
// =============================================================================

export async function exportInventoryCSV(
  groupBy: InventoryGroupBy,
  filters: InventoryFilters
): Promise<Blob> {
  const params = new URLSearchParams({
    groupBy,
    format: 'csv',
    status: filters.status || 'available',
  })

  if (filters.warehouse_id) params.append('warehouse_id', filters.warehouse_id)
  if (filters.location_id) params.append('location_id', filters.location_id)
  if (filters.product_id) params.append('product_id', filters.product_id)
  if (filters.search) params.append('search', filters.search)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)

  const response = await fetch(`/api/warehouse/inventory/export?${params}`)

  if (!response.ok) {
    throw new Error('Failed to export inventory data')
  }

  return response.blob()
}

export async function exportInventoryExcel(
  groupBy: InventoryGroupBy,
  filters: InventoryFilters
): Promise<Blob> {
  const params = new URLSearchParams({
    groupBy,
    format: 'xlsx',
    status: filters.status || 'available',
  })

  if (filters.warehouse_id) params.append('warehouse_id', filters.warehouse_id)
  if (filters.location_id) params.append('location_id', filters.location_id)
  if (filters.product_id) params.append('product_id', filters.product_id)
  if (filters.search) params.append('search', filters.search)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)

  const response = await fetch(`/api/warehouse/inventory/export?${params}`)

  if (!response.ok) {
    throw new Error('Failed to export inventory data')
  }

  return response.blob()
}

// =============================================================================
// Download Helper
// =============================================================================

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
