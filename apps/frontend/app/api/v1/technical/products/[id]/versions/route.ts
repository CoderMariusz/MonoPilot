/**
 * API Route: GET /api/v1/technical/products/:id/versions
 * Story: 02.2 - Product Versioning + History
 * Purpose: Returns paginated list of product versions (summary view)
 *
 * Auth: Required (JWT)
 * Roles: All authenticated users with org access
 * RLS: Enforced via product_id lookup (ADR-013)
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * Response:
 * {
 *   versions: [{ version, changed_at, changed_by }],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   has_more: boolean
 * }
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { versionsQuerySchema } from '@/lib/validation/product-history'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

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
  const queryResult = versionsQuerySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  })

  if (!queryResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: queryResult.error.errors,
      },
      { status: 400 }
    )
  }

  const { page, limit } = queryResult.data
  const offset = (page - 1) * limit

  // =============================================================================
  // CHECK PRODUCT EXISTS (RLS enforces org isolation)
  // =============================================================================

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (productError || !product) {
    // Generic error to prevent information leakage about product existence across orgs
    return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
  }

  // =============================================================================
  // FETCH VERSIONS LIST
  // =============================================================================

  const { data: versions, error: versionsError, count } = await supabase
    .from('product_version_history')
    .select(
      `
      version,
      changed_at,
      changed_by:users(first_name, last_name)
    `,
      { count: 'exact' }
    )
    .eq('product_id', params.id)
    .order('version', { ascending: false })
    .range(offset, offset + limit - 1)

  if (versionsError) {
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }

  // =============================================================================
  // FORMAT RESPONSE
  // =============================================================================

  return NextResponse.json({
    versions: (versions || []).map((v: any) => ({
      version: v.version,
      changed_at: v.changed_at,
      changed_by: `${v.changed_by.first_name} ${v.changed_by.last_name}`,
    })),
    total: count ?? 0,
    page,
    limit,
    has_more: offset + limit < (count ?? 0),
  })
}
