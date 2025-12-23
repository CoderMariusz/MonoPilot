/**
 * Session Validation Schemas
 * Story: 01.15 - Session & Password Management
 * Purpose: Zod schemas for session validation
 */

import { z } from 'zod'

// Session Schema
export const sessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  org_id: z.string().uuid(),
  session_token: z.string().min(32),
  device_type: z.string().nullable(),
  device_name: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  last_activity_at: z.string().datetime(),
  revoked_at: z.string().datetime().nullable(),
  revoked_by: z.string().uuid().nullable(),
  revocation_reason: z.string().nullable(),
  is_current: z.boolean().optional(),
})

// Sessions List Schema
export const sessionsListSchema = z.array(sessionSchema)

// Terminate Session Schema
export const terminateSessionSchema = z.object({
  session_id: z.string().uuid(),
  reason: z.string().max(100).optional(),
})

// Terminate All Sessions Schema
export const terminateAllSessionsSchema = z.object({
  user_id: z.string().uuid(),
  except_current: z.string().uuid().optional(),
})

// Device Info Schema
export const deviceInfoSchema = z.object({
  device_type: z.string().nullable(),
  device_name: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string(),
})

// Create Session Schema
export const createSessionSchema = z.object({
  user_id: z.string().uuid(),
  org_id: z.string().uuid(),
  device_info: deviceInfoSchema,
  timeout_hours: z.number().int().positive().optional(),
})

// TypeScript types
export type SessionInput = z.infer<typeof sessionSchema>
export type SessionsListInput = z.infer<typeof sessionsListSchema>
export type TerminateSessionInput = z.infer<typeof terminateSessionSchema>
export type TerminateAllSessionsInput = z.infer<typeof terminateAllSessionsSchema>
export type DeviceInfoInput = z.infer<typeof deviceInfoSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
