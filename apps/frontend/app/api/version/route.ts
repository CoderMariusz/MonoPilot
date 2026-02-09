/**
 * API Route: Version Info
 * GET /api/version - Returns API version information
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const version = {
      version: '1.0.0',
      apiVersion: 'v1',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    }

    return NextResponse.json(version, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[Version] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve version information' },
      { status: 500 }
    )
  }
}
