/**
 * Scanner Session Store
 * In-memory storage for scanner workflow sessions
 * In production, replace with Redis or database
 */

import type { WorkflowType } from './workflow-definitions'

export interface ScannerSession {
  workflow_id: string
  workflow_type: WorkflowType
  user_id: string
  org_id: string
  current_step: string
  step_data: Record<string, unknown>
  created_at: string
  expires_at: string
}

// Store sessions in memory (in production, use Redis)
export const sessions = new Map<string, ScannerSession>()

export function getSession(workflow_id: string): ScannerSession | undefined {
  return sessions.get(workflow_id)
}

export function setSession(session: ScannerSession): void {
  sessions.set(session.workflow_id, session)
}

export function deleteSession(workflow_id: string): boolean {
  return sessions.delete(workflow_id)
}

export function isSessionExpired(session: ScannerSession): boolean {
  return new Date(session.expires_at) < new Date()
}

export function refreshSession(workflow_id: string, minutes: number = 30): ScannerSession | null {
  const session = sessions.get(workflow_id)
  if (!session) return null

  const newExpiresAt = new Date(Date.now() + minutes * 60 * 1000)
  session.expires_at = newExpiresAt.toISOString()
  sessions.set(workflow_id, session)
  return session
}
