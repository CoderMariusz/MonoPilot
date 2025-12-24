import * as crypto from 'crypto'
import { createServerSupabaseAdmin } from '../supabase/server'

/**
 * Invitation Service
 * Story: 01.16 User Invitations (Email)
 *
 * Handles secure invitation token generation, validation, and user creation.
 * Uses cryptographically secure random tokens for invitation links.
 *
 * Security features:
 * - 256-bit random tokens (64 hex chars)
 * - No auto-confirm email (users must verify via email)
 * - Atomic user creation with rollback on failure
 * - One-time use tokens
 * - Token expiry validation
 */

// ============================================================================
// Types
// ============================================================================

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

export interface InvitationDetails {
  email: string
  role_name: string
  org_name: string
  expires_at: string
  is_expired: boolean
}

export interface AcceptInvitationResult {
  user_id: string
  access_token: string
  org_name: string
}

export interface InviteUserInput {
  email: string
  role_id: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate cryptographically secure invitation token
 * 256 bits of entropy = 64 hex characters
 * @returns Secure random hex token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Calculate expiry date (7 days from now)
 * @returns Date object set to 7 days in the future
 */
function calculateExpiryDate(): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return expiresAt
}

// ============================================================================
// Standalone Exported Functions (for backward compatibility)
// ============================================================================

/**
 * Generate invitation token (secure random, 7-day expiry)
 *
 * AC-002.6: Token contains signup link
 * AC-002.7: Invitation expires after 7 days
 *
 * @param _email - Email address (unused, kept for API compatibility)
 * @param _role - User role (unused, kept for API compatibility)
 * @param _orgId - Organization UUID (unused, kept for API compatibility)
 * @returns Cryptographically secure 64-char hex token
 */
export function generateInvitationToken(
  _email: string,
  _role: string,
  _orgId: string
): string {
  return generateSecureToken()
}

/**
 * Validate invitation token format
 *
 * AC-002.7: Token validation
 *
 * @param token - Token string to validate
 * @returns Placeholder payload (actual data comes from DB lookup)
 * @throws Error if token format is invalid
 */
export function validateInvitationToken(token: string): InvitationTokenPayload {
  // Validate format: 64 hex characters
  if (!token || token.length !== 64 || !/^[0-9a-f]{64}$/.test(token)) {
    throw new Error('Invalid invitation token format.')
  }

  // Note: Actual validation happens in database lookup
  // Return placeholder - actual payload comes from DB
  return {
    email: '',
    role: '',
    org_id: '',
    exp: 0,
  }
}

/**
 * Create invitation record in database (standalone function)
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
  const supabaseAdmin = createServerSupabaseAdmin()

  // Generate secure token and expiry date
  const token = generateSecureToken()
  const expiresAt = calculateExpiryDate()

  // Insert invitation record
  const { data, error } = await supabaseAdmin
    .from('user_invitations')
    .insert({
      org_id: params.orgId,
      email: params.email.toLowerCase().trim(),
      role: params.role,
      token,
      invited_by: params.invitedBy,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new Error('An invitation is already pending for this email address')
    }
    throw new Error(`Failed to create invitation: ${error.message}`)
  }

  return data as InvitationRecord
}

/**
 * Get invitations for organization (standalone function)
 *
 * @param orgId - Organization UUID
 * @param filters - Optional filters
 * @returns Array of invitations
 */
export async function getInvitations(
  orgId: string,
  filters?: {
    status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
    search?: string
  }
): Promise<(InvitationRecord & { invited_by_name?: string })[]> {
  const supabaseAdmin = createServerSupabaseAdmin()

  let query = supabaseAdmin
    .from('user_invitations')
    .select(
      `
      *,
      invited_by_user:users!user_invitations_invited_by_fkey(first_name, last_name)
    `
    )
    .eq('org_id', orgId)
    .order('sent_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('email', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`)
  }

  return (data || []).map((inv: any) => ({
    ...inv,
    invited_by_name: inv.invited_by_user
      ? `${inv.invited_by_user.first_name} ${inv.invited_by_user.last_name}`
      : 'Unknown',
  }))
}

/**
 * Resend invitation (standalone function)
 *
 * @param invitationId - Invitation UUID
 * @param orgId - Organization UUID
 * @returns Updated invitation record
 */
export async function resendInvitation(
  invitationId: string,
  orgId: string
): Promise<InvitationRecord> {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from('user_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found')
  }

  const newToken = generateSecureToken()
  const newExpiresAt = calculateExpiryDate()

  const { data, error } = await supabaseAdmin
    .from('user_invitations')
    .update({
      token: newToken,
      sent_at: new Date().toISOString(),
      expires_at: newExpiresAt.toISOString(),
      status: 'pending',
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
 * Cancel invitation (standalone function)
 *
 * @param invitationId - Invitation UUID
 * @param orgId - Organization UUID
 */
export async function cancelInvitation(
  invitationId: string,
  orgId: string
): Promise<void> {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from('user_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found')
  }

  const { error: updateError } = await supabaseAdmin
    .from('user_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('org_id', orgId)

  if (updateError) {
    throw new Error(`Failed to cancel invitation: ${updateError.message}`)
  }

  // Deactivate placeholder user if exists
  await supabaseAdmin
    .from('users')
    .update({ status: 'inactive' })
    .eq('email', invitation.email)
    .eq('org_id', orgId)
    .eq('status', 'invited')
}

/**
 * Accept invitation (standalone function - for backward compatibility)
 *
 * @param token - Invitation token
 */
export async function acceptInvitation(token: string): Promise<void> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Validate token format
  validateInvitationToken(token)

  // Find invitation by token
  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from('user_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found or already used')
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('This invitation has expired. Please request a new one.')
  }

  // Update invitation status
  const { error: updateError } = await supabaseAdmin
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

// ============================================================================
// InvitationService Class (Static Methods for API Routes)
// ============================================================================

/**
 * InvitationService class with static methods
 * Used by API routes that import { InvitationService }
 */
export class InvitationService {
  /**
   * Create a new invitation
   *
   * @param orgId - Organization UUID
   * @param invitedBy - User ID who sent the invitation
   * @param data - Invitation data (email, role_id)
   * @returns Created invitation record
   */
  static async createInvitation(
    orgId: string,
    invitedBy: string,
    data: InviteUserInput
  ): Promise<InvitationRecord> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Look up role code from role_id
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('code')
      .eq('id', data.role_id)
      .single()

    if (roleError || !role) {
      throw new Error('Invalid role ID')
    }

    // Check if email already has pending invitation
    const { data: existing } = await supabaseAdmin
      .from('user_invitations')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', data.email.toLowerCase().trim())
      .eq('status', 'pending')
      .single()

    if (existing) {
      throw new Error('An invitation is already pending for this email address')
    }

    // Check if user already exists in org
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', data.email.toLowerCase().trim())
      .single()

    if (existingUser) {
      throw new Error('A user with this email already exists in your organization')
    }

    // Generate secure token and expiry
    const token = generateSecureToken()
    const expiresAt = calculateExpiryDate()

    // Insert invitation record
    const { data: invitation, error } = await supabaseAdmin
      .from('user_invitations')
      .insert({
        org_id: orgId,
        email: data.email.toLowerCase().trim(),
        role: role.code,
        token,
        invited_by: invitedBy,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('An invitation is already pending for this email address')
      }
      throw new Error(`Failed to create invitation: ${error.message}`)
    }

    return invitation as InvitationRecord
  }

  /**
   * Get invitation details by token (public - no auth required)
   *
   * @param token - Invitation token (64 hex chars)
   * @returns Invitation details or null if not found
   */
  static async getInvitationByToken(token: string): Promise<InvitationDetails | null> {
    // Validate token format
    if (!token || token.length !== 64 || !/^[0-9a-f]{64}$/.test(token)) {
      return null
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: invitation, error } = await supabaseAdmin
      .from('user_invitations')
      .select(
        `
        email,
        role,
        expires_at,
        status,
        organizations!inner(name)
      `
      )
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return null
    }

    // Check status
    if (invitation.status !== 'pending') {
      return null
    }

    const isExpired = new Date(invitation.expires_at) < new Date()

    // Get role name
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('code', invitation.role)
      .single()

    return {
      email: invitation.email,
      role_name: roleData?.name || invitation.role,
      org_name: (invitation.organizations as any).name,
      expires_at: invitation.expires_at,
      is_expired: isExpired,
    }
  }

  /**
   * Accept invitation and create user account
   *
   * SECURITY: This method does NOT auto-confirm email or create sessions.
   * Users must verify email through Supabase's standard flow.
   *
   * @param token - Invitation token
   * @param password - User's chosen password
   * @returns User ID, access token placeholder, and org name
   */
  static async acceptInvitation(
    token: string,
    password: string
  ): Promise<AcceptInvitationResult> {
    // Validate token format
    if (!token || token.length !== 64 || !/^[0-9a-f]{64}$/.test(token)) {
      throw new Error('Invalid invitation token format')
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get invitation with org details
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('user_invitations')
      .select(
        `
        *,
        organizations!inner(id, name)
      `
      )
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (fetchError || !invitation) {
      throw new Error('Invitation not found or has already been used')
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('This invitation has expired. Please request a new one.')
    }

    // Get role_id from role code
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', invitation.role)
      .single()

    if (roleError || !roleData) {
      throw new Error('Invalid role configuration')
    }

    // Create Supabase auth user WITHOUT auto-confirm
    // User will receive verification email from Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: false, // SECURITY: Do NOT auto-confirm email
      user_metadata: {
        org_id: invitation.org_id,
        role: invitation.role,
        invitation_token: token,
      },
    })

    if (authError) {
      // Handle duplicate email error
      if (authError.message.includes('already registered')) {
        throw new Error('An account with this email already exists')
      }
      throw new Error(`Failed to create account: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user account')
    }

    // Create database user record (atomic with rollback)
    try {
      const { error: dbError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        org_id: invitation.org_id,
        email: invitation.email,
        first_name: invitation.email.split('@')[0], // Placeholder, user can update later
        last_name: '',
        role_id: roleData.id,
        is_active: true,
      })

      if (dbError) {
        // Rollback: Delete auth user if database insert failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Failed to create user profile: ${dbError.message}`)
      }
    } catch (error) {
      // Rollback: Delete auth user on any error
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw error
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Failed to update invitation status:', updateError)
      // Don't throw - user is already created
    }

    // Return result WITHOUT auto-generated session token
    // User must verify email and log in normally
    return {
      user_id: authData.user.id,
      access_token: '', // SECURITY: No auto-login, user must verify email
      org_name: (invitation.organizations as any).name,
    }
  }

  /**
   * List invitations for organization
   *
   * @param orgId - Organization UUID
   * @param status - Optional status filter
   * @returns Array of invitations
   */
  static async listInvitations(
    orgId: string,
    status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
  ): Promise<InvitationRecord[]> {
    const supabaseAdmin = createServerSupabaseAdmin()

    let query = supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to list invitations: ${error.message}`)
    }

    return data as InvitationRecord[]
  }

  /**
   * Resend invitation
   *
   * @param invitationId - Invitation UUID
   * @param orgId - Organization UUID
   * @returns Updated invitation record
   */
  static async resendInvitation(
    invitationId: string,
    orgId: string
  ): Promise<InvitationRecord> {
    return resendInvitation(invitationId, orgId)
  }

  /**
   * Cancel invitation
   *
   * @param invitationId - Invitation UUID
   * @param orgId - Organization UUID
   */
  static async cancelInvitation(
    invitationId: string,
    orgId: string
  ): Promise<void> {
    return cancelInvitation(invitationId, orgId)
  }
}
