/**
 * Warehouse Settings Validation Schema
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Zod schema for warehouse configuration with cross-field validation
 */

import { z } from 'zod';

export const qaStatusEnum = z.enum(['pending', 'passed', 'failed', 'quarantine']);

// Base schema without refinements (for partial updates)
const warehouseSettingsBaseSchema = z.object({
  // Phase 0: Core Configuration
  auto_generate_lp_number: z.boolean(),
  lp_number_prefix: z.string()
    .min(1, "Prefix must be at least 1 character")
    .max(10, "Prefix must be at most 10 characters")
    .regex(/^[A-Z0-9-]+$/, "Prefix must be uppercase alphanumeric with hyphens only")
    .transform(val => val.toUpperCase()),
  lp_number_sequence_length: z.number()
    .int()
    .min(4, "Sequence length must be at least 4")
    .max(12, "Sequence length must be at most 12"),
  enable_split_merge: z.boolean(),
  require_qa_on_receipt: z.boolean(),
  default_qa_status: qaStatusEnum,
  enable_expiry_tracking: z.boolean(),
  require_expiry_on_receipt: z.boolean(),
  expiry_warning_days: z.number()
    .int()
    .min(1, "Warning days must be at least 1")
    .max(365, "Warning days must be at most 365"),
  enable_batch_tracking: z.boolean(),
  require_batch_on_receipt: z.boolean(),
  enable_supplier_batch: z.boolean(),
  enable_fifo: z.boolean(),
  enable_fefo: z.boolean(),

  // Phase 1: Receipt & Inventory
  enable_asn: z.boolean(),
  allow_over_receipt: z.boolean(),
  over_receipt_tolerance_pct: z.number()
    .min(0, "Tolerance must be at least 0%")
    .max(100, "Tolerance must be at most 100%"),
  enable_transit_location: z.boolean(),

  // Phase 2: Scanner & Labels
  scanner_idle_timeout_sec: z.number()
    .int()
    .min(60, "Timeout must be at least 60 seconds")
    .max(3600, "Timeout must be at most 3600 seconds (60 minutes)"),
  scanner_sound_feedback: z.boolean(),
  print_label_on_receipt: z.boolean(),
  label_copies_default: z.number()
    .int()
    .min(1, "Must print at least 1 copy")
    .max(10, "Cannot print more than 10 copies"),

  // Phase 3: Advanced Features
  enable_pallets: z.boolean(),
  enable_gs1_barcodes: z.boolean(),
  enable_catch_weight: z.boolean(),
  enable_location_zones: z.boolean(),
  enable_location_capacity: z.boolean(),
});

// Full schema with cross-field validations (for create operations)
export const warehouseSettingsSchema = warehouseSettingsBaseSchema
  .refine(data => {
    // Cross-field: require_batch_on_receipt requires enable_batch_tracking
    if (data.require_batch_on_receipt && !data.enable_batch_tracking) {
      return false;
    }
    return true;
  }, {
    message: "Enable batch tracking first",
    path: ["require_batch_on_receipt"]
  })
  .refine(data => {
    // Cross-field: require_expiry_on_receipt requires enable_expiry_tracking
    if (data.require_expiry_on_receipt && !data.enable_expiry_tracking) {
      return false;
    }
    return true;
  }, {
    message: "Enable expiry tracking first",
    path: ["require_expiry_on_receipt"]
  })
  .refine(data => {
    // Cross-field: lp_number_prefix required when auto_generate_lp_number enabled
    if (data.auto_generate_lp_number && !data.lp_number_prefix) {
      return false;
    }
    return true;
  }, {
    message: "Prefix required when auto-generation enabled",
    path: ["lp_number_prefix"]
  });

// Partial schema for updates (uses base schema without refinements)
export const updateWarehouseSettingsSchema = warehouseSettingsBaseSchema.partial();

export type UpdateWarehouseSettingsInput = z.infer<typeof updateWarehouseSettingsSchema>;
export type WarehouseSettingsValidation = z.infer<typeof warehouseSettingsSchema>;

export interface WarehouseSettings extends WarehouseSettingsValidation {
  id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

/**
 * Default Warehouse Settings
 * Applied when initializing settings for new organizations
 */
export const DEFAULT_WAREHOUSE_SETTINGS: WarehouseSettingsValidation = {
  // Phase 0: Core Configuration
  auto_generate_lp_number: true,
  lp_number_prefix: 'LP',
  lp_number_sequence_length: 8,
  enable_split_merge: true,
  require_qa_on_receipt: true,
  default_qa_status: 'pending',
  enable_expiry_tracking: true,
  require_expiry_on_receipt: false,
  expiry_warning_days: 30,
  enable_batch_tracking: true,
  require_batch_on_receipt: false,
  enable_supplier_batch: true,
  enable_fifo: true,
  enable_fefo: false,

  // Phase 1: Receipt & Inventory
  enable_asn: false,
  allow_over_receipt: false,
  over_receipt_tolerance_pct: 0.00,
  enable_transit_location: true,

  // Phase 2: Scanner & Labels
  scanner_idle_timeout_sec: 300,
  scanner_sound_feedback: true,
  print_label_on_receipt: true,
  label_copies_default: 1,

  // Phase 3: Advanced Features
  enable_pallets: false,
  enable_gs1_barcodes: false,
  enable_catch_weight: false,
  enable_location_zones: false,
  enable_location_capacity: false,
};
