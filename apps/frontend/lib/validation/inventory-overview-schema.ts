/**
 * Inventory Overview Validation Schema
 * Wireframe: WH-INV-001
 * PRD: FR-WH-023, FR-WH-024, Inventory Visibility
 */

import { z } from 'zod'

export const inventoryOverviewQuerySchema = z.object({
  groupBy: z.enum(['product', 'location', 'warehouse'], {
    required_error: 'groupBy is required',
    invalid_type_error: 'groupBy must be one of: product, location, warehouse',
  }),
  warehouse_id: z.string().uuid('Invalid warehouse UUID').optional(),
  location_id: z.string().uuid('Invalid location UUID').optional(),
  product_id: z.string().uuid('Invalid product UUID').optional(),
  status: z.enum(['available', 'reserved', 'blocked', 'all']).default('available'),
  date_from: z.string().datetime('Invalid date_from format').optional(),
  date_to: z.string().datetime('Invalid date_to format').optional(),
  search: z.string().max(100, 'Search term too long (max 100 characters)').optional(),
  page: z.coerce.number().int().positive('Page must be positive').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(50),
})

export type InventoryOverviewQuery = z.infer<typeof inventoryOverviewQuerySchema>
