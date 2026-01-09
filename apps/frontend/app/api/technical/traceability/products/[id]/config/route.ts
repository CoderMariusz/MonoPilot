/**
 * API Route: /api/technical/traceability/products/[id]/config
 * Story: 02.10a - Traceability Configuration
 *
 * Endpoints:
 * - GET  - Get product traceability config (returns defaults if none exists)
 * - PUT  - Update/create product traceability config
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { TraceabilityConfigService } from '@/lib/services/traceability-config-service'
import { updateTraceabilityConfigSchema } from '@/lib/validation/traceability'

type RouteContext = {
  params: Promise<{ id: string }>
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/technical/traceability/products/:id/config
 * Get traceability configuration for a product
 * Returns default values if no config exists
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id: productId } = await context.params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate UUID format
    if (!UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { error: 'INVALID_UUID', message: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Get user's org_id for product verification
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', productId)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Get traceability config (returns defaults if none exists)
    const config = await TraceabilityConfigService.getProductTraceabilityConfig(productId)

    return NextResponse.json({
      ...config,
      product: {
        id: product.id,
        code: product.code,
        name: product.name
      }
    })

  } catch (error) {
    console.error('Error in GET /api/technical/traceability/products/[id]/config:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/technical/traceability/products/:id/config
 * Update or create traceability configuration for a product
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id: productId } = await context.params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate UUID format
    if (!UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { error: 'INVALID_UUID', message: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Get user's org_id and role for authorization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles!role_id(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Check role permissions (admin, production_manager, quality_manager can update)
    const roleData = userData?.role as unknown as { code: string } | { code: string }[] | null
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    const allowedRoles = ['admin', 'production_manager', 'quality_manager']

    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', productId)
      .eq('org_id', userData.org_id)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = updateTraceabilityConfigSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Map validation errors to specific error codes
      if (firstError?.path?.includes('lot_number_format')) {
        return NextResponse.json(
          { error: 'INVALID_LOT_FORMAT', message: firstError.message },
          { status: 400 }
        )
      }

      if (firstError?.path?.includes('min_batch_size') ||
          firstError?.path?.includes('max_batch_size') ||
          firstError?.path?.includes('standard_batch_size')) {
        return NextResponse.json(
          { error: 'INVALID_BATCH_SIZE', message: firstError.message },
          { status: 400 }
        )
      }

      if (firstError?.path?.includes('processing_buffer_days')) {
        return NextResponse.json(
          { error: 'INVALID_BUFFER_DAYS', message: firstError.message },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: firstError.message, errors },
        { status: 400 }
      )
    }

    // Update traceability config (upsert)
    const updatedConfig = await TraceabilityConfigService.updateProductTraceabilityConfig(
      productId,
      validationResult.data
    )

    return NextResponse.json({
      ...updatedConfig,
      product: {
        id: product.id,
        code: product.code,
        name: product.name
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/technical/traceability/products/[id]/config:', error)

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
