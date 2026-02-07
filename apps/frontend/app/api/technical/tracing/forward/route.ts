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

    let lpId: string | undefined = input.lp_id
    
    // Check if we need to lookup LP by batch number or LP number
    if (!lpId && input.batch_number) {
      // Query LP by batch_number
      const { data: batchLp, error: batchError } = await supabase
        .from('license_plates')
        .select('id')
        .eq('batch_number', input.batch_number)
        .eq('org_id', currentUser.org_id)
        .single()
      
      if (batchError || !batchLp) {
        return NextResponse.json({ error: 'License plate with batch number not found' }, { status: 404 })
      }
      lpId = batchLp.id
    }

    if (!lpId) {
      return NextResponse.json({ error: 'LP ID or batch number required' }, { status: 400 })
    }

    // Determine if lpId is a UUID or LP number
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidRegex.test(lpId)

    // CRITICAL SECURITY: Verify LP belongs to user's organization
    let query = supabase
      .from('license_plates')
      .select('id, org_id')
    
    if (isUuid) {
      query = query.eq('id', lpId)
    } else {
      query = query.eq('lp_number', lpId)
    }

    const { data: lp, error: lpError } = await query.single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (lp.org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Forbidden: License plate belongs to different organization' },
        { status: 403 }
      )
    }

    const result = await traceForward(lp.id, input.max_depth)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
