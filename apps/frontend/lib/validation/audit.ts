/**
 * Audit Validation Schemas
 * Story: 01.17 - Audit Trail
 *
 * Zod schemas for audit log API input validation.
 */

import { z } from 'zod'

export const auditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'SESSION_EXPIRED',
])

export type AuditAction = z.infer<typeof auditActionSchema>

export const auditLogQuerySchema = z.object({
  search: z.string().optional(),
  user_id: z
    .string()
    .transform((v) => v.split(',').filter(Boolean))
    .optional(),
  action: z
    .string()
    .transform((v) => v.split(',').filter(Boolean))
    .optional(),
  entity_type: z
    .string()
    .transform((v) => v.split(',').filter(Boolean))
    .optional(),
  date_from: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  date_to: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>

export const auditExportSchema = z.object({
  search: z.string().optional(),
  user_id: z.array(z.string()).optional(),
  action: z.array(z.string()).optional(),
  entity_type: z.array(z.string()).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

export type AuditExportInput = z.infer<typeof auditExportSchema>
