/**
 * API Error Handler Utility
 * Story: 01.1 - Org Context + Base RLS
 *
 * Centralized error handling for API routes
 * Converts application errors to Next.js JSON responses
 */

import { NextResponse } from 'next/server'
import { AppError } from '@/lib/errors/app-error'

/**
 * Handle error and return appropriate JSON response
 *
 * @param error - Error object (AppError or unknown)
 * @returns NextResponse with error message and status code
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known application errors
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  // Handle unknown errors
  console.error('Unhandled API error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
