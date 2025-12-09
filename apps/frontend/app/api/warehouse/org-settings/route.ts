// API Route: Warehouse Organization Settings
// Epic 5: Warehouse Management
// Story 5.31: Warehouse Settings Configuration
// GET /api/warehouse/org-settings - Get warehouse settings for org
// PUT /api/warehouse/org-settings - Update warehouse settings

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

// GET /api/warehouse/org-settings - Get warehouse settings
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

    // Fetch warehouse settings for org
    const { data, error } = await supabaseAdmin
      .from('warehouse_settings')
      .select('*')
      .eq('org_id', currentUser.org_id)
      .single()

    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabaseAdmin
          .from('warehouse_settings')
          .insert({
            org_id: currentUser.org_id,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating default warehouse settings:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ settings: newSettings })
      }

      console.error('Error fetching warehouse settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Error in GET /api/warehouse/org-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/warehouse/org-settings - Update warehouse settings
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

    // Authorization: Admin only
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    const supabaseAdmin = createServerSupabaseAdmin()

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Add all allowed fields from body
    const allowedFields = [
      'lp_number_format',
      'auto_print_labels',
      'allow_over_receipt',
      'over_receipt_tolerance_pct',
      'scanner_session_timeout_mins',
      'scanner_warning_timeout_secs',
      'max_offline_operations',
      'offline_warning_threshold_pct',
      'barcode_format_lp',
      'barcode_format_product',
      'barcode_format_location',
      'printer_config',
      'zpl_label_template',
      'barcode_patterns',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate percentage fields (0-100)
    if (updateData.over_receipt_tolerance_pct !== undefined) {
      const val = Number(updateData.over_receipt_tolerance_pct)
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json(
          { error: 'over_receipt_tolerance_pct must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    if (updateData.offline_warning_threshold_pct !== undefined) {
      const val = Number(updateData.offline_warning_threshold_pct)
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json(
          { error: 'offline_warning_threshold_pct must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Validate timeout ranges
    if (updateData.scanner_session_timeout_mins !== undefined) {
      const val = Number(updateData.scanner_session_timeout_mins)
      if (isNaN(val) || val < 1 || val > 60) {
        return NextResponse.json(
          { error: 'scanner_session_timeout_mins must be between 1 and 60' },
          { status: 400 }
        )
      }
    }

    if (updateData.scanner_warning_timeout_secs !== undefined) {
      const val = Number(updateData.scanner_warning_timeout_secs)
      if (isNaN(val) || val < 1 || val > 60) {
        return NextResponse.json(
          { error: 'scanner_warning_timeout_secs must be between 1 and 60' },
          { status: 400 }
        )
      }
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('warehouse_settings')
      .update(updateData)
      .eq('org_id', currentUser.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating warehouse settings:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      settings: data,
      message: 'Warehouse settings updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/warehouse/org-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
