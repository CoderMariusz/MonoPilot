/**
 * React Testing Utilities & Mocks
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 *
 * Provides mock components and utilities for testing permission-based React hooks
 */

import React, { ReactNode, FC } from 'react'
import type { SystemRole } from '@/lib/constants/roles'

/**
 * Mock user object for testing
 */
export interface MockUser {
  id: string
  email: string
  role: SystemRole | null
}

/**
 * Mock auth context value
 */
export interface MockAuthContextValue {
  user: MockUser | null
  isLoading: boolean
  error?: Error | null
}

/**
 * Options for creating mock auth context
 */
export interface CreateMockAuthContextOptions {
  role?: SystemRole | null
  user?: MockUser | null
  isLoading?: boolean
  error?: Error | null
  onFetchPermissions?: () => void
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  const role = overrides?.role || 'viewer'
  return {
    id: overrides?.id || `user-${role}`,
    email: overrides?.email || `${role}@test.com`,
    role,
    ...overrides,
  }
}

/**
 * Create a mock OrgContext wrapper for testing
 *
 * Usage:
 * ```tsx
 * const { result } = renderHook(() => usePermissions(), {
 *   wrapper: createMockAuthContext({ role: 'admin' }),
 * })
 * ```
 */
export function createMockAuthContext(
  options: CreateMockAuthContextOptions = {},
  callbacks: { onFetchPermissions?: () => void } = {}
): FC<{ children: ReactNode }> {
  const {
    role = 'viewer',
    user: userOverride,
    isLoading = false,
    error = null,
  } = options

  // Determine mock user: use userOverride if explicitly provided, otherwise create from role
  const mockUser = userOverride !== undefined ? userOverride : (role ? createMockUser({ role }) : null)

  // Create a mock OrgContext that useOrgContext will use
  const MockOrgContext = React.createContext<{
    user: MockUser | null
    isLoading: boolean
    error?: Error | null
  }>({
    user: mockUser,
    isLoading,
    error,
  })

  // Store the context so we can mock useOrgContext to use it
  ;(globalThis as any).__MOCK_ORG_CONTEXT__ = MockOrgContext
  ;(globalThis as any).__MOCK_USER__ = mockUser

  const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    React.useEffect(() => {
      callbacks.onFetchPermissions?.()
    }, [])

    return (
      <MockOrgContext.Provider value={{ user: mockUser, isLoading, error }}>
        {children}
      </MockOrgContext.Provider>
    )
  }

  return AuthProvider
}

/**
 * Get auth context for testing permission hooks
 */
export const useAuthContext = () => {
  const context = React.useContext(
    React.createContext<{ user: MockUser | null; isLoading: boolean; error?: Error | null }>({
      user: null,
      isLoading: false,
    })
  )
  return context
}

/**
 * Mock fetch for API testing
 */
export class MockFetch {
  private responses: Map<string, Response> = new Map()

  setResponse(url: string, response: Response) {
    this.responses.set(url, response)
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const response = this.responses.get(url)
    if (!response) {
      return new Response('Not found', { status: 404 })
    }
    return response
  }
}

/**
 * Create mock websocket for permission updates
 */
export class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.OPEN

  onopen: ((this: MockWebSocket, ev: Event) => void) | null = null
  onclose: ((this: MockWebSocket, ev: Event) => void) | null = null
  onerror: ((this: MockWebSocket, ev: Event) => void) | null = null
  onmessage: ((this: MockWebSocket, ev: MessageEvent) => void) | null = null

  constructor(public url: string) {}

  send(data: string | ArrayBufferLike) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new Event('close'))
  }

  simulateMessage(data: any) {
    this.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify(data),
      })
    )
  }

  simulateError(error: string) {
    this.onerror?.(new Event('error'))
  }
}

/**
 * Verify permissions in test assertions
 */
export function expectPermission(
  result: any,
  role: SystemRole,
  module: string,
  action: 'C' | 'R' | 'U' | 'D',
  expectedValue: boolean
) {
  expect(result.current.can(module as any, action)).toBe(expectedValue)
}
