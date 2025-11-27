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
      id, code, name, type, uom, version, status, updated_at, created_at,
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

  // Apply type filter
  if (type_filter !== 'all') {
    query = query.eq('type', type_filter)
  }

  const { data, error } = await query

  if (error) throw new Error(`Dashboard query failed: ${error.message}`)

  // Handle empty or null data
  const products = data || []

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
      .filter((p: any) => config.types.includes(p.type))
      .slice(0, limit)

    const count = products.filter((p: any) => config.types.includes(p.type)).length

    return {
      category: config.category,
      label: config.label,
      count,
      percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0,
      products: groupProducts.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.type as 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP' | 'CUSTOM',
        version: p.version || 1,
        status: p.status,
        updated_at: p.updated_at,
        uom: p.uom,
        allergen_count: p.product_allergens?.[0]?.count || 0,
        bom_count: p.boms?.[0]?.count || 0
      })),
      recent_changes: []
    }
  })

  // Build category stats
  const category_stats = categoryConfigs.map(config => {
    const count = products.filter((p: any) => config.types.includes(p.type)).length
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
      id, code, name, type,
      product_allergens (allergen_id, relation_type)
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .eq('status', 'active')

  // Apply product type filter
  if (product_types?.length) {
    query = query.in('type', product_types)
  }

  // Apply search filter
  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  // Apply sorting
  const ascending = sort_order === 'asc'
  switch (sort_by) {
    case 'name':
      query = query.order('name', { ascending })
      break
    case 'type':
      query = query.order('type', { ascending })
      break
    case 'code':
    default:
      query = query.order('code', { ascending })
      break
  }

  // Calculate offset
  const offset = (page - 1) * pageSize

  const { data: products, error, count } = await query
    .range(offset, offset + pageSize - 1)

  if (error) throw new Error(`Allergen matrix query failed: ${error.message}`)

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
      product_type: p.type as ProductCategory,
      allergens: allergenMap,
      allergen_count: allergenCount
    }
  })

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
      id, code, name, type,
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
