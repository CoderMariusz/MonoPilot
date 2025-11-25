// POST /api/technical/tracing/recall - Recall Simulation API (Story 2.20)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { recallInputSchema } from '@/lib/validation/tracing-schemas'
import { simulateRecall } from '@/lib/services/recall-service'

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

    const orgId = currentUser.org_id

    const body = await request.json()
    const input = recallInputSchema.parse(body)

    const result = await simulateRecall(orgId, input)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Recall simulation error:', error)
    return NextResponse.json(
      { error: error.message || 'Recall simulation failed' },
      { status: 400 }
    )
  }
}
