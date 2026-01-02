/**
 * API Error Handler Utilities
 * Standardized error handling for API routes
 *
 * Refactored from Story 03.10 to reduce duplication across API endpoints
 * Handles WorkOrderError and standard errors with success envelope format
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { WorkOrderError } from '@/lib/services/work-order-service'
import { WOOperationsError } from '@/lib/services/wo-operations-service'
import { GanttError } from '@/lib/services/gantt-service'
import { AuthError } from './auth-helpers'

/**
 * Standard error response format (with success envelope)
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * Standard success response format (with success envelope)
 */
export interface SuccessResponse<T = any> {
  success: true
  data?: T
  meta?: any
  message?: string
}

/**
 * Handle errors in API routes with standardized response format
 *
 * Handles:
 * - AuthError (authentication/authorization errors) - 401/403
 * - ZodError (validation errors) - 400
 * - WorkOrderError (business logic errors) - varies by error
 * - Unknown errors - 500
 *
 * All responses use { success: false, error: {...} } envelope
 *
 * @param error - The caught error
 * @param context - Optional context for logging (e.g., "GET /api/work-orders")
 * @returns NextResponse with standardized error format
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ErrorResponse> {
  // Auth/permission errors
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status }
    )
  }

  // Validation errors from Zod
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors,
        },
      },
      { status: 400 }
    )
  }

  // Business logic errors from WorkOrderService
  if (error instanceof WorkOrderError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status }
    )
  }

  // Business logic errors from WOOperationsService
  if (error instanceof WOOperationsError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status }
    )
  }

  // Business logic errors from GanttService
  if (error instanceof GanttError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status }
    )
  }

  // Unknown errors - log and return generic 500
  const errorContext = context || 'API request'
  console.error(`Unexpected error in ${errorContext}:`, error)

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    { status: 500 }
  )
}

/**
 * Create standardized success response
 *
 * @param data - Response data (optional)
 * @param options - Optional status, message, or meta
 * @returns NextResponse with { success: true, data, meta, message } envelope
 */
export function successResponse<T>(
  data?: T,
  options?: { status?: number; message?: string; meta?: any }
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
  }

  if (data !== undefined) {
    response.data = data
  }

  if (options?.message) {
    response.message = options.message
  }

  if (options?.meta) {
    response.meta = options.meta
  }

  return NextResponse.json(response, { status: options?.status || 200 })
}

/**
 * Create unauthorized error response (401)
 */
export function unauthorizedResponse(): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    },
    { status: 401 }
  )
}

/**
 * Create forbidden error response (403)
 */
export function forbiddenResponse(message = 'Insufficient permissions'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 }
  )
}

/**
 * Create not found error response (404)
 */
export function notFoundResponse(message = 'Resource not found'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
      },
    },
    { status: 404 }
  )
}

/**
 * Create user not found error response (404)
 */
export function userNotFoundResponse(): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    },
    { status: 404 }
  )
}
