/**
 * API Route: Bulk Shelf Life Recalculation
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Endpoints:
 * - POST /api/technical/shelf-life/bulk-recalculate - Recalculate multiple products
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { bulkRecalculate } from '@/lib/services/shelf-life-service'
import { z } from 'zod'

const bulkRecalculateSchema = z.object({
  product_ids: z.array(z.string().uuid()).optional(),
})

/**
 * POST /api/technical/shelf-life/bulk-recalculate
 * Recalculate shelf life for multiple products
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check role permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role:roles!role_id(code)')
      .eq('id', user.id)
      .single()

    // Handle potential array or single object from Supabase join
    const roleData = userData?.role as unknown as { code: string } | { code: string }[] | null
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    const allowedRoles = ['admin', 'production_manager']

    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    let productIds: string[] | undefined
    try {
      const body = await request.json()
      const validationResult = bulkRecalculateSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Invalid request body' },
          { status: 400 }
        )
      }

      productIds = validationResult.data.product_ids
    } catch {
      // No body - recalculate all flagged products
    }

    // Perform bulk recalculation
    const result = await bulkRecalculate(productIds)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in bulk recalculation:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
