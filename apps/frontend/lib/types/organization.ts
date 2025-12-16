/**
 * Organization Types
 * Story: 01.1 - Org Context + Base RLS
 */

export interface Organization {
  id: string
  name: string
  slug: string
  timezone: string
  locale: string
  currency: string
  logo_url?: string
  onboarding_step: number
  onboarding_started_at?: string
  onboarding_completed_at?: string
  onboarding_skipped: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * OrgContext: Complete session context for authenticated user
 * Used by all API endpoints for org isolation and permission checks
 */
export interface OrgContext {
  org_id: string
  user_id: string
  role_code: string
  role_name: string
  permissions: Record<string, string>
  organization: {
    id: string
    name: string
    slug: string
    timezone: string
    locale: string
    currency: string
    onboarding_step: number
    onboarding_completed_at: string | null
    is_active: boolean
  }
}
