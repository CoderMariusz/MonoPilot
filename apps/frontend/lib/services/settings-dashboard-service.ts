/**
 * Settings Dashboard Service
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Service for fetching dashboard statistics and recent activity data
 */

interface DashboardStats {
  users?: { total: number; pending_invitations?: number }
  infrastructure?: { warehouses: number; machines: number; production_lines: number }
  master_data?: { allergens: number; tax_codes: number }
  integrations?: { api_keys: number; webhooks: number }
  system?: { enabled_modules: number; audit_log_entries: number }
  security?: { last_login: string | null; session_status: string }
}

interface AuditLog {
  id: string
  user_name: string
  action: string
  created_at: string
}

interface RecentActivityResponse {
  logs: AuditLog[]
}

interface PermissionOptions {
  role?: string
  permissions?: string[]
}

// Cache for dashboard stats
export const statsCache = new Map<string, { data: DashboardStats; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Settings Dashboard Service
 * Handles fetching and caching of dashboard data
 */
export class SettingsDashboardService {
  /**
   * Fetch dashboard statistics
   * Filters stats based on user permissions
   */
  static async getDashboardStats(
    orgId: string,
    options?: PermissionOptions
  ): Promise<DashboardStats> {
    // Check cache
    const cached = statsCache.get(orgId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    // Fetch from API
    const response = await fetch('/api/v1/settings/dashboard/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch dashboard stats')
    }

    const stats: DashboardStats = await response.json()

    // Cache the result
    statsCache.set(orgId, { data: stats, timestamp: Date.now() })

    return stats
  }

  /**
   * Fetch recent activity (last 5 audit logs)
   */
  static async getRecentActivity(orgId: string): Promise<RecentActivityResponse> {
    const response = await fetch('/api/v1/settings/audit-logs?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch recent activity')
    }

    return response.json()
  }

  /**
   * Fetch organization summary data
   */
  static async getOrganizationSummary(orgId: string) {
    const response = await fetch('/api/v1/settings/context', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch organization summary')
    }

    return response.json()
  }

  /**
   * Clear stats cache
   */
  static clearCache(orgId?: string) {
    if (orgId) {
      statsCache.delete(orgId)
    } else {
      statsCache.clear()
    }
  }
}
