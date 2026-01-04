/**
 * Warehouse Dashboard Service
 * Story: 05.7 - Warehouse Dashboard
 *
 * Handles KPI calculations, alerts, and activity for the warehouse dashboard.
 * Uses in-memory caching with 60-second TTL for performance.
 *
 * KPI Calculations:
 * - total_lps: COUNT(license_plates WHERE status != 'consumed')
 * - available_lps: COUNT(license_plates WHERE status='available' AND qa_status='passed')
 * - reserved_lps: COUNT(DISTINCT lp_id FROM lp_reservations WHERE status='active')
 * - consumed_today: COUNT(license_plates WHERE status='consumed' AND updated_at >= TODAY)
 * - expiring_soon: COUNT(license_plates WHERE expiry_date BETWEEN NOW AND NOW+30days)
 */

import { createServerSupabase } from '@/lib/supabase/server'
import type {
  DashboardKPIs,
  DashboardAlerts,
  ActivityItem,
  LowStockAlert,
  ExpiringItemAlert,
  BlockedLPAlert,
} from '../types/warehouse-dashboard'

// Cache TTL in seconds (1 minute)
const CACHE_TTL = 60

// Cache key patterns
export const CACHE_KEYS = {
  DASHBOARD_KPIS: (orgId: string) => `warehouse:dashboard:kpis:${orgId}`,
  DASHBOARD_ALERTS: (orgId: string) => `warehouse:dashboard:alerts:${orgId}`,
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
 * Get KPI data for the warehouse dashboard
 * @param orgId Organization ID for RLS filtering
 * @returns DashboardKPIs object with all 5 metrics
 */
export async function getDashboardKPIs(orgId: string): Promise<DashboardKPIs> {
  const cacheKey = CACHE_KEYS.DASHBOARD_KPIS(orgId)

  // Check cache first
  const cached = getFromCache<DashboardKPIs>(cacheKey)
  if (cached) {
    return cached
  }

  const supabase = await createServerSupabase()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Execute all queries in parallel for performance
    const [
      totalResult,
      availableResult,
      reservedResult,
      consumedTodayResult,
      expiringSoonResult,
    ] = await Promise.all([
      // 1. Total LPs (not consumed)
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .not('status', 'eq', 'consumed'),

      // 2. Available LPs (status='available' AND qa_status='passed')
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'available')
        .eq('qa_status', 'passed'),

      // 3. Reserved LPs (distinct count from lp_reservations)
      supabase
        .from('lp_reservations')
        .select('lp_id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'active'),

      // 4. Consumed today (status='consumed' AND updated_at >= today)
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'consumed')
        .gte('updated_at', `${today}T00:00:00Z`),

      // 5. Expiring soon (within 30 days)
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'available')
        .gte('expiry_date', today)
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    ])

    const kpis: DashboardKPIs = {
      total_lps: totalResult.count ?? 0,
      available_lps: availableResult.count ?? 0,
      reserved_lps: reservedResult.count ?? 0,
      consumed_today: consumedTodayResult.count ?? 0,
      expiring_soon: expiringSoonResult.count ?? 0,
    }

    // Cache the result
    setCache(cacheKey, kpis, CACHE_TTL)

    return kpis
  } catch (error) {
    console.error('Error fetching warehouse dashboard KPIs:', error)
    // Return zeros on error
    return {
      total_lps: 0,
      available_lps: 0,
      reserved_lps: 0,
      consumed_today: 0,
      expiring_soon: 0,
    }
  }
}

/**
 * Get alerts for the warehouse dashboard
 * @param orgId Organization ID for RLS filtering
 * @returns DashboardAlerts with low stock, expiring items, and blocked LPs
 */
export async function getDashboardAlerts(orgId: string): Promise<DashboardAlerts> {
  const cacheKey = CACHE_KEYS.DASHBOARD_ALERTS(orgId)

  // Check cache first
  const cached = getFromCache<DashboardAlerts>(cacheKey)
  if (cached) {
    return cached
  }

  const supabase = await createServerSupabase()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    // 1. Get low stock products (current_count < min_stock)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, code, min_stock')
      .eq('org_id', orgId)
      .not('min_stock', 'is', null)
      .gt('min_stock', 0)

    const lowStock: LowStockAlert[] = []

    if (!productsError && productsData) {
      // For each product, count available LPs
      for (const product of productsData) {
        const { count } = await supabase
          .from('license_plates')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('product_id', product.id)
          .eq('status', 'available')
          .eq('qa_status', 'passed')

        const currentCount = count ?? 0
        const minStock = product.min_stock ?? 0

        if (currentCount < minStock) {
          lowStock.push({
            product_id: product.id,
            product_name: product.name,
            product_code: product.code,
            current_count: currentCount,
            min_stock: minStock,
          })
        }
      }
    }

    // Sort by severity (highest gap first) and limit to 10
    lowStock.sort((a, b) => (b.min_stock - b.current_count) - (a.min_stock - a.current_count))
    const limitedLowStock = lowStock.slice(0, 10)

    // 2. Get expiring items (expiry_date within 30 days)
    const { data: expiringData, error: expiringError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        expiry_date,
        products!inner(name)
      `)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .gte('expiry_date', todayStr)
      .lte('expiry_date', in30Days)
      .order('expiry_date', { ascending: true })
      .limit(10)

    const expiringItems: ExpiringItemAlert[] = []

    if (!expiringError && expiringData) {
      for (const item of expiringData) {
        const expiryDate = new Date(item.expiry_date)
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        const productName = (item.products as any)?.name ?? 'Unknown Product'

        expiringItems.push({
          lp_id: item.id,
          lp_number: item.lp_number,
          product_name: productName,
          expiry_date: item.expiry_date,
          days_until_expiry: daysUntilExpiry,
        })
      }
    }

    // 3. Get blocked LPs (qa_status in 'quarantine' or 'failed')
    const { data: blockedData, error: blockedError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        qa_status,
        batch_number,
        products!inner(name)
      `)
      .eq('org_id', orgId)
      .eq('status', 'blocked')
      .in('qa_status', ['quarantine', 'failed'])
      .order('updated_at', { ascending: false })
      .limit(10)

    const blockedLPs: BlockedLPAlert[] = []

    if (!blockedError && blockedData) {
      for (const item of blockedData) {
        const productName = (item.products as any)?.name ?? 'Unknown Product'

        blockedLPs.push({
          lp_id: item.id,
          lp_number: item.lp_number,
          product_name: productName,
          qa_status: item.qa_status as 'quarantine' | 'failed',
          block_reason: item.batch_number,
        })
      }
    }

    const alerts: DashboardAlerts = {
      low_stock: limitedLowStock,
      expiring_items: expiringItems,
      blocked_lps: blockedLPs,
    }

    // Cache the result
    setCache(cacheKey, alerts, CACHE_TTL)

    return alerts
  } catch (error) {
    console.error('Error fetching warehouse dashboard alerts:', error)
    return {
      low_stock: [],
      expiring_items: [],
      blocked_lps: [],
    }
  }
}

/**
 * Get recent activity for the warehouse dashboard
 * @param orgId Organization ID for RLS filtering
 * @param limit Maximum number of activities to return (default 20, max 50)
 * @returns Array of ActivityItem
 */
export async function getRecentActivity(orgId: string, limit: number = 20): Promise<ActivityItem[]> {
  const supabase = await createServerSupabase()
  const activities: ActivityItem[] = []

  try {
    // Get recent LP creation/updates
    const { data: recentLPs, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        status,
        source,
        quantity,
        uom,
        created_at,
        updated_at,
        products!inner(name),
        users:created_by(first_name, last_name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50))

    if (!lpError && recentLPs) {
      for (const lp of recentLPs) {
        const user = (lp.users as any)
        const userName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'System'
        const productName = (lp.products as any)?.name ?? 'Unknown Product'

        // Determine operation type from source and status
        let operationType: ActivityItem['operation_type'] = 'create'
        let description = `Created LP - ${lp.quantity} ${lp.uom} of ${productName}`

        if (lp.status === 'consumed') {
          operationType = 'consume'
          description = `Consumed ${lp.quantity} ${lp.uom} of ${productName}`
        } else if (lp.source === 'split') {
          operationType = 'split'
          description = `Split LP - ${lp.quantity} ${lp.uom} of ${productName}`
        }

        activities.push({
          timestamp: lp.created_at,
          operation_type: operationType,
          lp_id: lp.id,
          lp_number: lp.lp_number,
          user_name: userName,
          description,
        })
      }
    }

    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return activities.slice(0, Math.min(limit, 50))
  } catch (error) {
    console.error('Error fetching warehouse dashboard activity:', error)
    return []
  }
}

/**
 * Invalidate all dashboard caches for an organization
 * @param orgId Organization ID
 */
export async function invalidateDashboardCache(orgId: string): Promise<void> {
  deleteCache(CACHE_KEYS.DASHBOARD_KPIS(orgId))
  deleteCache(CACHE_KEYS.DASHBOARD_ALERTS(orgId))
}
