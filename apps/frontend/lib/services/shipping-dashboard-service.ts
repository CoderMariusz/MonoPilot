/**
 * Shipping Dashboard Service
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Handles KPI calculations, alerts, and activity for the shipping dashboard.
 * Uses Redis caching with 60-second TTL for performance.
 */

import { createServerSupabase } from '@/lib/supabase/server'
import { getCache, setCache } from '@/lib/cache/redis'
import type {
  DashboardKPIs,
  DashboardAlerts,
  ActivityItem,
  TrendIndicator,
  TrendDirection,
  ShipmentsByDateData,
} from '../types/shipping-dashboard'

// Cache TTL in seconds (1 minute)
const CACHE_TTL = 60

// Cache key constants
export const SHIPPING_DASHBOARD_CACHE_KEYS = {
  DASHBOARD_KPIS: (orgId: string, dateRangeHash: string) =>
    `shipping:dashboard:kpis:${orgId}:${dateRangeHash}`,
  DASHBOARD_ALERTS: (orgId: string, dateRangeHash: string) =>
    `shipping:dashboard:alerts:${orgId}:${dateRangeHash}`,
  DASHBOARD_ACTIVITY: (orgId: string, limit: number) =>
    `shipping:dashboard:activity:${orgId}:${limit}`,
}

function hashDateRange(dateFrom: Date, dateTo: Date): string {
  const fromStr = dateFrom.toISOString().split('T')[0]
  const toStr = dateTo.toISOString().split('T')[0]
  return `${fromStr}_${toStr}`
}

/**
 * ShippingDashboardService class with static methods
 */
export class ShippingDashboardService {
  /**
   * Get KPI data for the shipping dashboard
   */
  static async getKPIs(
    orgId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<DashboardKPIs> {
    const dateRangeHash = hashDateRange(dateFrom, dateTo)
    const cacheKey = SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_KPIS(orgId, dateRangeHash)

    // Check cache first
    const cached = await getCache<DashboardKPIs>(cacheKey)
    if (cached) {
      return cached
    }

    const supabase = await createServerSupabase()
    const dateFromStr = dateFrom.toISOString()
    const dateToStr = dateTo.toISOString()

    // Calculate previous period for trends
    const periodDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000))
    const prevDateTo = new Date(dateFrom.getTime() - 1)
    const prevDateFrom = new Date(prevDateTo.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const prevDateFromStr = prevDateFrom.toISOString()
    const prevDateToStr = prevDateTo.toISOString()

    try {
      // Get orders by status (current period)
      const { data: ordersData } = await supabase
        .from('sales_orders')
        .select('status')
        .eq('org_id', orgId)
        .gte('order_date', dateFromStr)
        .lte('order_date', dateToStr)

      // Get orders (previous period)
      const { data: prevOrdersData } = await supabase
        .from('sales_orders')
        .select('status')
        .eq('org_id', orgId)
        .gte('order_date', prevDateFromStr)
        .lte('order_date', prevDateToStr)

      // Get pick_lists by status (current period)
      const { data: pickListsData } = await supabase
        .from('pick_lists')
        .select('status')
        .eq('org_id', orgId)
        .gte('created_at', dateFromStr)
        .lte('created_at', dateToStr)

      // Get pick_lists (previous period)
      const { data: prevPickListsData } = await supabase
        .from('pick_lists')
        .select('status')
        .eq('org_id', orgId)
        .gte('created_at', prevDateFromStr)
        .lte('created_at', prevDateToStr)

      // Get shipments by status (current period)
      const { data: shipmentsData } = await supabase
        .from('shipments')
        .select('status')
        .eq('org_id', orgId)
        .gte('created_at', dateFromStr)
        .lte('created_at', dateToStr)

      // Get shipments (previous period)
      const { data: prevShipmentsData } = await supabase
        .from('shipments')
        .select('status')
        .eq('org_id', orgId)
        .gte('created_at', prevDateFromStr)
        .lte('created_at', prevDateToStr)

      // Get backorders
      const { data: backorderData } = await supabase
        .from('sales_order_lines')
        .select('quantity_ordered, quantity_allocated, unit_price, sales_orders!inner(org_id, status)')
        .eq('sales_orders.org_id', orgId)
        .not('sales_orders.status', 'in', '("cancelled","shipped","delivered")')

      // Calculate order status breakdown
      const ordersByStatus = {
        draft: 0,
        confirmed: 0,
        allocated: 0,
        picking: 0,
        packing: 0,
        shipped: 0,
        delivered: 0,
      }
      const orders = ordersData || []
      orders.forEach((o: any) => {
        const status = o.status as keyof typeof ordersByStatus
        if (status in ordersByStatus) {
          ordersByStatus[status]++
        }
      })
      const ordersTotal = orders.length
      const prevOrdersTotal = (prevOrdersData || []).length

      // Calculate pick_list status breakdown
      const pickListsByStatus = {
        pending: 0,
        assigned: 0,
        in_progress: 0,
        completed: 0,
      }
      const pickLists = pickListsData || []
      pickLists.forEach((p: any) => {
        const status = p.status as keyof typeof pickListsByStatus
        if (status in pickListsByStatus) {
          pickListsByStatus[status]++
        }
      })
      const pickListsTotal = pickLists.length
      const prevPickListsTotal = (prevPickListsData || []).length

      // Calculate shipment status breakdown
      const shipmentsByStatus = {
        pending: 0,
        packing: 0,
        packed: 0,
        shipped: 0,
        delivered: 0,
      }
      const shipments = shipmentsData || []
      shipments.forEach((s: any) => {
        const status = s.status as keyof typeof shipmentsByStatus
        if (status in shipmentsByStatus) {
          shipmentsByStatus[status]++
        }
      })
      const shipmentsTotal = shipments.length
      const prevShipmentsTotal = (prevShipmentsData || []).length

      // Calculate backorders
      let backordersCount = 0
      let backordersValue = 0
      const backorders = backorderData || []
      backorders.forEach((line: any) => {
        const qtyBackordered = (line.quantity_ordered || 0) - (line.quantity_allocated || 0)
        if (qtyBackordered > 0) {
          backordersCount++
          backordersValue += qtyBackordered * (line.unit_price || 0)
        }
      })

      // Calculate on-time delivery percentage
      const { data: onTimeData } = await supabase
        .from('shipments')
        .select('shipped_at, promised_date')
        .eq('org_id', orgId)
        .eq('status', 'delivered')
        .gte('shipped_at', dateFromStr)
        .lte('shipped_at', dateToStr)

      let onTimeDeliveryPct = 0
      const deliveredShipments = onTimeData || []
      if (deliveredShipments.length > 0) {
        const onTimeCount = deliveredShipments.filter((s: any) => {
          if (!s.shipped_at || !s.promised_date) return true
          return new Date(s.shipped_at) <= new Date(s.promised_date)
        }).length
        onTimeDeliveryPct = Math.round((onTimeCount / deliveredShipments.length) * 100)
      }

      // Calculate avg pick time
      const { data: completedPicksData } = await supabase
        .from('pick_lists')
        .select('created_at, completed_at')
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .gte('completed_at', dateFromStr)
        .lte('completed_at', dateToStr)
        .not('completed_at', 'is', null)

      let avgPickTimeHours = 0
      const completedPicks = completedPicksData || []
      if (completedPicks.length > 0) {
        const totalHours = completedPicks.reduce((sum: number, p: any) => {
          const created = new Date(p.created_at).getTime()
          const completed = new Date(p.completed_at).getTime()
          return sum + (completed - created) / (1000 * 60 * 60)
        }, 0)
        avgPickTimeHours = Math.round((totalHours / completedPicks.length) * 10) / 10
      }

      // Calculate avg pack time
      const { data: shippedData } = await supabase
        .from('shipments')
        .select('created_at, shipped_at')
        .eq('org_id', orgId)
        .eq('status', 'shipped')
        .gte('shipped_at', dateFromStr)
        .lte('shipped_at', dateToStr)
        .not('shipped_at', 'is', null)

      let avgPackTimeHours = 0
      const shippedShipments = shippedData || []
      if (shippedShipments.length > 0) {
        const totalHours = shippedShipments.reduce((sum: number, s: any) => {
          const created = new Date(s.created_at).getTime()
          const shipped = new Date(s.shipped_at).getTime()
          return sum + (shipped - created) / (1000 * 60 * 60)
        }, 0)
        avgPackTimeHours = Math.round((totalHours / shippedShipments.length) * 10) / 10
      }

      const kpis: DashboardKPIs = {
        orders: {
          total: ordersTotal,
          by_status: ordersByStatus,
          trend: ShippingDashboardService.calculateTrend(ordersTotal, prevOrdersTotal),
        },
        pick_lists: {
          total: pickListsTotal,
          by_status: pickListsByStatus,
          trend: ShippingDashboardService.calculateTrend(pickListsTotal, prevPickListsTotal),
        },
        shipments: {
          total: shipmentsTotal,
          by_status: shipmentsByStatus,
          trend: ShippingDashboardService.calculateTrend(shipmentsTotal, prevShipmentsTotal),
        },
        backorders: {
          count: backordersCount,
          total_value: Math.round(backordersValue * 100) / 100,
        },
        on_time_delivery_pct: onTimeDeliveryPct,
        avg_pick_time_hours: avgPickTimeHours,
        avg_pack_time_hours: avgPackTimeHours,
        last_updated: new Date().toISOString(),
      }

      // Cache the result
      await setCache(cacheKey, kpis, CACHE_TTL)

      return kpis
    } catch (error) {
      console.error('Error fetching shipping dashboard KPIs:', error)
      // Return default values on error
      return {
        orders: {
          total: 0,
          by_status: { draft: 0, confirmed: 0, allocated: 0, picking: 0, packing: 0, shipped: 0, delivered: 0 },
          trend: { current: 0, previous: 0, percentage: 0, direction: 'neutral' },
        },
        pick_lists: {
          total: 0,
          by_status: { pending: 0, assigned: 0, in_progress: 0, completed: 0 },
          trend: { current: 0, previous: 0, percentage: 0, direction: 'neutral' },
        },
        shipments: {
          total: 0,
          by_status: { pending: 0, packing: 0, packed: 0, shipped: 0, delivered: 0 },
          trend: { current: 0, previous: 0, percentage: 0, direction: 'neutral' },
        },
        backorders: { count: 0, total_value: 0 },
        on_time_delivery_pct: 0,
        avg_pick_time_hours: 0,
        avg_pack_time_hours: 0,
        last_updated: new Date().toISOString(),
      }
    }
  }

  /**
   * Calculate trend indicator from current and previous values
   */
  static calculateTrend(current: number, previous: number): TrendIndicator {
    let percentage = 0
    let direction: TrendDirection = 'neutral'

    if (previous === 0 && current === 0) {
      percentage = 0
      direction = 'neutral'
    } else if (previous === 0) {
      percentage = 100
      direction = 'up'
    } else {
      percentage = Math.round(Math.abs((current - previous) / previous) * 100)
      if (current > previous) {
        direction = 'up'
      } else if (current < previous) {
        direction = 'down'
      } else {
        direction = 'neutral'
      }
    }

    return {
      current,
      previous,
      percentage,
      direction,
    }
  }

  /**
   * Generate cache key for dashboard data
   */
  static generateCacheKey(
    type: 'kpis' | 'alerts' | 'activity',
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): string {
    if (type === 'activity' && limit !== undefined) {
      return SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_ACTIVITY(orgId, limit)
    }
    const dateRangeHash = dateFrom && dateTo ? hashDateRange(dateFrom, dateTo) : 'default'
    if (type === 'alerts') {
      return SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_ALERTS(orgId, dateRangeHash)
    }
    return SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_KPIS(orgId, dateRangeHash)
  }

  /**
   * Get alerts for the shipping dashboard
   */
  static async getAlerts(
    orgId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<DashboardAlerts> {
    const dateRangeHash = hashDateRange(dateFrom, dateTo)
    const cacheKey = SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_ALERTS(orgId, dateRangeHash)

    // Check cache first
    const cached = await getCache<DashboardAlerts>(cacheKey)
    if (cached) {
      return cached
    }

    const supabase = await createServerSupabase()
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    try {
      // 1. Get backorder items
      const { data: backorderData } = await supabase
        .from('sales_order_lines')
        .select('id, quantity_ordered, quantity_allocated, products!inner(name), sales_orders!inner(org_id, status)')
        .eq('sales_orders.org_id', orgId)
        .not('sales_orders.status', 'in', '("cancelled","shipped","delivered")')

      const backorderItems: DashboardAlerts['backorders']['items'] = []
      const backorders = backorderData || []
      backorders.forEach((line: any) => {
        const qtyBackordered = (line.quantity_ordered || 0) - (line.quantity_allocated || 0)
        if (qtyBackordered > 0) {
          backorderItems.push({
            so_line_id: line.id,
            product_name: (line.products as any)?.name || 'Unknown',
            qty_backordered: qtyBackordered,
          })
        }
      })
      // Sort by qty_backordered DESC and limit
      backorderItems.sort((a, b) => b.qty_backordered - a.qty_backordered)
      const limitedBackorders = backorderItems.slice(0, 10)

      // 2. Get delayed shipments
      const { data: delayedData } = await supabase
        .from('sales_orders')
        .select('id, order_number, promised_ship_date')
        .eq('org_id', orgId)
        .not('status', 'in', '("shipped","delivered","cancelled")')
        .lt('promised_ship_date', today)

      const delayedItems: DashboardAlerts['delayed_shipments']['items'] = []
      const delayedOrders = delayedData || []
      delayedOrders.forEach((order: any) => {
        if (order.promised_ship_date) {
          const promisedDate = new Date(order.promised_ship_date)
          const daysLate = Math.floor((now.getTime() - promisedDate.getTime()) / (24 * 60 * 60 * 1000))
          if (daysLate > 0) {
            delayedItems.push({
              so_id: order.id,
              order_number: order.order_number,
              promised_date: order.promised_ship_date,
              days_late: daysLate,
            })
          }
        }
      })
      // Sort by days_late DESC
      delayedItems.sort((a, b) => b.days_late - a.days_late)
      const limitedDelayed = delayedItems.slice(0, 10)

      // 3. Get pending picks overdue (> 24 hours)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const { data: overduePicksData } = await supabase
        .from('pick_lists')
        .select('id, pick_list_number, created_at')
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .lt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true })
        .limit(10)

      const overdueItems: DashboardAlerts['pending_picks_overdue']['items'] = []
      const overduePicks = overduePicksData || []
      overduePicks.forEach((pick: any) => {
        const createdAt = new Date(pick.created_at)
        const hoursPending = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
        overdueItems.push({
          pick_list_id: pick.id,
          pick_list_number: pick.pick_list_number,
          created_at: pick.created_at,
          hours_pending: hoursPending,
        })
      })

      // 4. Get allergen conflicts (orders not validated)
      const { data: allergenData } = await supabase
        .from('sales_orders')
        .select('id, order_number, allergen_validated, customers!inner(name), sales_order_lines!inner(products!inner(product_allergens(allergens(name))))')
        .eq('org_id', orgId)
        .eq('allergen_validated', false)
        .not('status', 'in', '("cancelled","shipped","delivered")')
        .limit(10)

      const allergenItems: DashboardAlerts['allergen_conflicts']['items'] = []
      const allergenOrders = allergenData || []
      allergenOrders.forEach((order: any) => {
        const allergens = new Set<string>()
        const lines = order.sales_order_lines || []
        lines.forEach((line: any) => {
          const productAllergens = line.products?.product_allergens || []
          productAllergens.forEach((pa: any) => {
            if (pa.allergens?.name) {
              allergens.add(pa.allergens.name)
            }
          })
        })

        if (allergens.size > 0) {
          allergenItems.push({
            so_id: order.id,
            order_number: order.order_number,
            customer_name: (order.customers as any)?.name || 'Unknown',
            conflicting_allergens: Array.from(allergens),
          })
        }
      })

      // Calculate alert summary
      const critical = limitedBackorders.length + limitedDelayed.filter(d => d.days_late >= 3).length
      const warning = overdueItems.length + limitedDelayed.filter(d => d.days_late < 3).length + allergenItems.length
      const info = 0

      const alerts: DashboardAlerts = {
        backorders: {
          count: limitedBackorders.length,
          items: limitedBackorders,
        },
        delayed_shipments: {
          count: limitedDelayed.length,
          items: limitedDelayed,
        },
        pending_picks_overdue: {
          count: overdueItems.length,
          items: overdueItems,
        },
        allergen_conflicts: {
          count: allergenItems.length,
          items: allergenItems,
        },
        alert_summary: {
          critical,
          warning,
          info,
        },
      }

      // Cache the result
      await setCache(cacheKey, alerts, CACHE_TTL)

      return alerts
    } catch (error) {
      console.error('Error fetching shipping dashboard alerts:', error)
      return {
        backorders: { count: 0, items: [] },
        delayed_shipments: { count: 0, items: [] },
        pending_picks_overdue: { count: 0, items: [] },
        allergen_conflicts: { count: 0, items: [] },
        alert_summary: { critical: 0, warning: 0, info: 0 },
      }
    }
  }

  /**
   * Get recent activity for the shipping dashboard
   */
  static async getRecentActivity(
    orgId: string,
    limit: number = 10
  ): Promise<ActivityItem[]> {
    // Enforce max limit of 50
    const effectiveLimit = Math.min(Math.max(limit, 1), 50)
    const cacheKey = SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_ACTIVITY(orgId, effectiveLimit)

    // Check cache first
    const cached = await getCache<ActivityItem[]>(cacheKey)
    if (cached) {
      return cached
    }

    const supabase = await createServerSupabase()
    const activities: ActivityItem[] = []

    try {
      // Get recent sales orders
      const { data: recentOrders } = await supabase
        .from('sales_orders')
        .select('id, order_number, status, created_at, users:created_by(id, first_name, last_name)')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(effectiveLimit)

      const orders = recentOrders || []
      orders.forEach((order: any) => {
        const user = order.users
        const firstName = user?.first_name || ''
        const lastName = user?.last_name || ''
        const userName = (firstName + ' ' + lastName).trim() || 'System'
        const userId = user?.id || 'system'

        let activityType: ActivityItem['type'] = 'so_created'
        let description = 'Sales order ' + order.order_number + ' created'

        if (order.status === 'confirmed') {
          activityType = 'so_confirmed'
          description = 'Sales order ' + order.order_number + ' confirmed'
        } else if (order.status === 'shipped') {
          activityType = 'so_shipped'
          description = 'Sales order ' + order.order_number + ' shipped'
        }

        activities.push({
          id: 'so-' + order.id,
          type: activityType,
          entity_type: 'sales_order',
          entity_id: order.id,
          entity_number: order.order_number,
          description,
          created_at: order.created_at,
          created_by: { id: userId, name: userName },
          status: 'success',
        })
      })

      // Get recent pick lists completed
      const { data: recentPicks } = await supabase
        .from('pick_lists')
        .select('id, pick_list_number, status, completed_at, created_at, users:assigned_to(id, first_name, last_name)')
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(effectiveLimit)

      const picks = recentPicks || []
      picks.forEach((pick: any) => {
        const user = pick.users
        const firstName = user?.first_name || ''
        const lastName = user?.last_name || ''
        const userName = (firstName + ' ' + lastName).trim() || 'System'
        const userId = user?.id || 'system'

        activities.push({
          id: 'pl-' + pick.id,
          type: 'pick_completed',
          entity_type: 'pick_list',
          entity_id: pick.id,
          entity_number: pick.pick_list_number,
          description: 'Pick list ' + pick.pick_list_number + ' completed',
          created_at: pick.completed_at || pick.created_at,
          created_by: { id: userId, name: userName },
          status: 'success',
        })
      })

      // Get recent shipments packed
      const { data: recentShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, shipped_at, created_at, users:created_by(id, first_name, last_name)')
        .eq('org_id', orgId)
        .in('status', ['packed', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(effectiveLimit)

      const shipments = recentShipments || []
      shipments.forEach((shipment: any) => {
        const user = shipment.users
        const firstName = user?.first_name || ''
        const lastName = user?.last_name || ''
        const userName = (firstName + ' ' + lastName).trim() || 'System'
        const userId = user?.id || 'system'

        activities.push({
          id: 'sh-' + shipment.id,
          type: 'shipment_packed',
          entity_type: 'shipment',
          entity_id: shipment.id,
          entity_number: shipment.shipment_number,
          description: 'Shipment ' + shipment.shipment_number + ' ' + shipment.status,
          created_at: shipment.shipped_at || shipment.created_at,
          created_by: { id: userId, name: userName },
          status: 'success',
        })
      })

      // Sort all activities by created_at DESC
      activities.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Limit to requested amount
      const result = activities.slice(0, effectiveLimit)

      // Cache the result
      await setCache(cacheKey, result, CACHE_TTL)

      return result
    } catch (error) {
      console.error('Error fetching shipping dashboard activity:', error)
      return []
    }
  }

  /**
   * Get shipments by date for chart
   */
  static async getShipmentsByDate(
    orgId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ShipmentsByDateData[]> {
    const supabase = await createServerSupabase()
    const dateFromStr = dateFrom.toISOString()
    const dateToStr = dateTo.toISOString()

    try {
      const { data: shipmentsData } = await supabase
        .from('shipments')
        .select('shipped_at')
        .eq('org_id', orgId)
        .eq('status', 'shipped')
        .gte('shipped_at', dateFromStr)
        .lte('shipped_at', dateToStr)
        .not('shipped_at', 'is', null)

      // Group by date
      const countByDate = new Map<string, number>()
      const shipments = shipmentsData || []
      shipments.forEach((s: any) => {
        const date = new Date(s.shipped_at).toISOString().split('T')[0]
        countByDate.set(date, (countByDate.get(date) || 0) + 1)
      })

      // Convert to array and sort by date
      const result: ShipmentsByDateData[] = Array.from(countByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Filter to ensure dates are within range
      return result.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= dateFrom && itemDate <= dateTo
      })
    } catch (error) {
      console.error('Error fetching shipments by date:', error)
      return []
    }
  }
}
