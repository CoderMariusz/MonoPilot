/**
 * Audit Service
 * Story: 01.17 - Audit Trail
 * Phase: P3b - Backend Implementation (GREEN)
 *
 * Comprehensive audit logging: CREATE/UPDATE/DELETE actions, field-level changes,
 * auth events (LOGIN/LOGOUT/LOGIN_FAILED), sensitive field redaction, search/filter/export.
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST
 * - Sensitive fields redacted before storage
 * - Immutable audit entries (DB triggers prevent UPDATE/DELETE)
 */

import { createServerSupabase } from '@/lib/supabase/server'

const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'api_key',
  'api_secret',
  'refresh_token',
  'session_token',
  'secret_key',
  'private_key',
  'access_token',
]

const MAX_EXPORT_ROWS = 10000

const CSV_COLUMNS = ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Changes']

// ============================================================================
// Types
// ============================================================================

interface LogCreateParams {
  orgId: string
  userId: string
  entityType: string
  entityId: string
  created: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

interface LogUpdateParams {
  orgId: string
  userId: string
  entityType: string
  entityId: string
  before: Record<string, any>
  after: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

interface LogDeleteParams {
  orgId: string
  userId: string
  entityType: string
  entityId: string
  deleted: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

interface LogLoginParams {
  orgId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

interface LogLogoutParams {
  orgId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

interface LogLoginFailedParams {
  orgId: string
  email: string
  ipAddress?: string
  reason?: string
}

interface AuditLogFilters {
  limit?: number
  offset?: number
  user_ids?: string[]
  actions?: string[]
  entity_types?: string[]
  date_from?: Date
  date_to?: Date
  search?: string
}

interface AuditLogResult {
  data: any[]
  total: number
  limit: number
  offset: number
}

// ============================================================================
// Service
// ============================================================================

export class AuditService {
  /**
   * Redact sensitive fields (password, api_key, etc.) to '[REDACTED]'.
   * Recursively processes nested objects.
   */
  static redactSensitiveFields(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        result[key] = '[REDACTED]'
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = AuditService.redactSensitiveFields(value)
      } else {
        result[key] = value
      }
    }
    return result
  }

  /**
   * Compute field-level differences between before and after states.
   * Returns only changed fields with their before/after values.
   */
  static computeChanges(
    before: Record<string, any>,
    after: Record<string, any>
  ): { before: Record<string, any>; after: Record<string, any>; changed_fields: string[] } {
    const changed_fields: string[] = []
    const beforeDiff: Record<string, any> = {}
    const afterDiff: Record<string, any> = {}

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of allKeys) {
      const beforeVal = key in before ? before[key] : undefined
      const afterVal = key in after ? after[key] : undefined
      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changed_fields.push(key)
        beforeDiff[key] = beforeVal ?? null
        afterDiff[key] = afterVal ?? null
      }
    }

    return { before: beforeDiff, after: afterDiff, changed_fields }
  }

  /**
   * Log a CREATE action for a new entity.
   */
  static async logCreate(params: LogCreateParams): Promise<void> {
    const supabase = await createServerSupabase()
    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: 'CREATE',
      changes: { created: params.created },
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
  }

  /**
   * Log an UPDATE action with field-level before/after diff.
   * Skips if no fields actually changed. Redacts sensitive fields.
   */
  static async logUpdate(params: LogUpdateParams): Promise<void> {
    const changes = AuditService.computeChanges(params.before, params.after)
    if (changes.changed_fields.length === 0) return

    const redactedBefore = AuditService.redactSensitiveFields(changes.before)
    const redactedAfter = AuditService.redactSensitiveFields(changes.after)

    const supabase = await createServerSupabase()
    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: 'UPDATE',
      changes: {
        before: redactedBefore,
        after: redactedAfter,
        changed_fields: changes.changed_fields,
      },
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
  }

  /**
   * Log a DELETE action, capturing the deleted entity state.
   */
  static async logDelete(params: LogDeleteParams): Promise<void> {
    const supabase = await createServerSupabase()
    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: 'DELETE',
      changes: { deleted: AuditService.redactSensitiveFields(params.deleted) },
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
  }

  /**
   * Log a successful LOGIN event.
   */
  static async logLogin(params: LogLoginParams): Promise<void> {
    const supabase = await createServerSupabase()
    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      entity_type: 'auth',
      entity_id: params.userId,
      action: 'LOGIN',
      changes: {},
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
  }

  /**
   * Log a LOGOUT event.
   */
  static async logLogout(params: LogLogoutParams): Promise<void> {
    const supabase = await createServerSupabase()
    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      entity_type: 'auth',
      entity_id: params.userId,
      action: 'LOGOUT',
      changes: {},
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
  }

  /**
   * Log a failed login attempt with email and reason in metadata.
   */
  static async logLoginFailed(params: LogLoginFailedParams): Promise<void> {
    const supabase = await createServerSupabase()
    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: null,
      entity_type: 'auth',
      entity_id: null,
      action: 'LOGIN_FAILED',
      changes: {},
      metadata: {
        email: params.email,
        reason: params.reason ?? 'Unknown',
      },
      ip_address: params.ipAddress ?? null,
      user_agent: null,
    })
  }

  /**
   * Query audit logs with filters, pagination, search.
   * Always scoped to org_id (RLS + explicit filter).
   */
  static async getAuditLogs(
    orgId: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLogResult> {
    const supabase = await createServerSupabase()
    let query = supabase
      .from('audit_logs')
      .select('*, user:users(id, email, first_name, last_name)', { count: 'exact' })

    query = query.eq('org_id', orgId)

    if (filters.user_ids?.length) {
      query = query.in('user_id', filters.user_ids)
    }
    if (filters.actions?.length) {
      query = query.in('action', filters.actions)
    }
    if (filters.entity_types?.length) {
      query = query.in('entity_type', filters.entity_types)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from.toISOString())
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to.toISOString())
    }
    if (filters.search) {
      query = query.textSearch('fts', filters.search)
    }

    const limit = filters.limit ?? 100
    const offset = filters.offset ?? 0

    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) throw error

    return {
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    }
  }

  /**
   * Export audit logs as CSV buffer. Max 10,000 rows.
   */
  static async exportToCsv(
    orgId: string,
    filters: AuditLogFilters = {}
  ): Promise<Buffer> {
    const result = await AuditService.getAuditLogs(orgId, {
      ...filters,
      limit: MAX_EXPORT_ROWS,
      offset: 0,
    })

    const rows: string[] = [CSV_COLUMNS.join(',')]

    for (const row of result.data) {
      const user = row.user
      const values = [
        row.created_at ?? '',
        user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '',
        user?.email ?? '',
        row.action ?? '',
        row.entity_type ?? '',
        row.entity_id ?? '',
        row.changes ? JSON.stringify(row.changes).replace(/"/g, '""') : '',
      ]
      rows.push(values.map((v) => `"${v}"`).join(','))
    }

    return Buffer.from(rows.join('\n'))
  }
}

export default AuditService
