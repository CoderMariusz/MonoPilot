/**
 * Cron Job: Cleanup Expired Invitations
 * Story: 1.14 (Batch 3) - AC-1.5: Auto-Cleanup Cron Job
 *
 * Schedule: Weekly (Sunday 2am UTC)
 * Configured in: vercel.json
 *
 * Purpose:
 * - Delete expired invitations that are older than 30 days
 * - Prevent database bloat from old invitation records
 * - Log deletion count for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret (prevent unauthorized access)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      )
    }

    // Check authorization header: "Bearer <CRON_SECRET>"
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Invalid authorization')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting cleanup-invitations job...')

    // 2. Calculate cutoff date (30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 3. Delete expired invitations older than 30 days
    // AC-1.5: WHERE status = 'expired' AND expires_at < NOW() - 30 days
    const { data: deletedInvitations, error: deleteError } = await supabase
      .from('user_invitations')
      .delete()
      .eq('status', 'expired')
      .lt('expires_at', thirtyDaysAgo.toISOString())
      .select('id')

    if (deleteError) {
      console.error('[Cron] Delete failed:', deleteError)
      return NextResponse.json(
        { error: 'Delete operation failed', details: deleteError.message },
        { status: 500 }
      )
    }

    const deletedCount = deletedInvitations?.length || 0

    // 4. Log result for monitoring
    console.log(`[Cron] ✅ Cleanup completed: ${deletedCount} expired invitations deleted`)
    console.log(`[Cron] Cutoff date: ${thirtyDaysAgo.toISOString()}`)

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        deleted_count: deletedCount,
        cutoff_date: thirtyDaysAgo.toISOString(),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Vercel Cron Configuration (vercel.json):
 *
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-invitations",
 *     "schedule": "0 2 * * 0"
 *   }]
 * }
 *
 * Schedule format (cron expression):
 * - "0 2 * * 0" = Sunday at 2:00 AM UTC
 * - Minute Hour Day Month Weekday
 *
 * Authentication:
 * - Vercel automatically adds Authorization header with CRON_SECRET
 * - Set CRON_SECRET in Vercel environment variables
 */
