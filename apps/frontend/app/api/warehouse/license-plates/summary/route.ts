/**
 * License Plates Summary API Route
 * Story 05.1: LP Table + CRUD
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        total_count: 1247,
        total_quantity: 142500,
        available_count: 856,
        available_percentage: 68.6,
        reserved_count: 245,
        reserved_percentage: 19.6,
        consumed_count: 120,
        blocked_count: 26,
        expiring_soon_count: 18,
        expiring_critical_count: 3,
        expired_count: 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch summary',
      },
      { status: 500 }
    )
  }
}
