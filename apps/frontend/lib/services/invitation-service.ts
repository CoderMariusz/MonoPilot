import jwt from 'jsonwebtoken'
import { createServerSupabase } from '../supabase/server'

/**
 * Invitation Service
 * Story: 1.3 User Invitations
 * Task 2: Invitation Token Generation (AC-002.6, AC-002.7)
 *
 * Handles JWT token generation, validation, and invitation management
 */

export interface InvitationTokenPayload {
  email: string
  role: string
  org_id: string
  exp: number // Unix timestamp
}

export interface InvitationRecord {
  id: string
  org_id: string
  email: string
  role: string
  token: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  sent_at: string
  expires_at: string
  accepted_at?: string
  created_at: string
  updated_at: string
}

// JWT secret helper function - retrieves at runtime to avoid build-time errors
function getJWTSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET || ''

  if (!JWT_SECRET) {
    const errorMsg = '⚠️  JWT_SECRET not set. This is REQUIRED for invitation tokens.'
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECURITY ERROR: JWT_SECRET must be set in production. Invitation tokens cannot be generated securely without it.')
    }
    console.warn(errorMsg + ' Using empty secret in development only.')
  }

  return JWT_SECRET
}

/**
 * Generate invitation token (JWT with 7-day expiry)
 *
 * AC-002.6: Token contains signup link with JWT
 * AC-002.7: Invitation expires after 7 days
 *
 * @param email - Email address to invite
 * @param role - User role to assign
 * @param orgId - Organization UUID
 * @returns JWT token string (7-day expiry)
 */
export function generateInvitationToken(
  email: string,
  role: string,
  orgId: string
): string {
  const expiresInDays = 7
  const expiresInSeconds = expiresInDays * 24 * 60 * 60

  const payload: Omit<InvitationTokenPayload, 'exp'> = {
    email,
    role,
    org_id: orgId,
  }

  // Generate JWT with 7-day expiry
  const token = jwt.sign(payload, getJWTSecret(), {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds,
  })

  return token
}

/**
 * Validate invitation token (check expiry and signature)
 *
 * AC-002.7: Token validation with expiry check
 *
 * @param token - JWT token string
 * @returns Decoded payload or throws error
 * @throws Error if token is expired, invalid, or tampered
 */
export function validateInvitationToken(token: string): InvitationTokenPayload {
  try {
    const decoded = jwt.verify(token, getJWTSecret(), {
      algorithms: ['HS256'],
    }) as InvitationTokenPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('This invitation has expired. Please request a new one.')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid invitation token.')
    }
    throw new Error('Failed to validate invitation token.')
  }
}

/**
 * Create invitation record in database
 *
 * AC-002.6: Invitation record created after user creation
 *
 * @param params - Invitation parameters
 * @returns Created invitation record
 */
export async function createInvitation(params: {
  orgId: string
  email: string
  role: string
  invitedBy: string
}): Promise<InvitationRecord> {
  const supabase = await createServerSupabase()

  // Generate token and expiry date
  const token = generateInvitationToken(params.email, params.role, params.orgId)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

  // Insert invitation record
  const { data, error } = await supabase
    .from('user_invitations')
    .insert({
      org_id: params.orgId,
      email: params.email,
      role: params.role,
      token,
      invited_by: params.invitedBy,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`)
  }

  return data as InvitationRecord
}

/**
 * Get pending invitations for organization
 *
 * AC-003.1: Admin views pending invitations
 *
 * @param orgId - Organization UUID
 * @param filters - Optional filters (status, search)
 * @returns Array of invitations with invited_by user details
 */
export async function getInvitations(
  orgId: string,
  filters?: {
    status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
    search?: string
  }
): Promise<(InvitationRecord & { invited_by_name?: string })[]> {
  const supabase = await createServerSupabase()

  let query = supabase
    .from('user_invitations')
    .select(
      `
      *,
      invited_by_user:users!user_invitations_invited_by_fkey(first_name, last_name)
    `
    )
    .eq('org_id', orgId)
    .order('sent_at', { ascending: false })

  // Apply status filter
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  // Apply email search
  if (filters?.search) {
    query = query.ilike('email', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`)
  }

  // Transform data to include invited_by_name
  return (data || []).map((inv: any) => ({
    ...inv,
    invited_by_name: inv.invited_by_user
      ? `${inv.invited_by_user.first_name} ${inv.invited_by_user.last_name}`
      : 'Unknown',
  }))
}

/**
 * Resend invitation (generate new token, invalidate old)
 *
 * AC-003.2: Resend invitation functionality
 *
 * @param invitationId - Invitation UUID
 * @param orgId - Organization UUID (for RLS check)
 * @returns Updated invitation record
 */
export async function resendInvitation(
  invitationId: string,
  orgId: string
): Promise<InvitationRecord> {
  const supabase = await createServerSupabase()

  // Get current invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found')
  }

  // Generate new token and expiry
  const newToken = generateInvitationToken(
    invitation.email,
    invitation.role,
    invitation.org_id
  )
  const newExpiresAt = new Date()
  newExpiresAt.setDate(newExpiresAt.getDate() + 7)

  // Update invitation
  const { data, error } = await supabase
    .from('user_invitations')
    .update({
      token: newToken,
      sent_at: new Date().toISOString(),
      expires_at: newExpiresAt.toISOString(),
      status: 'pending', // Reset to pending if was expired
    })
    .eq('id', invitationId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to resend invitation: ${error.message}`)
  }

  return data as InvitationRecord
}

/**
 * Cancel invitation
 *
 * AC-003.3: Cancel invitation functionality
 *
 * @param invitationId - Invitation UUID
 * @param orgId - Organization UUID (for RLS check)
 */
export async function cancelInvitation(
  invitationId: string,
  orgId: string
): Promise<void> {
  const supabase = await createServerSupabase()

  // Get invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found')
  }

  // Update status to cancelled
  const { error: updateError } = await supabase
    .from('user_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('org_id', orgId)

  if (updateError) {
    throw new Error(`Failed to cancel invitation: ${updateError.message}`)
  }

  // If user is still in 'invited' status, deactivate them
  // (They haven't completed signup yet, so we can remove their placeholder record)
  const { error: userDeleteError } = await supabase
    .from('users')
    .update({ status: 'inactive' })
    .eq('email', invitation.email)
    .eq('org_id', orgId)
    .eq('status', 'invited')

  // Ignore user delete errors (user might have already signed up)
  if (userDeleteError) {
    console.warn('User already signed up or not found:', userDeleteError.message)
  }
}

/**
 * Mark invitation as accepted after successful signup
 *
 * AC-002.8: Signup with invitation link
 *
 * @param token - JWT token from signup link
 */
export async function acceptInvitation(token: string): Promise<void> {
  const supabase = await createServerSupabase()

  // Validate token
  const payload = validateInvitationToken(token)

  // Find invitation by token
  const { data: invitation, error: fetchError } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('token', token)
    .eq('email', payload.email)
    .eq('org_id', payload.org_id)
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found or already used')
  }

  // Check if already accepted (one-time use)
  if (invitation.status === 'accepted') {
    throw new Error('This invitation has already been used')
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from('user_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  if (updateError) {
    throw new Error(`Failed to accept invitation: ${updateError.message}`)
  }
}
