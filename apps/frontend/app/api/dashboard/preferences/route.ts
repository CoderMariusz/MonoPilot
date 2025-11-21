import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z, ZodError } from 'zod'

/**
 * Dashboard Preferences API Route
 * Story: 1.13 Main Dashboard
 * Task 3: API Endpoints
 *
 * GET /api/dashboard/preferences - Get user preferences
 * PUT /api/dashboard/preferences - Update user preferences
 */

// ============================================================================
// Validation Schema
// ============================================================================

const DashboardConfigSchema = z.object({
  module_order: z.array(z.string()).optional(),
  pinned_modules: z.array(z.string()).optional(),
  show_activity_feed: z.boolean().optional(),
})

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>

export interface UserPreferences {
  user_id: string
  dashboard_config: DashboardConfig
  updated_at: string
}

// ============================================================================
// GET /api/dashboard/preferences - Get User Preferences (AC-012.5)
// ============================================================================

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

    // Get user preferences
    const { data: preferences, error: queryError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    // If preferences don't exist, create default ones
    if (queryError && queryError.code === 'PGRST116') {
      // No rows returned - create default preferences
      const { data: newPreferences, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: session.user.id,
          dashboard_config: {
            module_order: [
              'settings',
              'technical',
              'planning',
              'production',
              'warehouse',
              'quality',
              'shipping',
              'npd',
            ],
            pinned_modules: [],
            show_activity_feed: true,
          },
        })
        .select()
        .single()

      if (insertError || !newPreferences) {
        console.error('Failed to create default preferences:', insertError)
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { preferences: newPreferences },
        { status: 200 }
      )
    }

    if (queryError) {
      console.error('Failed to fetch preferences:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preferences }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/dashboard/preferences:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/dashboard/preferences - Update User Preferences (AC-012.5)
// ============================================================================

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = DashboardConfigSchema.parse(body)

    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('dashboard_config')
      .eq('user_id', session.user.id)
      .single()

    if (!existingPreferences) {
      // Create new preferences with validated data
      const { data: newPreferences, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: session.user.id,
          dashboard_config: validatedData,
        })
        .select()
        .single()

      if (insertError || !newPreferences) {
        console.error('Failed to create preferences:', insertError)
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          preferences: newPreferences,
          message: 'Preferences created successfully',
        },
        { status: 201 }
      )
    }

    // Merge existing config with new data (partial update)
    const updatedConfig = {
      ...existingPreferences.dashboard_config,
      ...validatedData,
    }

    // Update existing preferences
    const { data: updatedPreferences, error: updateError } = await supabase
      .from('user_preferences')
      .update({ dashboard_config: updatedConfig })
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError || !updatedPreferences) {
      console.error('Failed to update preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        preferences: updatedPreferences,
        message: 'Preferences updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/dashboard/preferences:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
