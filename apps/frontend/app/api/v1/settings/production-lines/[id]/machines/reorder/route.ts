/**
 * API Route: /api/v1/settings/production-lines/[id]/machines/reorder
 * Story: 01.11 - Production Lines CRUD
 * Methods: PATCH (reorder machines)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { machineReorderSchema } from '@/lib/validation/production-line-schemas'
import { ProductionLineService } from '@/lib/services/production-line-service'
import { ZodError } from 'zod'

/**
 * PATCH /api/v1/settings/production-lines/:id/machines/reorder
 * Reorder machines in production line
 *
 * Request Body:
 * - machine_orders: Array<{ machine_id: string, sequence_order: number }>
 *
 * Validation Rules:
 * - Sequences must be 1, 2, 3... (no gaps)
 * - No duplicate sequences
 * - All machines must belong to the line
 *
 * Permission: PROD_MANAGER+
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userRole = (userData.role as any)?.code

    // Check role permissions (SUPER_ADMIN, ADMIN, PROD_MANAGER)
    if (!['SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = machineReorderSchema.parse(body)

    // Call service to reorder machines
    const result = await ProductionLineService.reorderMachines(
      params.id,
      validatedData.machine_orders
    )

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('Invalid sequence')) {
        return NextResponse.json(
          { error: 'Invalid sequence order: sequences must be 1, 2, 3... with no gaps or duplicates' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/v1/settings/production-lines/:id/machines/reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
