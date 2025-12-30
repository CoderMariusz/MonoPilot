/**
 * API Route: GET /api/v1/technical/products/:id/history
 * Story: 02.2 - Product Versioning + History
 * Purpose: Returns detailed change history with changed_fields JSONB
 *
 * Auth: Required (JWT)
 * Roles: All authenticated users with org access
 * RLS: Enforced via product_id lookup (ADR-013)
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - from_date: Filter changes from this date (ISO 8601)
 * - to_date: Filter changes until this date (ISO 8601)
 *
 * Response:
 * {
 *   history: [{
 *     id, version, changed_fields,
 *     changed_by: { id, name, email },
 *     changed_at, is_initial
 *   }],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   has_more: boolean
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { historyQuerySchema } from '@/lib/validation/product-history'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()

  // =============================================================================
  // AUTH CHECK
  // =============================================================================

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // =============================================================================
  // VALIDATE QUERY PARAMETERS
  // =============================================================================

  const { searchParams } = new URL(request.url)
  const queryResult = historyQuerySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    from_date: searchParams.get('from_date'),
    to_date: searchParams.get('to_date'),
  })

  if (!queryResult.success) {
    return NextResponse.json(
      {
        error: queryResult.error.errors[0]?.message ?? 'Invalid query parameters',
      },
      { status: 400 }
    )
  }

  const { page, limit, from_date, to_date } = queryResult.data
  const offset = (page - 1) * limit

  // =============================================================================
  // CHECK PRODUCT EXISTS (RLS enforces org isolation)
  // =============================================================================

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // =============================================================================
  // BUILD QUERY WITH OPTIONAL DATE FILTERS
  // =============================================================================

  let query = supabase
    .from('product_version_history')
    .select(
      `
      id,
      version,
      changed_fields,
      changed_at,
      changed_by:users(id, first_name, last_name, email)
    `,
      { count: 'exact' }
    )
    .eq('product_id', id)
    .order('version', { ascending: false })

  // Apply date filters
  if (from_date) {
    query = query.gte('changed_at', from_date)
  }
  if (to_date) {
    query = query.lte('changed_at', to_date)
  }

  // Apply pagination
  const { data: history, error: historyError, count } = await query.range(
    offset,
    offset + limit - 1
  )

  if (historyError) {
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }

  // =============================================================================
  // FORMAT RESPONSE
  // =============================================================================

  return NextResponse.json({
    history: (history || []).map((h: any) => ({
      id: h.id,
      version: h.version,
      changed_fields: h.changed_fields,
      changed_by: {
        id: h.changed_by.id,
        name: `${h.changed_by.first_name} ${h.changed_by.last_name}`,
        email: h.changed_by.email,
      },
      changed_at: h.changed_at,
      is_initial: h.changed_fields._initial === true,
    })),
    total: count ?? 0,
    page,
    limit,
    has_more: offset + limit < (count ?? 0),
  })
}
