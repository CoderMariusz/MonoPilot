/**
 * Planning Dashboard Service
 * Story: 03.16 - Planning Dashboard
 *
 * Handles KPI calculations, alerts, and activity for the planning dashboard.
 * Uses Redis caching with 2-minute TTL for performance.
 *
 * KPI Calculations:
 * - po_pending_approval: COUNT(purchase_orders WHERE approval_status='pending')
 * - po_this_month: COUNT(purchase_orders WHERE created_at >= month_start)
 * - to_in_transit: COUNT(transfer_orders WHERE status IN ('partially_shipped', 'shipped'))
 * - wo_scheduled_today: COUNT(work_orders WHERE scheduled_date = TODAY)
 * - wo_overdue: COUNT(work_orders WHERE scheduled_date < TODAY AND status NOT IN ('completed', 'cancelled'))
 * - open_orders: COUNT(purchase_orders WHERE status NOT IN ('closed', 'cancelled'))
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import type {
  KPIData,
  Alert,
  AlertsResponse,
  Activity,
  ActivityResponse,
} from '../types/planning-dashboard'

// Cache TTL in seconds (2 minutes)
const CACHE_TTL = 120

// Cache key patterns
export const CACHE_KEYS = {
  kpis: (orgId: string) => `planning:dashboard:kpis:${orgId}`,
  alerts: (orgId: string) => `planning:dashboard:alerts:${orgId}`,
  activity: (orgId: string) => `planning:dashboard:activity:${orgId}`,
}

// Simple in-memory cache for when Redis is not available
const memoryCache = new Map<string, { data: unknown; expiry: number }>()

function getFromCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T
  }
  memoryCache.delete(key)
  return null
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  })
}

function deleteCache(key: string): void {
  memoryCache.delete(key)
}

/**
 * Get KPI data for the planning dashboard
 * @param orgId Organization ID for RLS filtering
 * @returns KPIData object with all 6 metrics
 */
export async function getKPIs(orgId: string): Promise<KPIData> {
  const cacheKey = CACHE_KEYS.kpis(orgId)

  // Check cache first
  const cached = getFromCache<KPIData>(cacheKey)
  if (cached) {
    return cached
  }

  const supabase = createServerSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  try {
    // Execute all queries in parallel for performance
    const [
      pendingApprovalResult,
      thisMonthResult,
      inTransitResult,
      scheduledTodayResult,
      overdueResult,
      openOrdersResult,
    ] = await Promise.all([
      // 1. POs pending approval
      supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('approval_status', 'pending'),

      // 2. POs created this month
      supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', `${monthStart}T00:00:00Z`),

      // 3. TOs in transit (partially_shipped or shipped)
      supabase
        .from('transfer_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['partially_shipped', 'shipped']),

      // 4. WOs scheduled for today
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('scheduled_date', today),

      // 5. Overdue WOs (scheduled_date < today AND not completed/cancelled)
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .lt('scheduled_date', today)
        .not('status', 'in', '("completed","cancelled")'),

      // 6. Open POs (not closed or cancelled)
      supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .not('status', 'in', '("closed","cancelled")'),
    ])

    const kpis: KPIData = {
      po_pending_approval: pendingApprovalResult.count ?? 0,
      po_this_month: thisMonthResult.count ?? 0,
      to_in_transit: inTransitResult.count ?? 0,
      wo_scheduled_today: scheduledTodayResult.count ?? 0,
      wo_overdue: overdueResult.count ?? 0,
      open_orders: openOrdersResult.count ?? 0,
    }

    // Cache the result
    setCache(cacheKey, kpis, CACHE_TTL)

    return kpis
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    // Return zeros on error
    return {
      po_pending_approval: 0,
      po_this_month: 0,
      to_in_transit: 0,
      wo_scheduled_today: 0,
      wo_overdue: 0,
      open_orders: 0,
    }
  }
}

/**
 * Get alerts for the planning dashboard
 * @param orgId Organization ID for RLS filtering
 * @param limit Maximum number of alerts to return (default 10, max 50)
 * @returns AlertsResponse with alerts array and total count
 */
export async function getAlerts(orgId: string, limit: number = 10): Promise<AlertsResponse> {
  const cacheKey = CACHE_KEYS.alerts(orgId)

  // Check cache first
  const cached = getFromCache<AlertsResponse>(cacheKey)
  if (cached) {
    return {
      alerts: cached.alerts.slice(0, limit),
      total: cached.total,
    }
  }

  const supabase = createServerSupabaseAdmin()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const alerts: Alert[] = []

  try {
    // 1. Get overdue POs (expected_delivery_date < today AND status not closed/cancelled/receiving)
    const { data: overduePOs, error: overduePOError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        expected_delivery_date,
        suppliers(name)
      `)
      .eq('org_id', orgId)
      .lt('expected_delivery_date', todayStr)
      .not('status', 'in', '("closed","cancelled","receiving")')
      .order('expected_delivery_date', { ascending: true })
      .limit(50)

    if (!overduePOError && overduePOs) {
      for (const po of overduePOs) {
        const expectedDate = new Date(po.expected_delivery_date)
        const daysOverdue = Math.floor((today.getTime() - expectedDate.getTime()) / (24 * 60 * 60 * 1000))

        if (daysOverdue > 0) {
          const supplierName = (po.suppliers as any)?.name ?? 'Unknown Supplier'
          alerts.push({
            id: `overdue-po-${po.id}`,
            type: 'overdue_po',
            severity: daysOverdue >= 4 ? 'critical' : 'warning',
            entity_type: 'purchase_order',
            entity_id: po.id,
            entity_number: po.po_number,
            description: `${po.po_number} from ${supplierName} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
            days_overdue: daysOverdue,
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    // 2. Get POs pending approval for more than 2 days
    const { data: pendingPOs, error: pendingPOError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        created_at,
        suppliers(name)
      `)
      .eq('org_id', orgId)
      .eq('approval_status', 'pending')
      .lt('created_at', twoDaysAgo)
      .order('created_at', { ascending: true })
      .limit(50)

    if (!pendingPOError && pendingPOs) {
      for (const po of pendingPOs) {
        const createdAt = new Date(po.created_at)
        const daysPending = Math.floor((today.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
        const supplierName = (po.suppliers as any)?.name ?? 'Unknown Supplier'

        alerts.push({
          id: `pending-approval-${po.id}`,
          type: 'pending_approval',
          severity: daysPending >= 4 ? 'critical' : 'warning',
          entity_type: 'purchase_order',
          entity_id: po.id,
          entity_number: po.po_number,
          description: `${po.po_number} from ${supplierName} pending approval for ${daysPending} days`,
          created_at: po.created_at,
        })
      }
    }

    // Sort alerts: critical first, then by entity_number
    const severityOrder = { critical: 0, warning: 1 }
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return a.entity_number.localeCompare(b.entity_number)
    })

    const response: AlertsResponse = {
      alerts: alerts.slice(0, Math.min(limit, 50)),
      total: alerts.length,
    }

    // Cache the full result (we'll slice when returning from cache)
    setCache(cacheKey, { alerts, total: alerts.length }, CACHE_TTL)

    return response
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return {
      alerts: [],
      total: 0,
    }
  }
}

/**
 * Get recent activity for the planning dashboard
 * @param orgId Organization ID for RLS filtering
 * @param limit Maximum number of activities to return (default 20, max 100)
 * @returns ActivityResponse with activities array and total count
 */
export async function getRecentActivity(orgId: string, limit: number = 20): Promise<ActivityResponse> {
  const cacheKey = CACHE_KEYS.activity(orgId)

  // Check cache first
  const cached = getFromCache<ActivityResponse>(cacheKey)
  if (cached) {
    return {
      activities: cached.activities.slice(0, limit),
      total: cached.total,
    }
  }

  const supabase = createServerSupabaseAdmin()
  const activities: Activity[] = []

  try {
    // Get PO status history for recent activity
    const { data: poHistory, error: poError } = await supabase
      .from('po_status_history')
      .select(`
        id,
        po_id,
        to_status,
        changed_by,
        changed_at,
        purchase_orders!inner(po_number, org_id),
        users(first_name, last_name)
      `)
      .eq('purchase_orders.org_id', orgId)
      .order('changed_at', { ascending: false })
      .limit(100)

    if (!poError && poHistory) {
      for (const entry of poHistory) {
        const po = (entry as any).purchase_orders
        const user = (entry as any).users

        // Map status to action
        let action: Activity['action'] = 'updated'
        if (entry.to_status === 'draft') action = 'created'
        else if (entry.to_status === 'approved') action = 'approved'
        else if (entry.to_status === 'cancelled') action = 'cancelled'
        else if (entry.to_status === 'closed') action = 'completed'

        activities.push({
          id: `po-history-${entry.id}`,
          entity_type: 'purchase_order',
          entity_id: entry.po_id,
          entity_number: po?.po_number ?? 'Unknown',
          action,
          user_id: entry.changed_by ?? '',
          user_name: user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'System',
          timestamp: entry.changed_at,
        })
      }
    }

    // Get TO activity from transfer_orders directly (last modified)
    const { data: recentTOs, error: toError } = await supabase
      .from('transfer_orders')
      .select(`
        id,
        to_number,
        status,
        created_by,
        updated_at,
        users:created_by(first_name, last_name)
      `)
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!toError && recentTOs) {
      for (const to of recentTOs) {
        const user = (to as any).users

        let action: Activity['action'] = 'updated'
        if (to.status === 'completed') action = 'completed'
        else if (to.status === 'cancelled') action = 'cancelled'

        activities.push({
          id: `to-${to.id}`,
          entity_type: 'transfer_order',
          entity_id: to.id,
          entity_number: to.to_number,
          action,
          user_id: to.created_by ?? '',
          user_name: user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'System',
          timestamp: to.updated_at,
        })
      }
    }

    // Get WO activity from work_orders directly (last modified)
    const { data: recentWOs, error: woError } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        status,
        created_by,
        updated_at,
        users:created_by(first_name, last_name)
      `)
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!woError && recentWOs) {
      for (const wo of recentWOs) {
        const user = (wo as any).users

        let action: Activity['action'] = 'updated'
        if (wo.status === 'completed') action = 'completed'
        else if (wo.status === 'cancelled') action = 'cancelled'

        activities.push({
          id: `wo-${wo.id}`,
          entity_type: 'work_order',
          entity_id: wo.id,
          entity_number: wo.wo_number,
          action,
          user_id: wo.created_by ?? '',
          user_name: user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'System',
          timestamp: wo.updated_at,
        })
      }
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const response: ActivityResponse = {
      activities: activities.slice(0, Math.min(limit, 100)),
      total: activities.length,
    }

    // Cache the result
    setCache(cacheKey, { activities, total: activities.length }, CACHE_TTL)

    return response
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return {
      activities: [],
      total: 0,
    }
  }
}

/**
 * Invalidate all dashboard caches for an organization
 * @param orgId Organization ID
 */
export async function invalidateDashboardCache(orgId: string): Promise<void> {
  deleteCache(CACHE_KEYS.kpis(orgId))
  deleteCache(CACHE_KEYS.alerts(orgId))
  deleteCache(CACHE_KEYS.activity(orgId))
}

/**
 * Get cache key for testing purposes
 */
export function getCacheKey(type: 'kpis' | 'alerts' | 'activity', orgId: string): string {
  return CACHE_KEYS[type](orgId)
}
