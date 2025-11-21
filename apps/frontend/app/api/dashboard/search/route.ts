import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Dashboard Global Search API Route
 * Story: 1.13 Main Dashboard
 * Task 3: API Endpoints
 *
 * GET /api/dashboard/search?q={query} - Global search across entities
 */

export interface SearchResult {
  id: string
  type: 'work_order' | 'purchase_order' | 'license_plate' | 'product' | 'supplier' | 'user'
  code: string
  description: string
  status?: string
  link: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  total_count: number
  searched_types: string[]
}

// ============================================================================
// GET /api/dashboard/search - Global Search (AC-012.4)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameter
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const searchTerm = query.trim()
    const searchPattern = `%${searchTerm}%`
    const results: SearchResult[] = []
    const searchedTypes: string[] = []

    // ========================================================================
    // Search Users (Always available)
    // ========================================================================

    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, status')
        .eq('org_id', currentUser.org_id)
        .or(
          `email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`
        )
        .limit(5)

      if (!usersError && users) {
        searchedTypes.push('users')
        results.push(
          ...users.map((user) => ({
            id: user.id,
            type: 'user' as const,
            code: user.email,
            description: `${user.first_name} ${user.last_name}`,
            status: user.status,
            link: `/settings/users/${user.id}`,
          }))
        )
      }
    } catch (error) {
      console.warn('Failed to search users:', error)
    }

    // ========================================================================
    // Search Work Orders (Epic 3 - Graceful degradation)
    // ========================================================================

    // Note: Table 'work_orders' doesn't exist yet (Epic 3-4)
    // When implemented, uncomment this:
    /*
    try {
      const { data: workOrders, error: woError } = await supabase
        .from('work_orders')
        .select('id, wo_code, product_code, status')
        .eq('org_id', currentUser.org_id)
        .or(`wo_code.ilike.${searchPattern},product_code.ilike.${searchPattern}`)
        .limit(5)

      if (!woError && workOrders) {
        searchedTypes.push('work_orders')
        results.push(
          ...workOrders.map((wo) => ({
            id: wo.id,
            type: 'work_order' as const,
            code: wo.wo_code,
            description: `Product: ${wo.product_code}`,
            status: wo.status,
            link: `/production/work-orders/${wo.id}`,
          }))
        )
      }
    } catch (error) {
      console.warn('Failed to search work orders:', error)
    }
    */

    // ========================================================================
    // Search Purchase Orders (Epic 3 - Graceful degradation)
    // ========================================================================

    // Note: Table 'purchase_orders' doesn't exist yet (Epic 3)
    // When implemented, uncomment this:
    /*
    try {
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select('id, po_code, supplier_name, status')
        .eq('org_id', currentUser.org_id)
        .or(`po_code.ilike.${searchPattern},supplier_name.ilike.${searchPattern}`)
        .limit(5)

      if (!poError && purchaseOrders) {
        searchedTypes.push('purchase_orders')
        results.push(
          ...purchaseOrders.map((po) => ({
            id: po.id,
            type: 'purchase_order' as const,
            code: po.po_code,
            description: `Supplier: ${po.supplier_name}`,
            status: po.status,
            link: `/planning/purchase-orders/${po.id}`,
          }))
        )
      }
    } catch (error) {
      console.warn('Failed to search purchase orders:', error)
    }
    */

    // ========================================================================
    // Search License Plates (Epic 5 - Graceful degradation)
    // ========================================================================

    // Note: Table 'license_plates' doesn't exist yet (Epic 5)
    // When implemented, uncomment this:
    /*
    try {
      const { data: licensePlates, error: lpError } = await supabase
        .from('license_plates')
        .select('id, lp_code, product_code, status, location')
        .eq('org_id', currentUser.org_id)
        .or(`lp_code.ilike.${searchPattern},product_code.ilike.${searchPattern}`)
        .limit(5)

      if (!lpError && licensePlates) {
        searchedTypes.push('license_plates')
        results.push(
          ...licensePlates.map((lp) => ({
            id: lp.id,
            type: 'license_plate' as const,
            code: lp.lp_code,
            description: `${lp.product_code} @ ${lp.location}`,
            status: lp.status,
            link: `/warehouse/license-plates/${lp.id}`,
          }))
        )
      }
    } catch (error) {
      console.warn('Failed to search license plates:', error)
    }
    */

    // ========================================================================
    // Search Products (Epic 2 - Graceful degradation)
    // ========================================================================

    // Note: Table 'products' doesn't exist yet (Epic 2)
    // When implemented, uncomment this:
    /*
    try {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, product_code, description, status')
        .eq('org_id', currentUser.org_id)
        .or(`product_code.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(5)

      if (!prodError && products) {
        searchedTypes.push('products')
        results.push(
          ...products.map((prod) => ({
            id: prod.id,
            type: 'product' as const,
            code: prod.product_code,
            description: prod.description,
            status: prod.status,
            link: `/technical/products/${prod.id}`,
          }))
        )
      }
    } catch (error) {
      console.warn('Failed to search products:', error)
    }
    */

    // ========================================================================
    // Search Suppliers (Epic 3 - Graceful degradation)
    // ========================================================================

    // Note: Table 'suppliers' doesn't exist yet (Epic 3)
    // When implemented, uncomment this:
    /*
    try {
      const { data: suppliers, error: suppError } = await supabase
        .from('suppliers')
        .select('id, supplier_code, supplier_name, status')
        .eq('org_id', currentUser.org_id)
        .or(`supplier_code.ilike.${searchPattern},supplier_name.ilike.${searchPattern}`)
        .limit(5)

      if (!suppError && suppliers) {
        searchedTypes.push('suppliers')
        results.push(
          ...suppliers.map((supp) => ({
            id: supp.id,
            type: 'supplier' as const,
            code: supp.supplier_code,
            description: supp.supplier_name,
            status: supp.status,
            link: `/planning/suppliers/${supp.id}`,
          }))
        )
      }
    } catch (error) {
      console.warn('Failed to search suppliers:', error)
    }
    */

    // Prepare response
    const response: SearchResponse = {
      query: searchTerm,
      results: results.slice(0, 20), // Limit to top 20 results
      total_count: results.length,
      searched_types: searchedTypes,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/dashboard/search:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
