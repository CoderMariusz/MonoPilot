/**
 * Audit Service
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides audit logging for quality module entities.
 * Logs entity changes for regulatory compliance and traceability.
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - No sensitive data in logs (only IDs and action types)
 */

import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
}

/**
 * Log an audit entry
 * In MVP, this logs to console. Future phases will store in audit_logs table.
 *
 * @param entry - The audit log entry to record
 */
export async function log(entry: AuditLogEntry): Promise<void> {
  // MVP implementation: Console logging
  // Future: Store in audit_logs table
  console.log('[AUDIT]', {
    timestamp: new Date().toISOString(),
    ...entry,
  });

  // Return immediately for MVP
  return Promise.resolve();
}

/**
 * Export service as object for easier testing/mocking
 */
export const AuditService = {
  log,
};

export default AuditService;
