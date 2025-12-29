/**
 * API Route: Shelf Life Product Configuration
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Endpoints:
 * - GET /api/technical/shelf-life/products/:id - Get shelf life config
 * - PUT /api/technical/shelf-life/products/:id - Update shelf life config
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getShelfLifeConfig,
  updateShelfLifeConfig,
} from '@/lib/services/shelf-life-service'
import { updateShelfLifeConfigSchema } from '@/lib/validation/shelf-life-schemas'

/**
 * GET /api/technical/shelf-life/products/:id
 * Get shelf life configuration for a product
 */
export async function GET(
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

    const config = await getShelfLifeConfig(productId)

    if (!config) {
      // Return 404 for product not found (includes cross-org access per AC-11.19)
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error getting shelf life config:', error)

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

/**
 * PUT /api/technical/shelf-life/products/:id
 * Update shelf life configuration (including override)
 */
export async function PUT(
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateShelfLifeConfigSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Map validation errors to API error codes
      if (firstError?.path?.includes('override_reason')) {
        return NextResponse.json(
          { error: 'OVERRIDE_REASON_REQUIRED', message: firstError.message },
          { status: 400 }
        )
      }

      if (firstError?.path?.includes('storage_temp')) {
        return NextResponse.json(
          { error: 'INVALID_TEMP_RANGE', message: firstError.message },
          { status: 400 }
        )
      }

      if (firstError?.path?.includes('storage_humidity')) {
        return NextResponse.json(
          { error: 'INVALID_HUMIDITY_RANGE', message: firstError.message },
          { status: 400 }
        )
      }

      if (firstError?.path?.includes('expiry')) {
        return NextResponse.json(
          { error: 'INVALID_EXPIRY_THRESHOLD', message: firstError.message },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: firstError.message, errors },
        { status: 400 }
      )
    }

    // Check if product exists first
    const existingConfig = await getShelfLifeConfig(productId)
    if (!existingConfig) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Update configuration
    const updatedConfig = await updateShelfLifeConfig(productId, validationResult.data)

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Error updating shelf life config:', error)

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
