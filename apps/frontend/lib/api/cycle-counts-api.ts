/**
 * Cycle Counts API Client
 * Wireframe: WH-INV-001 - Cycle Counts Tab (Screen 5)
 * PRD: FR-023 (Cycle Count)
 */

import type {
  CycleCountFilters,
  CycleCountsResponse,
  CycleCountResponse,
  CreateCycleCountInput,
  UpdateCycleCountInput,
} from '@/lib/types/cycle-count'

const API_BASE = '/api/warehouse/cycle-counts'

/**
 * Fetches cycle counts with pagination and filters
 */
export async function fetchCycleCounts(
  filters: CycleCountFilters,
  page: number,
  limit: number
): Promise<CycleCountsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status)
  }
  if (filters.warehouse_id) {
    params.append('warehouse_id', filters.warehouse_id)
  }
  if (filters.type) {
    params.append('type', filters.type)
  }
  if (filters.date_from) {
    params.append('date_from', filters.date_from)
  }
  if (filters.date_to) {
    params.append('date_to', filters.date_to)
  }

  const response = await fetch(`${API_BASE}?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch cycle counts' }))
    throw new Error(error.message || 'Failed to fetch cycle counts')
  }

  return response.json()
}

/**
 * Fetches a single cycle count by ID
 */
export async function fetchCycleCount(id: string): Promise<CycleCountResponse> {
  const response = await fetch(`${API_BASE}/${id}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch cycle count' }))
    throw new Error(error.message || 'Failed to fetch cycle count')
  }

  return response.json()
}

/**
 * Creates a new cycle count
 */
export async function createCycleCount(
  input: CreateCycleCountInput
): Promise<CycleCountResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create cycle count' }))
    throw new Error(error.message || 'Failed to create cycle count')
  }

  return response.json()
}

/**
 * Updates a cycle count
 */
export async function updateCycleCount(
  id: string,
  input: UpdateCycleCountInput
): Promise<CycleCountResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update cycle count' }))
    throw new Error(error.message || 'Failed to update cycle count')
  }

  return response.json()
}

/**
 * Starts a cycle count (changes status to in_progress)
 */
export async function startCycleCount(id: string): Promise<CycleCountResponse> {
  const response = await fetch(`${API_BASE}/${id}/start`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to start cycle count' }))
    throw new Error(error.message || 'Failed to start cycle count')
  }

  return response.json()
}

/**
 * Completes a cycle count
 */
export async function completeCycleCount(id: string): Promise<CycleCountResponse> {
  const response = await fetch(`${API_BASE}/${id}/complete`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to complete cycle count' }))
    throw new Error(error.message || 'Failed to complete cycle count')
  }

  return response.json()
}

/**
 * Cancels a cycle count
 */
export async function cancelCycleCount(id: string): Promise<CycleCountResponse> {
  const response = await fetch(`${API_BASE}/${id}/cancel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to cancel cycle count' }))
    throw new Error(error.message || 'Failed to cancel cycle count')
  }

  return response.json()
}

/**
 * Exports cycle count sheet as PDF
 */
export async function exportCycleCountSheet(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/${id}/export`, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to export cycle count sheet' }))
    throw new Error(error.message || 'Failed to export cycle count sheet')
  }

  return response.blob()
}
