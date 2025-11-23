/**
 * API Route: /api/technical/products/[id]/history
 * Story 2.3: Product History - Version history listing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

// GET /api/technical/products/[id]/history - Get version history
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = createServerSupabaseAdmin()
    const { id } = await context.params

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = user.user_metadata.org_id

    // Verify product exists and belongs to org
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const params = historyQuerySchema.parse(searchParams)

    // Fetch version history with pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1

    const { data, error, count } = await supabase
      .from('product_version_history')
      .select(`
        id,
        version,
        changed_fields,
        change_summary,
        changed_at,
        changed_by_user:users!product_version_history_changed_by_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .eq('product_id', id)
      .eq('org_id', orgId)
      .order('changed_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching version history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch version history', details: error.message },
        { status: 500 }
      )
    }

    // Transform response
    const transformedData = data.map((item: any) => ({
      id: item.id,
      version: item.version,
      changed_fields: item.changed_fields,
      change_summary: item.change_summary,
      changed_at: item.changed_at,
      changed_by: item.changed_by_user
    }))

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit)
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in GET /api/technical/products/[id]/history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
