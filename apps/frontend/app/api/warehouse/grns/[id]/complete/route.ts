/**
 * GRN Complete API Route (Story 05.10)
 * POST /api/warehouse/grns/:id/complete - Complete GRN and create LPs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { GRNService } from '@/lib/services/grn-service'

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

    const result = await GRNService.complete(supabase, id, user.id)

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message.includes('not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (
      err.message.includes('Cannot complete') ||
      err.message.includes('no items') ||
      err.message.includes('required')
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
