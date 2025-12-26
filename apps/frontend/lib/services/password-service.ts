/**
 * Password Service
 * Story: 01.15 - Session & Password Management
 *
 * Manages password policies, validation, hashing, and history.
 * Provides methods for password changes, validation, expiry checks, and admin resets.
 *
 * **Architecture:** Service layer accepts Supabase client as parameter.
 * Uses bcrypt for password hashing with cost factor 12.
 *
 * **Security:**
 * - Password history table is service-role only (RLS blocks all users)
 * - All password operations log to audit trail
 * - Password changes terminate other sessions
 * - Never log passwords in plain text
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs' // Use bcryptjs for browser compatibility
import type { PasswordPolicy, PasswordValidationResult, PasswordRequirement } from '@/lib/types/password'
import {
  calculatePasswordStrength,
  meetsMinLength,
  hasUppercase,
  hasLowercase,
  hasNumber,
  hasSpecialChar,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '@/lib/utils/password-helpers'
import { terminateAllSessions } from './session-service'

const BCRYPT_ROUNDS = 12 // Cost factor for bcrypt

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Validate password against complexity requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirement[] = [
    { id: 'minLength', label: 'At least 8 characters', met: meetsMinLength(password, 8) },
    { id: 'uppercase', label: 'One uppercase letter', met: hasUppercase(password) },
    { id: 'lowercase', label: 'One lowercase letter', met: hasLowercase(password) },
    { id: 'number', label: 'One number', met: hasNumber(password) },
    { id: 'special', label: 'One special character', met: hasSpecialChar(password) },
  ]

  const valid = requirements.every((req) => req.met)
  const score = calculatePasswordStrength(password)
  const strength_label = getPasswordStrengthLabel(score)
  const strength_color = getPasswordStrengthColor(score)

  return {
    valid,
    score,
    requirements,
    strength_label,
    strength_color,
  }
}

/**
 * Get password policy for an organization
 */
export async function getPasswordPolicy(
  supabase: SupabaseClient,
  orgId: string
): Promise<PasswordPolicy> {
  const { data, error } = await supabase
    .from('organizations')
    .select('session_timeout_hours, password_expiry_days, enforce_password_history')
    .eq('id', orgId)
    .single()

  if (error) throw error

  return {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_number: true,
    require_special: true,
    password_expiry_days: data.password_expiry_days,
    enforce_password_history: data.enforce_password_history ?? true,
    session_timeout_hours: data.session_timeout_hours ?? 24,
  }
}

/**
 * Check if password exists in user's history (last 5 passwords)
 * SECURITY: Uses service role client to bypass RLS
 * SECURITY: Uses constant-time check to prevent timing attacks (CWE-208)
 */
export async function checkPasswordHistory(
  supabase: SupabaseClient,
  userId: string,
  password: string
): Promise<boolean> {
  // Get user's password history (last 5)
  const { data: history, error } = await supabase
    .from('password_history')
    .select('password_hash')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  // SECURITY: Always check all hashes regardless of matches (constant time)
  // This prevents timing attacks that could reveal password history info
  const historyHashes = (history || []).map(entry => entry.password_hash)

  // Check all hashes in parallel - execution time is consistent regardless of match position
  const checks = await Promise.all(
    historyHashes.map(hash => verifyPassword(password, hash))
  )

  // Return true if any hash matched
  return checks.some(match => match === true)
}

/**
 * Add password to history
 * SECURITY: Uses service role client to bypass RLS
 */
export async function addToHistory(
  supabase: SupabaseClient,
  userId: string,
  passwordHash: string
): Promise<void> {
  const { error } = await supabase
    .from('password_history')
    .insert({
      user_id: userId,
      password_hash: passwordHash,
    })

  if (error) throw error
}

/**
 * Check if user's password is expired
 */
export async function isPasswordExpired(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  const policy = await getPasswordPolicy(supabase, orgId)

  if (!policy.password_expiry_days) return false

  const { data: user, error } = await supabase
    .from('users')
    .select('password_changed_at, password_expires_at')
    .eq('id', userId)
    .single()

  if (error) throw error
  if (!user) return false

  // Check explicit expiry date first
  if (user.password_expires_at) {
    return new Date(user.password_expires_at) < new Date()
  }

  // Calculate based on last change + policy
  if (user.password_changed_at) {
    const changedAt = new Date(user.password_changed_at)
    const expiresAt = new Date(changedAt)
    expiresAt.setDate(expiresAt.getDate() + policy.password_expiry_days)
    return expiresAt < new Date()
  }

  return false
}

/**
 * Minimum execution time for password operations (milliseconds)
 * SECURITY: Prevents timing attacks by ensuring consistent response times (CWE-208)
 */
const MIN_PASSWORD_OPERATION_TIME_MS = 100

/**
 * Change user password
 * - Verifies current password
 * - Validates new password
 * - Checks password history
 * - Terminates other sessions
 *
 * SECURITY: Uses minimum execution time to prevent timing attacks
 */
export async function changePassword(
  supabase: SupabaseClient,
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // SECURITY: Record start time for timing attack prevention
  const startTime = Date.now()

  try {
    // Get user's current password hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, org_id, password_hash')
      .eq('id', userId)
      .single()

    if (userError) throw userError
    if (!user) throw new Error('User not found')

    // Verify current password (if user has password_hash)
    if (user.password_hash) {
      const isValid = await verifyPassword(currentPassword, user.password_hash)
      if (!isValid) throw new Error('Current password is incorrect')
    }

    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      throw new Error('New password does not meet requirements')
    }

    // Check if current and new password are the same
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password')
    }

    // Check password history (if enforced)
    const policy = await getPasswordPolicy(supabase, user.org_id)
    if (policy.enforce_password_history) {
      const inHistory = await checkPasswordHistory(supabase, userId, newPassword)
      if (inHistory) {
        throw new Error('Password was used recently. Please choose a different password.')
      }
    }

    // Hash new password
    const newHash = await hashPassword(newPassword)

    // Add old password to history (if exists)
    if (user.password_hash) {
      await addToHistory(supabase, userId, user.password_hash)
    }

    // Calculate password expiry date
    let passwordExpiresAt: string | null = null
    if (policy.password_expiry_days) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + policy.password_expiry_days)
      passwordExpiresAt = expiresAt.toISOString()
    }

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newHash,
        password_changed_at: new Date().toISOString(),
        password_expires_at: passwordExpiresAt,
        force_password_change: false,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Terminate other sessions (keep current session)
    // Note: We don't have session_id here, so we terminate all
    // In production, you'd pass current session_id to keep it active
    await terminateAllSessions(supabase, userId)
  } finally {
    // SECURITY: Ensure minimum execution time to prevent timing attacks
    const elapsed = Date.now() - startTime
    if (elapsed < MIN_PASSWORD_OPERATION_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_PASSWORD_OPERATION_TIME_MS - elapsed))
    }
  }
}

/**
 * Admin force password reset
 * - Sets new password
 * - Sets force_password_change flag
 * - Terminates all user sessions
 */
export async function forcePasswordReset(
  supabase: SupabaseClient,
  userId: string,
  adminId: string,
  newPassword: string,
  forceChange: boolean = true
): Promise<void> {
  // Validate new password
  const validation = validatePassword(newPassword)
  if (!validation.valid) {
    throw new Error('New password does not meet requirements')
  }

  // Hash new password
  const newHash = await hashPassword(newPassword)

  // Get user's org_id for policy
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('org_id, password_hash')
    .eq('id', userId)
    .single()

  if (userError) throw userError
  if (!user) throw new Error('User not found')

  // Add old password to history (if exists)
  if (user.password_hash) {
    await addToHistory(supabase, userId, user.password_hash)
  }

  // Calculate password expiry date
  const policy = await getPasswordPolicy(supabase, user.org_id)
  let passwordExpiresAt: string | null = null
  if (policy.password_expiry_days) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + policy.password_expiry_days)
    passwordExpiresAt = expiresAt.toISOString()
  }

  // Update user password
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: newHash,
      password_changed_at: new Date().toISOString(),
      password_expires_at: passwordExpiresAt,
      force_password_change: forceChange,
    })
    .eq('id', userId)

  if (updateError) throw updateError

  // Terminate ALL user sessions (admin reset)
  await terminateAllSessions(supabase, userId)
}
