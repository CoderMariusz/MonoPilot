/**
 * API Route: /api/v1/settings/production-lines/validate-code
 * Story: 01.11 - Production Lines CRUD
 * Methods: GET (validate code uniqueness)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ProductionLineService } from '@/lib/services/production-line-service'

/**
 * GET /api/v1/settings/production-lines/validate-code
 * Validate production line code uniqueness (org-scoped)
 *
 * Query Parameters:
 * - code: string (required) - The code to validate
 * - exclude_id: string (optional) - Line ID to exclude (for edit mode)
 *
 * Response:
 * - valid: boolean - True if code is unique
 * - error: string | null - Error message if code is not unique
 *
 * Use Cases:
 * - Create mode: ?code=NEW-LINE (no exclude_id)
 * - Edit mode: ?code=LINE-A&exclude_id=line-001-uuid (excludes current line)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const exclude_id = searchParams.get('exclude_id') || undefined

    // Validate required parameters
    if (!code) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      )
    }

    // Call service to check code uniqueness
    const isUnique = await ProductionLineService.isCodeUnique(code, exclude_id)

    return NextResponse.json({
      valid: isUnique,
      error: isUnique ? null : 'Line code already exists',
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/production-lines/validate-code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
