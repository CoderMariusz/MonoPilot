/**
 * Machine Validation Schemas
 * Story: 1.7 Machine Configuration
 * AC-006.1, AC-006.6: Client-side and server-side validation
 */

import { z } from 'zod'

// Machine Status Enum
export const machineStatusEnum = z.enum(['active', 'down', 'maintenance'])
export type MachineStatus = z.infer<typeof machineStatusEnum>

// Create Machine Schema
// AC-006.1: Admin może stworzyć machine
export const createMachineSchema = z.object({
  code: z
    .string()
    .min(2, 'Machine code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z
    .string()
    .min(1, 'Machine name is required')
    .max(100, 'Name must be 100 characters or less'),
  status: machineStatusEnum.default('active'),
  capacity_per_hour: z
    .number()
    .positive('Capacity must be a positive number')
    .optional()
    .nullable(),
  line_ids: z
    .array(z.string().uuid('Invalid line ID format'))
    .optional()
    .default([]),
})

// Update Machine Schema
// AC-006.6: Edit machine
export const updateMachineSchema = z.object({
  code: z
    .string()
    .min(2, 'Machine code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  name: z
    .string()
    .min(1, 'Machine name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  status: machineStatusEnum.optional(),
  capacity_per_hour: z
    .number()
    .positive('Capacity must be a positive number')
    .optional()
    .nullable(),
  line_ids: z
    .array(z.string().uuid('Invalid line ID format'))
    .optional(),
})

// TypeScript types
export type CreateMachineInput = z.infer<typeof createMachineSchema>
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>

// Machine Filters Schema
// AC-006.4: Machines list view with filters
export const machineFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'down', 'maintenance', 'all']).optional(),
  sort_by: z.enum(['code', 'name', 'status', 'created_at']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

// Machine Filters (for list page)
export interface MachineFilters {
  search?: string
  status?: 'active' | 'down' | 'maintenance' | 'all'
  sort_by?: 'code' | 'name' | 'status' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

// Machine Type
export interface Machine {
  id: string
  code: string
  name: string
  status: MachineStatus
  capacity_per_hour: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  org_id: string
  // Joined line objects (when queried with joins)
  assigned_lines?: Array<{
    id: string
    code: string
    name: string
  }>
}
