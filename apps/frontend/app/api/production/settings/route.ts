// API Route: Production Settings
// Epic 4 Story 4.17 - Production Settings Configuration
// GET /api/production/settings - Get production settings for org
// PUT /api/production/settings - Update production settings

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { ProductionSettingsService, type ProductionSettingsUpdate } from '@/lib/services/production-settings-service'

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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Use service to get settings (handles upsert for new orgs)
    try {
      const settings = await ProductionSettingsService.getProductionSettings(
        supabaseAdmin,
        currentUser.org_id
      )
      return NextResponse.json({ settings })
    } catch (serviceError) {
      console.error('Error fetching production settings:', serviceError)
      return NextResponse.json(
        { error: serviceError instanceof Error ? serviceError.message : 'Failed to fetch settings' },
        { status: 500 }
      )
    }
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

    // Get current user with role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Admin only (per AC-4.17.8)
    // Role is an object from join: { code: string }
    const roleCode = (currentUser.role as { code: string } | null)?.code?.toLowerCase()
    if (roleCode !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json() as ProductionSettingsUpdate

    const supabaseAdmin = createServerSupabaseAdmin()

    // Use service for update (handles validation)
    try {
      const settings = await ProductionSettingsService.updateProductionSettings(
        supabaseAdmin,
        currentUser.org_id,
        body
      )
      return NextResponse.json({
        settings,
        message: 'Production settings updated successfully',
      })
    } catch (serviceError) {
      console.error('Error updating production settings:', serviceError)
      const message = serviceError instanceof Error ? serviceError.message : 'Failed to update settings'

      // Check if validation error
      if (message.includes('must be') || message.includes('Invalid') || message.includes('No fields')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }

      return NextResponse.json({ error: message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in PUT /api/production/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
