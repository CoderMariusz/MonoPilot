/**
 * GRN Cancel API Route (Story 05.10)
 * POST /api/warehouse/grns/:id/cancel - Cancel GRN
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { GRNService } from '@/lib/services/grn-service'
import { cancelGRNSchema } from '@/lib/validation/grn-schemas'

export async function POST(
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
    const validated = cancelGRNSchema.parse(body)

    const grn = await GRNService.cancel(supabase, id, validated.reason, user.id)

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
    if (
      err.message.includes('already cancelled') ||
      err.message.includes('Cannot cancel')
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
