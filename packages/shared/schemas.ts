import { z } from 'zod';

export const userRoleSchema = z.enum(['Operator', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC', 'Admin']);

export const workOrderStatusSchema = z.enum(['Released', 'Started', 'In Progress', 'Completed', 'Closed']);

export const licensePlateStatusSchema = z.enum(['Available', 'Reserved', 'In Production', 'QA Hold', 'QA Released', 'QA Rejected', 'Shipped']);
