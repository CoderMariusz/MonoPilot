/**
 * API Response Helpers
 * Story: 01.13 - Tax Codes CRUD (Refactoring)
 *
 * Provides consistent error and success response builders for API routes.
 * Reduces code duplication across routes.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard API error codes with corresponding HTTP status codes
 */
export const API_ERRORS = {
  UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
  USER_NOT_FOUND: { status: 401, message: 'User not found' },
  PERMISSION_DENIED: { status: 403, message: 'Permission denied' },
  NOT_FOUND: { status: 404, message: 'Not found' },
  CONFLICT: { status: 409, message: 'Resource already exists' },
  VALIDATION_FAILED: { status: 400, message: 'Validation failed' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
} as const

type ApiErrorKey = keyof typeof API_ERRORS

/**
 * Creates a standardized error response
 *
 * @param error - Error key from API_ERRORS or custom error message
 * @param customMessage - Optional custom message to override default
 * @returns NextResponse with error JSON and appropriate status code
 *
 * @example
 * ```ts
 * return errorResponse('UNAUTHORIZED')
 * return errorResponse('NOT_FOUND', 'Tax code not found')
 * ```
 */
export function errorResponse(error: ApiErrorKey, customMessage?: string): NextResponse {
  const { status, message } = API_ERRORS[error]
  return NextResponse.json({ error: customMessage || message }, { status })
}

/**
 * Creates an error response from a ZodError validation failure
 *
 * @param zodError - The ZodError instance from schema validation
 * @returns NextResponse with structured validation error details
 *
 * @example
 * ```ts
 * try {
 *   schema.parse(body)
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     return validationErrorResponse(error)
 *   }
 * }
 * ```
 */
export function validationErrorResponse(zodError: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    },
    { status: 400 }
  )
}

/**
 * Creates a standardized success response with data
 *
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON data
 *
 * @example
 * ```ts
 * return successResponse(taxCode)
 * return successResponse(newTaxCode, 201)
 * ```
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Creates a no-content response (204)
 *
 * @returns NextResponse with no body and 204 status
 *
 * @example
 * ```ts
 * return noContentResponse() // For DELETE operations
 * ```
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}
