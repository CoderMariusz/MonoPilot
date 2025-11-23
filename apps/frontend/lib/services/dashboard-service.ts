// Dashboard Service - Product grouping and Allergen Matrix (Stories 2.23, 2.24)
import { createAdminClient } from '../supabase/admin-client'
import type { ProductDashboardResponse, AllergenMatrixResponse } from '../types/dashboard'

/**
 * Get product dashboard with grouped products by type (RM, WIP, FG)
 */
export async function getProductDashboard(
  orgId: string,
  limit: number = 8
): Promise<ProductDashboardResponse> {
  const supabase = createAdminClient()

  // Query products grouped by type
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, code, name, type, version, status, updated_at,
      product_allergens (count)
    `)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Dashboard query failed: ${error.message}`)

  // Handle empty or null data
  const products = data || []

  // Group products by type
  const groups = [
    { category: 'RM' as const, label: 'Raw Materials', type: 'RM' },
    { category: 'WIP' as const, label: 'Work in Progress', type: 'WIP' },
    { category: 'FG' as const, label: 'Finished Goods', type: 'FG' }
  ].map(group => {
    const groupProducts = products
      .filter((p: any) => p.type === group.type)
      .slice(0, limit)

    return {
      category: group.category,
      label: group.label,
      count: products.filter((p: any) => p.type === group.type).length,
      products: groupProducts.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        version: p.version,
        status: p.status,
        updated_at: p.updated_at,
        allergen_count: p.product_allergens?.[0]?.count || 0
      })),
      recent_changes: []
    }
  })

  return {
    groups,
    overall_stats: {
      total_products: products.length,
      active_products: products.length,
      recent_updates: products.filter((p: any) =>
        new Date(p.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }
  }
}

/**
 * Get allergen matrix - all products vs all allergens
 */
export async function getAllergenMatrix(
  orgId: string,
  options: {
    product_types?: string[]
    limit?: number
    offset?: number
  } = {}
): Promise<AllergenMatrixResponse> {
  const supabase = createAdminClient()

  // Get all allergens
  const { data: allergens } = await supabase
    .from('allergens')
    .select('id, code, name')
    .eq('org_id', orgId)

  // Get products with allergen relationships
  let query = supabase
    .from('products')
    .select(`
      id, code, name, type,
      product_allergens (allergen_id, relation_type)
    `)
    .eq('org_id', orgId)
    .eq('status', 'active')

  if (options.product_types?.length) {
    query = query.in('type', options.product_types)
  }

  const { data: products, error } = await query
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 100) - 1)

  if (error) throw new Error(`Allergen matrix query failed: ${error.message}`)

  // Build matrix
  const matrix = products.map((p: any) => {
    const allergenMap: Record<string, 'contains' | 'may_contain' | 'none'> = {}

    allergens?.forEach(a => {
      const relation = p.product_allergens?.find((pa: any) => pa.allergen_id === a.id)
      allergenMap[a.id] = relation?.relation_type || 'none'
    })

    return {
      product_id: p.id,
      product_code: p.code,
      product_name: p.name,
      product_type: p.type,
      allergens: allergenMap,
      allergen_count: p.product_allergens?.length || 0
    }
  })

  return {
    matrix,
    allergens: allergens || [],
    total: products.length
  }
}
