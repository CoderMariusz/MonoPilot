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
  notes: z.string().optional().nullable(),
  // Story 2.28: Packaging fields
  units_per_box: z.number().int().positive().max(10000, 'Max 10000 units per box').optional(),
  boxes_per_pallet: z.number().int().positive().max(200, 'Max 200 boxes per pallet').optional()
})

export type CreateBOMInput = z.input<typeof CreateBOMSchema>

// Update BOM Schema (cannot change product_id)
export const UpdateBOMSchema = CreateBOMSchema.omit({ product_id: true }).partial().extend({
  status: BOMStatusEnum.optional(),
  effective_from: dateStringSchema.or(z.date()).optional(),
  effective_to: dateStringSchema.or(z.date()).optional().nullable(),
  // Story 2.28: Packaging can be cleared
  units_per_box: z.number().int().positive().max(10000).nullable().optional(),
  boxes_per_pallet: z.number().int().positive().max(200).nullable().optional()
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
  // Story 2.28: Packaging fields
  units_per_box: number | null
  boxes_per_pallet: number | null
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
// BOM ITEM SCHEMAS - Story 2.26: Operation Assignment
// ============================================================================

/**
 * Schema for creating a new BOM Item
 * Story 2.26: BOM Items with Operation Assignment
 */
export const CreateBOMItemSchema = z.object({
  component_id: z.string().uuid('Invalid component ID'),
  operation_seq: z.number().int().positive('Operation sequence must be positive').default(1),
  is_output: z.boolean().optional().default(false),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().min(1, 'UoM is required').max(10, 'UoM max 10 chars'),
  scrap_percent: z.number().min(0, 'Scrap percent cannot be negative').max(100, 'Scrap percent cannot exceed 100').optional().default(0),
  sequence: z.number().int().positive('Sequence must be a positive integer').optional().default(1),
  line_ids: z.array(z.string().uuid('Invalid line ID')).min(1, 'line_ids cannot be empty array').optional(),
  consume_whole_lp: z.boolean().optional().default(false),
  notes: z.string().max(500).optional().nullable(),
})

export type CreateBOMItemInput = z.infer<typeof CreateBOMItemSchema>

/**
 * Schema for updating a BOM Item
 * Story 2.26: BOM Items with Operation Assignment
 */
export const UpdateBOMItemSchema = z.object({
  component_id: z.string().uuid('Invalid component ID').optional(),
  operation_seq: z.number().int().positive('Operation sequence must be positive').optional(),
  is_output: z.boolean().optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  uom: z.string().min(1, 'UoM is required').max(10, 'UoM max 10 chars').optional(),
  scrap_percent: z.number().min(0, 'Scrap percent cannot be negative').max(100, 'Scrap percent cannot exceed 100').optional(),
  sequence: z.number().int().positive('Sequence must be a positive integer').optional(),
  line_ids: z.array(z.string().uuid('Invalid line ID')).min(1, 'line_ids cannot be empty array').nullable().optional(),
  consume_whole_lp: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export type UpdateBOMItemInput = z.infer<typeof UpdateBOMItemSchema>

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
  id: string
  bom_id: string
  component_id: string
  component?: {
    id: string
    code: string
    name: string
    uom: string
    type: string
  }
  operation_seq: number
  operation?: {
    sequence: number
    name: string
  }
  is_output: boolean
  quantity: number
  uom: string
  scrap_percent: number
  sequence: number
  line_ids: string[] | null
  lines?: Array<{ id: string; name: string }>
  consume_whole_lp: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BOMItemsByOperation {
  operation_seq: number
  operation_name: string | null
  inputs: BOMItem[]
  outputs: BOMItem[]
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

// ============================================================================
// BOM PRODUCTION LINES - Story 2.25
// ============================================================================

/**
 * Schema for a single production line item
 * AC-2.25.9: Zod validation for line assignment
 */
export const BomProductionLineItemSchema = z.object({
  line_id: z.string().uuid('Invalid line ID'),
  labor_cost_per_hour: z.number().min(0, 'Labor cost cannot be negative').max(9999.99, 'Labor cost cannot exceed 9999.99').optional()
})

export type BomProductionLineItemInput = z.infer<typeof BomProductionLineItemSchema>

/**
 * Schema for setting BOM production lines (bulk replace)
 * AC-2.25.9: Zod validation with duplicate check
 */
export const SetBomLinesSchema = z.object({
  lines: z.array(BomProductionLineItemSchema)
    .refine(
      (lines) => {
        const ids = lines.map(l => l.line_id)
        return new Set(ids).size === ids.length
      },
      { message: 'Duplicate line_id values not allowed' }
    )
})

export type SetBomLinesInput = z.infer<typeof SetBomLinesSchema>

// ============================================================================
// BOM ITEM ALTERNATIVES - Story 2.27
// ============================================================================

/**
 * Schema for creating a BOM item alternative
 * AC-2.27.4: Zod validation for alternative creation
 */
export const CreateBOMItemAlternativeSchema = z.object({
  alternative_component_id: z.string().uuid('Invalid alternative component ID'),
  priority: z.number().int().positive('Priority must be a positive integer').default(1),
  quantity_ratio: z.number().positive('Quantity ratio must be positive').max(9999.9999, 'Quantity ratio too large').default(1.0),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
})

export type CreateBOMItemAlternativeInput = z.infer<typeof CreateBOMItemAlternativeSchema>

/**
 * Schema for updating a BOM item alternative
 * AC-2.27.5: Zod validation for alternative update
 */
export const UpdateBOMItemAlternativeSchema = z.object({
  priority: z.number().int().positive('Priority must be a positive integer').optional(),
  quantity_ratio: z.number().positive('Quantity ratio must be positive').max(9999.9999, 'Quantity ratio too large').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
})

export type UpdateBOMItemAlternativeInput = z.infer<typeof UpdateBOMItemAlternativeSchema>

/**
 * BOM Item Alternative interface
 * AC-2.27.3: Type for alternatives list
 */
export interface BOMItemAlternative {
  id: string
  bom_item_id: string
  alternative_component_id: string
  alternative_component?: {
    id: string
    code: string
    name: string
    uom: string
    type: string
  }
  priority: number
  quantity_ratio: number
  notes: string | null
  created_at: string
}

// ============================================================================
// BOM PACKAGING - Story 2.28
// ============================================================================

/**
 * Packaging breakdown for production planning
 * AC-2.28.6
 */
export interface PackagingBreakdown {
  total_units: number
  units_per_box: number
  boxes_per_pallet: number
  units_per_pallet: number
  full_pallets: number
  partial_pallet_boxes: number
  partial_pallet_units: number
  total_boxes: number
}

/**
 * Calculate units per pallet
 */
export function calculateUnitsPerPallet(bom: BOM): number | null {
  if (bom.units_per_box && bom.boxes_per_pallet) {
    return bom.units_per_box * bom.boxes_per_pallet
  }
  return null
}

/**
 * Calculate boxes needed for quantity
 */
export function calculateBoxesNeeded(quantity: number, unitsPerBox: number): number {
  return Math.ceil(quantity / unitsPerBox)
}

/**
 * Calculate pallets needed for quantity
 */
export function calculatePalletsNeeded(quantity: number, bom: BOM): number | null {
  const unitsPerPallet = calculateUnitsPerPallet(bom)
  if (!unitsPerPallet) return null
  return Math.ceil(quantity / unitsPerPallet)
}

/**
 * Calculate full packaging breakdown
 */
export function calculatePackaging(quantity: number, bom: BOM): PackagingBreakdown | null {
  if (!bom.units_per_box || !bom.boxes_per_pallet) return null

  const unitsPerPallet = bom.units_per_box * bom.boxes_per_pallet
  const fullPallets = Math.floor(quantity / unitsPerPallet)
  const remainingUnits = quantity % unitsPerPallet
  const remainingBoxes = Math.ceil(remainingUnits / bom.units_per_box)

  return {
    total_units: quantity,
    units_per_box: bom.units_per_box,
    boxes_per_pallet: bom.boxes_per_pallet,
    units_per_pallet: unitsPerPallet,
    full_pallets: fullPallets,
    partial_pallet_boxes: remainingBoxes,
    partial_pallet_units: remainingUnits,
    total_boxes: (fullPallets * bom.boxes_per_pallet) + remainingBoxes
  }
}

/**
 * Format packaging for display
 */
export function formatPackaging(bom: BOM): string | null {
  if (!bom.units_per_box && !bom.boxes_per_pallet) {
    return null
  }

  const parts: string[] = []
  if (bom.units_per_box) {
    parts.push(`${bom.units_per_box} units/box`)
  }
  if (bom.boxes_per_pallet) {
    parts.push(`${bom.boxes_per_pallet} boxes/pallet`)
  }

  const unitsPerPallet = calculateUnitsPerPallet(bom)
  if (unitsPerPallet) {
    parts.push(`(${unitsPerPallet} units/pallet)`)
  }

  return parts.join(' • ')
}
