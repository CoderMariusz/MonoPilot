/**
 * Machine Validation Schemas
 * Story: 01.10 - Machines CRUD
 * Purpose: Zod schemas for machine validation
 */

import { z } from 'zod'

// Machine Type Enum
export const machineTypeEnum = z.enum([
  'MIXER',
  'OVEN',
  'FILLER',
  'PACKAGING',
  'CONVEYOR',
  'BLENDER',
  'CUTTER',
  'LABELER',
  'OTHER',
])

// Machine Status Enum
export const machineStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'OFFLINE', 'DECOMMISSIONED'])

// Create Machine Schema
export const machineCreateSchema = z.object({
  code: z
    .string()
    .min(1, 'Machine code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(1, 'Machine name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  type: machineTypeEnum,
  status: machineStatusEnum.default('ACTIVE').optional(),
  units_per_hour: z
    .number()
    .int('Units per hour must be an integer')
    .min(0, 'Units per hour must be positive')
    .nullable()
    .optional(),
  setup_time_minutes: z
    .number()
    .int('Setup time must be an integer')
    .min(0, 'Setup time must be positive')
    .nullable()
    .optional(),
  max_batch_size: z
    .number()
    .int('Max batch size must be an integer')
    .min(0, 'Max batch size must be positive')
    .nullable()
    .optional(),
  location_id: z.string().uuid('Invalid location ID').nullable().optional(),
})

// Update Machine Schema (derived from create schema using .partial() - DRY pattern)
export const machineUpdateSchema = machineCreateSchema.partial()

// Machine Status Update Schema
export const machineStatusSchema = z.object({
  status: machineStatusEnum,
})

// TypeScript types
export type CreateMachineInput = z.input<typeof machineCreateSchema>
export type UpdateMachineInput = z.input<typeof machineUpdateSchema>
export type MachineStatusInput = z.infer<typeof machineStatusSchema>
export type MachineType = z.infer<typeof machineTypeEnum>
export type MachineStatus = z.infer<typeof machineStatusEnum>
