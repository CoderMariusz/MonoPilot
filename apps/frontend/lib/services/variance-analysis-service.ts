/**
 * Variance Analysis Service (Story 02.15)
 * Provides variance calculation between standard and actual costs
 */

import type {
  ProductCost,
  WorkOrderCost,
  VarianceComponent,
  VarianceComponents,
  SignificantVariance,
  VarianceReport,
} from '@/lib/types/variance'

/**
 * Default threshold for significant variance detection (5%)
 */
const DEFAULT_THRESHOLD = 5

/**
 * Calculate variance between standard costs and actual costs from work orders
 *
 * Aggregates actual costs from multiple work orders, calculates average per work order,
 * then compares to standard costs to identify variances for each cost component
 * (material, labor, overhead, total).
 *
 * @param standardCosts - Standard cost record for the product
 * @param actualCosts - Array of actual costs from completed work orders
 * @returns VarianceReport with components breakdown, significant variances (>5%), and work order count
 *
 * @example
 * ```typescript
 * const variance = calculateVariance(standardCost, actualWorkOrderCosts)
 * // variance.components.material.variance_percent = 8.5 (8.5% over budget)
 * // variance.work_orders_analyzed = 15
 * // variance.significant_variances contains components exceeding 5% threshold
 * ```
 *
 * @remarks
 * - Returns null components and empty array if no work orders provided
 * - Averages actual costs across all work orders for comparison
 * - Variance calculation: actual - standard
 * - Variance percent: (variance / standard) * 100
 * - If standard is 0, variance percent is 0% (avoids division by zero)
 * - Significant variances use 5% threshold by default
 *
 * @see ProductCost for standard cost structure
 * @see WorkOrderCost for actual cost structure
 * @see VarianceReport for return type structure
 */
export function calculateVariance(
  standardCosts: ProductCost,
  actualCosts: WorkOrderCost[]
): VarianceReport {
  // If no work orders, return empty result
  if (actualCosts.length === 0) {
    return {
      components: null,
      significant_variances: [],
      work_orders_analyzed: 0,
    }
  }

  // Aggregate actual costs from work orders
  const totalActual = actualCosts.reduce(
    (acc, wo) => ({
      material: acc.material + wo.material_cost,
      labor: acc.labor + wo.labor_cost,
      overhead: acc.overhead + wo.overhead_cost,
      total: acc.total + wo.total_cost,
    }),
    { material: 0, labor: 0, overhead: 0, total: 0 }
  )

  // Average per work order
  const count = actualCosts.length
  const avgActual = {
    material: totalActual.material / count,
    labor: totalActual.labor / count,
    overhead: totalActual.overhead / count,
    total: totalActual.total / count,
  }

  // Calculate variance for each component
  const calcVariance = (standard: number, actual: number): VarianceComponent => {
    const variance = actual - standard
    const variance_percent = standard !== 0 ? (variance / standard) * 100 : 0
    return {
      standard,
      actual,
      variance,
      variance_percent,
    }
  }

  const components: VarianceComponents = {
    material: calcVariance(standardCosts.material_cost, avgActual.material),
    labor: calcVariance(standardCosts.labor_cost, avgActual.labor),
    overhead: calcVariance(standardCosts.overhead_cost, avgActual.overhead),
    total: calcVariance(standardCosts.total_cost, avgActual.total),
  }

  // Identify significant variances (>5% threshold by default)
  const significant_variances = identifySignificantVariances(
    components,
    DEFAULT_THRESHOLD
  )

  return {
    components,
    significant_variances,
    work_orders_analyzed: count,
  }
}

/**
 * Identify variances that exceed the threshold
 *
 * Filters variance components to find those with absolute variance percentage
 * greater than the threshold. Each significant variance includes component name,
 * variance percentage, threshold used, and direction (over/under).
 *
 * @param components - Variance components to check (material, labor, overhead, total)
 * @param threshold - Percentage threshold for significance (default: 5%)
 * @returns Array of significant variances sorted by entry order
 *
 * @example
 * ```typescript
 * const significant = identifySignificantVariances(components, 5)
 * // Returns: [
 * //   { component: 'material', variance_percent: 8.5, threshold: 5, direction: 'over' },
 * //   { component: 'labor', variance_percent: -6.2, threshold: 5, direction: 'under' }
 * // ]
 * ```
 *
 * @remarks
 * - Uses absolute value for threshold comparison
 * - Direction is 'over' if variance > 0, 'under' if variance < 0
 * - Checks all components: material, labor, overhead, and total
 * - Returns empty array if no variances exceed threshold
 * - Default threshold of 5% matches industry standard for cost variance analysis
 *
 * @see VarianceComponents for input structure
 * @see SignificantVariance for return type structure
 */
export function identifySignificantVariances(
  components: VarianceComponents,
  threshold: number = DEFAULT_THRESHOLD
): SignificantVariance[] {
  const significant: SignificantVariance[] = []

  for (const [component, data] of Object.entries(components)) {
    const absPercent = Math.abs(data.variance_percent)

    if (absPercent > threshold) {
      significant.push({
        component,
        variance_percent: data.variance_percent,
        threshold,
        direction: data.variance_percent > 0 ? 'over' : 'under',
      })
    }
  }

  return significant
}
