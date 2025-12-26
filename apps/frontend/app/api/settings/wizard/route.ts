import { NextRequest, NextResponse } from 'next/server'
import { WizardService } from '@/lib/services/wizard-service'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/settings/wizard
 * Get wizard progress and completion status
 * AC-012.3, AC-012.4: Progress tracking and resume
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const progress = await WizardService.getProgress(userData.org_id)

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Wizard GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/settings/wizard
 * Save wizard progress
 * AC-012.3: Auto-save per step
 *
 * Body: { step: number, data: object }
 * Auth: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role and get org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    const role = userData?.role as any
    const roleCode = role?.code || role?.[0]?.code
    // Allow admin or owner to save progress
    if (!userData || (roleCode !== 'admin' && roleCode !== 'owner')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { step, data } = body

    if (typeof step !== 'number' || !data) {
      return NextResponse.json(
        { error: 'Invalid request - step and data required' },
        { status: 400 }
      )
    }

    // We use updateProgress to simply persist the state of the wizard
    // This supports the resumable nature of the wizard without necessarily committing side-effects yet
    await WizardService.updateProgress(userData.org_id, step, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wizard POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/settings/wizard
 * Mark wizard as completed
 * AC-012.8: Wizard completion
 *
 * Auth: Admin only
 */
export async function PUT() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    const role = userData?.role as any
    const roleCode = role?.code || role?.[0]?.code
    if (!userData || (roleCode !== 'admin' && roleCode !== 'owner')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const result = await WizardService.completeWizard()

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to complete wizard' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wizard PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
