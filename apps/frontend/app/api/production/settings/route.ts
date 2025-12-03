// API Route: Production Settings
// Epic 4 Story 4.17 - Production Settings Configuration
// GET /api/production/settings - Get production settings for org
// PUT /api/production/settings - Update production settings

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { productionSettingsSchema, type ProductionSettingsInput } from '@/lib/validation/production-schemas'
import { ZodError } from 'zod'

// GET /api/production/settings - Get production settings
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

    // Fetch production settings for org
    const { data, error } = await supabaseAdmin
      .from('production_settings')
      .select('*')
      .eq('organization_id', currentUser.org_id)
      .single()

    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabaseAdmin
          .from('production_settings')
          .insert({
            organization_id: currentUser.org_id,
            allow_pause_wo: true,
            auto_complete_wo: true,
            require_operation_sequence: true,
            require_qa_on_output: true,
            auto_create_by_product_lp: false,
            dashboard_refresh_seconds: 30,
            // Story 4.11: Over-Consumption Control (default: false - conservative)
            allow_over_consumption: false,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating default production settings:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ settings: newSettings })
      }

      console.error('Error fetching production settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Error in GET /api/production/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/production/settings - Update production settings
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

    // Authorization: Admin only (per AC-4.17.8)
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = productionSettingsSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Build update data
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('production_settings')
      .update(updateData)
      .eq('organization_id', currentUser.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating production settings:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      settings: data,
      message: 'Production settings updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/production/settings:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
