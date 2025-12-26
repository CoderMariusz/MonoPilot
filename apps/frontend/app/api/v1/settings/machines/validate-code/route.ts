/**
 * API Route: /api/v1/settings/machines/validate-code
 * Story: 01.10 - Machines CRUD
 * Method: GET
 *
 * Real-time code uniqueness validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/machines/validate-code
 * Validate machine code uniqueness
 *
 * Query Parameters:
 * - code: string (required) - Code to validate
 * - exclude_id: string (optional) - Machine ID to exclude (for edit mode)
 *
 * Returns:
 * - { available: boolean, code: string }
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

        const orgId = userData.org_id

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get('code')
        const excludeId = searchParams.get('exclude_id') || undefined

        if (!code) {
            return NextResponse.json(
                { error: 'Code parameter is required' },
                { status: 400 }
            )
        }

        // Normalize code to uppercase
        const normalizedCode = code.toUpperCase()

        // Check if code exists
        let query = supabase
            .from('machines')
            .select('id')
            .eq('org_id', orgId)
            .eq('code', normalizedCode)
            .eq('is_deleted', false)

        if (excludeId) {
            query = query.neq('id', excludeId)
        }

        const { data: existingMachines, error } = await query

        if (error) {
            console.error('Failed to validate machine code:', error)
            return NextResponse.json(
                { error: 'Failed to validate code' },
                { status: 500 }
            )
        }

        const available = !existingMachines || existingMachines.length === 0

        return NextResponse.json({
            available,
            code: normalizedCode,
        })
    } catch (error) {
        console.error('Error in GET /api/v1/settings/machines/validate-code:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
