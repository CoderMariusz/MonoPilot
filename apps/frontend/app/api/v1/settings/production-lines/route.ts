/**
 * API Route: /api/v1/settings/production-lines
 * Story: 01.11 - Production Lines CRUD
 * Methods: GET (list), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productionLineCreateSchema } from '@/lib/validation/production-line-schemas'
import { ProductionLineService } from '@/lib/services/production-line-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/production-lines
 * List production lines with filters, search, and pagination
 *
 * Query Parameters:
 * - search: Filter by code or name
 * - warehouse_id: Filter by warehouse UUID
 * - status: Filter by status (active, maintenance, inactive, setup)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25, max: 100)
 *
 * Performance Target: < 300ms for 50 lines
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
    const search = searchParams.get('search') || undefined
    const warehouse_id = searchParams.get('warehouse_id') || undefined
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)

    // Call service
    const result = await ProductionLineService.list({
      warehouse_id,
      status,
      search,
      page,
      limit,
    })

    if (!result.success) {
      console.error('Failed to list production lines:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      lines: result.data || [],
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 25,
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/production-lines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/settings/production-lines
 * Create new production line
 *
 * Request Body:
 * - code: string (required, uppercase alphanumeric + hyphens, max 50 chars)
 * - name: string (required, max 100 chars)
 * - description: string (optional, max 500 chars)
 * - warehouse_id: string (required, UUID)
 * - default_output_location_id: string (optional, UUID)
 * - status: enum (optional, default: active)
 * - machine_ids: string[] (optional, UUIDs)
 * - product_ids: string[] (optional, UUIDs)
 *
 * Performance Target: < 500ms
 * Permission: PROD_MANAGER+
 */
export async function POST(request: NextRequest) {
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

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check role permissions - use lowercase role codes as stored in DB
    if (!['owner', 'admin', 'production_manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = productionLineCreateSchema.parse(body)

    // Call service to create line
    const result = await ProductionLineService.create(validatedData)

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('must be unique')) {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/v1/settings/production-lines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
