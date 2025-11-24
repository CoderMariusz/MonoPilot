// Service: Create Operation
// Location: apps/frontend/lib/services/{resource}-service.ts
// Replace: {Resource}, {resource}, {resources}

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { invalidate{Resource}Cache } from '@/lib/cache/{resource}-cache'
import type { Create{Resource}Input, {Resource}ServiceResult } from './{resource}-types'

async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id || null
}

export async function create{Resource}(
  input: Create{Resource}Input
): Promise<{Resource}ServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Check unique constraint
    const { data: existing } = await supabaseAdmin
      .from('{resources}')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code)
      .single()

    if (existing) {
      return {
        success: false,
        error: '{Resource} code already exists',
        code: 'DUPLICATE_CODE',
      }
    }

    // Insert with admin client
    const { data, error } = await supabaseAdmin
      .from('{resources}')
      .insert({
        ...input,
        org_id: orgId,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('create{Resource} DB error:', error)
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    await invalidate{Resource}Cache(orgId)

    return { success: true, data }
  } catch (error) {
    console.error('create{Resource} error:', error)
    return {
      success: false,
      error: 'Internal error',
      code: 'DATABASE_ERROR',
    }
  }
}
