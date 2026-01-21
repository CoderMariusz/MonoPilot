/**
 * API Route: WO Materials with Consumption Progress
 * Story 04.6a: Material Consumption Desktop
 *
 * GET /api/production/work-orders/:id/consumption-materials
 * Returns materials for a work order with consumption progress
 *
 * Security:
 * - Requires authentication
 * - Role-based: owner, admin, production_manager, production_operator, planner
 * - RLS: org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
} as const

// Roles allowed to view materials
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager', 'production_operator', 'planner']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // 1. Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 2. Get current user with role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 3. Role-based authorization
    const roleCode = (currentUser.role as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // 4. Verify work order exists
    const { data: workOrder, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select('id, org_id')
      .eq('id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // 5. Parse query parameters
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter') || 'all'
    const sort = url.searchParams.get('sort') || 'sequence'

    // 6. Build query
    let query = supabaseAdmin
      .from('wo_materials')
      .select(`
        id,
        wo_id,
        product_id,
        material_name,
        material_sku,
        required_qty,
        consumed_qty,
        uom,
        sequence,
        consume_whole_lp,
        is_by_product,
        products(id, code, name, product_type_id)
      `)
      .eq('wo_id', woId)
      .eq('organization_id', currentUser.org_id)

    // 7. Apply sorting
    if (sort === 'name') {
      query = query.order('material_name', { ascending: true })
    } else if (sort === 'progress') {
      // Sort by progress percentage (consumed_qty / required_qty)
      query = query.order('consumed_qty', { ascending: false })
    } else {
      // Default: sort by sequence
      query = query.order('sequence', { ascending: true })
    }

    // 8. Execute query
    const { data: materials, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching materials:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch materials' },
        { status: 500 }
      )
    }

    // 9. Transform and filter response
    let formattedMaterials = (materials || []).map((m: any) => {
      const requiredQty = Number(m.required_qty)
      const consumedQty = Number(m.consumed_qty || 0)
      const remainingQty = Math.max(0, requiredQty - consumedQty)
      const progressPercent = requiredQty > 0
        ? Math.min(100, Math.round((consumedQty / requiredQty) * 100))
        : 0
      const variancePercent = requiredQty > 0
        ? Math.round(((consumedQty - requiredQty) / requiredQty) * 100)
        : 0

      return {
        id: m.id,
        product_id: m.product_id,
        material_name: m.material_name,
        material_sku: m.material_sku || m.products?.code || '',
        required_qty: requiredQty,
        consumed_qty: consumedQty,
        remaining_qty: remainingQty,
        uom: m.uom,
        sequence: m.sequence,
        consume_whole_lp: m.consume_whole_lp,
        is_by_product: m.is_by_product || false,
        progress_percent: progressPercent,
        variance_percent: variancePercent,
      }
    })

    // 10. Apply filter
    if (filter === 'partial') {
      formattedMaterials = formattedMaterials.filter(
        (m: any) => m.consumed_qty > 0 && m.consumed_qty < m.required_qty
      )
    } else if (filter === 'completed') {
      formattedMaterials = formattedMaterials.filter(
        (m: any) => m.consumed_qty >= m.required_qty
      )
    } else if (filter === 'over-consumed') {
      formattedMaterials = formattedMaterials.filter(
        (m: any) => m.consumed_qty > m.required_qty
      )
    }
    // 'all' filter returns everything

    // 11. Return response
    return NextResponse.json({
      materials: formattedMaterials,
      total: formattedMaterials.length,
    })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:id/consumption-materials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
