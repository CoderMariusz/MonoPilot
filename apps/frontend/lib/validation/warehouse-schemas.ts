/**
 * Warehouse Validation Schemas
 * Story: 01.8 - Warehouses CRUD
 * Purpose: Zod schemas for warehouse validation
 */

import { z } from 'zod'

// Warehouse Type Enum
export const warehouseTypeEnum = z.enum([
  'GENERAL',
  'RAW_MATERIALS',
  'WIP',
  'FINISHED_GOODS',
  'QUARANTINE',
])

// Code regex pattern: 2-20 uppercase alphanumeric characters with hyphens
const CODE_REGEX = /^[A-Z0-9-]{2,20}$/

// Shared field validators
const codeValidator = z
  .string()
  .min(2, 'Code must be at least 2 characters')
  .max(20, 'Code must be at most 20 characters')
  .transform((val) => val.toUpperCase())
  .refine(
    (val) => CODE_REGEX.test(val),
    'Code must be 2-20 uppercase alphanumeric characters with hyphens only'
  )

const nameValidator = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')

const addressValidator = z
  .string()
  .max(500, 'Address must be at most 500 characters')
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null))

const emailValidator = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be at most 255 characters')
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null))

const phoneValidator = z
  .string()
  .max(20, 'Phone must be at most 20 characters')
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null))

// Create Warehouse Schema
export const createWarehouseSchema = z.object({
  code: codeValidator,
  name: nameValidator,
  type: warehouseTypeEnum.default('GENERAL'),
  address: addressValidator,
  contact_email: emailValidator,
  contact_phone: phoneValidator,
  is_active: z.boolean().default(true),
})

// Update Warehouse Schema
// Code is optional but follows same rules when provided
export const updateWarehouseSchema = z.object({
  code: codeValidator.optional(),
  name: nameValidator.optional(),
  type: warehouseTypeEnum.optional(),
  address: addressValidator,
  contact_email: emailValidator,
  contact_phone: phoneValidator,
  is_active: z.boolean().optional(),
})

// Set Default Schema
export const setDefaultSchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
})

// TypeScript types derived from schemas
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>
export type SetDefaultInput = z.infer<typeof setDefaultSchema>
export type WarehouseType = z.infer<typeof warehouseTypeEnum>
