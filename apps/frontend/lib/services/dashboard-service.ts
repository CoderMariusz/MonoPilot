// Dashboard Service - Product grouping and Allergen Matrix (Stories 2.23, 2.24)
import { createAdminClient } from '../supabase/admin-client'
import type {
  ProductDashboardResponse,
  AllergenMatrixResponse,
  RecentActivityResponse,
  AllergenInsights,
  ProductCategory,
  AllergenStatus
} from '../types/dashboard'
import type { AllergenMatrixQuery } from '../validation/dashboard-schemas'

/**
 * Get product dashboard with grouped products by type (RM, WIP, FG)
 * Implements AC-2.23.1 through AC-2.23.5
 */
export async function getProductDashboard(
  orgId: string,
  options: {
    limit?: number
    search?: string
    type_filter?: 'all' | 'RM' | 'WIP' | 'FG'
  } = {}
): Promise<ProductDashboardResponse> {
  const { limit = 8, search, type_filter = 'all' } = options
  const supabase = createAdminClient()

  // Query products grouped by type
  let query = supabase
    .from('products')
    .select(`
      id, code, name, base_uom, version, status, updated_at, created_at,
      product_type:product_types!product_type_id (code),
      product_allergens (count),
      boms (count)
    `)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  // Apply search filter
  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  // Note: Can't filter by joined column in PostgREST
  // We'll filter client-side after fetching

  const { data, error } = await query

  if (error) throw new Error(`Dashboard query failed: ${error.message}`)

  // Handle empty or null data
  let products = data || []

  // Client-side filter by type if specified
  if (type_filter !== 'all') {
    const filterTypes = type_filter === 'RM' ? ['RM', 'RAW']
      : type_filter === 'WIP' ? ['WIP', 'SEMI']
      : type_filter === 'FG' ? ['FG', 'FINISHED']
      : []
    products = products.filter((p: any) => filterTypes.includes(p.product_type?.code))
  }

  // Calculate total for percentage
  const totalProducts = products.length

  // Get month-old date for trend calculation
  const monthAgo = new Date()
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  // Count products created this month
  const trendThisMonth = products.filter((p: any) =>
    new Date(p.created_at) > monthAgo
  ).length

  // Group products by type
  const categoryConfigs: Array<{ category: ProductCategory; label: string; types: string[] }> = [
    { category: 'RM', label: 'Raw Materials', types: ['RM', 'RAW'] },
    { category: 'WIP', label: 'Work in Progress', types: ['WIP', 'SEMI'] },
    { category: 'FG', label: 'Finished Goods', types: ['FG', 'FINISHED'] }
  ]

  const groups = categoryConfigs.map(config => {
    const groupProducts = products
      .filter((p: any) => config.types.includes(p.product_type?.code))
      .slice(0, limit)

    const count = products.filter((p: any) => config.types.includes(p.product_type?.code)).length

    return {
      category: config.category,
      label: config.label,
      count,
      percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0,
      products: groupProducts.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.product_type?.code as 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP' | 'CUSTOM',
        version: p.version || 1,
        status: p.status,
        updated_at: p.updated_at,
        uom: p.base_uom,
        allergen_count: p.product_allergens?.[0]?.count || 0,
        bom_count: p.boms?.[0]?.count || 0
      })),
      recent_changes: []
    }
  })

  // Build category stats
  const category_stats = categoryConfigs.map(config => {
    const count = products.filter((p: any) => config.types.includes(p.product_type?.code)).length
    return {
      category: config.category,
      count,
      percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0
    }
  })

  return {
    groups,
    overall_stats: {
      total_products: totalProducts,
      active_products: totalProducts,
      recent_updates: products.filter((p: any) =>
        new Date(p.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      trend_this_month: trendThisMonth
    },
    category_stats
  }
}

/**
 * Get recent activity feed for dashboard
 * Implements AC-2.23.6
 */
export async function getRecentActivity(
  orgId: string,
  options: { days?: number; limit?: number } = {}
): Promise<RecentActivityResponse> {
  const { days = 7, limit = 10 } = options
  const supabase = createAdminClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  // Query recent product changes
  const { data: products, error } = await supabase
    .from('products')
    .select('id, code, name, created_at, updated_at, created_by')
    .eq('org_id', orgId)
    .gte('updated_at', cutoffDate.toISOString())
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Recent activity query failed: ${error.message}`)

  // Transform to activity items
  const activities = (products || []).map((p: any) => {
    const isNew = new Date(p.created_at).getTime() === new Date(p.updated_at).getTime()
    return {
      id: `activity-${p.id}`,
      product_id: p.id,
      product_code: p.code,
      product_name: p.name,
      change_type: isNew ? 'created' as const : 'updated' as const,
      changed_at: p.updated_at,
      changed_by: p.created_by || 'system'
    }
  })

  return {
    activities,
    total: activities.length
  }
}

/**
 * Get allergen matrix - all products vs all allergens
 * Implements AC-2.24.1 through AC-2.24.6
 */
export async function getAllergenMatrix(
  orgId: string,
  options: Partial<AllergenMatrixQuery> = {}
): Promise<AllergenMatrixResponse> {
  const {
    product_types,
    allergen_ids,
    allergen_count_min,
    allergen_count_max,
    has_allergens = 'all',
    sort_by = 'code',
    sort_order = 'asc',
    search,
    page = 1,
    pageSize = 50
  } = options

  const supabase = createAdminClient()

  // Get all allergens (or filtered)
  let allergenQuery = supabase
    .from('allergens')
    .select('id, code, name')
    .order('name')

  // Filter allergens if needed
  if (allergen_ids?.length) {
    allergenQuery = allergenQuery.in('id', allergen_ids)
  }

  const { data: allergens } = await allergenQuery

  // Get products with allergen relationships
  let query = supabase
    .from('products')
    .select(`
      id, code, name,
      product_type:product_types!product_type_id (code),
      product_allergens (allergen_id, relation_type)
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .eq('status', 'active')

  // Note: Can't filter by joined column in PostgREST
  // We'll filter client-side after fetching if needed

  // Apply search filter
  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  // Apply sorting (except for type - we'll sort that client-side)
  const ascending = sort_order === 'asc'
  const needsClientSort = sort_by === 'type'

  switch (sort_by) {
    case 'name':
      query = query.order('name', { ascending })
      break
    case 'type':
      // Can't sort by joined column - will sort client-side later
      query = query.order('code', { ascending })
      break
    case 'code':
    default:
      query = query.order('code', { ascending })
      break
  }

  // Calculate offset
  const offset = (page - 1) * pageSize

  const { data: productsData, error, count } = await query
    .range(offset, offset + pageSize - 1)

  if (error) throw new Error(`Allergen matrix query failed: ${error.message}`)

  // Client-side filter by product types if specified
  let products = productsData || []
  if (product_types?.length) {
    products = products.filter((p: any) => product_types.includes(p.product_type?.code))
  }

  // Build matrix
  let matrix = (products || []).map((p: any) => {
    const allergenMap: Record<string, AllergenStatus> = {}
    let allergenCount = 0

    allergens?.forEach(a => {
      const relation = p.product_allergens?.find((pa: any) => pa.allergen_id === a.id)
      if (relation) {
        allergenMap[a.id] = relation.relation_type as AllergenStatus
        if (relation.relation_type === 'contains' || relation.relation_type === 'may_contain') {
          allergenCount++
        }
      } else {
        allergenMap[a.id] = 'unknown'
      }
    })

    return {
      product_id: p.id,
      product_code: p.code,
      product_name: p.name,
      product_type: p.product_type?.code as ProductCategory,
      allergens: allergenMap,
      allergen_count: allergenCount
    }
  })

  // Client-side sort by type if needed
  if (needsClientSort && sort_by === 'type') {
    matrix.sort((a, b) => {
      const typeA = a.product_type || ''
      const typeB = b.product_type || ''
      return ascending ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA)
    })
  }

  // Apply allergen count filters (client-side for now)
  if (allergen_count_min !== undefined) {
    matrix = matrix.filter(row => row.allergen_count >= allergen_count_min)
  }
  if (allergen_count_max !== undefined) {
    matrix = matrix.filter(row => row.allergen_count <= allergen_count_max)
  }

  // Apply has_allergens filter
  if (has_allergens === 'with') {
    matrix = matrix.filter(row => row.allergen_count > 0)
  } else if (has_allergens === 'without') {
    matrix = matrix.filter(row => row.allergen_count === 0)
  } else if (has_allergens === 'missing') {
    matrix = matrix.filter(row =>
      Object.values(row.allergens).some(status => status === 'unknown')
    )
  }

  // Sort by allergen_count if needed (client-side)
  if (sort_by === 'allergen_count') {
    matrix.sort((a, b) => {
      return ascending
        ? a.allergen_count - b.allergen_count
        : b.allergen_count - a.allergen_count
    })
  }

  const total = count || matrix.length
  const totalPages = Math.ceil(total / pageSize)

  return {
    matrix,
    allergens: (allergens || []).map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      is_eu_mandatory: isEuMandatoryAllergen(a.name)
    })),
    total,
    page,
    pageSize,
    totalPages
  }
}

/**
 * Get allergen insights for dashboard
 * Implements AC-2.24.9
 */
export async function getAllergenInsights(orgId: string): Promise<AllergenInsights> {
  const supabase = createAdminClient()

  // Get products with allergen data
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, code, name,
      product_type:product_types!product_type_id (code),
      product_allergens (allergen_id, relation_type)
    `)
    .eq('org_id', orgId)
    .eq('status', 'active')

  // Get all allergens
  const { data: allergens } = await supabase
    .from('allergens')
    .select('id, code, name')

  const productList = products || []
  const allergenList = allergens || []

  // High-risk products (5+ allergens)
  const highRiskProducts = productList
    .map((p: any) => {
      const count = p.product_allergens?.filter((pa: any) =>
        pa.relation_type === 'contains' || pa.relation_type === 'may_contain'
      ).length || 0
      return { ...p, allergen_count: count }
    })
    .filter((p: any) => p.allergen_count >= 5)
    .sort((a: any, b: any) => b.allergen_count - a.allergen_count)
    .slice(0, 5)

  // Missing declarations (products with no allergen records)
  const missingDeclarations = productList
    .filter((p: any) => !p.product_allergens || p.product_allergens.length === 0)
    .slice(0, 5)

  // Most common allergens
  const allergenCounts: Record<string, number> = {}
  productList.forEach((p: any) => {
    p.product_allergens?.forEach((pa: any) => {
      if (pa.relation_type === 'contains' || pa.relation_type === 'may_contain') {
        allergenCounts[pa.allergen_id] = (allergenCounts[pa.allergen_id] || 0) + 1
      }
    })
  })

  const mostCommonAllergens = Object.entries(allergenCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([allergenId, count]) => {
      const allergen = allergenList.find((a: any) => a.id === allergenId)
      return {
        allergen_id: allergenId,
        allergen_name: allergen?.name || 'Unknown',
        product_count: count,
        percentage: productList.length > 0 ? Math.round((count / productList.length) * 100) : 0
      }
    })

  // Cross-contamination alerts (products with may_contain)
  const crossContaminationProducts = productList
    .filter((p: any) =>
      p.product_allergens?.some((pa: any) => pa.relation_type === 'may_contain')
    )
    .slice(0, 5)

  return {
    high_risk_products: {
      count: highRiskProducts.length,
      products: highRiskProducts.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        allergen_count: p.allergen_count
      }))
    },
    missing_declarations: {
      count: missingDeclarations.length,
      products: missingDeclarations.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name
      }))
    },
    most_common_allergens: mostCommonAllergens,
    cross_contamination_alerts: {
      count: crossContaminationProducts.length,
      products: crossContaminationProducts.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name
      }))
    }
  }
}

/**
 * Helper: Check if allergen is EU mandatory
 */
function isEuMandatoryAllergen(name: string): boolean {
  const euMandatory = [
    'gluten', 'cereals', 'wheat', 'barley', 'rye', 'oats',
    'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'soy',
    'milk', 'dairy', 'lactose', 'nuts', 'tree nuts', 'celery',
    'mustard', 'sesame', 'sulfites', 'sulphites', 'lupin', 'molluscs'
  ]
  return euMandatory.some(term => name.toLowerCase().includes(term))
}

// ============================================================================
// Story 02.12 - Technical Dashboard Functions
// ============================================================================

import type {
  DashboardStatsResponse,
  TechnicalAllergenMatrixResponse,
  BomTimelineResponse,
  TechnicalRecentActivityResponse,
  TechnicalActivityItem,
  CostTrendsResponse,
  TrendDirection,
  ActivityType,
  EntityType,
  AllergenRelation
} from '../types/dashboard'

/**
 * Format relative time from timestamp
 * Implements AC-12.18
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()

  // Handle future timestamps
  if (diffMs < 0) {
    return 'just now'
  }

  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Fetch dashboard stats - Products, BOMs, Routings counts with trends
 * Implements AC-12.01 to AC-12.05, AC-12.23
 */
export async function fetchDashboardStats(orgId: string): Promise<DashboardStatsResponse> {
  const supabase = createAdminClient()

  // Parallel queries for stats
  const [productsResult, bomsResult, routingsResult, costsResult] = await Promise.all([
    // Products stats
    supabase
      .from('products')
      .select('id, status', { count: 'exact' })
      .eq('org_id', orgId),

    // BOMs stats
    supabase
      .from('boms')
      .select('id, status', { count: 'exact' })
      .eq('org_id', orgId),

    // Routings stats
    supabase
      .from('routings')
      .select('id, is_reusable', { count: 'exact' })
      .eq('org_id', orgId),

    // Cost data - product costs from last 2 months for trend
    supabase
      .from('product_costs')
      .select('total_cost, calculated_at')
      .eq('org_id', orgId)
      .gte('calculated_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('calculated_at', { ascending: false })
  ])

  // Process products
  const products = productsResult.data || []
  const activeProducts = products.filter((p: any) => p.status === 'active').length
  const inactiveProducts = products.filter((p: any) => p.status !== 'active').length

  // Process BOMs
  const boms = bomsResult.data || []
  const activeBoms = boms.filter((b: any) => b.status === 'Active').length
  const phasedBoms = boms.filter((b: any) => b.status === 'Phased Out').length

  // Process Routings
  const routings = routingsResult.data || []
  const reusableRoutings = routings.filter((r: any) => r.is_reusable).length

  // Calculate cost trend
  const costs = costsResult.data || []
  let avgCost = 0
  let trendPercent = 0
  let trendDirection: TrendDirection = 'neutral'

  if (costs.length > 0) {
    // Current month costs
    const now = new Date()
    const currentMonth = costs.filter((c: any) => {
      const date = new Date(c.calculated_at)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })

    // Previous month costs
    const prevMonth = costs.filter((c: any) => {
      const date = new Date(c.calculated_at)
      const prev = new Date(now.getFullYear(), now.getMonth() - 1)
      return date.getMonth() === prev.getMonth() && date.getFullYear() === prev.getFullYear()
    })

    const currentAvg = currentMonth.length > 0
      ? currentMonth.reduce((sum: number, c: any) => sum + (c.total_cost || 0), 0) / currentMonth.length
      : 0

    const prevAvg = prevMonth.length > 0
      ? prevMonth.reduce((sum: number, c: any) => sum + (c.total_cost || 0), 0) / prevMonth.length
      : 0

    avgCost = currentAvg > 0 ? currentAvg : prevAvg

    if (prevAvg > 0 && currentAvg > 0) {
      trendPercent = Math.round(((currentAvg - prevAvg) / prevAvg) * 100 * 10) / 10
      trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral'
    }
  }

  return {
    products: {
      total: products.length,
      active: activeProducts,
      inactive: inactiveProducts
    },
    boms: {
      total: boms.length,
      active: activeBoms,
      phased: phasedBoms
    },
    routings: {
      total: routings.length,
      reusable: reusableRoutings
    },
    avg_cost: {
      value: Math.round(avgCost * 100) / 100,
      currency: 'PLN',
      trend_percent: Math.abs(trendPercent),
      trend_direction: trendDirection
    }
  }
}

/**
 * Fetch allergen matrix - Products x Allergens heatmap
 * Implements AC-12.06 to AC-12.12
 */
export async function fetchAllergenMatrix(
  orgId: string,
  productType?: string
): Promise<TechnicalAllergenMatrixResponse> {
  const supabase = createAdminClient()

  // Get all allergens
  const { data: allergens } = await supabase
    .from('allergens')
    .select('id, code, name')
    .order('name')

  // Get products with allergen relations
  let productsQuery = supabase
    .from('products')
    .select(`
      id, code, name,
      product_type:product_types!product_type_id (code),
      product_allergens (allergen_id, relation_type)
    `)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('code')
    .limit(50)

  // Note: Can't filter by joined column - will filter client-side if needed

  const { data: productsData } = await productsQuery

  // Client-side filter by productType if specified
  let products = productsData || []
  if (productType) {
    products = products.filter((p: any) => p.product_type?.code === productType)
  }

  // Build matrix
  const matrixProducts = (products || []).map((p: any) => {
    const relations: Record<string, AllergenRelation> = {}

    allergens?.forEach(a => {
      const relation = p.product_allergens?.find((pa: any) => pa.allergen_id === a.id)
      if (relation) {
        relations[a.id] = relation.relation_type === 'contains' ? 'contains'
          : relation.relation_type === 'may_contain' ? 'may_contain'
          : null
      } else {
        relations[a.id] = null
      }
    })

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      allergen_relations: relations
    }
  })

  return {
    allergens: (allergens || []).map(a => ({
      id: a.id,
      code: a.code,
      name: a.name
    })),
    products: matrixProducts
  }
}

/**
 * Fetch BOM timeline - Version changes over time
 * Implements AC-12.13 to AC-12.16
 */
export async function fetchBomTimeline(
  orgId: string,
  options: { productId?: string; months?: number; limit?: number } = {}
): Promise<BomTimelineResponse> {
  const { productId, months = 6, limit = 50 } = options
  const supabase = createAdminClient()

  // Calculate date cutoff
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)

  let query = supabase
    .from('boms')
    .select(`
      id,
      version,
      effective_from,
      created_at,
      created_by,
      product:products!product_id (id, code, name),
      creator:users!created_by (id, first_name, last_name)
    `)
    .eq('org_id', orgId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit + 1) // +1 to check if limit reached

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data } = await query

  const timeline = (data || []).slice(0, limit).map((b: any) => ({
    bom_id: b.id,
    product_id: b.product?.id || '',
    product_code: b.product?.code || '',
    product_name: b.product?.name || '',
    version: parseFloat(b.version) || 1,
    effective_from: b.effective_from,
    changed_by: b.created_by || '',
    changed_by_name: b.creator ? `${b.creator.first_name || ''} ${b.creator.last_name || ''}`.trim() : 'Unknown',
    changed_at: b.created_at
  }))

  return {
    timeline,
    limit_reached: (data || []).length > limit
  }
}

/**
 * Fetch recent activity - Last N events across products, BOMs, routings
 * Implements AC-12.17 to AC-12.19
 */
export async function fetchRecentActivity(
  orgId: string,
  limit: number = 10
): Promise<TechnicalRecentActivityResponse> {
  const supabase = createAdminClient()

  // Parallelize all 3 queries for optimal performance
  const [productsResult, bomsResult, routingsResult] = await Promise.all([
    // Query recent products
    supabase
      .from('products')
      .select('id, code, name, created_at, updated_at, created_by, users!created_by(first_name, last_name)')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(limit),

    // Query recent BOMs
    supabase
      .from('boms')
      .select(`
        id, version, status, created_at, updated_at, created_by,
        product:products!product_id(code, name),
        creator:users!created_by(first_name, last_name)
      `)
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(limit),

    // Query recent routings
    supabase
      .from('routings')
      .select('id, name, created_at, updated_at, created_by, users!created_by(first_name, last_name)')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(limit)
  ])

  const products = productsResult.data as Array<{ id: string; code: string; name: string; created_at: string; updated_at: string; created_by: string | null; users?: { first_name: string | null; last_name: string | null } }> | null
  const boms = bomsResult.data as Array<{ id: string; version: number; status: string; created_at: string; updated_at: string; created_by: string | null; product?: { code: string; name: string }; creator?: { first_name: string | null; last_name: string | null } }> | null
  const routings = routingsResult.data as Array<{ id: string; name: string; created_at: string; updated_at: string; created_by: string | null; users?: { first_name: string | null; last_name: string | null } }> | null

  // Combine and sort all activities
  const allActivities = [] as TechnicalActivityItem[]

  // Process products
  for (const p of products || []) {
    const isCreated = new Date(p.created_at).getTime() === new Date(p.updated_at).getTime()
    const userName = p.users ? `${p.users.first_name || ''} ${p.users.last_name || ''}`.trim() : 'Unknown'

    allActivities.push({
      id: `product-${p.id}`,
      type: (isCreated ? 'product_created' : 'product_updated') as ActivityType,
      entity_type: 'product' as EntityType,
      entity_id: p.id,
      description: `Product ${p.code} ${isCreated ? 'created' : 'updated'}`,
      user_id: p.created_by || '',
      user_name: userName,
      timestamp: p.updated_at,
      relative_time: formatRelativeTime(p.updated_at),
      link: `/technical/products/${p.id}`
    })
  }

  // Process BOMs
  for (const b of boms || []) {
    const isCreated = new Date(b.created_at).getTime() === new Date(b.updated_at).getTime()
    const userName = b.creator ? `${b.creator.first_name || ''} ${b.creator.last_name || ''}`.trim() : 'Unknown'
    const productCode = b.product?.code || 'Unknown'

    allActivities.push({
      id: `bom-${b.id}`,
      type: (isCreated ? 'bom_created' : (b.status === 'Active' ? 'bom_activated' : 'bom_created')) as ActivityType,
      entity_type: 'bom' as EntityType,
      entity_id: b.id,
      description: `BOM v${b.version} for ${productCode} ${isCreated ? 'created' : 'updated'}`,
      user_id: b.created_by || '',
      user_name: userName,
      timestamp: b.updated_at,
      relative_time: formatRelativeTime(b.updated_at),
      link: `/technical/boms/${b.id}`
    })
  }

  // Process routings
  for (const r of routings || []) {
    const isCreated = new Date(r.created_at).getTime() === new Date(r.updated_at).getTime()
    const userName = r.users ? `${r.users.first_name || ''} ${r.users.last_name || ''}`.trim() : 'Unknown'

    allActivities.push({
      id: `routing-${r.id}`,
      type: (isCreated ? 'routing_created' : 'routing_updated') as ActivityType,
      entity_type: 'routing' as EntityType,
      entity_id: r.id,
      description: `Routing "${r.name}" ${isCreated ? 'created' : 'updated'}`,
      user_id: r.created_by || '',
      user_name: userName,
      timestamp: r.updated_at,
      relative_time: formatRelativeTime(r.updated_at),
      link: `/technical/routings/${r.id}`
    })
  }

  // Sort by timestamp descending and take top N
  allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    activities: allActivities.slice(0, limit)
  }
}

/**
 * Fetch cost trends - Monthly cost averages
 * Implements AC-12.20 to AC-12.22
 */
export async function fetchCostTrends(
  orgId: string,
  months: number = 6
): Promise<CostTrendsResponse> {
  const supabase = createAdminClient()

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data: costs } = await supabase
    .from('product_costs')
    .select('material_cost, labor_cost, overhead_cost, total_cost, calculated_at')
    .eq('org_id', orgId)
    .gte('calculated_at', startDate.toISOString())
    .lte('calculated_at', endDate.toISOString())
    .order('calculated_at', { ascending: true })

  // Group by month
  const monthlyData: Record<string, {
    material_costs: number[]
    labor_costs: number[]
    overhead_costs: number[]
    total_costs: number[]
  }> = {}

  // Initialize months
  const monthLabels: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthLabels.push(key)
    monthlyData[key] = { material_costs: [], labor_costs: [], overhead_costs: [], total_costs: [] }
  }

  // Aggregate costs
  (costs || []).forEach((c: any) => {
    const date = new Date(c.calculated_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (monthlyData[key]) {
      monthlyData[key].material_costs.push(c.material_cost || 0)
      monthlyData[key].labor_costs.push(c.labor_cost || 0)
      monthlyData[key].overhead_costs.push(c.overhead_cost || 0)
      monthlyData[key].total_costs.push(c.total_cost || 0)
    }
  })

  // Calculate averages
  const data = monthLabels.map(month => {
    const d = monthlyData[month]
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    return {
      month,
      material_cost: Math.round(avg(d.material_costs) * 100) / 100,
      labor_cost: Math.round(avg(d.labor_costs) * 100) / 100,
      overhead_cost: Math.round(avg(d.overhead_costs) * 100) / 100,
      total_cost: Math.round(avg(d.total_costs) * 100) / 100
    }
  })

  return {
    months: monthLabels,
    data,
    currency: 'PLN'
  }
}

/**
 * Export allergen matrix as PDF
 * Implements AC-12.11
 */
export async function exportAllergenMatrixPdf(
  data: TechnicalAllergenMatrixResponse,
  orgId: string
): Promise<Blob> {
  // Dynamic import of jsPDF for code splitting
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'landscape' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(18)
  doc.text('Allergen Matrix', pageWidth / 2, 15, { align: 'center' })

  // Timestamp
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' })

  // Legend
  doc.setFontSize(8)
  let legendY = 30
  doc.setFillColor(239, 68, 68) // Red
  doc.rect(14, legendY, 5, 5, 'F')
  doc.text('Contains', 21, legendY + 4)

  doc.setFillColor(251, 191, 36) // Yellow
  doc.rect(50, legendY, 5, 5, 'F')
  doc.text('May Contain', 57, legendY + 4)

  doc.setFillColor(16, 185, 129) // Green
  doc.rect(100, legendY, 5, 5, 'F')
  doc.text('Free From', 107, legendY + 4)

  // Table header
  let y = 45
  const startX = 14
  const colWidth = 20
  const rowHeight = 8
  const productColWidth = 50

  // Allergen headers
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Product', startX, y)

  data.allergens.slice(0, 10).forEach((allergen, i) => {
    doc.text(allergen.code.substring(0, 8), startX + productColWidth + (i * colWidth), y)
  })

  y += 5
  doc.line(startX, y, pageWidth - 14, y)
  y += 3

  // Product rows
  doc.setFont('helvetica', 'normal')
  data.products.slice(0, 25).forEach((product, rowIndex) => {
    if (y > 180) {
      doc.addPage()
      y = 20
    }

    doc.text(product.code.substring(0, 20), startX, y)

    data.allergens.slice(0, 10).forEach((allergen, colIndex) => {
      const relation = product.allergen_relations[allergen.id]
      const cellX = startX + productColWidth + (colIndex * colWidth) - 2
      const cellY = y - 5

      if (relation === 'contains') {
        doc.setFillColor(239, 68, 68)
        doc.rect(cellX, cellY, colWidth - 2, rowHeight - 1, 'F')
      } else if (relation === 'may_contain') {
        doc.setFillColor(251, 191, 36)
        doc.rect(cellX, cellY, colWidth - 2, rowHeight - 1, 'F')
      } else {
        doc.setFillColor(16, 185, 129)
        doc.rect(cellX, cellY, colWidth - 2, rowHeight - 1, 'F')
      }
    })

    y += rowHeight
  })

  // Generate filename
  const today = new Date().toISOString().split('T')[0]
  const filename = `allergen-matrix-${orgId}-${today}.pdf`

  return doc.output('blob')
}
