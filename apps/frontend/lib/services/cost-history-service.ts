/**
 * Cost History Service (Story 02.15)
 * Provides cost history retrieval, trend calculation, and component breakdown
 */

import type {
  ProductCost,
  TrendSummary,
  ComponentBreakdownInput,
  ComponentBreakdownPercentages,
  CostDriver,
} from '@/lib/types/cost-history'

/**
 * Calculate cost trends for 30-day, 90-day, and year-to-date periods
 *
 * Compares oldest cost to newest cost within each period to determine percentage change.
 * Returns 0% if insufficient data (< 2 records) for a period.
 *
 * @param costHistory - Array of product cost records (any sort order accepted, will be sorted internally)
 * @returns TrendSummary with trend_30d, trend_90d, and trend_ytd as percentages
 *
 * @example
 * ```typescript
 * const trends = calculateTrends(costHistory)
 * // trends.trend_30d = 5.2 (5.2% increase over 30 days)
 * // trends.trend_90d = -2.1 (-2.1% decrease over 90 days)
 * // trends.trend_ytd = 12.5 (12.5% increase year-to-date)
 * ```
 *
 * @remarks
 * - Calculations are based on created_at timestamps
 * - If oldest cost is 0, returns 0% to avoid division by zero
 * - YTD calculation starts from January 1st of current year
 * - Periods include records from cutoff day at 00:00:00
 *
 * @see TrendSummary for return type structure
 * @see ProductCost for cost record structure
 */
export function calculateTrends(costHistory: ProductCost[]): TrendSummary {
  const now = new Date()

  const calculatePeriodTrend = (days: number): number => {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - days)
    // Set to start of day to include records from the cutoff day
    cutoff.setHours(0, 0, 0, 0)

    const periodCosts = costHistory
      .filter((c) => new Date(c.created_at) >= cutoff)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

    if (periodCosts.length < 2) return 0

    const oldest = periodCosts[0].total_cost
    const newest = periodCosts[periodCosts.length - 1].total_cost

    if (oldest === 0) return 0

    return ((newest - oldest) / oldest) * 100
  }

  const calculateYtdTrend = (): number => {
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const ytdCosts = costHistory
      .filter((c) => new Date(c.created_at) >= startOfYear)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

    if (ytdCosts.length < 2) return 0

    const first = ytdCosts[0].total_cost
    const last = ytdCosts[ytdCosts.length - 1].total_cost

    if (first === 0) return 0

    return ((last - first) / first) * 100
  }

  return {
    trend_30d: calculatePeriodTrend(30),
    trend_90d: calculatePeriodTrend(90),
    trend_ytd: calculateYtdTrend(),
  }
}

/**
 * Calculate component breakdown percentages with optional historical comparison
 *
 * Calculates what percentage each component (material, labor, overhead) contributes
 * to the total cost. If historical data is provided, also calculates percentage change
 * for each component.
 *
 * @param current - Current cost breakdown with material, labor, and overhead
 * @param historical - Optional historical cost breakdown for comparison
 * @returns ComponentBreakdownPercentages with percentages for each component and optional change percentages
 *
 * @example
 * ```typescript
 * const breakdown = getComponentBreakdown(
 *   { material: 100, labor: 50, overhead: 25 },
 *   { material: 90, labor: 45, overhead: 20 }
 * )
 * // breakdown.material = 57.14 (57.14% of total)
 * // breakdown.material_change = 11.11 (11.11% increase from historical)
 * ```
 *
 * @remarks
 * - Returns all zeros if total is 0 (avoids division by zero)
 * - Change percentages only included if historical data provided
 * - Change calculation: ((current - historical) / historical) * 100
 * - If historical component is 0, change is 0%
 *
 * @see ComponentBreakdownInput for input type structure
 * @see ComponentBreakdownPercentages for return type structure
 */
export function getComponentBreakdown(
  current: ComponentBreakdownInput,
  historical?: ComponentBreakdownInput
): ComponentBreakdownPercentages {
  const total = current.material + current.labor + current.overhead

  // Handle zero total case
  if (total === 0) {
    return {
      material: 0,
      labor: 0,
      overhead: 0,
    }
  }

  const result: ComponentBreakdownPercentages = {
    material: (current.material / total) * 100,
    labor: (current.labor / total) * 100,
    overhead: (current.overhead / total) * 100,
  }

  // Calculate changes if historical data provided
  if (historical) {
    if (historical.material > 0) {
      result.material_change =
        ((current.material - historical.material) / historical.material) * 100
    } else {
      result.material_change = 0
    }

    if (historical.labor > 0) {
      result.labor_change =
        ((current.labor - historical.labor) / historical.labor) * 100
    } else {
      result.labor_change = 0
    }

    if (historical.overhead > 0) {
      result.overhead_change =
        ((current.overhead - historical.overhead) / historical.overhead) * 100
    } else {
      result.overhead_change = 0
    }
  }

  return result
}

/**
 * Get top cost drivers (ingredients with highest impact on cost changes)
 *
 * Identifies which ingredients have the largest impact on product cost changes.
 * This is a placeholder function - actual implementation is in the API route.
 *
 * @param productId - Product ID to analyze
 * @param limit - Maximum number of drivers to return (default: 5)
 * @returns Promise resolving to array of cost drivers sorted by impact descending
 *
 * @example
 * ```typescript
 * const drivers = await getCostDrivers('product-123', 5)
 * // Returns top 5 ingredients by cost impact
 * ```
 *
 * @remarks
 * - This is a mock implementation for testing
 * - Production implementation is in API route with database access
 * - Returns empty array for nonexistent products
 * - Real implementation would query BOM items and historical ingredient costs
 *
 * @see CostDriver for return type structure
 */
export async function getCostDrivers(
  productId: string,
  limit: number = 5
): Promise<CostDriver[]> {
  // In a real implementation, this would query the database
  // For now, return empty array for nonexistent products
  // and sample data for valid products

  if (productId === 'nonexistent-product') {
    return []
  }

  // Mock implementation - in production this would query:
  // 1. BOM items for the product
  // 2. Historical ingredient costs
  // 3. Calculate impact percentages

  // Return empty array by default - actual implementation
  // would be populated by the API route which has DB access
  return []
}
