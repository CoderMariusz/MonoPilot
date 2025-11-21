import { z } from 'zod';

export const userRoleSchema = z.enum(['Operator', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC', 'Admin']);

export const workOrderStatusSchema = z.enum(['Released', 'Started', 'In Progress', 'Completed', 'Closed']);

export const licensePlateStatusSchema = z.enum([
  'available',
  'reserved',
  'in_production',
  'consumed',
  'in_transit',
  'quarantine',
  'qa_passed',
  'qa_rejected',
  'shipped',
  'damaged'
]);

export const qaStatusSchema = z.enum(['pending', 'passed', 'failed', 'on_hold']);

// NPD Module Schemas (Epic NPD-1, Story NPD-1.1)
export const npdProjectStatusSchema = z.enum([
  'idea',
  'concept',
  'development',
  'testing',
  'on_hold',
  'launched',
  'cancelled'
]);

export const npdProjectGateSchema = z.enum(['G0', 'G1', 'G2', 'G3', 'G4', 'Launched']);

export const npdProjectPrioritySchema = z.enum(['high', 'medium', 'low']);

export const createNPDProjectSchema = z.object({
  project_name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: npdProjectStatusSchema.optional(),
  current_gate: npdProjectGateSchema.optional(),
  priority: npdProjectPrioritySchema.optional(),
  portfolio_category: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  target_launch_date: z.string().datetime().optional(),
});

export const updateNPDProjectSchema = z.object({
  project_name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: npdProjectStatusSchema.optional(),
  current_gate: npdProjectGateSchema.optional(),
  priority: npdProjectPrioritySchema.optional(),
  portfolio_category: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  target_launch_date: z.string().datetime().optional(),
});

// NPD Module Schemas (Epic NPD-1, Story NPD-1.2)
export const advanceGateSchema = z.object({
  id: z.string().uuid('Invalid project ID format'),
  toGate: npdProjectGateSchema,
});

// Type exports for NPD schemas
export type CreateNPDProjectInput = z.infer<typeof createNPDProjectSchema>;
export type UpdateNPDProjectInput = z.infer<typeof updateNPDProjectSchema>;
export type AdvanceGateInput = z.infer<typeof advanceGateSchema>;

// Warehouse Schemas (Epic 1, Story 1.5: Warehouse Configuration)
// AC-004.1: Admin może stworzyć warehouse
export const createWarehouseSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase, numbers, and hyphens only'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  address: z.string().optional(),
  is_active: z.boolean().default(true),
});

// AC-004.5: Edit warehouse (includes default locations)
export const updateWarehouseSchema = createWarehouseSchema.extend({
  default_receiving_location_id: z.string().uuid().optional(),
  default_shipping_location_id: z.string().uuid().optional(),
  transit_location_id: z.string().uuid().optional(),
}).partial();

// Warehouse filters for list queries (AC-004.3)
export const warehouseFiltersSchema = z.object({
  is_active: z.boolean().optional(),
  search: z.string().optional(), // Search by code or name
});

// Type exports for Warehouse schemas
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type WarehouseFilters = z.infer<typeof warehouseFiltersSchema>;
