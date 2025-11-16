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
