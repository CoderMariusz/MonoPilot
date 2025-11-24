// Validation: Base CRUD Schemas
// Location: apps/frontend/lib/validation/{resource}-schemas.ts
// Replace: {Resource}, {resource}

import { z } from 'zod'

export const create{Resource}Schema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must not exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type Create{Resource}Input = z.infer<typeof create{Resource}Schema>

export const update{Resource}Schema = create{Resource}Schema.partial().omit({ code: true })

export type Update{Resource}Input = z.infer<typeof update{Resource}Schema>

export const {resource}FiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export type {Resource}Filters = z.infer<typeof {resource}FiltersSchema>
