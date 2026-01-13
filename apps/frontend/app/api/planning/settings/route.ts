// API Route: Planning Settings
// Epic 3 Batch 3A - Story 3.5: Configurable PO Statuses
// GET /api/planning/settings - Get planning settings for org
// PUT /api/planning/settings - Update planning settings

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { planningSettingsSchema, woSettingsSchema, type PlanningSettingsInput, type WOSettingsInput } from '@/lib/validation/planning-schemas'
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
      .select('org_id, role:roles(code)')
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Manager, Admin only
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!['manager', 'admin'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    const supabaseAdmin = createServerSupabaseAdmin()

    // Build update data - support both PO and WO settings
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Validate PO settings if present
    if (body.po_statuses !== undefined) {
      const poData = planningSettingsSchema.parse(body)

      // Verify po_default_status matches one of the status codes
      const poDefaultExists = poData.po_statuses.some(
        status => status.code === poData.po_default_status
      )
      if (!poDefaultExists) {
        return NextResponse.json(
          { error: 'PO default status must match one of the configured statuses' },
          { status: 400 }
        )
      }

      Object.assign(updateData, {
        po_statuses: poData.po_statuses,
        po_default_status: poData.po_default_status,
        po_require_approval: poData.po_require_approval,
        po_approval_threshold: poData.po_approval_threshold,
        po_payment_terms_visible: poData.po_payment_terms_visible,
        po_shipping_method_visible: poData.po_shipping_method_visible,
        po_notes_visible: poData.po_notes_visible,
      })
    }

    // Validate WO settings if present (Story 3.15)
    if (body.wo_statuses !== undefined) {
      const woData = woSettingsSchema.parse(body)

      // Verify wo_default_status matches one of the status codes
      const woDefaultExists = woData.wo_statuses.some(
        status => status.code === woData.wo_default_status
      )
      if (!woDefaultExists) {
        return NextResponse.json(
          { error: 'WO default status must match one of the configured statuses' },
          { status: 400 }
        )
      }

      Object.assign(updateData, {
        wo_statuses: woData.wo_statuses,
        wo_default_status: woData.wo_default_status,
        wo_status_expiry_days: woData.wo_status_expiry_days,
      })
    }

    // Handle wo_status_expiry_days update alone
    if (body.wo_status_expiry_days !== undefined && body.wo_statuses === undefined) {
      updateData.wo_status_expiry_days = body.wo_status_expiry_days
    }

    // Handle wo_source_of_demand toggle (Story 3.16)
    if (body.wo_source_of_demand !== undefined) {
      updateData.wo_source_of_demand = body.wo_source_of_demand
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
