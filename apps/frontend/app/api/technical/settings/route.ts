/**
 * API Route: /api/technical/settings
 * Story 2.22: Technical Settings - Get and Update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { technicalSettingsSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

// GET /api/technical/settings - Get technical module settings
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Fetch settings
    const { data, error } = await supabase
      .from('technical_settings')
      .select(`
        *,
        updated_by_user:users!technical_settings_updated_by_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('org_id', orgId)
      .single()

    // If settings don't exist, create default settings
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('technical_settings')
        .insert({
          org_id: orgId,
          updated_by: session.user.id
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create settings', details: createError.message },
          { status: 500 }
        )
      }

      return NextResponse.json(newSettings)
    }

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      )
    }

    const { updated_by_user, ...settings } = data

    return NextResponse.json({
      ...settings,
      updated_by: updated_by_user
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/technical/settings - Update technical settings
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id and check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Check if user is admin (only admins can update settings)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update technical settings' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validated = technicalSettingsSchema.parse(body)

    // Update or insert settings (upsert)
    const { data, error } = await supabase
      .from('technical_settings')
      .upsert({
        org_id: orgId,
        ...validated,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in PUT /api/technical/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
