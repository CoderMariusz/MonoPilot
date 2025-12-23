/**
 * Password Types
 * Story: 01.15 - Session & Password Management
 * Purpose: TypeScript types for password management
 */

export interface PasswordPolicy {
  min_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_number: boolean
  require_special: boolean
  password_expiry_days: number | null
  enforce_password_history: boolean
  session_timeout_hours: number
}

export interface PasswordRequirement {
  id: string
  label: string
  met: boolean
}

export interface PasswordValidationResult {
  valid: boolean
  score: number // 0-4 (weak to strong)
  requirements: PasswordRequirement[]
  strength_label: string // "Weak", "Medium", "Strong"
  strength_color: string // "red", "yellow", "green"
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface PasswordHistoryEntry {
  id: string
  user_id: string
  password_hash: string
  created_at: string
}

export interface ResetPasswordRequest {
  user_id: string
  new_password: string
  force_change: boolean
}
