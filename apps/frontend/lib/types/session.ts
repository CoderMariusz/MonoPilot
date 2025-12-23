/**
 * Session Types
 * Story: 01.15 - Session & Password Management
 * Purpose: TypeScript types for session management
 */

export interface Session {
  id: string
  user_id: string
  org_id: string
  session_token: string
  device_type: string | null
  device_name: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  expires_at: string
  last_activity_at: string
  revoked_at: string | null
  revoked_by: string | null
  revocation_reason: string | null
  is_current?: boolean // Computed field for current session
}

export interface DeviceInfo {
  device_type: string | null
  device_name: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  user_agent: string
}

export interface SessionValidation {
  valid: boolean
  session: Session | null
  reason?: 'expired' | 'revoked' | 'not_found' | 'invalid'
}

export interface CreateSessionRequest {
  user_id: string
  org_id: string
  device_info: DeviceInfo
  timeout_hours?: number
}

export interface TerminateSessionRequest {
  session_id: string
  reason?: string
}

export interface TerminateAllSessionsRequest {
  user_id: string
  except_current?: string // session_id to keep active
}
