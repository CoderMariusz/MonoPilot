/**
 * Unit Tests: Session Service
 * Story: 01.15 - Session & Password Management
 *
 * Tests session management functionality:
 * - Session token generation (256-bit entropy)
 * - Session creation with device info
 * - Session validation (active, expired, revoked)
 * - Session termination (single and bulk)
 * - User agent parsing
 *
 * Coverage Target: >90% (security critical)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  parseUserAgent,
  isSessionExpired,
  createSession,
  getSession,
  getSessions,
  getCurrentSession,
  validateSession,
  terminateSession,
  terminateAllSessions,
  updateLastActivity,
} from '../session-service'
import type { Session, DeviceInfo } from '@/lib/types/session'

// Mock Supabase client factory
function createMockSupabase(overrides: Record<string, any> = {}): SupabaseClient {
  const defaultMock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    limit: vi.fn().mockReturnThis(),
  }

  return { ...defaultMock, ...overrides } as unknown as SupabaseClient
}

// Test fixtures
const mockDeviceInfo: DeviceInfo = {
  device_type: 'Desktop',
  device_name: 'Windows',
  browser: 'Chrome',
  os: 'Windows 10',
  ip_address: '192.168.1.100',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

const mockSession: Session = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-uuid-1',
  org_id: 'org-uuid-1',
  session_token: 'a'.repeat(64),
  device_type: 'Desktop',
  device_name: 'Windows',
  browser: 'Chrome',
  os: 'Windows 10',
  ip_address: '192.168.1.100',
  user_agent: 'Mozilla/5.0...',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  last_activity_at: new Date().toISOString(),
  revoked_at: null,
  revoked_by: null,
  revocation_reason: null,
}

describe('Session Service', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-08T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('parseUserAgent', () => {
    it('should parse Chrome on Windows correctly', () => {
      // GIVEN Chrome browser user agent on Windows
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const ipAddress = '192.168.1.100'

      // WHEN parsing user agent
      const result = parseUserAgent(userAgent, ipAddress)

      // THEN device info is extracted correctly
      expect(result.device_type).toBe('Desktop')
      expect(result.browser).toBe('Chrome')
      expect(result.os).toBe('Windows')
      expect(result.ip_address).toBe('192.168.1.100')
      expect(result.user_agent).toBe(userAgent)
    })

    it('should parse Safari on iPhone correctly', () => {
      // GIVEN Safari browser user agent on iPhone
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      const ipAddress = '10.0.0.50'

      // WHEN parsing user agent
      const result = parseUserAgent(userAgent, ipAddress)

      // THEN identifies as mobile device
      expect(result.device_type).toBe('Mobile')
      expect(result.browser).toBe('Mobile Safari')
      expect(result.os).toBe('iOS')
      expect(result.ip_address).toBe('10.0.0.50')
    })

    it('should parse Firefox on Mac correctly', () => {
      // GIVEN Firefox browser on macOS
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
      const ipAddress = '172.16.0.1'

      // WHEN parsing user agent
      const result = parseUserAgent(userAgent, ipAddress)

      // THEN identifies as desktop with Firefox
      expect(result.device_type).toBe('Desktop')
      expect(result.browser).toBe('Firefox')
      expect(result.os).toBe('macOS')
    })

    it('should handle null IP address', () => {
      // GIVEN user agent with null IP
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0)'
      const ipAddress = null

      // WHEN parsing user agent
      const result = parseUserAgent(userAgent, ipAddress)

      // THEN IP address is null
      expect(result.ip_address).toBeNull()
    })

    it('should handle unknown/malformed user agents', () => {
      // GIVEN malformed user agent
      const userAgent = 'Unknown Browser/1.0'
      const ipAddress = '127.0.0.1'

      // WHEN parsing user agent
      const result = parseUserAgent(userAgent, ipAddress)

      // THEN returns best-effort parse
      expect(result.device_type).toBe('Desktop')
      expect(result.user_agent).toBe(userAgent)
      expect(result.ip_address).toBe('127.0.0.1')
    })

    it('should parse tablet device correctly', () => {
      // GIVEN iPad user agent
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      const ipAddress = '192.168.1.50'

      // WHEN parsing user agent
      const result = parseUserAgent(userAgent, ipAddress)

      // THEN identifies as tablet
      expect(result.device_type).toBe('Tablet')
      expect(result.device_name).toBe('Apple iPad')
    })
  })

  describe('isSessionExpired', () => {
    it('should return false for non-expired session', () => {
      // GIVEN session with future expiry
      const session: Session = {
        ...mockSession,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      }

      // WHEN checking if expired
      const expired = isSessionExpired(session)

      // THEN returns false
      expect(expired).toBe(false)
    })

    it('should return true for expired session', () => {
      // GIVEN session with past expiry
      const session: Session = {
        ...mockSession,
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      }

      // WHEN checking if expired
      const expired = isSessionExpired(session)

      // THEN returns true
      expect(expired).toBe(true)
    })

    it('should return false for session expiring exactly now (boundary case)', () => {
      // GIVEN session expiring now
      const session: Session = {
        ...mockSession,
        expires_at: new Date(Date.now()).toISOString(),
      }

      // WHEN checking if expired
      const expired = isSessionExpired(session)

      // THEN returns false (strictly less than comparison)
      // Note: Implementation uses < comparison, so exact same time is not expired
      expect(expired).toBe(false)
    })

    it('should handle session expiring in 1 second (not yet expired)', () => {
      // GIVEN session expiring in 1 second
      const session: Session = {
        ...mockSession,
        expires_at: new Date(Date.now() + 1000).toISOString(),
      }

      // WHEN checking if expired
      const expired = isSessionExpired(session)

      // THEN returns false
      expect(expired).toBe(false)
    })
  })

  describe('createSession', () => {
    it('should create session with default 24-hour timeout', async () => {
      // GIVEN supabase mock that returns created session
      const mockSupabase = createMockSupabase()
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
        }),
      })
      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { session_timeout_hours: null }, error: null }),
          }),
        }),
        insert: insertMock,
      })
      mockSupabase.from = fromMock

      // WHEN creating session
      const result = await createSession(
        mockSupabase,
        'user-uuid-1',
        'org-uuid-1',
        mockDeviceInfo
      )

      // THEN session is created
      expect(result).toBeDefined()
      expect(fromMock).toHaveBeenCalledWith('organizations')
      expect(fromMock).toHaveBeenCalledWith('user_sessions')
    })

    it('should use organization-specific timeout when configured', async () => {
      // GIVEN org with 8-hour session timeout
      const mockSupabase = createMockSupabase()
      const insertedData: any = {}
      const insertMock = vi.fn().mockImplementation((data) => {
        Object.assign(insertedData, data)
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }
      })
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { session_timeout_hours: 8 },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          insert: insertMock,
        }
      })
      mockSupabase.from = fromMock

      // WHEN creating session
      await createSession(
        mockSupabase,
        'user-uuid-1',
        'org-uuid-1',
        mockDeviceInfo
      )

      // THEN insert was called with 8-hour expiry
      expect(insertMock).toHaveBeenCalled()
      const insertArg = insertMock.mock.calls[0][0]
      const expiresAt = new Date(insertArg.expires_at)
      const now = new Date()
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      expect(Math.round(diffHours)).toBe(8)
    })

    it('should generate cryptographically secure 64-char hex token', async () => {
      // GIVEN supabase mock
      let capturedToken = ''
      const mockSupabase = createMockSupabase()
      const insertMock = vi.fn().mockImplementation((data) => {
        capturedToken = data.session_token
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }
      })
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return { insert: insertMock }
      })
      mockSupabase.from = fromMock

      // WHEN creating session
      await createSession(
        mockSupabase,
        'user-uuid-1',
        'org-uuid-1',
        mockDeviceInfo
      )

      // THEN token is 64 characters hex (32 bytes = 256 bits)
      expect(capturedToken).toMatch(/^[0-9a-f]{64}$/i)
    })

    it('should throw error if database insert fails', async () => {
      // GIVEN supabase mock that returns error
      const mockSupabase = createMockSupabase()
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }
      })
      mockSupabase.from = fromMock

      // WHEN creating session
      // THEN throws error
      await expect(
        createSession(mockSupabase, 'user-uuid-1', 'org-uuid-1', mockDeviceInfo)
      ).rejects.toThrow()
    })

    it('should store device info correctly', async () => {
      // GIVEN supabase mock
      let capturedData: any = {}
      const mockSupabase = createMockSupabase()
      const insertMock = vi.fn().mockImplementation((data) => {
        capturedData = data
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }
      })
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return { insert: insertMock }
      })
      mockSupabase.from = fromMock

      // WHEN creating session
      await createSession(
        mockSupabase,
        'user-uuid-1',
        'org-uuid-1',
        mockDeviceInfo
      )

      // THEN device info is stored
      expect(capturedData.device_type).toBe('Desktop')
      expect(capturedData.device_name).toBe('Windows')
      expect(capturedData.browser).toBe('Chrome')
      expect(capturedData.ip_address).toBe('192.168.1.100')
      expect(capturedData.user_id).toBe('user-uuid-1')
      expect(capturedData.org_id).toBe('org-uuid-1')
    })
  })

  describe('getSession', () => {
    it('should return session by token', async () => {
      // GIVEN supabase mock returning session
      const mockSupabase = createMockSupabase()
      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }),
      })
      mockSupabase.from = fromMock

      // WHEN getting session
      const result = await getSession(mockSupabase, mockSession.session_token)

      // THEN returns session
      expect(result).toEqual(mockSession)
      expect(fromMock).toHaveBeenCalledWith('user_sessions')
    })

    it('should return null for non-existent token', async () => {
      // GIVEN supabase mock returning no session
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      // WHEN getting session with invalid token
      const result = await getSession(mockSupabase, 'invalid-token')

      // THEN returns null
      expect(result).toBeNull()
    })

    it('should throw error on database failure', async () => {
      // GIVEN supabase mock returning error
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      // WHEN getting session
      // THEN throws error
      await expect(getSession(mockSupabase, 'token')).rejects.toThrow()
    })
  })

  describe('getSessions', () => {
    it('should return all active sessions for user', async () => {
      // GIVEN multiple sessions for user
      const sessions = [mockSession, { ...mockSession, id: 'session-2' }]
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: sessions, error: null }),
            }),
          }),
        }),
      })

      // WHEN getting sessions
      const result = await getSessions(mockSupabase, 'user-uuid-1')

      // THEN returns all sessions
      expect(result).toHaveLength(2)
    })

    it('should exclude revoked sessions', async () => {
      // GIVEN supabase mock
      const mockSupabase = createMockSupabase()
      const isMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockSession], error: null }),
      })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: isMock,
          }),
        }),
      })

      // WHEN getting sessions
      await getSessions(mockSupabase, 'user-uuid-1')

      // THEN queries for revoked_at IS NULL
      expect(isMock).toHaveBeenCalledWith('revoked_at', null)
    })

    it('should order by last_activity_at descending', async () => {
      // GIVEN supabase mock
      const mockSupabase = createMockSupabase()
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        }),
      })

      // WHEN getting sessions
      await getSessions(mockSupabase, 'user-uuid-1')

      // THEN orders by last_activity_at descending
      expect(orderMock).toHaveBeenCalledWith('last_activity_at', { ascending: false })
    })

    it('should return empty array when no sessions exist', async () => {
      // GIVEN supabase mock returning no sessions
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })

      // WHEN getting sessions
      const result = await getSessions(mockSupabase, 'user-uuid-1')

      // THEN returns empty array
      expect(result).toEqual([])
    })
  })

  describe('validateSession', () => {
    it('should return valid=true for active session', async () => {
      // GIVEN active non-expired session
      const activeSession = {
        ...mockSession,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        revoked_at: null,
      }
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: activeSession, error: null }),
          }),
        }),
      })

      // WHEN validating session
      const result = await validateSession(mockSupabase, activeSession.session_token)

      // THEN returns valid
      expect(result.valid).toBe(true)
      expect(result.session).toEqual(activeSession)
      expect(result.reason).toBeUndefined()
    })

    it('should return valid=false with reason=expired for expired session', async () => {
      // GIVEN expired session
      const expiredSession = {
        ...mockSession,
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        revoked_at: null,
      }
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: expiredSession, error: null }),
          }),
        }),
      })

      // WHEN validating session
      const result = await validateSession(mockSupabase, expiredSession.session_token)

      // THEN returns invalid with expired reason
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('expired')
      expect(result.session).toEqual(expiredSession)
    })

    it('should return valid=false with reason=revoked for revoked session', async () => {
      // GIVEN revoked session
      const revokedSession = {
        ...mockSession,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        revoked_at: new Date().toISOString(),
        revocation_reason: 'user_logout',
      }
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: revokedSession, error: null }),
          }),
        }),
      })

      // WHEN validating session
      const result = await validateSession(mockSupabase, revokedSession.session_token)

      // THEN returns invalid with revoked reason
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('revoked')
    })

    it('should return valid=false with reason=not_found for non-existent session', async () => {
      // GIVEN no session found
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      // WHEN validating non-existent session
      const result = await validateSession(mockSupabase, 'non-existent-token')

      // THEN returns invalid with not_found reason
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('not_found')
      expect(result.session).toBeNull()
    })
  })

  describe('getCurrentSession', () => {
    it('should return session if valid', async () => {
      // GIVEN valid session
      const activeSession = {
        ...mockSession,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: activeSession, error: null }),
          }),
        }),
      })

      // WHEN getting current session
      const result = await getCurrentSession(mockSupabase, activeSession.session_token)

      // THEN returns session
      expect(result).toEqual(activeSession)
    })

    it('should return null if session invalid', async () => {
      // GIVEN invalid session
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      // WHEN getting current session
      const result = await getCurrentSession(mockSupabase, 'invalid-token')

      // THEN returns null
      expect(result).toBeNull()
    })
  })

  describe('terminateSession', () => {
    it('should mark session as revoked with timestamp and reason', async () => {
      // GIVEN supabase mock
      let capturedUpdate: any = {}
      const mockSupabase = createMockSupabase()
      const updateMock = vi.fn().mockImplementation((data) => {
        capturedUpdate = data
        return {
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      })
      mockSupabase.from = vi.fn().mockReturnValue({
        update: updateMock,
      })

      // WHEN terminating session
      await terminateSession(mockSupabase, 'session-id', 'user_logout', 'user-id')

      // THEN session is marked as revoked
      expect(capturedUpdate.revoked_at).toBeDefined()
      expect(capturedUpdate.revocation_reason).toBe('user_logout')
      expect(capturedUpdate.revoked_by).toBe('user-id')
    })

    it('should use default reason when not provided', async () => {
      // GIVEN supabase mock
      let capturedUpdate: any = {}
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((data) => {
          capturedUpdate = data
          return {
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
      })

      // WHEN terminating session without reason
      await terminateSession(mockSupabase, 'session-id')

      // THEN uses default reason
      expect(capturedUpdate.revocation_reason).toBe('user_logout')
      expect(capturedUpdate.revoked_by).toBeNull()
    })

    it('should throw error on database failure', async () => {
      // GIVEN supabase mock returning error
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      // WHEN terminating session
      // THEN throws error
      await expect(terminateSession(mockSupabase, 'session-id')).rejects.toThrow()
    })
  })

  describe('terminateAllSessions', () => {
    it('should terminate all sessions for user', async () => {
      // GIVEN supabase mock
      const terminatedSessions = [{ id: 'session-1' }, { id: 'session-2' }]
      const mockSupabase = createMockSupabase()
      const selectMock = vi.fn().mockResolvedValue({ data: terminatedSessions, error: null })
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: selectMock,
            }),
          }),
        }),
      })

      // WHEN terminating all sessions
      const count = await terminateAllSessions(mockSupabase, 'user-id')

      // THEN returns count of terminated sessions
      expect(count).toBe(2)
    })

    it('should exclude current session when specified', async () => {
      // GIVEN supabase mock
      const mockSupabase = createMockSupabase()
      const neqMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'session-2' }], error: null }),
      })
      const isMock = vi.fn().mockReturnValue({
        neq: neqMock,
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: isMock,
          }),
        }),
      })

      // WHEN terminating all sessions except current
      await terminateAllSessions(mockSupabase, 'user-id', 'current-session-id')

      // THEN neq is called with current session id
      expect(neqMock).toHaveBeenCalled()
    })

    it('should use password_change reason when exceptCurrent is provided', async () => {
      // GIVEN supabase mock - needs to support method chaining where query.neq() is called conditionally
      // The implementation builds: from().update().eq().is() then optionally .neq() then .select()
      let capturedUpdate: any = {}
      const mockSupabase = createMockSupabase()

      // Create a chainable query object that remembers methods called
      const queryChain: any = {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        neq: vi.fn().mockReturnThis(),
      }
      // Make neq return the same object so select() can be called
      queryChain.neq.mockReturnValue(queryChain)

      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((data) => {
          capturedUpdate = data
          return {
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue(queryChain),
            }),
          }
        }),
      })

      // WHEN terminating with exceptCurrent
      await terminateAllSessions(mockSupabase, 'user-id', 'current-session-id')

      // THEN uses password_change reason
      expect(capturedUpdate.revocation_reason).toBe('password_change')
    })

    it('should use logout_all reason when terminating all including current', async () => {
      // GIVEN supabase mock
      let capturedUpdate: any = {}
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((data) => {
          capturedUpdate = data
          return {
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }),
      })

      // WHEN terminating all sessions
      await terminateAllSessions(mockSupabase, 'user-id')

      // THEN uses logout_all reason
      expect(capturedUpdate.revocation_reason).toBe('logout_all')
    })

    it('should return 0 when no sessions to terminate', async () => {
      // GIVEN supabase mock with no sessions
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })

      // WHEN terminating all sessions
      const count = await terminateAllSessions(mockSupabase, 'user-id')

      // THEN returns 0
      expect(count).toBe(0)
    })
  })

  describe('updateLastActivity', () => {
    it('should update last_activity_at timestamp', async () => {
      // GIVEN supabase mock
      let capturedUpdate: any = {}
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((data) => {
          capturedUpdate = data
          return {
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
      })

      // WHEN updating last activity
      await updateLastActivity(mockSupabase, 'session-id')

      // THEN last_activity_at is updated
      expect(capturedUpdate.last_activity_at).toBeDefined()
      expect(new Date(capturedUpdate.last_activity_at)).toBeInstanceOf(Date)
    })

    it('should throw error on database failure', async () => {
      // GIVEN supabase mock returning error
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      // WHEN updating last activity
      // THEN throws error
      await expect(updateLastActivity(mockSupabase, 'session-id')).rejects.toThrow()
    })
  })

  describe('Security: Token Generation', () => {
    it('should generate unique tokens for each session', async () => {
      // GIVEN mock supabase
      const capturedTokens: string[] = []
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          insert: vi.fn().mockImplementation((data) => {
            capturedTokens.push(data.session_token)
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
              }),
            }
          }),
        }
      })

      // WHEN creating multiple sessions
      await createSession(mockSupabase, 'user-1', 'org-1', mockDeviceInfo)
      await createSession(mockSupabase, 'user-1', 'org-1', mockDeviceInfo)
      await createSession(mockSupabase, 'user-1', 'org-1', mockDeviceInfo)

      // THEN all tokens are unique
      const uniqueTokens = new Set(capturedTokens)
      expect(uniqueTokens.size).toBe(3)
    })

    it('should generate tokens with sufficient entropy (256 bits)', async () => {
      // GIVEN mock supabase
      let capturedToken = ''
      const mockSupabase = createMockSupabase()
      mockSupabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          insert: vi.fn().mockImplementation((data) => {
            capturedToken = data.session_token
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
              }),
            }
          }),
        }
      })

      // WHEN creating session
      await createSession(mockSupabase, 'user-1', 'org-1', mockDeviceInfo)

      // THEN token is 64 hex chars (32 bytes = 256 bits)
      expect(capturedToken).toHaveLength(64)
      expect(capturedToken).toMatch(/^[0-9a-f]+$/i)
    })
  })
})

/**
 * Test Summary for Story 01.15 - Session Service
 * ==============================================
 *
 * Test Coverage:
 * - parseUserAgent: 6 tests (Chrome, Safari, Firefox, tablet, null IP, malformed)
 * - isSessionExpired: 4 tests (not expired, expired, edge cases)
 * - createSession: 5 tests (default timeout, org timeout, token generation, error handling, device info)
 * - getSession: 3 tests (valid token, invalid token, error handling)
 * - getSessions: 4 tests (multiple sessions, exclude revoked, ordering, empty result)
 * - validateSession: 4 tests (valid, expired, revoked, not found)
 * - getCurrentSession: 2 tests (valid, invalid)
 * - terminateSession: 3 tests (with reason, default reason, error handling)
 * - terminateAllSessions: 5 tests (all, except current, password_change reason, logout_all, no sessions)
 * - updateLastActivity: 2 tests (success, error handling)
 * - Security: 2 tests (unique tokens, 256-bit entropy)
 *
 * Total: 40 test cases
 * Coverage Target: >90% (security critical)
 */
