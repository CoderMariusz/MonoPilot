/**
 * WO Pause/Resume Service (Story 4.3)
 * Handles pause/resume operations with atomic status transitions
 */

import { createServerSupabase } from '@/lib/supabase/server'

// Error codes for pause/resume operations
export type WOPauseErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_STATUS'
  | 'ALREADY_PAUSED'
  | 'NOT_PAUSED'
  | 'PAUSE_DISABLED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'

export class WOPauseError extends Error {
  constructor(
    public code: WOPauseErrorCode,
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'WOPauseError'
  }
}

// Roles that can pause/resume WOs
const ALLOWED_ROLES = ['admin', 'manager', 'operator']

export interface PauseResult {
  id: string
  wo_number: string
  status: string
  paused_at: string
  paused_by_user_id: string
  paused_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  pause_reason?: string
  notes?: string
}

export interface ResumeResult {
  id: string
  wo_number: string
  status: string
  pause_history: {
    id: string
    pause_reason: string | null
    notes: string | null
    paused_at: string
    resumed_at: string
    duration_minutes: number
  }[]
}

export interface PauseHistoryItem {
  id: string
  pause_reason: string | null
  notes: string | null
  paused_at: string
  resumed_at: string | null
  duration_minutes: number | null
  paused_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  resumed_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
}

/**
 * Check if pause is enabled for the organization
 */
export async function isPauseEnabled(orgId: string): Promise<boolean> {
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('production_settings')
    .select('allow_pause_wo')
    .eq('organization_id', orgId)
    .single()

  // Default to true if no settings exist
  return data?.allow_pause_wo ?? true
}

/**
 * Get configurable pause reasons for the organization
 */
export async function getPauseReasons(
  orgId: string,
): Promise<{ id: string; label: string; enabled: boolean }[]> {
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('production_settings')
    .select('pause_reasons')
    .eq('organization_id', orgId)
    .single()

  const defaultReasons = [
    { id: 'breakdown', label: 'Breakdown', enabled: true },
    { id: 'break', label: 'Break', enabled: true },
    { id: 'material_wait', label: 'Material Wait', enabled: true },
    { id: 'other', label: 'Other', enabled: true },
  ]

  const reasons = data?.pause_reasons ?? defaultReasons
  // Return only enabled reasons
  return (reasons as typeof defaultReasons).filter((r) => r.enabled)
}

/**
 * Pause a work order
 */
export async function pauseWorkOrder(
  woId: string,
  userId: string,
  userRole: string,
  orgId: string,
  pauseReason?: string,
  notes?: string,
): Promise<PauseResult> {
  const supabase = await createServerSupabase()

  // Check role permission
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new WOPauseError('FORBIDDEN', 403, 'You do not have permission to pause work orders')
  }

  // Check if pause is enabled
  const pauseEnabled = await isPauseEnabled(orgId)
  if (!pauseEnabled) {
    throw new WOPauseError('PAUSE_DISABLED', 400, 'Pause functionality is disabled for this organization')
  }

  // Get WO and validate
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOPauseError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new WOPauseError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.status === 'paused') {
    throw new WOPauseError('ALREADY_PAUSED', 400, 'Work order is already paused')
  }

  if (wo.status !== 'in_progress') {
    throw new WOPauseError(
      'INVALID_STATUS',
      400,
      `Cannot pause work order with status '${wo.status}'. Only in_progress WOs can be paused.`,
    )
  }

  const now = new Date().toISOString()

  // Atomic update: Update WO status and insert pause record
  const { error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'paused',
      paused_at: now,
      paused_by_user_id: userId,
      updated_at: now,
    })
    .eq('id', woId)
    .eq('status', 'in_progress') // Optimistic lock

  if (updateError) {
    throw new WOPauseError('INTERNAL_ERROR', 500, 'Failed to pause work order')
  }

  // Insert pause record
  const { error: pauseError } = await supabase.from('wo_pauses').insert({
    wo_id: woId,
    organization_id: orgId,
    paused_at: now,
    paused_by_user_id: userId,
    reason: pauseReason || null,
    notes: notes || null,
  })

  if (pauseError) {
    // Rollback WO status if pause record insert fails
    await supabase
      .from('work_orders')
      .update({
        status: 'in_progress',
        paused_at: null,
        paused_by_user_id: null,
      })
      .eq('id', woId)

    throw new WOPauseError('INTERNAL_ERROR', 500, 'Failed to record pause event')
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: userId,
    activity_type: 'wo_paused',
    entity_type: 'work_order',
    entity_id: woId,
    entity_code: wo.wo_number,
    description: `Work order ${wo.wo_number} paused${pauseReason ? `: ${pauseReason}` : ''}`,
    metadata: { pause_reason: pauseReason, notes },
  })

  // Get user info for response
  const { data: user } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('id', userId)
    .single()

  return {
    id: wo.id,
    wo_number: wo.wo_number,
    status: 'paused',
    paused_at: now,
    paused_by_user_id: userId,
    paused_by_user: user || undefined,
    pause_reason: pauseReason,
    notes,
  }
}

/**
 * Resume a paused work order
 */
export async function resumeWorkOrder(
  woId: string,
  userId: string,
  userRole: string,
  orgId: string,
): Promise<ResumeResult> {
  const supabase = await createServerSupabase()

  // Check role permission
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new WOPauseError('FORBIDDEN', 403, 'You do not have permission to resume work orders')
  }

  // Get WO and validate
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id, paused_at')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOPauseError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new WOPauseError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.status !== 'paused') {
    throw new WOPauseError(
      'NOT_PAUSED',
      400,
      `Cannot resume work order with status '${wo.status}'. Only paused WOs can be resumed.`,
    )
  }

  const now = new Date().toISOString()

  // Calculate pause duration
  let durationMinutes = 0
  if (wo.paused_at) {
    const pausedAt = new Date(wo.paused_at)
    const resumedAt = new Date(now)
    durationMinutes = Math.round((resumedAt.getTime() - pausedAt.getTime()) / 60000)
  }

  // Update WO status
  const { error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'in_progress',
      paused_at: null,
      paused_by_user_id: null,
      updated_at: now,
    })
    .eq('id', woId)
    .eq('status', 'paused') // Optimistic lock

  if (updateError) {
    throw new WOPauseError('INTERNAL_ERROR', 500, 'Failed to resume work order')
  }

  // Update the latest pause record with resumed_at and duration
  const { data: latestPause, error: pauseQueryError } = await supabase
    .from('wo_pauses')
    .select('id')
    .eq('wo_id', woId)
    .is('resumed_at', null)
    .order('paused_at', { ascending: false })
    .limit(1)
    .single()

  if (!pauseQueryError && latestPause) {
    await supabase
      .from('wo_pauses')
      .update({
        resumed_at: now,
        resumed_by_user_id: userId,
        duration_minutes: durationMinutes,
      })
      .eq('id', latestPause.id)
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: userId,
    activity_type: 'wo_resumed',
    entity_type: 'work_order',
    entity_id: woId,
    entity_code: wo.wo_number,
    description: `Work order ${wo.wo_number} resumed after ${durationMinutes} minutes`,
    metadata: { duration_minutes: durationMinutes },
  })

  // Get pause history for response
  const { data: pauseHistory } = await supabase
    .from('wo_pauses')
    .select('id, reason, notes, paused_at, resumed_at, duration_minutes')
    .eq('wo_id', woId)
    .order('paused_at', { ascending: false })
    .limit(5)

  return {
    id: wo.id,
    wo_number: wo.wo_number,
    status: 'in_progress',
    pause_history: (pauseHistory || []).map((p: { id: string; reason: string | null; notes: string | null; paused_at: string; resumed_at: string | null; duration_minutes: number | null }) => ({
      id: p.id,
      pause_reason: p.reason,
      notes: p.notes,
      paused_at: p.paused_at,
      resumed_at: p.resumed_at || now,
      duration_minutes: p.duration_minutes || durationMinutes,
    })),
  }
}

/**
 * Get pause history for a work order
 */
export async function getPauseHistory(woId: string, orgId: string): Promise<PauseHistoryItem[]> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('wo_pauses')
    .select(
      `
      id,
      reason,
      notes,
      paused_at,
      resumed_at,
      duration_minutes,
      paused_by_user_id,
      resumed_by_user_id
    `,
    )
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .order('paused_at', { ascending: false })

  if (error) {
    return []
  }

  return (data || []).map((p: { id: string; reason: string | null; notes: string | null; paused_at: string; resumed_at: string | null; duration_minutes: number | null; paused_by_user_id: string; resumed_by_user_id: string | null }) => ({
    id: p.id,
    pause_reason: p.reason,
    notes: p.notes,
    paused_at: p.paused_at,
    resumed_at: p.resumed_at,
    duration_minutes: p.duration_minutes,
  }))
}

/**
 * Get total downtime summary for a work order
 */
export async function getDowntimeSummary(
  woId: string,
  orgId: string,
): Promise<{
  total_minutes: number
  by_reason: { reason: string; minutes: number }[]
}> {
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('wo_pauses')
    .select('reason, duration_minutes')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .not('duration_minutes', 'is', null)

  if (!data || data.length === 0) {
    return { total_minutes: 0, by_reason: [] }
  }

  const byReason: Record<string, number> = {}
  let totalMinutes = 0

  for (const pause of data) {
    const minutes = pause.duration_minutes || 0
    totalMinutes += minutes

    const reason = pause.reason || 'Unspecified'
    byReason[reason] = (byReason[reason] || 0) + minutes
  }

  return {
    total_minutes: totalMinutes,
    by_reason: Object.entries(byReason).map(([reason, minutes]) => ({
      reason,
      minutes,
    })),
  }
}
