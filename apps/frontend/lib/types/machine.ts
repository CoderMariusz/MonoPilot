/**
 * Machine Types
 * Story: 01.10 - Machines CRUD
 * Purpose: TypeScript types and interfaces for machine management
 */

// Machine Type Enum (9 types)
export type MachineType =
  | 'MIXER'
  | 'OVEN'
  | 'FILLER'
  | 'PACKAGING'
  | 'CONVEYOR'
  | 'BLENDER'
  | 'CUTTER'
  | 'LABELER'
  | 'OTHER'

// Machine Status Enum (4 states)
export type MachineStatus = 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED'

// Machine Type Labels (for UI display)
export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  MIXER: 'Mixer',
  OVEN: 'Oven',
  FILLER: 'Filler',
  PACKAGING: 'Packaging',
  CONVEYOR: 'Conveyor',
  BLENDER: 'Blender',
  CUTTER: 'Cutter',
  LABELER: 'Labeler',
  OTHER: 'Other',
}

// Machine Type Colors (for UI badge styling)
export const MACHINE_TYPE_COLORS: Record<MachineType, { bg: string; text: string }> = {
  MIXER: { bg: 'bg-blue-100', text: 'text-blue-800' },
  OVEN: { bg: 'bg-orange-100', text: 'text-orange-800' },
  FILLER: { bg: 'bg-purple-100', text: 'text-purple-800' },
  PACKAGING: { bg: 'bg-green-100', text: 'text-green-800' },
  CONVEYOR: { bg: 'bg-gray-100', text: 'text-gray-800' },
  BLENDER: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  CUTTER: { bg: 'bg-red-100', text: 'text-red-800' },
  LABELER: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  OTHER: { bg: 'bg-slate-100', text: 'text-slate-800' },
}

// Machine Status Labels (for UI display)
export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  OFFLINE: 'Offline',
  DECOMMISSIONED: 'Decommissioned',
}

// Machine Status Colors (for UI badge styling)
export const MACHINE_STATUS_COLORS: Record<MachineStatus, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800' },
  MAINTENANCE: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  OFFLINE: { bg: 'bg-red-100', text: 'text-red-800' },
  DECOMMISSIONED: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

// Location reference (from locations table)
export interface MachineLocation {
  id: string
  code: string
  name: string
  full_path: string
  warehouse_id: string
}

// Base Machine Interface
export interface Machine {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  type: MachineType
  status: MachineStatus
  units_per_hour: number | null
  setup_time_minutes: number | null
  max_batch_size: number | null
  location_id: string | null
  location?: MachineLocation | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

// Create Machine Input
export interface CreateMachineInput {
  code: string
  name: string
  description?: string | null
  type: MachineType
  status?: MachineStatus
  units_per_hour?: number | null
  setup_time_minutes?: number | null
  max_batch_size?: number | null
  location_id?: string | null
}

// Update Machine Input
export interface UpdateMachineInput {
  code?: string
  name?: string
  description?: string | null
  type?: MachineType
  status?: MachineStatus
  units_per_hour?: number | null
  setup_time_minutes?: number | null
  max_batch_size?: number | null
  location_id?: string | null
}

// Machine List Parameters
export interface MachineListParams {
  search?: string
  type?: MachineType
  status?: MachineStatus
  location_id?: string
  sortBy?: 'code' | 'name' | 'type' | 'status' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Paginated Result
export interface PaginatedMachineResult {
  machines: Machine[]
  total: number
  page: number
  limit: number
}

// Validation Result
export interface MachineValidationResult {
  isUnique: boolean
  message?: string
}

// Can Delete Result
export interface CanDeleteMachineResult {
  canDelete: boolean
  reason?: string
  lineCodes?: string[]
}
