// POST /api/technical/tracing/forward - Forward Trace API (Story 2.18)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { traceInputSchema } from '@/lib/validation/tracing-schemas'
import { traceForward } from '@/lib/services/genealogy-service'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const input = traceInputSchema.parse(body)

    // Get LP ID from batch_number if needed
    let lpId = input.lp_id
    if (!lpId && input.batch_number) {
      // TODO: Query LP by batch_number
      throw new Error('Batch number lookup not implemented yet')
    }

    // CRITICAL SECURITY: Verify LP belongs to user's organization
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, org_id')
      .eq('id', lpId!)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (lp.org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Forbidden: License plate belongs to different organization' },
        { status: 403 }
      )
    }

    const result = await traceForward(lpId!, input.max_depth)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
