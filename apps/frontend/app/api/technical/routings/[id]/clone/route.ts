import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { cloneRouting } from '@/lib/services/routing-service'
import { z } from 'zod'

/**
 * Clone Routing API Route - Story 02.7
 *
 * POST /api/technical/routings/:id/clone
 * Clones a routing with all operations
 *
 * AC-02.7.20: Clone creates new routing with operations
 */

const cloneRoutingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceRoutingId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract role code from joined roles table
    const roleData = currentUser.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = cloneRoutingSchema.parse(body)

    // Call service method
    const result = await cloneRouting(sourceRoutingId, validatedData)

    if (!result.success) {
      // 404: Source routing not found
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Source routing not found' },
          { status: 404 }
        )
      }

      // 409: Duplicate name
      if (result.code === 'DUPLICATE_NAME') {
        return NextResponse.json(
          { error: result.error || 'Routing with this name already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to clone routing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: `Routing cloned successfully with ${result.data?.operationsCount || 0} operations`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/routings/:id/clone:', error)

    if (error instanceof z.ZodError) {
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
