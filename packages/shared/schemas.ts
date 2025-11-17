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
