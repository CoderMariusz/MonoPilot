/**
 * GRN API Routes - List and Create (Story 05.10)
 * GET /api/warehouse/grns - List GRNs with filters
 * POST /api/warehouse/grns - Create GRN with items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { GRNService } from '@/lib/services/grn-service'
import { createGRNSchema, grnQuerySchema } from '@/lib/validation/grn-schemas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      source_type: searchParams.get('source_type') || undefined,
      warehouse_id: searchParams.get('warehouse_id') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      supplier_id: searchParams.get('supplier_id') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    }

    // Validate query params
    const validated = grnQuerySchema.parse(queryParams)

    const result = await GRNService.list(supabase, validated)

    return NextResponse.json(
      {
        data: result.data,
        meta: result.pagination,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validated = createGRNSchema.parse(body)

    // Create GRN
    const grn = await GRNService.create(supabase, validated, user.id)

    return NextResponse.json(grn, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
