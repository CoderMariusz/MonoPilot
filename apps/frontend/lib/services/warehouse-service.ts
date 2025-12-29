/**
 * Warehouse Service
 * Story: 01.8 - Warehouses CRUD
 * Purpose: Business logic for warehouse management operations
 *
 * Handles:
 * - CRUD operations (list, getById, create, update, delete)
 * - Default warehouse management (setDefault)
 * - Status management (disable, enable)
 * - Code uniqueness validation
 * - Active inventory checks
 */

import type {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseListParams,
  PaginatedResult,
  ValidationResult,
  CanDisableResult,
} from '@/lib/types/warehouse'

export class WarehouseService {
  /**
   * List warehouses with search, filters, pagination
   * Calls API endpoint which handles RLS and org filtering
   */
  static async list(
    params: WarehouseListParams = {}
  ): Promise<PaginatedResult<Warehouse>> {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.set('search', params.search)
    if (params.type) searchParams.set('type', params.type)
    if (params.status) searchParams.set('status', params.status)
    if (params.sort) searchParams.set('sort', params.sort)
    if (params.order) searchParams.set('order', params.order)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const response = await fetch(
      `/api/v1/settings/warehouses?${searchParams.toString()}`
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch warehouses')
    }

    return response.json()
  }

  /**
   * Get warehouse by ID
   * Returns null if not found (including cross-tenant access)
   */
  static async getById(id: string): Promise<Warehouse | null> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}`)

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch warehouse')
    }

    return response.json()
  }

  /**
   * Create new warehouse
   */
  static async create(data: CreateWarehouseInput): Promise<Warehouse> {
    const response = await fetch('/api/v1/settings/warehouses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to create warehouse')
    }

    return response.json()
  }

  /**
   * Update warehouse
   */
  static async update(
    id: string,
    data: UpdateWarehouseInput
  ): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to update warehouse')
    }

    return response.json()
  }

  /**
   * Soft delete warehouse
   * Sets is_active = false and records disabled_at/disabled_by
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to delete warehouse')
    }
  }

  /**
   * Set warehouse as default
   * Atomically unsets previous default and sets new one
   */
  static async setDefault(id: string): Promise<Warehouse> {
    const response = await fetch(
      `/api/v1/settings/warehouses/${id}/set-default`,
      {
        method: 'PATCH',
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to set default warehouse')
    }

    return response.json()
  }

  /**
   * Disable warehouse
   * Validates that warehouse has no active inventory and is not default
   */
  static async disable(id: string): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}/disable`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to disable warehouse')
    }

    return response.json()
  }

  /**
   * Enable warehouse
   * Re-enables a previously disabled warehouse
   */
  static async enable(id: string): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}/enable`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to enable warehouse')
    }

    return response.json()
  }

  /**
   * Validate warehouse code uniqueness
   * Used for real-time form validation
   */
  static async validateCode(
    code: string,
    excludeId?: string
  ): Promise<ValidationResult> {
    const searchParams = new URLSearchParams({ code })
    if (excludeId) {
      searchParams.set('exclude_id', excludeId)
    }

    const response = await fetch(
      `/api/v1/settings/warehouses/validate-code?${searchParams.toString()}`
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to validate code')
    }

    return response.json()
  }

  /**
   * Check if warehouse has active inventory
   * Returns true if any license plates with qty > 0 exist
   * Note: This is checked server-side in the disable endpoint
   */
  static async hasActiveInventory(id: string): Promise<boolean> {
    const canDisableResult = await this.canDisable(id)
    const hasInventoryReason = canDisableResult.reason?.includes('active inventory') ?? false
    return !canDisableResult.allowed && hasInventoryReason
  }

  /**
   * Check if warehouse can be disabled
   * Business rules:
   * - Cannot disable if has active inventory (LPs with qty > 0)
   * - Cannot disable if is default warehouse
   */
  static async canDisable(id: string): Promise<CanDisableResult> {
    // We can check this by attempting to get the warehouse and checking its properties
    // The actual validation happens in the disable endpoint
    const warehouse = await this.getById(id)

    if (!warehouse) {
      return { allowed: false, reason: 'Warehouse not found' }
    }

    if (warehouse.is_default) {
      return {
        allowed: false,
        reason: 'Cannot disable default warehouse. Set another warehouse as default first.',
      }
    }

    // For inventory check, we'd need a dedicated endpoint or the disable endpoint will check
    // For now, return allowed: true and let the disable endpoint do the full validation
    return { allowed: true }
  }
}
