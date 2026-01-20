/**
 * Server-side getOrgContext helper
 * Story: 04.6b - Material Consumption Scanner
 *
 * Wrapper around org-context-service for use in API routes.
 * Combines session derivation and context fetching in one call.
 */

import { createServerSupabase } from '@/lib/supabase/server'
import {
  getOrgContext as getOrgContextService,
  deriveUserIdFromSession,
} from '@/lib/services/org-context-service'
import type { OrgContext } from '@/lib/types/organization'

/**
 * Get organization context for the current authenticated user.
 * This is a convenience wrapper for API routes.
 *
 * @returns OrgContext or null if not authenticated
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  try {
    const supabase = await createServerSupabase()
    const userId = await deriveUserIdFromSession(supabase)
    const context = await getOrgContextService(userId, supabase)
    return context
  } catch {
    // Return null instead of throwing for simpler API route handling
    return null
  }
}

export default getOrgContext
