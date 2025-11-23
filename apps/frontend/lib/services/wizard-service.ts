import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

/**
 * Wizard Service
 * Story: 1.12 Settings Wizard (Backend only - Frontend in 1.14)
 */

export interface WizardProgress {
  step: number
  data: Record<string, any>
}

export interface WizardServiceResult {
  success: boolean
  data?: any
  error?: string
}

async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return data?.org_id || null
}

/**
 * Save wizard progress
 * AC-012.3: Progress tracking
 */
export async function saveWizardProgress(
  step: number,
  data: Record<string, any>
): Promise<WizardServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' }
    }

    const progress: WizardProgress = { step, data }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ wizard_progress: progress })
      .eq('id', orgId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: progress }
  } catch (error) {
    return { success: false, error: 'Unknown error' }
  }
}

/**
 * Get wizard progress
 * AC-012.4: Resume functionality
 */
export async function getWizardProgress(): Promise<WizardServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' }
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('wizard_progress, wizard_completed')
      .eq('id', orgId)
      .single()

    if (error || !data) {
      return { success: false, error: 'Failed to fetch progress' }
    }

    return {
      success: true,
      data: {
        progress: data.wizard_progress,
        completed: data.wizard_completed,
      },
    }
  } catch (error) {
    return { success: false, error: 'Unknown error' }
  }
}

/**
 * Complete wizard
 * AC-012.8: Mark wizard as completed
 *
 * NOTE: Full implementation (creating warehouse, locations, users, etc.)
 * will be in frontend Story 1.14. This just marks wizard as complete.
 */
export async function completeWizard(): Promise<WizardServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' }
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ wizard_completed: true })
      .eq('id', orgId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Unknown error' }
  }
}
