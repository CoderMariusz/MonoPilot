// API Route: Planning Settings
// Epic 3 Batch 3A - Story 3.5: Configurable PO Statuses
// GET /api/planning/settings - Get planning settings for org
// PUT /api/planning/settings - Update planning settings

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { planningSettingsSchema, type PlanningSettingsInput } from '@/lib/validation/planning-schemas'
import { ZodError } from 'zod'

// GET /api/planning/settings - Get planning settings
export async function GET(request: NextRequest) {
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

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch planning settings for org
    const { data, error } = await supabaseAdmin
      .from('planning_settings')
      .select('*')
      .eq('org_id', currentUser.org_id)
      .single()

    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabaseAdmin
          .from('planning_settings')
          .insert({
            org_id: currentUser.org_id,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating default planning settings:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ settings: newSettings })
      }

      console.error('Error fetching planning settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Error in GET /api/planning/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/planning/settings - Update planning settings
export async function PUT(request: NextRequest) {
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

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Manager, Admin only
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: PlanningSettingsInput = planningSettingsSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify po_default_status matches one of the status codes
    const defaultStatusExists = validatedData.po_statuses.some(
      status => status.code === validatedData.po_default_status
    )

    if (!defaultStatusExists) {
      return NextResponse.json(
        { error: 'Default status must match one of the configured statuses' },
        { status: 400 }
      )
    }

    // Update settings
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('planning_settings')
      .update(updateData)
      .eq('org_id', currentUser.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating planning settings:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      settings: data,
      message: 'Planning settings updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/settings:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
