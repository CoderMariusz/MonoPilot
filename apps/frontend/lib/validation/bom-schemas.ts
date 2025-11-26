import { z } from 'zod'

// BOM Status enum - must match database enum values exactly
export const BOMStatusEnum = z.enum(['Draft', 'Active', 'Phased Out', 'Inactive'])
export type BOMStatus = z.infer<typeof BOMStatusEnum>

// Date string validation (accepts YYYY-MM-DD or full ISO datetime)
const dateStringSchema = z.string().refine(
  (val: string) => {
    // Accept YYYY-MM-DD format from date input
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return true
    // Accept full ISO datetime format
    if (!isNaN(Date.parse(val))) return true
    return false
  },
  { message: 'Invalid date format' }
)

// Create BOM Schema
export const CreateBOMSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  effective_from: dateStringSchema.or(z.date()),
  effective_to: dateStringSchema.or(z.date()).optional().nullable(),
  status: BOMStatusEnum.optional().default('Draft'),
  output_qty: z.number().positive('Output quantity must be positive').optional().default(1.0),
  output_uom: z.string().min(1, 'Unit of measure is required'),
  notes: z.string().optional().nullable()
})

export type CreateBOMInput = z.input<typeof CreateBOMSchema>

// Update BOM Schema (cannot change product_id)
export const UpdateBOMSchema = CreateBOMSchema.omit({ product_id: true }).partial().extend({
  status: BOMStatusEnum.optional(),
  effective_from: dateStringSchema.or(z.date()).optional(),
  effective_to: dateStringSchema.or(z.date()).optional().nullable()
})

export type UpdateBOMInput = z.input<typeof UpdateBOMSchema>

// BOM type (matches database schema)
export interface BOM {
  id: string
  org_id: string
  product_id: string
  version: string
  effective_from: string | Date
  effective_to: string | Date | null
  status: BOMStatus
  output_qty: number
  output_uom: string
  notes: string | null
  created_by: string
  updated_by: string
  created_at: string | Date
  updated_at: string | Date
}

// BOM with related data (for display)
export interface BOMWithProduct extends BOM {
  product: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
  items_count?: number
  created_by_user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  updated_by_user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

// ============================================================================
// BOM CLONE SCHEMA
// ============================================================================

/**
 * Schema for cloning a BOM
 * Story 2.10: BOM Clone
 */
export const CloneBOMSchema = z.object({
  effective_from: dateStringSchema.or(z.date()),
  effective_to: dateStringSchema.or(z.date()).optional().nullable(),
}).refine(
  (data) => {
    if (data.effective_to && data.effective_from) {
      const fromDate = data.effective_from instanceof Date ? data.effective_from : new Date(data.effective_from);
      const toDate = data.effective_to instanceof Date ? data.effective_to : new Date(data.effective_to);
      return toDate > fromDate;
    }
    return true;
  },
  {
    message: 'effective_to must be after effective_from',
    path: ['effective_to'],
  }
);

export type CloneBOMInput = z.input<typeof CloneBOMSchema>;

// ============================================================================
// BOM ITEM SCHEMAS
// ============================================================================

export const ConditionLogicEnum = z.enum(['AND', 'OR']);
export type ConditionLogic = z.infer<typeof ConditionLogicEnum>;

/**
 * Schema for creating a new BOM Item
 * Story 2.7: BOM Items Management
 * Story 2.12: Conditional BOM Items
 * Story 2.13: By-Products
 */
export const CreateBOMItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().min(1, 'UoM is required'),
  scrap_percent: z.number().min(0, 'Scrap percent cannot be negative').max(100, 'Scrap percent cannot exceed 100').optional().default(0),
  sequence: z.number().int().positive('Sequence must be a positive integer'),
  consume_whole_lp: z.boolean().optional().default(false),

  // By-products (Story 2.13)
  is_by_product: z.boolean().optional().default(false),
  yield_percent: z.number().min(0, 'Yield percent cannot be negative').max(100, 'Yield percent cannot exceed 100').optional().nullable(),

  // Conditional items (Story 2.12)
  condition_flags: z.array(z.string()).optional().nullable(),
  condition_logic: ConditionLogicEnum.optional().nullable(),

  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If is_by_product is true, yield_percent is required
    if (data.is_by_product && (data.yield_percent === undefined || data.yield_percent === null)) {
      return false;
    }
    return true;
  },
  {
    message: 'yield_percent is required when is_by_product is true',
    path: ['yield_percent'],
  }
).refine(
  (data) => {
    // If condition_flags is provided, condition_logic should also be provided
    if (data.condition_flags && data.condition_flags.length > 0 && !data.condition_logic) {
      return false;
    }
    return true;
  },
  {
    message: 'condition_logic is required when condition_flags are provided',
    path: ['condition_logic'],
  }
);

export type CreateBOMItemInput = z.input<typeof CreateBOMItemSchema>;

/**
 * Schema for updating a BOM Item
 * Story 2.7: BOM Items Management
 */
export const UpdateBOMItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  uom: z.string().min(1, 'UoM is required').optional(),
  scrap_percent: z.number().min(0, 'Scrap percent cannot be negative').max(100, 'Scrap percent cannot exceed 100').optional(),
  sequence: z.number().int().positive('Sequence must be a positive integer').optional(),
  consume_whole_lp: z.boolean().optional(),
  is_by_product: z.boolean().optional(),
  yield_percent: z.number().min(0, 'Yield percent cannot be negative').max(100, 'Yield percent cannot exceed 100').optional().nullable(),
  condition_flags: z.array(z.string()).optional().nullable(),
  condition_logic: ConditionLogicEnum.optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpdateBOMItemInput = z.input<typeof UpdateBOMItemSchema>;

/**
 * Schema for reordering BOM items
 * Story 2.7: BOM Items Management
 */
export const ReorderBOMItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid('Invalid item ID'),
      sequence: z.number().int().positive('Sequence must be a positive integer'),
    })
  ).min(1, 'At least one item is required'),
});

export type ReorderBOMItemsInput = z.input<typeof ReorderBOMItemsSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for BOM list query parameters
 * Story 2.6: BOM CRUD
 */
export const BOMListQuerySchema = z.object({
  product_id: z.string().uuid('Invalid product ID').optional(),
  status: BOMStatusEnum.optional(),
  include_items: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export type BOMListQuery = z.infer<typeof BOMListQuerySchema>;

/**
 * Schema for BOM timeline query parameters
 * Story 2.9: BOM Timeline Visualization
 */
export const BOMTimelineQuerySchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
});

export type BOMTimelineQuery = z.infer<typeof BOMTimelineQuerySchema>;

/**
 * Schema for BOM compare query parameters
 * Story 2.11: BOM Compare
 */
export const BOMCompareQuerySchema = z.object({
  v1: z.string().uuid('Invalid BOM ID for version 1'),
  v2: z.string().uuid('Invalid BOM ID for version 2'),
});

export type BOMCompareQuery = z.infer<typeof BOMCompareQuerySchema>;

// ============================================================================
// TYPES
// ============================================================================

export interface BOMItem {
  id: string;
  bom_id: string;
  product_id: string;
  quantity: number;
  uom: string;
  scrap_percent: number;
  sequence: number;
  consume_whole_lp: boolean;
  is_by_product: boolean;
  yield_percent: number | null;
  condition_flags: string[] | null;
  condition_logic: ConditionLogic | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BOMWithItems extends BOM {
  items: BOMItem[];
}

export interface BOMTimelineData {
  boms: Array<{
    id: string;
    version: string;
    effective_from: string;
    effective_to: string | null;
    status: BOMStatus;
    color: string;
  }>;
}

export interface BOMComparison {
  added: BOMItem[];
  removed: BOMItem[];
  changed: Array<{
    item_v1: BOMItem;
    item_v2: BOMItem;
    changes: string[];
  }>;
  unchanged: BOMItem[];
}

export interface BOMAllergens {
  contains: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  may_contain: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  mismatch_warning?: string;
}
