/**
 * Stock Adjustments API Client
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

import type {
  AdjustmentFilters,
  AdjustmentsResponse,
  AdjustmentResponse,
  CreateAdjustmentInput,
  ApproveAdjustmentInput,
  RejectAdjustmentInput,
} from '@/lib/types/adjustment'

const API_BASE = '/api/warehouse/inventory/adjustments'

/**
 * Fetches adjustments with pagination and filters
 */
export async function fetchAdjustments(
  filters: AdjustmentFilters,
  page: number,
  limit: number
): Promise<AdjustmentsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status)
  }
  if (filters.reason) {
    params.append('reason', filters.reason)
  }
  if (filters.adjusted_by) {
    params.append('adjusted_by', filters.adjusted_by)
  }
  if (filters.warehouse_id) {
    params.append('warehouse_id', filters.warehouse_id)
  }
  if (filters.date_from) {
    params.append('date_from', filters.date_from)
  }
  if (filters.date_to) {
    params.append('date_to', filters.date_to)
  }

  const response = await fetch(`${API_BASE}?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch adjustments' }))
    throw new Error(error.message || 'Failed to fetch adjustments')
  }

  return response.json()
}

/**
 * Fetches a single adjustment by ID
 */
export async function fetchAdjustment(id: string): Promise<AdjustmentResponse> {
  const response = await fetch(`${API_BASE}/${id}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch adjustment' }))
    throw new Error(error.message || 'Failed to fetch adjustment')
  }

  return response.json()
}

/**
 * Creates a new stock adjustment
 */
export async function createAdjustment(
  input: CreateAdjustmentInput
): Promise<AdjustmentResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create adjustment' }))
    throw new Error(error.message || 'Failed to create adjustment')
  }

  return response.json()
}

/**
 * Approves a pending adjustment
 */
export async function approveAdjustment(
  id: string,
  input?: ApproveAdjustmentInput
): Promise<AdjustmentResponse> {
  const response = await fetch(`${API_BASE}/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input || {}),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to approve adjustment' }))
    throw new Error(error.message || 'Failed to approve adjustment')
  }

  return response.json()
}

/**
 * Rejects a pending adjustment
 */
export async function rejectAdjustment(
  id: string,
  input: RejectAdjustmentInput
): Promise<AdjustmentResponse> {
  const response = await fetch(`${API_BASE}/${id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to reject adjustment' }))
    throw new Error(error.message || 'Failed to reject adjustment')
  }

  return response.json()
}

/**
 * Reverses an approved adjustment (creates a reverse adjustment)
 */
export async function reverseAdjustment(
  id: string,
  reason: string
): Promise<AdjustmentResponse> {
  const response = await fetch(`${API_BASE}/${id}/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to reverse adjustment' }))
    throw new Error(error.message || 'Failed to reverse adjustment')
  }

  return response.json()
}

/**
 * Exports adjustments list
 */
export async function exportAdjustments(
  filters: AdjustmentFilters,
  format: 'csv' | 'excel' = 'csv'
): Promise<Blob> {
  const params = new URLSearchParams({ format })

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status)
  }
  if (filters.reason) {
    params.append('reason', filters.reason)
  }
  if (filters.date_from) {
    params.append('date_from', filters.date_from)
  }
  if (filters.date_to) {
    params.append('date_to', filters.date_to)
  }

  const response = await fetch(`${API_BASE}/export?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to export adjustments' }))
    throw new Error(error.message || 'Failed to export adjustments')
  }

  return response.blob()
}
