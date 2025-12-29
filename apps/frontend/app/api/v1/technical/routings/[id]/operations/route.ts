/**
 * Operations API Routes - Story 02.8
 *
 * GET /api/v1/technical/routings/:id/operations - List operations for a routing
 * POST /api/v1/technical/routings/:id/operations - Create operation
 *
 * Auth: Required
 * POST Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 * GET Roles: All authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getOperations,
  createOperation,
} from '@/lib/services/routing-operations-service'
import { operationFormSchema } from '@/lib/validation/operation-schemas'

/**
 * GET /api/v1/technical/routings/:id/operations
 * List all operations for a routing with summary stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: routingId } = await params

    // Get operations with summary
    const result = await getOperations(routingId)

    if (!result.success) {
      const status = result.code === 'ROUTING_NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('GET operations error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/technical/routings/:id/operations
 * Create a new operation for a routing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role for permission check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - need Technical write permission (C for create)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const roleCode = (userData.role as any)?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('C')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: routingId } = await params

    // Parse and validate request body
    const body = await request.json()
    const validationResult = operationFormSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Create operation
    const result = await createOperation(routingId, validationResult.data)

    if (!result.success) {
      const status = result.code === 'ROUTING_NOT_FOUND' ? 404 :
                     result.code === 'VALIDATION_ERROR' ? 400 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json({ operation: result.data }, { status: 201 })
  } catch (error) {
    console.error('POST operation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
