/**
 * API Route: List Purchase Orders for Receiving
 * Story 5.32a: Shared Receiving Service
 * GET /api/warehouse/source-documents/po
 *
 * Lists POs in Confirmed or PartiallyReceived status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { listDocumentsForReceiving, getSourceDocument } from '@/lib/services/receiving-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for specific document ID
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')

    if (docId) {
      // Get specific document
      const result = await getSourceDocument(currentUser.org_id, 'po', docId)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, code: result.code },
          { status: result.code === 'NOT_FOUND' ? 404 : 500 }
        )
      }

      return NextResponse.json({ document: result.data })
    }

    // List all documents ready for receiving
    const result = await listDocumentsForReceiving(currentUser.org_id, 'po')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      documents: result.data,
      total: result.data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/source-documents/po:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
