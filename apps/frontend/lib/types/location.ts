/**
 * Location TypeScript Types
 * Story: 01.9 - Warehouse Locations Management
 * Purpose: Hierarchical location types for tree structure
 */

// =============================================================================
// ENUMS
// =============================================================================

export type LocationLevel = 'zone' | 'aisle' | 'rack' | 'bin'

export type LocationType = 'bulk' | 'pallet' | 'shelf' | 'floor' | 'staging'

// Location Type Labels (for UI display)
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  bulk: 'Bulk Storage',
  pallet: 'Pallet',
  shelf: 'Shelf',
  floor: 'Floor',
  staging: 'Staging',
}

// Location Type Descriptions (for tooltips/help text)
export const LOCATION_TYPE_DESCRIPTIONS: Record<LocationType, string> = {
  bulk: 'Large capacity storage for bulk items',
  pallet: 'Standard pallet rack storage',
  shelf: 'Shelving unit for smaller items',
  floor: 'Floor-level storage area',
  staging: 'Temporary staging area for in/out processing',
}

// Location Level Labels (for UI display)
export const LOCATION_LEVEL_LABELS: Record<LocationLevel, string> = {
  zone: 'Zone',
  aisle: 'Aisle',
  rack: 'Rack',
  bin: 'Bin',
}

// Location Level Colors (for UI badge styling)
export const LOCATION_LEVEL_COLORS: Record<LocationLevel, { bg: string; text: string }> = {
  zone: { bg: 'bg-blue-100', text: 'text-blue-800' },
  aisle: { bg: 'bg-green-100', text: 'text-green-800' },
  rack: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  bin: { bg: 'bg-purple-100', text: 'text-purple-800' },
}

// =============================================================================
// CORE TYPES
// =============================================================================

export interface Location {
  id: string
  org_id: string
  warehouse_id: string
  parent_id: string | null
  code: string
  name: string
  description: string | null
  level: LocationLevel
  full_path: string
  depth: number
  location_type: LocationType
  max_pallets: number | null
  max_weight_kg: number | null
  current_pallets: number
  current_weight_kg: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface LocationNode extends Location {
  children: LocationNode[]
  children_count: number
  capacity_percent: number | null
}

export interface LocationTreeResponse {
  locations: LocationNode[]
  total_count: number
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateLocationInput {
  code: string
  name: string
  description?: string
  parent_id?: string | null
  level: LocationLevel
  location_type?: LocationType
  max_pallets?: number | null
  max_weight_kg?: number | null
  is_active?: boolean
}

export interface UpdateLocationInput {
  name?: string
  description?: string
  location_type?: LocationType
  max_pallets?: number | null
  max_weight_kg?: number | null
  is_active?: boolean
}

export interface LocationListParams {
  view?: 'tree' | 'flat'
  level?: LocationLevel
  type?: LocationType
  parent_id?: string | null
  search?: string
  include_capacity?: boolean
}

// =============================================================================
// SERVICE RESPONSE TYPES
// =============================================================================

export interface CanDeleteResult {
  can: boolean
  reason?: 'HAS_CHILDREN' | 'HAS_INVENTORY'
  count?: number
}
