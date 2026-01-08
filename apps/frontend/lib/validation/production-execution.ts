import { z } from 'zod';
import { WorkOrderStatus } from '@/lib/types/production-execution';

/**
 * Zod Schema for Starting a Work Order
 */
export const startWorkOrderSchema = z.object({
  line_id: z.string().uuid().optional(),
  machine_id: z.string().uuid().optional(),
  force: z.boolean().optional().default(false),
});

export type StartWorkOrderInput = z.infer<typeof startWorkOrderSchema>;

/**
 * Status Enum Validation
 */
export const woStatusEnum = z.nativeEnum(WorkOrderStatus);
