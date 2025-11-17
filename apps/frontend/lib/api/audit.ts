/**
 * Audit Logs API
 * Functions for querying database-level and application-level audit trails
 * Supports FDA 21 CFR Part 11 compliance requirements
 */

import { supabase } from '../supabase/client-browser';

export interface AuditLog {
  id: number;
  source: 'app' | 'db';              // Application-level or database-level
  object_name: string;                // Entity/table name
  command: string;                    // Action/SQL command
  user_id: string | null;             // User UUID
  user_email?: string;                // User email (joined from users table)
  timestamp: string;                  // ISO timestamp
  before_data?: any;                  // State before change (app-level only)
  after_data?: any;                   // State after change (app-level only)
  statement?: string;                 // SQL statement (db-level only)
  org_id?: number;                    // Organization ID for multi-tenant filtering
}

export interface AuditLogFilters {
  user?: string;                      // Filter by user email
  dateRange?: [Date, Date];           // Filter by date range [from, to]
  table?: string;                     // Filter by table/object name
  operation?: string;                 // Filter by operation/command
  source?: 'app' | 'db' | 'all';      // Filter by source (default: 'all')
}

export interface PaginationParams {
  limit?: number;                     // Results per page (default: 100, max: 1000)
  offset?: number;                    // Offset for pagination (default: 0)
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Maximum number of records allowed for CSV export
 * Prevents memory exhaustion and excessive server load
 */
const MAX_EXPORT_LIMIT = 5000;

/**
 * Audit Logs API Class
 * Provides methods for querying audit logs with filtering, pagination, and export
 */
export class AuditLogsAPI {
  /**
   * Get all audit logs with optional filtering and pagination
   * Returns unified view of application-level and database-level audit trails
   */
  static async getAll(
    filters?: AuditLogFilters,
    pagination?: PaginationParams
  ): Promise<AuditLogsResponse> {
    try {
      const limit = Math.min(pagination?.limit || 100, 1000);
      const offset = pagination?.offset || 0;

      // Build query for audit_log_view
      let query = supabase
        .from('audit_log_view')
        .select('*', { count: 'exact' });

      // Apply source filter
      if (filters?.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      // Apply user filter (by email - requires join)
      if (filters?.user) {
        // Note: This requires the view to include user_email
        // Alternatively, we can filter by user_id if we have it
        query = query.ilike('user_email', `%${filters.user}%`);
      }

      // Apply date range filter
      if (filters?.dateRange && filters.dateRange.length === 2) {
        const [fromDate, toDate] = filters.dateRange;
        query = query
          .gte('timestamp', fromDate.toISOString())
          .lte('timestamp', toDate.toISOString());
      }

      // Apply table/object name filter
      if (filters?.table) {
        query = query.ilike('object_name', `%${filters.table}%`);
      }

      // Apply operation/command filter
      if (filters?.operation) {
        query = query.ilike('command', `%${filters.operation}%`);
      }

      // Apply pagination and ordering
      query = query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error in AuditLogsAPI.getAll:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific entity
   * Returns complete history of changes for an entity
   */
  static async getEntityAuditTrail(
    entityName: string,
    entityId: number
  ): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.rpc('get_entity_audit_trail', {
        p_entity_name: entityName,
        p_entity_id: entityId,
      });

      if (error) {
        console.error('Error fetching entity audit trail:', error);
        throw new Error(`Failed to fetch audit trail for ${entityName}:${entityId}: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in AuditLogsAPI.getEntityAuditTrail:', error);
      throw error;
    }
  }

  /**
   * Get pgAudit statistics for performance monitoring
   * Returns log volume metrics and retention info
   */
  static async getStats(): Promise<{
    total_logs: number;
    logs_last_24h: number;
    logs_last_7d: number;
    oldest_log: string | null;
    newest_log: string | null;
    avg_logs_per_day: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_pgaudit_stats');

      if (error) {
        console.error('Error fetching pgAudit stats:', error);
        throw new Error(`Failed to fetch audit stats: ${error.message}`);
      }

      return data?.[0] || {
        total_logs: 0,
        logs_last_24h: 0,
        logs_last_7d: 0,
        oldest_log: null,
        newest_log: null,
        avg_logs_per_day: 0,
      };
    } catch (error) {
      console.error('Error in AuditLogsAPI.getStats:', error);
      throw error;
    }
  }

  /**
   * Export audit logs to CSV format
   * Returns CSV string with all audit log data
   * Limited to MAX_EXPORT_LIMIT (5000) records to prevent memory exhaustion
   */
  static async exportToCSV(
    filters?: AuditLogFilters
  ): Promise<string> {
    try {
      // First, check total count to enforce export limit
      const countResponse = await this.getAll(filters, { limit: 1, offset: 0 });
      const totalCount = countResponse.total;

      if (totalCount > MAX_EXPORT_LIMIT) {
        throw new Error(
          `Export limit exceeded: ${totalCount} records found, but maximum allowed is ${MAX_EXPORT_LIMIT}. ` +
          `Please apply more specific filters to reduce the result set.`
        );
      }

      // Fetch logs for export (capped at MAX_EXPORT_LIMIT)
      const response = await this.getAll(filters, { limit: MAX_EXPORT_LIMIT, offset: 0 });
      const logs = response.data;

      if (!logs || logs.length === 0) {
        return 'No audit logs found for the specified filters.';
      }

      // CSV headers
      const headers = [
        'Timestamp',
        'Source',
        'User Email',
        'Object/Table',
        'Command/Action',
        'Before',
        'After',
        'SQL Statement',
      ];

      // CSV rows
      const rows = logs.map(log => [
        log.timestamp,
        log.source,
        log.user_email || log.user_id || 'N/A',
        log.object_name,
        log.command,
        log.before_data ? JSON.stringify(log.before_data) : '',
        log.after_data ? JSON.stringify(log.after_data) : '',
        log.statement || '',
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          row.map(cell =>
            // Escape quotes and wrap in quotes if contains comma/newline
            typeof cell === 'string' && (cell.includes(',') || cell.includes('\n') || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        ),
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error in AuditLogsAPI.exportToCSV:', error);
      throw error;
    }
  }

  /**
   * Archive old audit logs (admin only)
   * Deletes logs older than specified retention period
   * @param retentionDays Number of days to retain logs (default: 90)
   */
  static async archiveOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('archive_old_audit_logs', {
        retention_days: retentionDays,
      });

      if (error) {
        console.error('Error archiving old audit logs:', error);
        throw new Error(`Failed to archive logs: ${error.message}`);
      }

      return data || 0;
    } catch (error) {
      console.error('Error in AuditLogsAPI.archiveOldLogs:', error);
      throw error;
    }
  }

  /**
   * Add a reason to the most recent audit event for an entity
   * Legacy method - kept for backward compatibility
   */
  static async addReason(
    entityType: string,
    entityId: number,
    reason: string
  ): Promise<void> {
    const response = await fetch('/api/audit/add-reason', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        reason: reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add audit reason');
    }
  }
}
