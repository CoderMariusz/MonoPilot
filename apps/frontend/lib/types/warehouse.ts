/**
 * Warehouse Types
 * Story: 01.8 - Warehouses CRUD
 * Purpose: TypeScript types and interfaces for warehouse management
 */

// Warehouse Type Enum
export type WarehouseType =
  | 'GENERAL'
  | 'RAW_MATERIALS'
  | 'WIP'
  | 'FINISHED_GOODS'
  | 'QUARANTINE'

// Warehouse Type Labels (for UI display)
export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  GENERAL: 'General',
  RAW_MATERIALS: 'Raw Materials',
  WIP: 'WIP (Work in Progress)',
  FINISHED_GOODS: 'Finished Goods',
  QUARANTINE: 'Quarantine',
}

// Warehouse Type Descriptions (for tooltips/help text)
export const WAREHOUSE_TYPE_DESCRIPTIONS: Record<WarehouseType, string> = {
  GENERAL: 'Multi-purpose storage for all product types',
  RAW_MATERIALS: 'Storage for incoming raw materials and ingredients',
  WIP: 'Work-in-progress inventory during production',
  FINISHED_GOODS: 'Completed products ready for shipping',
  QUARANTINE: 'Isolated storage for quality hold or rejected items',
}

// Warehouse Type Colors (for UI badge/tag styling)
export const WAREHOUSE_TYPE_COLORS: Record<WarehouseType, { bg: string; text: string }> = {
  GENERAL: { bg: 'bg-blue-100', text: 'text-blue-800' },
  RAW_MATERIALS: { bg: 'bg-green-100', text: 'text-green-800' },
  WIP: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  FINISHED_GOODS: { bg: 'bg-purple-100', text: 'text-purple-800' },
  QUARANTINE: { bg: 'bg-red-100', text: 'text-red-800' },
}

// Base Warehouse Interface
export interface Warehouse {
  id: string
  org_id: string
  code: string
  name: string
  type: WarehouseType
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  is_default: boolean
  is_active: boolean
  location_count: number
  disabled_at: string | null
  disabled_by: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

// Create Warehouse Input
export interface CreateWarehouseInput {
  code: string
  name: string
  type: WarehouseType
  address?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  is_active?: boolean
}

// Update Warehouse Input
export interface UpdateWarehouseInput {
  code?: string
  name?: string
  type?: WarehouseType
  address?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  is_active?: boolean
}

// Warehouse List Parameters
export interface WarehouseListParams {
  search?: string
  type?: WarehouseType
  status?: 'active' | 'disabled'
  sort?: 'code' | 'name' | 'type' | 'location_count' | 'created_at'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Paginated Result
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Validation Result
export interface ValidationResult {
  available: boolean
  message?: string
}

// Can Disable Result
export interface CanDisableResult {
  allowed: boolean
  reason?: string
}
