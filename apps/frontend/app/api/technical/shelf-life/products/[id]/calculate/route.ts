/**
 * API Route: Shelf Life Calculation
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Endpoints:
 * - POST /api/technical/shelf-life/products/:id/calculate - Calculate from BOM
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateShelfLife } from '@/lib/services/shelf-life-service'

/**
 * POST /api/technical/shelf-life/products/:id/calculate
 * Calculate shelf life from BOM ingredients
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: productId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(productId)) {
      return NextResponse.json(
        { error: 'INVALID_UUID', message: 'Invalid product ID format' },
        { status: 400 }
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
    const allowedRoles = ['admin', 'production_manager', 'quality_manager']

    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body for force_recalculate option
    let forceRecalculate = false
    try {
      const body = await request.json()
      forceRecalculate = body?.force_recalculate === true
    } catch {
      // No body or invalid JSON - that's okay, use defaults
    }

    // Check if product exists in user's org
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate shelf life
    const result = await calculateShelfLife(productId, forceRecalculate)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculating shelf life:', error)

    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('No active BOM found')) {
        return NextResponse.json(
          {
            error: 'NO_ACTIVE_BOM',
            message: 'No active BOM found. Set shelf life manually or create BOM first.',
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Missing shelf life for ingredient')) {
        return NextResponse.json(
          {
            error: 'MISSING_INGREDIENT_SHELF_LIFE',
            message: error.message,
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
