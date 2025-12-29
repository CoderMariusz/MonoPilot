/**
 * API Route: /api/v1/settings/production-lines/[id]
 * Story: 01.11 - Production Lines CRUD
 * Methods: GET (getById), PUT (update), DELETE (delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productionLineUpdateSchema } from '@/lib/validation/production-line-schemas'
import { ProductionLineService } from '@/lib/services/production-line-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/production-lines/:id
 * Get single production line by ID with machines, products, and capacity
 *
 * Returns 404 for cross-org access (not 403)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Call service to get line by ID
    const result = await ProductionLineService.getById(params.id, supabase)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 })
    }

    // Verify org_id matches (RLS should handle this, but double-check)
    if (result.data.org_id !== userData.org_id) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/production-lines/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/settings/production-lines/:id
 * Update production line
 *
 * Request Body: Partial<CreateProductionLineInput>
 *
 * Business Rules:
 * - Code cannot be changed if work orders exist
 * - Code must remain unique (org-scoped)
 *
 * Permission: PROD_MANAGER+
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const validatedData = productionLineUpdateSchema.parse(body)

    // Call service to update line
    const result = await ProductionLineService.update(params.id, validatedData, supabase)

    if (!result.success) {
      // Check for specific error types
      if (result.error === 'Line not found') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      if (result.error?.includes('must be unique')) {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }
      if (result.error?.includes('Code cannot be changed')) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/v1/settings/production-lines/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/settings/production-lines/:id
 * Delete production line
 *
 * Business Rules:
 * - Cannot delete if line has work orders
 * - CASCADE deletes machine assignments and product compatibility records
 *
 * Performance Target: < 500ms
 * Permission: ADMIN+ only (not PROD_MANAGER)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check role permissions - use lowercase role codes (ADMIN+ only)
    if (!['owner', 'admin'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Call service to delete line
    const result = await ProductionLineService.delete(params.id, supabase)

    if (!result.success) {
      // Check for specific error types
      if (result.error === 'Line not found') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      if (result.error?.includes('active work orders')) {
        return NextResponse.json(
          { error: 'Line has active work orders and cannot be deleted' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/v1/settings/production-lines/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
