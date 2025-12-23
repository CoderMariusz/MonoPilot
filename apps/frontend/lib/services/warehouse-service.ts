/**
 * Warehouse Service
 * Story: 01.8 - Warehouses CRUD
 * Purpose: Business logic for warehouse management operations
 *
 * Handles:
 * - CRUD operations (list, getById, create, update)
 * - Set default warehouse (atomic operation)
 * - Disable/enable warehouse with business rules
 * - Code validation and active inventory checks
 * - Search, filter, pagination functionality
 */

import { createClient } from '@/lib/supabase/client'
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseListParams,
  Warehouse,
  PaginatedResult,
  ValidationResult,
  CanDisableResult,
} from '@/lib/types/warehouse'

export class WarehouseService {
  /**
   * List warehouses with search, filters, pagination
   * AC-01: Page loads within 300ms with 20 per page
   * AC-01: Search by code/name (200ms)
   * AC-01: Filter by type (5 types)
   * AC-01: Filter by status (active/disabled)
   * AC-01: Sort by name (asc/desc)
   */
  static async list(params: WarehouseListParams = {}): Promise<PaginatedResult<Warehouse>> {
    const queryParams = new URLSearchParams()

    // Add pagination params
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.limit) queryParams.set('limit', params.limit.toString())

    // Add search param
    if (params.search) queryParams.set('search', params.search)

    // Add filter params
    if (params.type) queryParams.set('type', params.type)
    if (params.status) queryParams.set('status', params.status)

    // Add sort params
    if (params.sort) queryParams.set('sort', params.sort)
    if (params.order) queryParams.set('order', params.order)

    const response = await fetch(`/api/v1/settings/warehouses?${queryParams.toString()}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to fetch warehouses')
    }

    return response.json()
  }

  /**
   * Get warehouse by ID
   * AC-09: Cross-tenant access returns 404 (not 403)
   */
  static async getById(id: string): Promise<Warehouse | null> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to fetch warehouse')
    }

    return response.json()
  }

  /**
   * Create new warehouse
   * AC-02: Code uniqueness validation
   * AC-02: Code format validation
   * AC-02: Create warehouse with required fields
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
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to create warehouse')
    }

    return response.json()
  }

  /**
   * Update existing warehouse
   * AC-06: Edit warehouse
   * AC-06: Code immutability with inventory
   */
  static async update(id: string, data: UpdateWarehouseInput): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to update warehouse')
    }

    return response.json()
  }

  /**
   * Set warehouse as default (atomic operation)
   * AC-05: Set default warehouse
   * Trigger ensures only one default per org
   */
  static async setDefault(id: string): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}/set-default`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to set default warehouse')
    }

    return response.json()
  }

  /**
   * Disable warehouse (with business rules)
   * AC-07: Disable warehouse
   * Business Rules:
   * - Cannot disable with active inventory
   * - Cannot disable default warehouse
   */
  static async disable(id: string): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}/disable`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to disable warehouse')
    }

    return response.json()
  }

  /**
   * Enable warehouse
   * AC-07: Enable warehouse
   */
  static async enable(id: string): Promise<Warehouse> {
    const response = await fetch(`/api/v1/settings/warehouses/${id}/enable`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to enable warehouse')
    }

    return response.json()
  }

  /**
   * Validate warehouse code uniqueness
   * Used for real-time validation in forms
   */
  static async validateCode(code: string, excludeId?: string): Promise<ValidationResult> {
    const queryParams = new URLSearchParams({ code })
    if (excludeId) queryParams.set('exclude_id', excludeId)

    const response = await fetch(`/api/v1/settings/warehouses/validate-code?${queryParams.toString()}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'Failed to validate code')
    }

    return response.json()
  }

  /**
   * Check if warehouse has active inventory
   * Used to enforce business rules (cannot disable with inventory)
   */
  static async hasActiveInventory(id: string): Promise<boolean> {
    const supabase = createClient()

    const { count, error } = await supabase
      .from('license_plates')
      .select('*', { count: 'exact', head: true })
      .eq('warehouse_id', id)
      .gt('quantity', 0)

    if (error) {
      console.error('Failed to check active inventory:', error)
      return false
    }

    return (count ?? 0) > 0
  }

  /**
   * Check if warehouse can be disabled
   * Business Rules:
   * - Not default warehouse
   * - No active inventory
   */
  static async canDisable(id: string): Promise<CanDisableResult> {
    const warehouse = await this.getById(id)

    if (!warehouse) {
      return {
        allowed: false,
        reason: 'Warehouse not found',
      }
    }

    if (warehouse.is_default) {
      return {
        allowed: false,
        reason: 'Cannot disable default warehouse',
      }
    }

    const hasInventory = await this.hasActiveInventory(id)

    if (hasInventory) {
      return {
        allowed: false,
        reason: 'Cannot disable warehouse with active inventory',
      }
    }

    return {
      allowed: true,
    }
  }
}
