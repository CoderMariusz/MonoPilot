/**
 * Warehouse Access Validation Schemas
 * Story: 01.5b - User Warehouse Access Restrictions
 * Purpose: Zod schemas for warehouse access assignment validation
 */

import { z } from 'zod'

/**
 * Update Warehouse Access Request Schema
 * Used in PUT /api/v1/settings/users/:id/warehouse-access
 *
 * Business Rules:
 * - all_warehouses: true → sets warehouse_access_ids to NULL
 * - all_warehouses: false → requires warehouse_ids array with ≥1 UUID
 */
export const updateWarehouseAccessSchema = z.object({
  all_warehouses: z.boolean(),
  warehouse_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    // If all_warehouses is false, warehouse_ids must be provided and non-empty
    if (!data.all_warehouses) {
      return data.warehouse_ids && data.warehouse_ids.length > 0
    }
    return true
  },
  {
    message: 'At least one warehouse must be selected when all_warehouses is false',
    path: ['warehouse_ids'],
  }
)

/**
 * Warehouse Access Response Type
 * Returned by GET /api/v1/settings/users/:id/warehouse-access
 */
export interface WarehouseAccessResponse {
  user_id: string
  all_warehouses: boolean
  warehouse_ids: string[]
  warehouses: {
    id: string
    code: string
    name: string
    type: string
    is_active: boolean
  }[]
  warning?: string // Optional warning for edge cases (non-admin with NULL access)
}

/**
 * Update Warehouse Access Request Type
 */
export type UpdateWarehouseAccessRequest = z.infer<typeof updateWarehouseAccessSchema>
