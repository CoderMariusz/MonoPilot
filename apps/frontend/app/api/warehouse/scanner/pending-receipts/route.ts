/**
 * Pending Receipts API Route (Story 05.19)
 * GET /api/warehouse/scanner/pending-receipts - List pending POs for receiving
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { pendingReceiptsQuerySchema } from '@/lib/validation/scanner-receive'
import { ScannerReceiveService } from '@/lib/services/scanner-receive-service'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const queryResult = pendingReceiptsQuerySchema.safeParse({
      warehouse_id: searchParams.get('warehouse_id') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const query = queryResult.data

    // Get pending receipts
    const pendingReceipts = await ScannerReceiveService.getPendingReceipts(
      supabase,
      query.warehouse_id
    )

    // Apply search filter if provided
    let filteredReceipts = pendingReceipts
    if (query.search) {
      const search = query.search.toLowerCase()
      filteredReceipts = pendingReceipts.filter(
        (po) =>
          po.po_number.toLowerCase().includes(search) ||
          po.supplier_name.toLowerCase().includes(search)
      )
    }

    // Apply limit
    const limitedReceipts = filteredReceipts.slice(0, query.limit)

    return NextResponse.json({
      success: true,
      data: limitedReceipts,
      total: filteredReceipts.length,
    })
  } catch (error) {
    console.error('Pending receipts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch pending receipts',
        },
      },
      { status: 500 }
    )
  }
}
