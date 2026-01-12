/**
 * GRN API Routes - Single GRN Operations (Story 05.10)
 * GET /api/warehouse/grns/:id - Get GRN detail with items
 * PUT /api/warehouse/grns/:id - Update GRN (draft only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { GRNService } from '@/lib/services/grn-service'
import { updateGRNSchema } from '@/lib/validation/grn-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const grn = await GRNService.getById(supabase, id)

    if (!grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    return NextResponse.json(grn, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validated = updateGRNSchema.parse(body)

    const grn = await GRNService.update(supabase, id, validated)

    return NextResponse.json(grn, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    if (err.message.includes('not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err.message.includes('Cannot modify')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
