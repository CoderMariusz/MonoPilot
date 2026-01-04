/**
 * API Testing Utilities & Mocks
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 *
 * Provides mock Request/Response objects for testing API endpoints
 */

import type { SystemRole } from '@/lib/constants/roles'

/**
 * Mock user for API requests
 */
export interface MockRequestUser {
  id: string
  email: string
  role: SystemRole
  org_id: string
}

/**
 * Options for creating a mock request
 */
export interface CreateMockRequestOptions {
  user?: MockRequestUser | null
  body?: any
  headers?: Record<string, string>
  query?: Record<string, string>
  method?: string
}

/**
 * Create a mock Request object for API testing
 *
 * Usage:
 * ```ts
 * const req = createMockRequest('POST', '/api/v1/production/work-orders', {
 *   user: createMockUser({ role: 'owner' }),
 *   body: { product_id: '123', quantity: 100 },
 * })
 * ```
 */
export function createMockRequest(
  method: string,
  url: string,
  options: CreateMockRequestOptions = {}
): Request {
  const {
    user = createMockUser({ role: 'viewer' }),
    body = undefined,
    headers = {},
    query = {},
  } = options

  // Build URL with query params
  const queryString = Object.entries(query)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  let fullUrl = queryString ? `${url}?${queryString}` : url

  // Handle relative URLs for testing
  if (!fullUrl.startsWith('http')) {
    fullUrl = `http://localhost:3000${fullUrl}`
  }

  // Prepare headers
  const finalHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  })

  // Add auth header if user provided
  if (user) {
    finalHeaders.set('X-User-ID', user.id)
    finalHeaders.set('X-User-Email', user.email)
    finalHeaders.set('X-User-Role', user.role)
    finalHeaders.set('X-Org-ID', user.org_id)
  }

  // Create request body
  const requestBody = body ? JSON.stringify(body) : undefined

  return new Request(fullUrl, {
    method,
    headers: finalHeaders,
    body: requestBody,
  })
}

/**
 * Create a mock user for API requests
 */
export function createMockUser(overrides?: Partial<MockRequestUser>): MockRequestUser {
  const role = overrides?.role || 'viewer'
  return {
    id: overrides?.id || `user-${role}`,
    email: overrides?.email || `${role}@test.com`,
    role: role as SystemRole,
    org_id: overrides?.org_id || 'org-123',
    ...overrides,
  }
}

/**
 * Create a mock Response object
 */
export function createMockResponse(
  data: any,
  options: {
    status?: number
    headers?: Record<string, string>
  } = {}
): Response {
  const { status = 200, headers = {} } = options

  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  })

  const body = JSON.stringify(data)

  return new Response(body, {
    status,
    headers: responseHeaders,
  })
}

/**
 * Create a mock error response
 */
export function createMockErrorResponse(
  error: string,
  statusCode: number = 403,
  additionalData: any = {}
): Response {
  const errorData = {
    error,
    status: statusCode,
    ...additionalData,
  }

  return createMockResponse(errorData, { status: statusCode })
}

/**
 * Extract user from mock request
 */
export function extractUserFromRequest(req: Request): MockRequestUser | null {
  const userId = req.headers.get('X-User-ID')
  const userEmail = req.headers.get('X-User-Email')
  const userRole = req.headers.get('X-User-Role')
  const orgId = req.headers.get('X-Org-ID')

  if (!userId || !userEmail || !userRole || !orgId) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole as SystemRole,
    org_id: orgId,
  }
}

/**
 * Parse request body as JSON
 */
export async function parseRequestBody(req: Request): Promise<any> {
  try {
    const contentType = req.headers.get('Content-Type')
    if (!contentType?.includes('application/json')) {
      return null
    }
    return await req.clone().json()
  } catch {
    return null
  }
}

/**
 * Mock fetch implementation for testing
 */
export async function mockFetch(
  url: string | Request,
  init?: RequestInit
): Promise<Response> {
  // This would be overridden by tests
  return new Response('Not implemented', { status: 501 })
}
