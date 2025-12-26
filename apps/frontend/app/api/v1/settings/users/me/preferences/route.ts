/**
 * API Route: User Preferences (Current User)
 * Story: TD-208 - Language Selector for Allergen Names
 *
 * Endpoints:
 * - GET /api/v1/settings/users/me/preferences - Get current user's preferences
 * - PUT /api/v1/settings/users/me/preferences - Update current user's preferences
 *
 * Preferences include:
 * - language: User's preferred language for UI and data display
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  isValidLanguageCode,
  VALID_LANGUAGE_CODES,
  type LanguageCode,
} from '@/lib/services/user-preference-service'

/**
 * GET /api/v1/settings/users/me/preferences
 *
 * Returns current user's preferences including language.
 *
 * Response: 200 OK with { language: LanguageCode }
 * Error: 401 Unauthorized if not authenticated
 *        500 Internal Server Error on database failure
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's language using RPC function (includes fallback chain)
    const { data: language, error: rpcError } = await supabase
      .rpc('get_user_language', { p_user_id: user.id })

    if (rpcError) {
      console.error('[User Preferences API] Failed to get language:', rpcError)
      // Return default on error
      return NextResponse.json({
        language: 'en' as LanguageCode,
      }, { status: 200 })
    }

    return NextResponse.json({
      language: (language || 'en') as LanguageCode,
    }, { status: 200 })
  } catch (error) {
    console.error('[User Preferences API] Unexpected error in GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/settings/users/me/preferences
 *
 * Updates current user's preferences.
 *
 * Request body: { language?: LanguageCode }
 * Response: 200 OK with updated preferences
 * Error: 400 Bad Request if invalid language code
 *        401 Unauthorized if not authenticated
 *        500 Internal Server Error on database failure
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: { language?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate language if provided
    if (body.language !== undefined) {
      if (!isValidLanguageCode(body.language)) {
        return NextResponse.json(
          {
            error: `Invalid language code: ${body.language}. Valid codes: ${VALID_LANGUAGE_CODES.join(', ')}`,
            code: 'INVALID_LANGUAGE',
          },
          { status: 400 }
        )
      }

      // Update language using RPC function
      const { error: rpcError } = await supabase
        .rpc('set_user_language', { p_language: body.language })

      if (rpcError) {
        console.error('[User Preferences API] Failed to set language:', rpcError)

        // Handle specific errors
        if (rpcError.message.includes('Not authenticated')) {
          return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
          )
        }

        if (rpcError.message.includes('Invalid language code')) {
          return NextResponse.json(
            { error: rpcError.message, code: 'INVALID_LANGUAGE' },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to update preferences', details: rpcError.message },
          { status: 500 }
        )
      }
    }

    // Return updated preferences
    const { data: updatedLanguage } = await supabase
      .rpc('get_user_language', { p_user_id: user.id })

    return NextResponse.json({
      language: (updatedLanguage || 'en') as LanguageCode,
      message: 'Preferences updated successfully',
    }, { status: 200 })
  } catch (error) {
    console.error('[User Preferences API] Unexpected error in PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/settings/users/me/preferences
 *
 * Not supported - use PUT instead
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use PUT to update preferences.' },
    { status: 405, headers: { 'Allow': 'GET, PUT' } }
  )
}

/**
 * DELETE /api/v1/settings/users/me/preferences
 *
 * Not supported - preferences cannot be deleted
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Preferences cannot be deleted.' },
    { status: 405, headers: { 'Allow': 'GET, PUT' } }
  )
}
