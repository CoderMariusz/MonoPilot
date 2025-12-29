/**
 * API Route: Shelf Life Audit Log
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Endpoints:
 * - GET /api/technical/shelf-life/products/:id/audit - Get audit log
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuditLog, getShelfLifeConfig } from '@/lib/services/shelf-life-service'

/**
 * GET /api/technical/shelf-life/products/:id/audit
 * Get audit log for shelf life changes
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

    // Check if product exists in user's org
    const config = await getShelfLifeConfig(productId)
    if (!config) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    // Get audit log
    const auditLog = await getAuditLog(productId, limit, offset)

    return NextResponse.json(auditLog)
  } catch (error) {
    console.error('Error getting audit log:', error)

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
