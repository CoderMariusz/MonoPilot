/**
 * WO Materials Service - Story 03.11a
 *
 * Client-side service for WO materials API:
 * - getWOMaterials: Fetch materials for a Work Order
 * - refreshSnapshot: Refresh BOM snapshot for a Work Order
 * - canModifySnapshot: Check if WO snapshot can be modified
 *
 * @module lib/services/wo-materials-service
 */

import type {
  WOMaterialsListResponse,
  CreateSnapshotResponse,
} from '@/lib/types/wo-materials'

const API_BASE = '/api/planning/work-orders'

/**
 * Get all materials for a Work Order (BOM snapshot)
 *
 * @param woId - UUID of the Work Order
 * @returns Materials list with summary info
 * @throws Error if WO not found or request fails
 *
 * @example
 * ```ts
 * const { materials, total, bom_version } = await getWOMaterials('wo-uuid')
 * console.log(`${total} materials from BOM v${bom_version}`)
 * ```
 */
export async function getWOMaterials(
  woId: string
): Promise<WOMaterialsListResponse> {
  const response = await fetch(`${API_BASE}/${woId}/materials`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Work order not found')
    }
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch WO materials')
  }

  const data: WOMaterialsListResponse = await response.json()

  // Ensure materials are sorted by sequence
  data.materials.sort((a, b) => a.sequence - b.sequence)

  return data
}

/**
 * Refresh BOM snapshot for a Work Order
 *
 * Deletes existing wo_materials and recreates from current BOM.
 * Only allowed for draft/planned WOs.
 *
 * @param woId - UUID of the Work Order
 * @returns Snapshot creation result
 * @throws Error if WO not found, is released, or has no BOM
 *
 * @example
 * ```ts
 * const { success, materials_count, message } = await refreshSnapshot('wo-uuid')
 * console.log(message) // "Snapshot created with 10 materials"
 * ```
 */
export async function refreshSnapshot(
  woId: string
): Promise<CreateSnapshotResponse> {
  const response = await fetch(`${API_BASE}/${woId}/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()

    // Map error codes to user-friendly messages
    if (response.status === 404) {
      throw new Error('Work order not found')
    }
    if (response.status === 400) {
      throw new Error('Work order has no BOM selected')
    }
    if (response.status === 409) {
      throw new Error('Cannot modify materials after WO is released')
    }
    if (response.status === 403) {
      throw new Error('Permission denied')
    }

    throw new Error(error.error || 'Failed to refresh snapshot')
  }

  return response.json()
}

/**
 * Check if WO snapshot can be modified
 *
 * Only draft and planned WOs allow snapshot modification.
 *
 * @param woStatus - Current WO status
 * @returns true if snapshot can be modified
 *
 * @example
 * ```ts
 * if (canModifySnapshot(wo.status)) {
 *   // Show refresh button
 * }
 * ```
 */
export function canModifySnapshot(woStatus: string): boolean {
  return ['draft', 'planned'].includes(woStatus)
}
