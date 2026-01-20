/**
 * API Route: Consumption History
 * Story 04.6a: Material Consumption Desktop
 *
 * GET /api/production/work-orders/:woId/consumptions
 * Returns paginated consumption history for a work order
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

// Roles allowed to view consumption history
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager', 'production_operator', 'planner']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string }> }
) {
  try {
    const { woId } = await params
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
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const status = url.searchParams.get('status')
    const materialId = url.searchParams.get('material_id')
    const sort = url.searchParams.get('sort') || 'consumed_at'
    const order = url.searchParams.get('order') || 'desc'

    // 6. Build query
    let query = supabaseAdmin
      .from('wo_material_consumptions')
      .select(
        `
        id,
        wo_id,
        wo_material_id,
        lp_id,
        product_id,
        consumed_qty,
        uom,
        is_full_lp,
        lp_batch_number,
        lp_expiry_date,
        consumed_by,
        consumed_at,
        status,
        reversed_at,
        reversed_by,
        reversal_reason,
        wo_materials!inner(material_name, material_sku),
        license_plates!inner(lp_number),
        consumed_by_user:users!wo_material_consumptions_consumed_by_fkey(first_name, last_name, email)
      `,
        { count: 'exact' }
      )
      .eq('wo_id', woId)
      .eq('org_id', currentUser.org_id)

    // 7. Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (materialId) {
      query = query.eq('wo_material_id', materialId)
    }

    // 8. Apply sorting
    const validSortFields = ['consumed_at', 'consumed_qty', 'status']
    const sortField = validSortFields.includes(sort) ? sort : 'consumed_at'
    query = query.order(sortField, { ascending: order === 'asc' })

    // 9. Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    // 10. Execute query
    const { data: consumptions, error: queryError, count } = await query

    if (queryError) {
      console.error('Error fetching consumptions:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch consumption history' },
        { status: 500 }
      )
    }

    // 11. Transform response
    const formattedConsumptions = (consumptions || []).map((c: any) => {
      const material = Array.isArray(c.wo_materials)
        ? c.wo_materials[0]
        : c.wo_materials
      const lp = Array.isArray(c.license_plates)
        ? c.license_plates[0]
        : c.license_plates
      const user = Array.isArray(c.consumed_by_user)
        ? c.consumed_by_user[0]
        : c.consumed_by_user

      return {
        id: c.id,
        lp_number: lp?.lp_number || '',
        material_name: material?.material_name || '',
        consumed_qty: c.consumed_qty,
        uom: c.uom,
        consumed_at: c.consumed_at,
        consumed_by_name: user
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
          : '',
        batch_number: c.lp_batch_number,
        expiry_date: c.lp_expiry_date,
        status: c.status,
        is_full_lp: c.is_full_lp,
      }
    })

    // 12. Return paginated response
    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      data: formattedConsumptions,
      consumptions: formattedConsumptions, // Alias for backwards compatibility
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
      total,
      hasMore,
    })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:woId/consumptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
