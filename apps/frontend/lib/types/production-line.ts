/**
 * Production Line Types
 * Story: 01.11 - Production Lines CRUD
 * Purpose: TypeScript types and interfaces for production line management
 */

import type { Warehouse } from './warehouse'
import type { MachineStatus } from './machine'

// Production Line Status Enum (4 states)
export type ProductionLineStatus = 'active' | 'maintenance' | 'inactive' | 'setup'

// Production Line Status Labels (for UI display)
export const PRODUCTION_LINE_STATUS_LABELS: Record<ProductionLineStatus, string> = {
  active: 'Active',
  maintenance: 'Maintenance',
  inactive: 'Inactive',
  setup: 'Setup',
}

// Production Line Status Colors (for UI badge styling)
export const PRODUCTION_LINE_STATUS_COLORS: Record<
  ProductionLineStatus,
  { bg: string; text: string }
> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  setup: { bg: 'bg-blue-100', text: 'text-blue-800' },
}

// Line Machine (simplified machine data for line context)
export interface LineMachine {
  id: string
  code: string
  name: string
  status: MachineStatus
  capacity_per_hour: number | null
  sequence_order: number
}

// Product (simplified for compatibility selection)
export interface Product {
  id: string
  code: string
  name: string
  category?: string | null
}

// Base Production Line Interface
export interface ProductionLine {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  warehouse_id: string
  warehouse?: Warehouse
  default_output_location_id: string | null
  status: ProductionLineStatus
  calculated_capacity: number | null
  bottleneck_machine_id: string | null
  bottleneck_machine_code: string | null
  machines: LineMachine[]
  compatible_products: Product[]
  created_at: string
  updated_at: string
}

// Create Production Line Input
export interface CreateProductionLineInput {
  code: string
  name: string
  description?: string | null
  warehouse_id: string
  default_output_location_id?: string | null
  status?: ProductionLineStatus
  machine_ids?: string[]
  product_ids?: string[]
}

// Update Production Line Input
export interface UpdateProductionLineInput {
  code?: string
  name?: string
  description?: string | null
  warehouse_id?: string
  default_output_location_id?: string | null
  status?: ProductionLineStatus
  machine_ids?: string[]
  product_ids?: string[]
}

// Machine Reorder Input
export interface ReorderMachinesInput {
  machine_sequences: Array<{ machine_id: string; sequence_order: number }>
}

// Product Compatibility Input
export interface UpdateProductCompatibilityInput {
  product_ids: string[]
}

// Production Line List Parameters
export interface ProductionLineListParams {
  search?: string
  warehouse_id?: string
  status?: ProductionLineStatus
  sortBy?: 'code' | 'name' | 'warehouse' | 'capacity' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Paginated Result
export interface PaginatedProductionLineResult {
  lines: ProductionLine[]
  total: number
  page: number
  limit: number
}

// Validation Result
export interface ProductionLineValidationResult {
  isUnique: boolean
  message?: string
}

// Can Delete Result
export interface CanDeleteProductionLineResult {
  canDelete: boolean
  reason?: string
  workOrderCodes?: string[]
}

// Capacity calculation result
export interface CapacityResult {
  capacity: number | null
  bottleneck_machine_id: string | null
  bottleneck_machine_code: string | null
  machines_without_capacity: string[]
}

// Machine order for reordering
export interface MachineOrder {
  machine_id: string
  sequence_order: number
}
